import { Router } from 'express';
import type { Request, Response } from 'express';
import { dbRepository, relationalDB, logAudit } from '../../database/db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { marketDataAdapter } from '../../integrations/index.ts';
import { superStore } from '../services/superStore.ts';
import { broadcastRealtimeNotification } from '../services/realtime.ts';

const router = Router();

// 1. UPI, BANK LINKING, BENEFICIARIES & QR PAYMENTS ENDPOINTS
router.get('/upi/overview', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = await dbRepository.users.findById(req.user!.userId);
  return res.json({
    is_simulated: true,
    security_notice: 'SECURITY SAFEGUARD: Tatito never collects or stores your UPI PIN, banking password, or CVV. All UPI transfers in this environment execute via an isolated sandbox simulator.',
    wallet_balance: user?.wallet_balance ?? 24850,
    primary_vpa: `${(user?.full_name || 'ramesh').toLowerCase().replace(/[^a-z0-9]/g, '')}@tatitoupi`,
    linked_accounts: superStore.linkedAccounts,
    beneficiaries: superStore.beneficiaries,
    qr_codes: superStore.qrCodes,
    payment_requests: superStore.paymentRequests,
    transactions: superStore.upiTransactions
  });
});

// Bank Accounts CRUD + Sandbox Balance Check
router.get('/upi/bank-accounts', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ linked_accounts: superStore.linkedAccounts });
});

router.post('/upi/bank-accounts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { bank_name, account_number, ifsc, account_type } = req.body;
  if (!bank_name || !account_number || !ifsc) {
    return res.status(400).json({ error: 'Validation Error', detail: 'bank_name, account_number, and ifsc are required.' });
  }
  const cleanAcc = String(account_number).replace(/\s+/g, '');
  const last4 = cleanAcc.slice(-4).padStart(4, '0');
  const bankSlug = String(bank_name).toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'bank';
  const vpa = `${(req.user!.fullName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}.${bankSlug}@tatitoupi`;

  const newAcc = {
    id: `acc-${Date.now()}`,
    bank_name: String(bank_name).trim(),
    masked_account: `•••• •••• ${last4}`,
    ifsc: String(ifsc).toUpperCase().trim(),
    upi_vpa: vpa,
    account_type: account_type || 'Savings Account',
    is_primary: superStore.linkedAccounts.length === 0,
    balance_check_mode: 'SANDBOX_SIMULATED',
    simulated_bank_balance: 25000 + ((last4.charCodeAt(0) * 750) % 45000)
  };
  superStore.linkedAccounts.push(newAcc);
  logAudit(req.user!.userId, 'LINK_BANK_ACCOUNT', 'bank_accounts', newAcc.id, { bank: newAcc.bank_name, ifsc: newAcc.ifsc });
  return res.status(201).json({ status: 'BANK_LINKED_SANDBOX', is_simulated: true, account: newAcc });
});

router.patch('/upi/bank-accounts/:id/primary', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const found = superStore.linkedAccounts.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Bank account not found' });
  superStore.linkedAccounts.forEach((a) => {
    a.is_primary = a.id === req.params.id;
  });
  return res.json({ status: 'PRIMARY_UPDATED', linked_accounts: superStore.linkedAccounts });
});

router.delete('/upi/bank-accounts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const idx = superStore.linkedAccounts.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Bank account not found' });
  if (superStore.linkedAccounts.length <= 1) {
    return res.status(400).json({ error: 'Cannot Remove', detail: 'At least one linked bank account must remain active.' });
  }
  const removed = superStore.linkedAccounts.splice(idx, 1)[0];
  if (removed.is_primary && superStore.linkedAccounts[0]) {
    superStore.linkedAccounts[0].is_primary = true;
  }
  return res.json({ status: 'BANK_UNLINKED', removed_id: req.params.id });
});

router.post('/upi/bank-accounts/:id/balance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const found = superStore.linkedAccounts.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Bank account not found' });
  return res.json({
    account_id: found.id,
    bank_name: found.bank_name,
    masked_account: found.masked_account,
    balance: found.simulated_bank_balance,
    is_simulated: true,
    checked_at: new Date().toISOString(),
    disclaimer: 'SANDBOX BALANCE: Live bank balance enquiries run via NPCI UPI PIN Common Library.'
  });
});

// Beneficiaries CRUD
router.get('/beneficiaries', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ beneficiaries: superStore.beneficiaries });
});

router.post('/beneficiaries', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, vpa, upi_id, mobile, bank_masked, nickname } = req.body;
  const resolvedVpa = vpa || upi_id;
  if (!name || (!resolvedVpa && !mobile)) {
    return res.status(400).json({ error: 'Validation Error', detail: 'Beneficiary name and UPI ID or mobile are required.' });
  }
  const item = {
    id: `ben-${Date.now()}`,
    name: String(name).trim(),
    vpa: resolvedVpa ? String(resolvedVpa).trim() : `${String(mobile).slice(-10)}@tatitoupi`,
    mobile: mobile ? String(mobile).trim() : '',
    bank_masked: bank_masked || 'UPI Verified Handle',
    nickname: nickname || 'Saved Payee'
  };
  superStore.beneficiaries.unshift(item);
  return res.status(201).json({ status: 'BENEFICIARY_SAVED', beneficiary: item });
});

