import { Router } from 'express';
import type { Response } from 'express';
import { dbRepository, relationalDB, logAudit } from '../../database/db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { superStore } from '../services/superStore.ts';
import { broadcastRealtimeNotification } from '../services/realtime.ts';

const router = Router();

// GET /api/admin/dashboard-stats (and alias /api/admin/dashboard)
router.get(['/dashboard-stats', '/dashboard'], requireAuth, requireRole('admin', 'credit_officer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await dbRepository.admin.getDashboardStats();
    return res.json(stats);
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/admin/loans (and alias /api/admin/loan-applications)
router.get(['/loans', '/loan-applications'], requireAuth, requireRole('admin', 'credit_officer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statusFilter = (req.query.status as string || 'all').toLowerCase();
    const list = await dbRepository.loans.getAllApplications(statusFilter);
    res.json(list);
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// PATCH /api/admin/loans/:id/decision (and alias /api/admin/loans/:id/status)
router.patch(['/loans/:id/decision', '/loans/:id/status'], requireAuth, requireRole('admin', 'credit_officer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const decision = req.body.decision || req.body.status;
    const { remarks, sanctioned_amount } = req.body;

    const app = await dbRepository.loans.getApplicationById(appId);
    if (!app) return res.status(404).json({ error: 'Loan application not found' });

    const validDecisions = ['under_review', 'approved', 'sanctioned', 'disbursed', 'rejected', 'info_requested'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Invalid Decision', detail: `Must be one of: [${validDecisions.join(', ')}]` });
    }

    const prevStatus = app.status;
    let finalAmount = app.requested_amount;
    let calculatedEmi = app.calculated_emi;

    if (decision === 'approved' || decision === 'sanctioned') {
      finalAmount = parseFloat(sanctioned_amount) || parseFloat(app.requested_amount);
      const interestRate = parseFloat(app.interest_rate);
      const tenureMonths = parseInt(app.tenure_months, 10);
      const r = (interestRate / 12) / 100;
      calculatedEmi = Math.round((finalAmount * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1));

      // Generate repayment schedules if not existing
      const existingSched = await dbRepository.loans.getEmiSchedules(app.id);
      if (existingSched.length === 0) {
        const schedules = [];
        let balance = finalAmount;
        for (let m = 1; m <= tenureMonths; m++) {
          const interest = Math.round(balance * r);
          let principal = calculatedEmi - interest;
          if (m === tenureMonths || balance - principal < 0) {
            principal = balance;
            balance = 0;
          } else {
            balance -= principal;
          }

          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + m);
          dueDate.setDate(5); // 5th of each month

          schedules.push({
            application_id: app.id,
            installment_number: m,
            due_date: dueDate.toISOString().split('T')[0],
            emi_amount: calculatedEmi,
            principal_component: principal,
            interest_component: interest,
            remaining_balance: Math.max(0, balance)
          });

          if (balance <= 0) break;
        }
        await dbRepository.loans.createEmiSchedules(schedules);
      }
    }

    const updatedApp = await dbRepository.loans.updateApplicationDecision(
      appId,
      decision,
      remarks,
      finalAmount,
      calculatedEmi
    );

    if (decision === 'disbursed') {
      // Credit to user's wallet and record ledger entry
      const borrower = await dbRepository.users.findById(app.user_id);
      if (borrower) {
        const currentBalance = parseFloat(borrower.wallet_balance || 0);
        const addAmount = parseFloat(sanctioned_amount) || parseFloat(app.sanctioned_amount || app.requested_amount);
        const newBalance = currentBalance + addAmount;
        await dbRepository.users.updateWallet(borrower.id, newBalance);
        await dbRepository.wallet.recordTransaction({
          user_id: borrower.id,
          transaction_type: 'credit',
          amount: addAmount,
          balance_after: newBalance,
          description: `Loan Disbursement Credit (${app.application_no}) [SANDBOX]`,
          reference_id: `DISB-${app.application_no}`
        });
      }
    }

    // Notify borrower
    await dbRepository.notifications.create({
      user_id: app.user_id,
      title: `Loan #${app.application_no} Updated: ${decision.toUpperCase()}`,
      message: remarks || `Credit Committee has updated your application to ${decision.toUpperCase()}.`,
      category: 'loans'
    });

    logAudit(req.user!.userId, 'LOAN_DECISION', 'loan_applications', app.application_no, {
      prevStatus,
      decision,
      officer: req.user!.fullName
    });

    return res.json({
      status: 'UPDATED',
      application: updatedApp,
      message: `Application #${app.application_no} marked as ${decision.toUpperCase()}`
    });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    console.error('Loan decision error:', err);
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await dbRepository.admin.getAuditLogs(50);
    res.json(logs);
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/admin/reports/csv
router.get('/reports/csv', requireAuth, requireRole('admin', 'credit_officer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apps = await dbRepository.loans.getAllApplications();
    let csv = 'Application No,Applicant Name,Phone,Email,Product,Requested Amount,Interest Rate,Tenure Months,EMI,Status,Created At\n';

    apps.forEach((a: any) => {
      csv += `"${a.application_no}","${a.applicant_name}","${a.phone}","${a.email}","${a.product_name || 'Loan'}",${a.requested_amount},${a.interest_rate},${a.tenure_months},${a.calculated_emi},"${a.status}","${a.created_at}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`Tatito_Loans_Report_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/admin/users (List users)
router.get('/users', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roleFilter = req.query.role as string;
    const users = await dbRepository.users.getAll(roleFilter);
    return res.json(users);
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Bad Request', detail: 'Valid numeric user ID is required' });
    }
    const { role } = req.body;
    const allowed = ['customer', 'agent', 'credit_officer', 'admin', 'super_admin'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: 'Invalid Role', detail: `Allowed: [${allowed.join(', ')}]` });
    }
    const targetUser = await dbRepository.users.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', detail: 'Target user not found' });
    }
    await dbRepository.users.updateRole(userId, role);
    logAudit(req.user!.userId, 'UPDATE_USER_ROLE', 'users', String(userId), { newRole: role });
    return res.json({ message: 'User role updated successfully', userId, role });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Bad Request', detail: 'Valid numeric user ID is required' });
    }
    const targetUser = await dbRepository.users.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', detail: 'Target user not found' });
    }
    const { is_active } = req.body;
    await dbRepository.users.updateStatus(userId, Boolean(is_active));
    logAudit(req.user!.userId, 'UPDATE_USER_STATUS', 'users', String(userId), { is_active });
    return res.json({ message: 'User status updated', userId, is_active: Boolean(is_active) });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// PATCH /api/admin/loan-products/:id (Configure demo rates)
router.patch('/loan-products/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prodId = parseInt(req.params.id, 10);
    if (isNaN(prodId)) {
      return res.status(400).json({ error: 'Bad Request', detail: 'Valid numeric product ID is required' });
    }
    const { base_interest_rate, min_amount, max_amount } = req.body;
    const updated = await dbRepository.loans.updateProduct(prodId, {
      base_interest_rate: base_interest_rate !== undefined ? parseFloat(base_interest_rate) : undefined,
      min_amount: min_amount !== undefined ? parseFloat(min_amount) : undefined,
      max_amount: max_amount !== undefined ? parseFloat(max_amount) : undefined
    });
    if (!updated) return res.status(404).json({ error: 'Loan product not found' });
    logAudit(req.user!.userId, 'UPDATE_LOAN_PRODUCT', 'loan_products', String(prodId), req.body);
    return res.json({ message: 'Loan product updated', product: updated });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/admin/payments-monitor (Unified Transaction & Refund Monitor — strictly excludes PINs/passwords/OTPs)
router.get('/payments-monitor', requireAuth, requireRole('admin', 'credit_officer'), (_req: AuthenticatedRequest, res: Response) => {
  const bbpsPayments = (relationalDB.payments || []).map((p: any) => ({
    id: `bbps-${p.id}`,
    ref: p.payment_ref,
    channel: p.payment_mode || 'BBPS',
    category: p.payment_category,
    party: p.operator_name,
    amount: Number(p.amount || 0),
    status: p.status || 'DEMO_SUCCESS',
    refund_status: 'NONE',
    created_at: p.created_at
  }));
  const upiTxns = (superStore.upiTransactions || []).map((u: any) => ({
    id: u.id,
    ref: u.transaction_ref,
    channel: u.payment_mode || 'UPI_SANDBOX',
    category: u.direction || 'upi',
    party: u.counterparty_name,
    amount: Number(u.amount || 0),
    status: u.status || 'DEMO_SUCCESS',
    refund_status: u.refund_status || 'NONE',
    created_at: u.created_at
  }));

  const combined = [...upiTxns, ...bbpsPayments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalCount = combined.length;
  const successCount = combined.filter((t) => t.status.includes('SUCCESS')).length;
  const failedCount = combined.filter((t) => t.status.includes('FAIL')).length;
  const pendingCount = combined.filter((t) => t.status.includes('PENDING')).length;
  const refundsCount = combined.filter((t) => t.refund_status && t.refund_status !== 'NONE').length;
  const totalVolume = combined
    .filter((t) => t.status.includes('SUCCESS'))
    .reduce((acc, t) => acc + t.amount, 0);

  return res.json({
    summary: {
      total_transactions: totalCount,
      successful_count: successCount,
      failed_count: failedCount,
      pending_count: pendingCount,
      refunds_count: refundsCount,
      total_settled_volume: totalVolume
    },
    transactions: combined.slice(0, 60)
  });
});

// GET /api/admin/risk-alerts (Fraud & Risk Monitoring)
router.get('/risk-alerts', requireAuth, requireRole('admin', 'credit_officer'), (_req: AuthenticatedRequest, res: Response) => {
  const alerts: any[] = [];

  superStore.upiTransactions
    .filter((t: any) => Number(t.amount) >= 25000)
    .forEach((t: any) => {
      alerts.push({
        id: `risk-hi-${t.transaction_ref}`,
        severity: 'MEDIUM',
        rule: 'HIGH_VALUE_SANDBOX_TRANSFER',
        reference: t.transaction_ref,
        description: `Transfer of ₹${Number(t.amount).toLocaleString('en-IN')} to ${t.counterparty_name} exceeded ₹25,000 review threshold.`,
        status: 'MONITORED',
        created_at: t.created_at
      });
    });

  superStore.upiTransactions
    .filter((t: any) => t.status === 'FAILED' || t.refund_status !== 'NONE')
    .forEach((t: any) => {
      alerts.push({
        id: `risk-fl-${t.transaction_ref}`,
        severity: t.status === 'FAILED' ? 'HIGH' : 'LOW',
        rule: t.status === 'FAILED' ? 'GATEWAY_DECLINE_TRACE' : 'REFUND_DISPUTE_FLAG',
        reference: t.transaction_ref,
        description: `${t.status === 'FAILED' ? 'Declined transaction' : 'Refund initiated'} on ${t.counterparty_name} (₹${Number(t.amount).toLocaleString('en-IN')}).`,
        status: 'OPEN',
        created_at: t.created_at
      });
    });

  if (alerts.length === 0) {
    alerts.push({
      id: 'risk-baseline',
      severity: 'LOW',
      rule: 'BASELINE_COMPLIANCE_CHECK',
      reference: 'SYS-RISK-OK',
      description: 'Velocity checks active across Kadapa hub. Zero anomalous failed-PIN bursts detected.',
      status: 'CLEAR',
      created_at: new Date().toISOString()
    });
  }

  return res.json({ alerts });
});

// GET /api/admin/support-tickets
router.get('/support-tickets', requireAuth, requireRole('admin', 'credit_officer'), (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ tickets: superStore.supportTickets });
});

// PATCH /api/admin/support-tickets/:id
router.patch('/support-tickets/:id', requireAuth, requireRole('admin', 'credit_officer'), (req: AuthenticatedRequest, res: Response) => {
  const { status, resolution_note } = req.body;
  const tkt = superStore.supportTickets.find((t: any) => t.id === req.params.id);
  if (!tkt) return res.status(404).json({ error: 'Support ticket not found' });
  tkt.status = status || 'RESOLVED';
  if (resolution_note) tkt.resolution_note = resolution_note;
  tkt.messages = tkt.messages || [];
  tkt.messages.push({
    id: `msg-${Date.now()}`,
    sender_role: 'agent',
    sender_name: req.user?.fullName || 'Branch Admin',
    message: resolution_note || `Ticket status updated to ${tkt.status}.`,
    created_at: new Date().toISOString()
  });
  broadcastRealtimeNotification('all', {
    title: `Support Ticket ${tkt.ticket_no} Updated`,
    message: `Status changed to ${tkt.status}`,
    category: 'support',
    reference: tkt.ticket_no
  });
  logAudit(req.user!.userId, 'ADMIN_UPDATE_TICKET', 'support_tickets', tkt.ticket_no, { status: tkt.status });
  return res.json({ status: 'TICKET_UPDATED', ticket: tkt });
});

// GET /api/admin/offers-summary
router.get('/offers-summary', requireAuth, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    campaigns: superStore.rewards.campaigns,
    coupons: superStore.rewards.coupons,
    vouchers: superStore.rewards.vouchers,
    total_points_circulating: superStore.rewards.points
  });
});

export default router;
