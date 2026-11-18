import { Router } from 'express';
import type { Response } from 'express';
import { dbRepository, logAudit } from '../../database/db.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { getUserSettings, superStore } from '../services/superStore.ts';
import { broadcastRealtimeNotification } from '../services/realtime.ts';

const router = Router();

// GET /api/users/profile
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dbRepository.users.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = (await dbRepository.profiles.getByUserId(user.id)) || {};
    const kyc = await dbRepository.kyc.getByUserId(user.id);
    const demat = await dbRepository.investments.getDemat(user.id);

    const { password_hash: _, ...safeUser } = user;
    return res.json({
      ...safeUser,
      profile,
      kyc_records: kyc,
      demat_account: demat
    });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dbRepository.users.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { full_name, phone, dob, gender, address_line1, city, state, pincode, annual_income, occupation_type, bank_account_no, bank_ifsc, bank_name } = req.body;

    if (full_name || phone) {
      await dbRepository.users.updateProfileInfo(user.id, {
        full_name: full_name ? String(full_name).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined
      });
    }

    const updatedProfile = await dbRepository.profiles.upsert(user.id, {
      dob: dob || undefined,
      gender: gender || undefined,
      address_line1: address_line1 ? String(address_line1).trim() : undefined,
      city: city ? String(city).trim() : undefined,
      state: state ? String(state).trim() : undefined,
      pincode: pincode ? String(pincode).trim() : undefined,
      annual_income: annual_income !== undefined ? parseFloat(annual_income) : undefined,
      occupation_type,
      bank_account_no: bank_account_no || undefined,
      bank_ifsc: bank_ifsc || undefined,
      bank_name: bank_name || undefined
    });

    logAudit(user.id, 'UPDATE_PROFILE', 'user_profiles', String(user.id), { updatedFields: req.body });

    const refreshedUser = (await dbRepository.users.findById(user.id)) || user;
    const { password_hash: _, ...safeUser } = refreshedUser;
    return res.json({ ...safeUser, profile: updatedProfile });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/users/settings
router.get('/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    settings: getUserSettings(req.user!.userId),
    security_guarantee: 'Tatito never collects or stores UPI PINs, banking passwords, or card CVVs.'
  });
});

// PUT /api/users/settings
router.put('/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const current = getUserSettings(req.user!.userId);
  const { preferred_language, push_alerts, email_alerts, sms_alerts, biometric_lock_enabled, mask_balances_by_default } = req.body;
  if (preferred_language && ['English', 'Telugu', 'Hindi'].includes(preferred_language)) {
    current.preferred_language = preferred_language;
  }
  if (typeof push_alerts === 'boolean') current.push_alerts = push_alerts;
  if (typeof email_alerts === 'boolean') current.email_alerts = email_alerts;
  if (typeof sms_alerts === 'boolean') current.sms_alerts = sms_alerts;
  if (typeof biometric_lock_enabled === 'boolean') current.biometric_lock_enabled = biometric_lock_enabled;
  if (typeof mask_balances_by_default === 'boolean') current.mask_balances_by_default = mask_balances_by_default;

  logAudit(req.user!.userId, 'UPDATE_SETTINGS', 'security_settings', String(req.user!.userId), req.body);
  return res.json({ status: 'SETTINGS_UPDATED', settings: current });
});

// POST /api/users/account-action (Deactivate or request deletion)
router.post('/account-action', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { action, reason } = req.body;
  const userId = req.user!.userId;
  if (action === 'request_deletion') {
    const settings = getUserSettings(userId);
    settings.deletion_requested = true;
    logAudit(userId, 'ACCOUNT_DELETION_REQUESTED', 'users', String(userId), { reason: reason || 'User requested' });
    return res.json({
      status: 'DELETION_REQUEST_RECORDED',
      message: 'Account deletion request logged for RBI/NBFC statutory 7-day cooling-off verification.'
    });
  }
  if (action === 'deactivate') {
    logAudit(userId, 'ACCOUNT_DEACTIVATE_REQUESTED', 'users', String(userId), { reason: reason || 'Temporary self-lock' });
    return res.json({
      status: 'DEACTIVATION_SCHEDULED',
      message: 'Self-deactivation request recorded. Contact Kadapa branch desk to re-enable access.'
    });
  }
  return res.status(400).json({ error: 'Invalid Action', detail: 'Supported actions: request_deletion, deactivate' });
});

// POST /api/users/deposit (Simulated wallet top-up)
router.post('/deposit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dbRepository.users.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amt = parseFloat(req.body.amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: 'Bad Request', detail: 'Valid positive amount required' });
    }

    const currentBalance = parseFloat(user.wallet_balance || 0);
    const newBalance = currentBalance + amt;
    await dbRepository.users.updateWallet(user.id, newBalance);

    const paymentRef = `DEP-${Date.now()}`;
    await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: 'credit',
      amount: amt,
      balance_after: newBalance,
      description: 'IMPS Bank Transfer Deposit [SANDBOX]',
      reference_id: paymentRef
    });

    await dbRepository.payments.create({
      payment_ref: paymentRef,
      user_id: user.id,
      payment_category: 'wallet_deposit',
      operator_name: 'IMPS Bank Transfer Sandbox',
      account_identifier: user.phone,
      amount: amt,
      payment_mode: 'netbanking',
      status: 'DEMO_SUCCESS'
    });

    await dbRepository.notifications.create({
      user_id: user.id,
      title: 'Wallet Funded',
      message: `₹${amt.toLocaleString('en-IN')} deposited into wallet. Reference: ${paymentRef}`,
      category: 'investments'
    });
    broadcastRealtimeNotification(user.id, {
      title: 'Wallet Funded',
      message: `₹${amt.toLocaleString('en-IN')} deposited (${paymentRef})`,
      category: 'wallet',
      reference: paymentRef,
      amount: amt
    });

    logAudit(user.id, 'WALLET_DEPOSIT', 'payments', paymentRef, { amount: amt });

    return res.json({
      wallet_balance: newBalance,
      reference: paymentRef,
      message: 'Deposit simulated successfully'
    });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/wallet (and /api/users/wallet)