router.delete('/beneficiaries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const idx = superStore.beneficiaries.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Beneficiary not found' });
  superStore.beneficiaries.splice(idx, 1);
  return res.json({ status: 'BENEFICIARY_REMOVED', id: req.params.id });
});

router.post('/upi/send', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipient_name, recipient_vpa, amount, note, direction, payment_source, simulate_failure, simulate_pending } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Invalid amount', detail: 'Transfer amount must be greater than ₹0.' });
    }
    if (!recipient_vpa && direction !== 'self_transfer') {
      return res.status(400).json({ error: 'Missing recipient', detail: 'Please provide a recipient UPI ID, mobile number, or account.' });
    }

    const txRef = `UPI-DEMO-${Date.now().toString().slice(-8)}`;

    // Simulated payment failure mode (records FAILED attempt without touching wallet balance)
    if (simulate_failure === true) {
      const failedTx = {
        id: `upi-${Date.now()}`,
        transaction_ref: txRef,
        direction: direction || 'send',
        counterparty_name: recipient_name || recipient_vpa || 'UPI Recipient',
        counterparty_vpa: recipient_vpa || 'failed@upi',
        amount: amt,
        payment_mode: payment_source === 'wallet' ? 'TATITO_WALLET_UPI' : 'UPI_BANK_SANDBOX',
        status: 'FAILED',
        refund_status: 'NOT_APPLICABLE',
        note: note || 'Simulated PSP bank timeout / decline',
        is_simulated: true,
        created_at: new Date().toISOString()
      };
      superStore.upiTransactions.unshift(failedTx);
      return res.status(400).json({
        error: 'Simulated Payment Failure',
        detail: 'Simulated UPI decline from remitter bank. Wallet balance was NOT debited.',
        transaction: failedTx
      });
    }

    const finalStatus = simulate_pending === true ? 'PENDING' : 'DEMO_SUCCESS';

    let updatedBalance: number | undefined;
    if (payment_source === 'wallet' && finalStatus === 'DEMO_SUCCESS') {
      const result = await dbRepository.payments.executeAtomicWalletPayment({
        userId: req.user!.userId,
        amount: amt,
        category: 'upi_transfer',
        operator: recipient_name || recipient_vpa || 'UPI Recipient',
        accountIdentifier: recipient_vpa || 'SELF-TRANSFER',
        paymentMode: 'upi_wallet_sandbox',
        status: finalStatus,
        metaJson: { note, is_demo: true }
      });
      updatedBalance = result.newBalance;
    } else {
      const user = await dbRepository.users.findById(req.user!.userId);
      updatedBalance = user?.wallet_balance ?? 24850;
    }

    const newTx = {
      id: `upi-${Date.now()}`,
      transaction_ref: txRef,
      direction: direction || 'send',
      counterparty_name: recipient_name || (direction === 'self_transfer' ? 'Self Transfer (SBI ••4821 → UBI ••9104)' : recipient_vpa),
      counterparty_vpa: recipient_vpa || 'ramesh.ub@tatitoupi',
      amount: amt,
      payment_mode: payment_source === 'wallet' ? 'TATITO_WALLET_UPI' : 'UPI_BANK_SANDBOX',
      status: finalStatus,
      refund_status: 'NONE',
      note: note || 'UPI Sandbox Transfer',
      is_simulated: true,
      created_at: new Date().toISOString()
    };
    superStore.upiTransactions.unshift(newTx);

    if (finalStatus === 'DEMO_SUCCESS') {
      superStore.rewards.points += 10;
    }

    await dbRepository.notifications.create({
      user_id: req.user!.userId,
      title: finalStatus === 'PENDING' ? 'UPI Transfer Pending' : 'UPI Sandbox Transfer Completed',
      message: `₹${amt.toLocaleString('en-IN')} to ${newTx.counterparty_name} (${newTx.transaction_ref}) — ${finalStatus}.`,
      category: 'general'
    });
    broadcastRealtimeNotification(req.user!.userId, {
      title: finalStatus === 'PENDING' ? 'UPI Payment Pending' : 'UPI Transfer Settled',
      message: `₹${amt.toLocaleString('en-IN')} to ${newTx.counterparty_name} (${txRef})`,
      category: 'payments',
      reference: txRef,
      amount: amt
    });

    logAudit(req.user!.userId, 'UPI_SEND_SANDBOX', 'payment_transactions', txRef, { amount: amt, recipient_vpa, status: finalStatus });

    return res.status(201).json({
      status: finalStatus,
      is_simulated: true,
      transaction: newTx,
      wallet_balance: updatedBalance,
      reward_points_earned: finalStatus === 'DEMO_SUCCESS' ? 10 : 0,
      disclaimer: 'SANDBOX TRANSACTION: Simulated UPI payment. No real NPCI bank clearing occurred.'
    });
  } catch (err: any) {
    return res.status(err.statusCode || 400).json({ error: 'Transfer Failed', detail: err.message });
  }
});

router.post('/upi/request', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { payer_name, payer_vpa, amount, note } = req.body;
  const amt = parseFloat(amount);
  if (!payer_vpa || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid request', detail: 'Provide valid payer UPI ID/mobile and positive amount.' });
  }
  const reqItem = {
    id: `req-${Date.now()}`,
    payer_name: payer_name || payer_vpa,
    payer_vpa,
    amount: amt,
    note: note || 'Payment request via Tatito UPI',
    status: 'PENDING',
    is_simulated: true,
    created_at: new Date().toISOString()
  };
  superStore.paymentRequests.unshift(reqItem);
  return res.status(201).json({
    status: 'REQUEST_SENT_DEMO',
    is_simulated: true,
    request: reqItem
  });
});

// Respond to Collect / Payment Request (Approve or Decline)
router.post('/upi/requests/:id/respond', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reqItem = superStore.paymentRequests.find((r) => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Payment request not found' });
  const action = String(req.body.action || 'APPROVE').toUpperCase();
  if (action === 'DECLINE') {
    reqItem.status = 'DECLINED';
    return res.json({ status: 'DECLINED', request: reqItem });
  }

  try {
    const result = await dbRepository.payments.executeAtomicWalletPayment({
      userId: req.user!.userId,
      amount: Number(reqItem.amount),
      category: 'upi_collect',
      operator: reqItem.payer_name,
      accountIdentifier: reqItem.payer_vpa,
      paymentMode: 'upi_collect_sandbox',
      status: 'DEMO_SUCCESS'
    });
    reqItem.status = 'APPROVED_PAID_DEMO';
    const txRef = result.payment.payment_ref;
    superStore.upiTransactions.unshift({
      id: `upi-${Date.now()}`,
      transaction_ref: txRef,
      direction: 'send',
      counterparty_name: reqItem.payer_name,
      counterparty_vpa: reqItem.payer_vpa,
      amount: reqItem.amount,
      payment_mode: 'UPI_COLLECT_SANDBOX',
      status: 'DEMO_SUCCESS',
      refund_status: 'NONE',
      note: reqItem.note,
      is_simulated: true,
      created_at: new Date().toISOString()
    });
    return res.json({ status: 'APPROVED_PAID_DEMO', request: reqItem, wallet_balance: result.newBalance });
  } catch (err: any) {
    return res.status(err.statusCode || 400).json({ error: 'Approval Failed', detail: err.message });
  }
});

router.post('/upi/qr/generate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { amount, note, qr_type } = req.body;
  const amt = amount ? parseFloat(amount) : null;
  const vpa = 'ramesh@tatitoupi';
  const ref = `QR-DYN-${Date.now().toString().slice(-6)}`;
  const uri = `upi://pay?pa=${vpa}&pn=Ramesh%20Kumar${amt ? `&am=${amt}` : ''}&tr=${ref}&tn=${encodeURIComponent(note || 'Tatito QR')}&cu=INR`;
  const qr = {
    id: `qr-${Date.now()}`,
    qr_type: qr_type || (amt ? 'dynamic' : 'customer_static'),
    vpa,
    payee_name: req.user!.fullName || 'Ramesh Kumar',
    amount: amt,
    note: note || '',
    reference_code: ref,
    payload_uri: uri,
    is_simulated: true,
    created_at: new Date().toISOString()
  };
  superStore.qrCodes.unshift(qr);
  return res.status(201).json({ status: 'QR_GENERATED_DEMO', is_simulated: true, qr });
});

router.post('/upi/refund', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { transaction_ref, reason } = req.body;
  const tx = superStore.upiTransactions.find((t) => t.transaction_ref === transaction_ref);
  if (tx) {
    tx.refund_status = 'REFUND_INITIATED_DEMO';
  }
  const ticket = {
    id: `tkt-${Date.now()}`,
    ticket_no: `RFD-KDP-${Date.now().toString().slice(-4)}`,
    category: 'Refund Complaint',
    subject: `Refund requested for ${transaction_ref}`,
    description: reason || 'Customer initiated sandbox refund request.',
    transaction_ref,
    status: 'IN_PROGRESS',
    resolution_note: 'Queued for sandbox settlement reversal within 24 hours.',
    created_at: new Date().toISOString(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender_role: 'customer' as const,
        sender_name: req.user!.fullName,
        message: reason || `Refund requested for ${transaction_ref}`,
        created_at: new Date().toISOString()
      }
    ]
  };
  superStore.supportTickets.unshift(ticket);
  return res.json({
    status: 'REFUND_INITIATED_DEMO',
    is_simulated: true,
    transaction_ref,
    ticket
  });
});