router.get('/wallet', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dbRepository.users.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const transactions = await dbRepository.wallet.getTransactions(user.id);
    const payments = await dbRepository.payments.getByUser(user.id);
    const kyc = await dbRepository.kyc.getByUserId(user.id);
    const isFullKyc = Array.isArray(kyc) && kyc.length >= 2;
    const todaySpent = transactions
      .filter((t: any) => t.transaction_type === 'debit')
      .slice(0, 5)
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

    return res.json({
      user_id: user.id,
      wallet_balance: parseFloat(user.wallet_balance || 0),
      currency: 'INR',
      is_sandbox: true,
      limits: {
        kyc_tier: isFullKyc ? 'FULL_KYC_SANDBOX' : 'MIN_KYC_SANDBOX',
        per_txn_limit: isFullKyc ? 100000 : 10000,
        daily_limit: isFullKyc ? 200000 : 20000,
        monthly_limit: isFullKyc ? 1000000 : 100000,
        used_recent: todaySpent,
        rbi_ppi_notice: 'Simulated PPI escrow limits shown for demonstration only.'
      },
      transactions,
      recent_payments: payments.slice(0, 10),
      compliance_notice: 'SANDBOX WALLET LEDGER: Simulated NBFC internal escrow & payment gateway.'
    });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// GET /api/wallet/transactions
router.get('/wallet/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = await dbRepository.wallet.getTransactions(req.user!.userId);
    return res.json(transactions);
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// POST /api/wallet/add-money
router.post('/wallet/add-money', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dbRepository.users.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amt = parseFloat(req.body.amount);
    const mode = req.body.payment_mode || 'upi_sandbox';
    if (!amt || isNaN(amt) || amt <= 0 || amt > 500000) {
      return res.status(400).json({ error: 'Bad Request', detail: 'Valid deposit amount between ₹1 and ₹5,00,000 is required' });
    }

    const currentBalance = parseFloat(user.wallet_balance || 0);
    const newBalance = currentBalance + amt;
    await dbRepository.users.updateWallet(user.id, newBalance);

    const refId = `WAL-CR-${Date.now()}`;
    const txn = await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: 'credit',
      amount: amt,
      balance_after: newBalance,
      description: `Wallet Top-Up via ${String(mode).toUpperCase()} [SANDBOX]`,
      reference_id: refId
    });

    await dbRepository.payments.create({
      payment_ref: refId,
      user_id: user.id,
      payment_category: 'wallet_deposit',
      operator_name: `Tatito ${String(mode).toUpperCase()} Gateway Sandbox`,
      account_identifier: user.phone,
      amount: amt,
      payment_mode: mode,
      status: 'DEMO_SUCCESS'
    });

    broadcastRealtimeNotification(user.id, {
      title: 'Wallet Top-Up Credited',
      message: `₹${amt.toLocaleString('en-IN')} added via ${String(mode).toUpperCase()}`,
      category: 'wallet',
      reference: refId,
      amount: amt
    });

    logAudit(user.id, 'WALLET_ADD_MONEY', 'wallet_transactions', refId, { amount: amt, mode });

    return res.status(201).json({
      status: 'DEMO_SUCCESS',
      is_simulated: true,
      wallet_balance: newBalance,
      reference: refId,
      transaction: txn,
      message: `₹${amt.toLocaleString('en-IN')} credited to your Tatito Wallet [Sandbox Simulation]`
    });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// POST /api/wallet/withdraw
router.post('/wallet/withdraw', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dbRepository.users.findById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amt = parseFloat(req.body.amount);
    const bankAccount = req.body.bank_account || 'SBI Kadapa •••• 4821';
    if (!amt || isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Bad Request', detail: 'Valid positive withdrawal amount required' });
    }

    const currentBalance = parseFloat(user.wallet_balance || 0);
    if (currentBalance < amt) {
      return res.status(400).json({
        error: 'Insufficient Balance',
        detail: `Insufficient wallet balance (₹${currentBalance.toLocaleString('en-IN')}) for withdrawal of ₹${amt.toLocaleString('en-IN')}`
      });
    }

    const newBalance = currentBalance - amt;
    await dbRepository.users.updateWallet(user.id, newBalance);

    const refId = `WAL-DR-${Date.now()}`;
    const txn = await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: 'debit',
      amount: amt,
      balance_after: newBalance,
      description: `IMPS Settlement to ${bankAccount} [SANDBOX]`,
      reference_id: refId
    });

    broadcastRealtimeNotification(user.id, {
      title: 'Wallet Withdrawal Initiated',
      message: `₹${amt.toLocaleString('en-IN')} transferred to ${bankAccount}`,
      category: 'wallet',
      reference: refId,
      amount: amt
    });

    logAudit(user.id, 'WALLET_WITHDRAW', 'wallet_transactions', refId, { amount: amt, bankAccount });

    return res.json({
      status: 'DEMO_SUCCESS',
      is_simulated: true,
      wallet_balance: newBalance,
      reference: refId,
      transaction: txn,
      message: `₹${amt.toLocaleString('en-IN')} initiated to ${bankAccount} via simulated IMPS`
    });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Service Unavailable', detail: err.message });
    }
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

export default router;