// 2. REWARDS, SCRATCH CARDS, COUPONS, CASHBACK & REFERRALS
router.get('/rewards', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    is_simulated: true,
    ...superStore.rewards
  });
});

router.post('/rewards/scratch/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const card = superStore.rewards.scratchCards.find((c) => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Scratch card not found' });
  if (card.is_scratched) {
    return res.json({ status: 'ALREADY_SCRATCHED', card, points: superStore.rewards.points, lifetimeCashback: superStore.rewards.lifetimeCashback });
  }
  card.is_scratched = true;
  if (card.reward_type === 'points') {
    superStore.rewards.points += Number(card.reward_value);
  } else {
    superStore.rewards.lifetimeCashback += Number(card.reward_value);
  }
  superStore.rewards.history.unshift({
    id: `rw-${Date.now()}`,
    type: card.reward_type === 'points' ? 'points_earned' : 'cashback',
    title: `Scratch Card Revealed: ${card.title}`,
    points: card.reward_type === 'points' ? card.reward_value : 0,
    cashback: card.reward_type === 'cashback' ? card.reward_value : 0,
    status: 'CREDITED_DEMO',
    expiry: card.expires_at,
    date: new Date().toISOString().slice(0, 10)
  });

  return res.json({
    status: 'SCRATCHED_REVEALED_DEMO',
    is_simulated: true,
    card,
    points_balance: superStore.rewards.points,
    lifetime_cashback: superStore.rewards.lifetimeCashback
  });
});

router.post('/rewards/apply-coupon', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const code = String(req.body.code || '').toUpperCase().trim();
  const cpn = superStore.rewards.coupons.find((c) => c.code === code);
  if (!cpn) {
    return res.status(404).json({ error: 'Invalid Coupon', detail: `Coupon code '${code}' is not valid or has expired.` });
  }
  cpn.applied = true;
  return res.json({
    status: 'COUPON_APPLIED_DEMO',
    coupon: cpn,
    message: `Promo ${cpn.code} activated (₹${cpn.discount_amount} cashback on ₹${cpn.min_spend}+ spend).`
  });
});

router.post('/rewards/redeem', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { voucher_id, points_cost, value, title } = req.body;
  const cost = Number(points_cost || 500);
  if (superStore.rewards.points < cost) {
    return res.status(400).json({ error: 'Insufficient Points', detail: `You need ${cost} points to redeem this reward.` });
  }
  superStore.rewards.points -= cost;
  const cashVal = Number(value || Math.round(cost / 10));
  superStore.rewards.lifetimeCashback += cashVal;

  const entry = {
    id: `rw-${Date.now()}`,
    type: 'points_redeemed',
    title: title || `Redeemed Voucher (${voucher_id || 'Cashback'})`,
    points: -cost,
    cashback: cashVal,
    status: 'REDEEMED_DEMO',
    expiry: 'Completed',
    date: new Date().toISOString().slice(0, 10)
  };
  superStore.rewards.history.unshift(entry);

  return res.json({
    status: 'REDEEMED_DEMO',
    is_simulated: true,
    points_balance: superStore.rewards.points,
    lifetime_cashback: superStore.rewards.lifetimeCashback,
    entry
  });
});

router.post('/rewards/campaigns', requireAuth, requireRole('admin', 'super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const { code, title, category, rule, max_cashback, min_txn, valid_until } = req.body;
  if (!code || !title) {
    return res.status(400).json({ error: 'Missing campaign fields' });
  }
  const cmp = {
    id: `cmp-${Date.now()}`,
    code: String(code).toUpperCase(),
    title,
    category: category || 'General',
    rule: rule || 'Sandbox promotional offer',
    max_cashback: Number(max_cashback || 100),
    min_txn: Number(min_txn || 500),
    valid_until: valid_until || '2027-03-31',
    terms: 'Managed by Branch Admin in sandbox mode.'
  };
  superStore.rewards.campaigns.unshift(cmp);
  return res.status(201).json({ status: 'CAMPAIGN_CREATED', campaign: cmp });
});

// 3. UPI AUTOPAY & RECURRING MANDATES
router.get('/autopay', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    is_simulated: true,
    disclaimer: 'SANDBOX MANDATES: Automatic debits require authorized NPCI e-Mandate / UPI AutoPay partner execution with explicit customer 2FA consent.',
    mandates: superStore.mandates
  });
});

router.post('/autopay', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { biller_or_payee, category, amount, frequency, next_trigger_date } = req.body;
  const amt = parseFloat(amount);
  if (!biller_or_payee || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid mandate details' });
  }
  const mnd = {
    id: `mnd-${Date.now()}`,
    mandate_ref: `UMN-TATITO-${Date.now().toString().slice(-6)}`,
    biller_or_payee,
    category: category || 'Utility Bill',
    amount: amt,
    frequency: frequency || 'Monthly',
    next_trigger_date: next_trigger_date || '2026-12-05',
    status: 'ACTIVE',
    consent_verified: true
  };
  superStore.mandates.unshift(mnd);
  return res.status(201).json({ status: 'MANDATE_REGISTERED_DEMO', is_simulated: true, mandate: mnd });
});

router.patch('/autopay/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const found = superStore.mandates.find((m) => m.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: 'Mandate not found' });
  }
  found.status = status || (found.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
  return res.json({ status: 'MANDATE_UPDATED_DEMO', is_simulated: true, mandate: found });
});

// 4. EXPENSE TRACKER & SPLIT EXPENSES
router.get('/expenses', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const totalSpent = superStore.expenses.items.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  return res.json({
    is_simulated: true,
    bank_sync_notice: 'Manual & internal sandbox ledger entries only. External bank accounts are not auto-scraped without an active Account Aggregator (AA) consent.',
    monthly_income: superStore.expenses.monthlyIncome,
    total_spent: totalSpent,
    savings_surplus: Math.max(0, superStore.expenses.monthlyIncome - totalSpent),
    items: superStore.expenses.items,
    budgets: superStore.expenses.budgets,
    savings_goals: superStore.expenses.savingsGoals,
    groups: superStore.expenses.groups
  });
});

router.post('/expenses/add', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, amount, mode } = req.body;
  const amt = parseFloat(amount);
  if (!title || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid expense entry' });
  }
  const cat = category || 'Food & Groceries';
  const item = {
    id: `exp-${Date.now()}`,
    title,
    category: cat,
    amount: amt,
    date: new Date().toISOString().slice(0, 10),
    mode: mode || 'Manual Entry'
  };
  superStore.expenses.items.unshift(item);
  const b = superStore.expenses.budgets.find((x) => x.category === cat);
  if (b) {
    b.spent += amt;
  } else {
    superStore.expenses.budgets.push({ category: cat, limit: Math.max(10000, amt * 2), spent: amt });
  }
  return res.status(201).json({ status: 'EXPENSE_LOGGED', item, budgets: superStore.expenses.budgets });
});

router.post('/expenses/groups', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { group_name, members, expense_title, total_amount, paid_by, split_type } = req.body;
  const amt = parseFloat(total_amount || '0');
  const memberList = Array.isArray(members)
    ? members
    : String(members || 'Ramesh Kumar, Friend 1')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const grp = {
    id: `grp-${Date.now()}`,
    name: group_name || 'Shared Group Expense',
    members: memberList.length ? memberList : ['Ramesh Kumar', 'Suresh Reddy'],
    expenses: amt > 0
      ? [
          {
            id: `gexp-${Date.now()}`,
            title: expense_title || 'Shared Bill',
            total_amount: amt,
            paid_by: paid_by || 'Ramesh Kumar',
            split_type: split_type || 'EQUAL',
            per_person: Math.round(amt / Math.max(1, memberList.length)),
            status: 'OPEN',
            created_at: new Date().toISOString().slice(0, 10)
          }
        ]
      : []
  };
  superStore.expenses.groups.unshift(grp);
  return res.status(201).json({ status: 'GROUP_CREATED', group: grp });
});

router.post('/expenses/settle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { group_id, expense_id } = req.body;
  const grp = superStore.expenses.groups.find((g) => g.id === group_id);
  const exp = grp?.expenses.find((e: any) => e.id === expense_id);
  if (exp) {
    exp.status = 'SETTLED';
  }
  return res.json({ status: 'SPLIT_SETTLED_DEMO', group: grp });
});

// 5. CREDIT & FINANCIAL PROFILE
router.get('/credit-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const apps = await dbRepository.loans.getApplicationsByUser(req.user!.userId);
  const accounts = apps.filter((a: any) => a.status === 'approved' || a.status === 'sanctioned' || a.status === 'disbursed');
  return res.json({
    is_simulated: true,
    is_live_verified: false,
    bureau_status: 'PROVIDER_NOT_CONNECTED',
    disclaimer: 'CREDIT PROFILE NOTICE: Tatito does not invent statutory CIBIL/Experian scores or guarantee loan approval. Live bureau pulls require licensed NBFC/bureau credentials and customer OTP consent.',
    indicative_band: null,
    repayment_track_record: null,
    monthly_verified_income: null,
    existing_monthly_obligations: null,
    foir_percentage: null,
    max_additional_emi_capacity: null,
    active_loan_count: accounts.length,
    applications_count: apps.length,
    accounts,
    applications: apps
  });
});

// 6. INSURANCE MARKETPLACE
router.get('/insurance', (_req: Request, res: Response) => {
  return res.json({
    is_simulated: true,
    disclaimer: 'INSURANCE DISCLOSURE: Insurance plans displayed are illustrative sandbox listings. Actual solicitation and policy issuance require an IRDAI-licensed Corporate Agent / Broker integration.',
    products: superStore.insuranceProducts,
    my_policies: superStore.insurancePolicies
  });
});

router.post('/insurance/apply', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { product_code, insured_name, nominee_name } = req.body;
  const prod = superStore.insuranceProducts.find((p) => p.product_code === product_code) || superStore.insuranceProducts[0];
  const pol = {
    id: `pol-${Date.now()}`,
    policy_ref: `POL-DEMO-KDP-${Date.now().toString().slice(-4)}`,
    product_code: prod.product_code,
    plan_name: prod.plan_name,
    insured_name: insured_name || req.user!.fullName || 'Ramesh Kumar',
    nominee_name: nominee_name || 'Spouse / Family Nominee',
    sum_insured: prod.sum_insured,
    annual_premium: prod.annual_premium,
    renewal_date: '2027-11-11',
    status: 'SANDBOX_ISSUED',
    is_simulated: true
  };
  superStore.insurancePolicies.unshift(pol);
  return res.status(201).json({
    status: 'SANDBOX_POLICY_ISSUED',
    is_simulated: true,
    policy: pol,
    disclaimer: 'Simulated insurance proposal logged in sandbox mode. Not an active IRDAI insurance contract.'
  });
});

// 7. DIGITAL GOLD & SAVINGS VAULT
router.get('/gold', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const benchmarks = await marketDataAdapter.getMarketBenchmarks();
  const effectiveRate = benchmarks.gold24kPerGramInr.isLive
    ? benchmarks.gold24kPerGramInr.value
    : superStore.goldVault.liveRatePerGram24K;
  superStore.goldVault.liveRatePerGram24K = effectiveRate;
  const val = Math.round(superStore.goldVault.gramsHeld * effectiveRate);
  return res.json({
    is_simulated: true,
    rate_is_live: benchmarks.gold24kPerGramInr.isLive,
    rate_source: benchmarks.gold24kPerGramInr.isLive ? 'LIVE_SPOT_REFERENCE' : 'SANDBOX_STATIC',
    disclaimer: 'DIGITAL GOLD DISCLOSURE: Vault gram balances and gold orders in this prototype are simulated for demonstration. We do not simulate actual physical bullion ownership without an authorized MMTC-PAMP / SafeGold partner integration.',
    live_rate_24k_per_gram: effectiveRate,
    purity: '24K (99.9% Indicative)',
    grams_held: Number(superStore.goldVault.gramsHeld.toFixed(4)),
    current_valuation: val,
    monthly_sip_amount: superStore.goldVault.monthlySipAmount,
    transactions: superStore.goldVault.transactions
  });
});

router.post('/gold/trade', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { tx_type, amount_inr } = req.body;
  const amt = parseFloat(amount_inr);
  if (isNaN(amt) || amt < 100) {
    return res.status(400).json({ error: 'Invalid amount', detail: 'Minimum simulated gold transaction is ₹100.' });
  }
  const rate = superStore.goldVault.liveRatePerGram24K;
  const grams = Number((amt / rate).toFixed(4));
  if (tx_type === 'SELL' && grams > superStore.goldVault.gramsHeld) {
    return res.status(400).json({ error: 'Insufficient Gold Balance', detail: 'Cannot sell more grams than held in sandbox vault.' });
  }
  if (tx_type === 'SELL') {
    superStore.goldVault.gramsHeld = Number((superStore.goldVault.gramsHeld - grams).toFixed(4));
  } else {
    superStore.goldVault.gramsHeld = Number((superStore.goldVault.gramsHeld + grams).toFixed(4));
  }
  const tx = {
    id: `gld-${Date.now()}`,
    reference_no: `GOLD-DEMO-${Date.now().toString().slice(-5)}`,
    tx_type: tx_type || 'BUY',
    grams,
    rate_per_gram: rate,
    total_amount: amt,
    is_simulated: true,
    created_at: new Date().toISOString()
  };
  superStore.goldVault.transactions.unshift(tx);
  return res.status(201).json({
    status: 'DEMO_GOLD_EXECUTED',
    is_simulated: true,
    grams_held: superStore.goldVault.gramsHeld,
    transaction: tx
  });
});

// 8. TRAVEL & TRANSIT DESK
router.get('/travel', (_req: Request, res: Response) => {
  return res.json({
    is_simulated: true,
    disclaimer: 'TRAVEL SANDBOX: Flight, Bus, Train, and Hotel inventories are simulated. Live PNR ticketing requires authorized OTA / IRCTC / APSRTC partner APIs.',
    routes: superStore.travelRoutes,
    bookings: superStore.travelBookings
  });
});

router.post('/travel/book', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { route_id, travel_date, passengers } = req.body;
  const route = superStore.travelRoutes.find((r) => r.id === route_id) || superStore.travelRoutes[0];
  const pax = Math.max(1, Number(passengers || 1));
  const booking = {
    id: `tbk-${Date.now()}`,
    pnr_reference: `PNR-DEMO-${Date.now().toString().slice(-5)}`,
    mode: route.mode,
    operator_name: route.operator,
    origin: route.origin,
    destination: route.destination,
    travel_date: travel_date || '2026-11-28',
    passengers: pax,
    fare_amount: route.fare * pax,
    status: 'CONFIRMED_DEMO',
    is_simulated: true,
    created_at: new Date().toISOString()
  };
  superStore.travelBookings.unshift(booking);
  return res.status(201).json({ status: 'BOOKING_CONFIRMED_DEMO', is_simulated: true, booking });
});

router.patch('/travel/bookings/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const b = superStore.travelBookings.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  b.status = 'CANCELLED_REFUNDED_DEMO';
  return res.json({ status: 'CANCELLED_DEMO', is_simulated: true, booking: b });
});

// 9. MERCHANT SERVICES PORTAL + OUTLETS + SETTLEMENT CSV + REFUNDS
router.get('/merchants', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    is_simulated: true,
    profile: superStore.merchantProfile,
    outlets: superStore.merchantOutlets,
    transactions: superStore.merchantTransactions,
    daily_breakdown: [
      { day: 'Mon', volume: 28400 },
      { day: 'Tue', volume: 34200 },
      { day: 'Wed', volume: 29800 },
      { day: 'Thu', volume: 41500 },
      { day: 'Fri', volume: 52100 },
      { day: 'Today', volume: superStore.merchantProfile.today_sales }
    ]
  });
});

router.post('/merchants/register', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { business_name, category, gstin, settlement_bank } = req.body;
  if (!business_name) {
    return res.status(400).json({ error: 'Business name is required' });
  }
  const cleanVpa = `${business_name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}@tatitoupi`;
  superStore.merchantProfile = {
    ...superStore.merchantProfile,
    business_name,
    category: category || 'Retail & Services',
    merchant_vpa: cleanVpa,
    gstin: gstin || superStore.merchantProfile.gstin,
    settlement_bank: settlement_bank || superStore.merchantProfile.settlement_bank
  };
  return res.json({ status: 'MERCHANT_UPDATED_DEMO', is_simulated: true, profile: superStore.merchantProfile });
});

router.post('/merchants/outlets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { outlet_name, city } = req.body;
  if (!outlet_name || !city) {
    return res.status(400).json({ error: 'Validation Error', detail: 'outlet_name and city are required.' });
  }
  const idx = superStore.merchantOutlets.length + 1;
  const code = `${String(city).slice(0, 3).toUpperCase()}-BR-0${idx}`;
  const baseVpa = superStore.merchantProfile.merchant_vpa.split('@')[0] || 'merchant';
  const outlet = {
    id: `out-${Date.now()}`,
    outlet_code: code,
    outlet_name: String(outlet_name).trim(),
    city: String(city).trim(),
    outlet_vpa: `${baseVpa}.0${idx}@tatitoupi`,
    qr_reference: `MQR-OUT-${100 + idx}`,
    today_sales: 0,
    is_active: true
  };
  superStore.merchantOutlets.push(outlet);
  return res.status(201).json({ status: 'OUTLET_CREATED', outlet });
});

router.post('/merchants/refund', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { transaction_ref } = req.body;
  const mtx = superStore.merchantTransactions.find((m) => m.transaction_ref === transaction_ref);
  if (!mtx) return res.status(404).json({ error: 'Merchant transaction not found' });
  mtx.settlement_status = 'REFUNDED_TO_CUSTOMER_DEMO';
  mtx.refund_requested = false;
  return res.json({ status: 'MERCHANT_REFUND_APPROVED', transaction: mtx });
});

router.get('/merchants/settlement-report', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  let csv = 'Transaction Ref,Outlet Code,Customer Name,Customer VPA,Amount INR,Settlement Status,Timestamp\n';
  superStore.merchantTransactions.forEach((m: any) => {
    csv += `"${m.transaction_ref}","${m.outlet_code || 'MAIN'}","${m.customer_name}","${m.customer_vpa}",${m.amount},"${m.settlement_status}","${m.created_at}"\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment(`Tatito_Merchant_Settlement_${new Date().toISOString().split('T')[0]}.csv`);
  return res.send(csv);
});

// 10. CUSTOMER SUPPORT, CHAT REPLIES, FAQs & DISPUTE CENTER
router.get('/support', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    is_simulated: true,
    tickets: superStore.supportTickets,
    faqs: superStore.supportFaqs
  });
});

router.post('/support/tickets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { category, subject, description, transaction_ref } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Please provide both subject and description.' });
  }
  const now = new Date().toISOString();
  const tkt = {
    id: `tkt-${Date.now()}`,
    ticket_no: `TKT-KDP-${Date.now().toString().slice(-4)}`,
    category: category || 'Payment Complaint',
    subject,
    description,
    transaction_ref: transaction_ref || null,
    status: 'OPEN',
    resolution_note: 'Assigned to Kadapa Branch Grievance Officer. Expected SLA: 24 hours.',
    created_at: now,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender_role: 'customer' as const,
        sender_name: req.user!.fullName,
        message: description,
        created_at: now
      },
      {
        id: `msg-${Date.now() + 1}`,
        sender_role: 'system' as const,
        sender_name: 'Tatito Automated Triage',
        message: 'Ticket registered with Kadapa Grievance Desk. An advisor will reply shortly.',
        created_at: now
      }
    ]
  };
  superStore.supportTickets.unshift(tkt);
  broadcastRealtimeNotification(req.user!.userId, {
    title: 'Support Ticket Opened',
    message: `${tkt.ticket_no}: ${tkt.subject}`,
    category: 'support',
    reference: tkt.ticket_no
  });
  return res.status(201).json({ status: 'TICKET_CREATED', ticket: tkt });
});

router.post('/support/tickets/:id/reply', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }
  const tkt = superStore.supportTickets.find((t) => t.id === req.params.id);
  if (!tkt) return res.status(404).json({ error: 'Ticket not found' });

  tkt.messages = tkt.messages || [];
  const isStaff = req.user!.role === 'admin' || req.user!.role === 'super_admin';
  const entry = {
    id: `msg-${Date.now()}`,
    sender_role: isStaff ? ('agent' as const) : ('customer' as const),
    sender_name: req.user!.fullName,
    message: String(message).trim(),
    created_at: new Date().toISOString()
  };
  tkt.messages.push(entry);
  if (!isStaff && tkt.status === 'RESOLVED') {
    tkt.status = 'IN_PROGRESS';
  }
  return res.status(201).json({ status: 'REPLY_POSTED', message: entry, ticket: tkt });
});

router.patch('/support/tickets/:id', requireAuth, requireRole('admin', 'super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const { status, resolution_note } = req.body;
  const tkt = superStore.supportTickets.find((t) => t.id === req.params.id);
  if (!tkt) return res.status(404).json({ error: 'Ticket not found' });
  tkt.status = status || 'RESOLVED';
  if (resolution_note) tkt.resolution_note = resolution_note;
  return res.json({ status: 'TICKET_UPDATED', ticket: tkt });
});

// 11. UNIVERSAL SMART SEARCH
router.get('/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json({ query: '', results: [] });
  }
  const catalog = [
    { title: 'Send Money via UPI', category: 'Payments', link: '/payments?tab=upi' },
    { title: 'Scan & Pay QR Code', category: 'Payments', link: '/payments?tab=qr' },
    { title: 'Mobile Prepaid & Postpaid Recharge', category: 'Recharges & Bills', link: '/payments?tab=bills' },
    { title: 'APSPDCL Electricity, Landline & Piped Gas Bills', category: 'Recharges & Bills', link: '/payments?tab=bills' },
    { title: 'Credit Card, Rent, Subscriptions & Education Fees', category: 'Recharges & Bills', link: '/payments?tab=bills' },
    { title: 'UPI AutoPay & Recurring Mandates', category: 'Payments', link: '/payments?tab=autopay' },
    { title: 'Tatito Rewards, Scratch Cards, Coupons & Referrals', category: 'Rewards', link: '/services?tab=rewards' },
    { title: 'Personal Expense Tracker & Split Bills', category: 'Personal Finance', link: '/services?tab=expenses' },
    { title: 'Credit Score & Financial Profile', category: 'Credit', link: '/services?tab=credit' },
    { title: 'Health, Life, Motor & Travel Insurance', category: 'Insurance', link: '/services?tab=insurance' },
    { title: '24K Digital Gold & Monthly Gold SIP', category: 'Wealth', link: '/services?tab=gold' },
    { title: 'Flights, APSRTC Buses, Trains & Hotels', category: 'Travel', link: '/services?tab=travel' },
    { title: 'Merchant QR Outlets & Settlement Dashboard', category: 'Merchant', link: '/services?tab=merchant' },
    { title: '24x7 Customer Support, Live Chat & Dispute Center', category: 'Support', link: '/services?tab=support' },
    ...relationalDB.loan_products.map((p: any) => ({ title: p.product_name, category: 'Loans', link: `/loan-application?product=${p.product_code}` })),
    ...relationalDB.mutual_funds.map((f: any) => ({ title: f.scheme_name || f.fund_name, category: 'Mutual Funds', link: '/mutual-funds' }))
  ];
  const results = catalog.filter(
    (item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  );
  return res.json({ query: q, results: results.slice(0, 15) });
});

export default router;
