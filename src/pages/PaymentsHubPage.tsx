import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Send, QrCode, Smartphone, Wallet, Repeat, Receipt, ShieldCheck,
  CheckCircle2, AlertCircle, Building2, Pause, Play, XCircle,
  Search, Download, UserPlus, Trash2, RefreshCw
} from 'lucide-react';

const BILL_CATEGORIES = [
  { id: 'mobile_prepaid', icon: '📱', name: 'Mobile Prepaid', defaultOp: 'Jio / Airtel / BSNL AP', placeholder: '10-digit Mobile Number' },
  { id: 'mobile_postpaid', icon: '📲', name: 'Mobile Postpaid', defaultOp: 'Airtel / Jio Postpaid', placeholder: '10-digit Mobile Number' },
  { id: 'dth', icon: '📡', name: 'DTH Recharge', defaultOp: 'Tata Play / Sun Direct', placeholder: 'Subscriber ID (10 digits)' },
  { id: 'electricity', icon: '💡', name: 'Electricity Bill', defaultOp: 'APSPDCL (Southern Power AP)', placeholder: '13-digit Service No (1009823412034)' },
  { id: 'water', icon: '🚰', name: 'Water Bill', defaultOp: 'Kadapa Municipal Water', placeholder: 'Assessment / Tap Number' },
  { id: 'gas', icon: '🔥', name: 'LPG Gas Cylinder', defaultOp: 'Indane / HP Gas / Bharatgas', placeholder: 'LPG Consumer ID' },
  { id: 'piped_gas', icon: '⛽', name: 'Piped Gas (PNG)', defaultOp: 'Bhagyanagar / AP Gas Distribution', placeholder: 'BP / Customer Number' },
  { id: 'broadband', icon: '🌐', name: 'Broadband', defaultOp: 'ACT Fibernet / JioFiber', placeholder: 'Account / User ID' },
  { id: 'landline', icon: '☎️', name: 'Landline', defaultOp: 'BSNL AP Landline / Airtel', placeholder: 'STD Code + Landline No' },
  { id: 'fastag', icon: '🚗', name: 'FASTag Recharge', defaultOp: 'NHAI / SBI FASTag', placeholder: 'Vehicle Reg No (e.g. AP04AB1234)' },
  { id: 'credit_card', icon: '💳', name: 'Credit Card Bill', defaultOp: 'SBI Card / HDFC / ICICI', placeholder: 'Last 4 Digits & Mobile' },
  { id: 'insurance_premium', icon: '🩺', name: 'Insurance Premium', defaultOp: 'LIC / Star Health / HDFC Life', placeholder: 'Policy Number' },
  { id: 'rent', icon: '🏠', name: 'Rent Payment', defaultOp: 'Landlord Bank / UPI Settlement', placeholder: 'Landlord UPI ID or Account' },
  { id: 'education_fees', icon: '🎓', name: 'Education Fees', defaultOp: 'AP Universities & Schools', placeholder: 'Student Roll / Admission No' },
  { id: 'municipal_tax', icon: '🏛️', name: 'Municipal Tax', defaultOp: 'CDMA Andhra Pradesh', placeholder: 'Property Assessment No' },
  { id: 'subscriptions', icon: '🎬', name: 'Subscriptions', defaultOp: 'OTT / Cloud / News Bundles', placeholder: 'Registered Email / Mobile' },
];

const formatINR = (n: number) => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');

export const PaymentsHubPage: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'upi';

  const [upiData, setUpiData] = useState<any>(null);
  const [mandates, setMandates] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [walletTxns, setWalletTxns] = useState<any[]>([]);
  const [billHistory, setBillHistory] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(user?.wallet_balance || 24850);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // 1. Send / Receive / Self-Transfer state
  const [upiMode, setUpiMode] = useState<'send' | 'request' | 'self'>('send');
  const [recipientName, setRecipientName] = useState('Suresh Kumar Reddy');
  const [recipientVpa, setRecipientVpa] = useState('suresh.reddy@tatitoupi');
  const [upiAmount, setUpiAmount] = useState('1500');
  const [upiNote, setUpiNote] = useState('Instant UPI transfer');
  const [paymentSource, setPaymentSource] = useState<'wallet' | 'bank'>('wallet');
  const [testOutcome, setTestOutcome] = useState<'success' | 'pending' | 'failure'>('success');
  const [upiBusy, setUpiBusy] = useState(false);

  // Bank Account Linking & Balance Check state
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [newBankName, setNewBankName] = useState('HDFC Bank (Kadapa Branch)');
  const [newBankAccNo, setNewBankAccNo] = useState('501002948172');
  const [newBankIfsc, setNewBankIfsc] = useState('HDFC0001822');
  const [checkedBalances, setCheckedBalances] = useState<Record<string, number>>({});

  // Beneficiaries state
  const [showAddBen, setShowAddBen] = useState(false);
  const [benName, setBenName] = useState('');
  const [benVpa, setBenVpa] = useState('');
  const [benNick, setBenNick] = useState('');

  // 2. Scan & Pay + Dynamic QR state
  const [scanVpa, setScanVpa] = useState('svstore.kdp@tatitoupi');
  const [scanMerchantName, setScanMerchantName] = useState('Sri Venkateswara Provision Store');
  const [scanAmount, setScanAmount] = useState('450');
  const [scanConfirmStep, setScanConfirmStep] = useState(false);
  const [dynQrAmount, setDynQrAmount] = useState('1200');
  const [dynQrNote, setDynQrNote] = useState('Shop Invoice Payment');
  const [generatedQr, setGeneratedQr] = useState<any | null>(null);

  // 3. 16-Category Bill Payment state
  const [selectedBillCat, setSelectedBillCat] = useState(BILL_CATEGORIES[3]); // Electricity default
  const [billOperator, setBillOperator] = useState(BILL_CATEGORIES[3].defaultOp);
  const [billAccountNo, setBillAccountNo] = useState('1009823412034');
  const [fetchedBill, setFetchedBill] = useState<any | null>(null);
  const [billBusy, setBillBusy] = useState(false);

  // 4. Wallet Add / Withdraw state
  const [walletAction, setWalletAction] = useState<'add' | 'withdraw'>('add');
  const [walletAmount, setWalletAmount] = useState('5000');
  const [walletChannel, setWalletChannel] = useState('upi_sandbox');
  const [walletBank, setWalletBank] = useState('State Bank of India (Kadapa) •••• 4821');

  // 5. AutoPay New Mandate state
  const [newMandatePayee, setNewMandatePayee] = useState('');
  const [newMandateCat, setNewMandateCat] = useState('Utility Bill');
  const [newMandateAmt, setNewMandateAmt] = useState('1500');

  // 6. History Search & Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyChannelFilter, setHistoryChannelFilter] = useState('ALL');

  const loadAllPaymentData = async () => {
    if (!isAuthenticated) return;
    try {
      const [upi, mnd, wal, pHist] = await Promise.all([
        api.getUpiOverview(),
        api.getAutopayMandates(),
        api.getWallet(),
        api.getPaymentHistory()
      ]);
      setUpiData(upi);
      setMandates(mnd.mandates || []);
      setWalletData(wal);
      setWalletBalance(wal.wallet_balance ?? upi.wallet_balance ?? 24850);
      setWalletTxns(wal.transactions || []);
      setBillHistory(pHist || []);
    } catch (err) {
      console.error('Error loading payments hub:', err);
    }
  };

  useEffect(() => {
    loadAllPaymentData();
  }, [isAuthenticated]);

  const switchTab = (tab: string) => {
    setSearchParams({ tab });
    setNotice(null);
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const amt = parseFloat(upiAmount);
    if (isNaN(amt) || amt <= 0) {
      setNotice({ type: 'error', text: 'Enter a valid amount greater than ₹0.' });
      return;
    }
    setUpiBusy(true);
    try {
      if (upiMode === 'request') {
        const res = await api.requestUpiMoney({
          payer_name: recipientName,
          payer_vpa: recipientVpa,
          amount: amt,
          note: upiNote
        });
        setNotice({ type: 'success', text: `Payment request for ${formatINR(amt)} sent to ${recipientVpa} (${res.status}).` });
      } else {
        const res = await api.sendUpiMoney({
          recipient_name: upiMode === 'self' ? 'Self Transfer (SBI ••4821 → UBI ••9104)' : recipientName,
          recipient_vpa: upiMode === 'self' ? 'ramesh.ub@tatitoupi' : recipientVpa,
          amount: amt,
          note: upiNote,
          direction: upiMode === 'self' ? 'self_transfer' : 'send',
          payment_source: paymentSource,
          simulate_failure: testOutcome === 'failure',
          simulate_pending: testOutcome === 'pending'
        });
        setSelectedReceipt(res.transaction);
        setNotice({
          type: 'success',
          text: `${formatINR(amt)} processed (${res.transaction.transaction_ref} · ${res.status})${res.reward_points_earned ? ` · +${res.reward_points_earned} Reward Points!` : ''}`
        });
      }
      await refreshUser();
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'UPI operation failed' });
      await loadAllPaymentData();
    } finally {
      setUpiBusy(false);
    }
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.linkBankAccount({
        bank_name: newBankName,
        account_number: newBankAccNo,
        ifsc: newBankIfsc
      });
      setShowLinkBank(false);
      setNotice({ type: 'success', text: `${newBankName} linked in UPI sandbox.` });
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleCheckBankBalance = async (accId: string) => {
    try {
      const res = await api.checkBankBalance(accId);
      setCheckedBalances((prev) => ({ ...prev, [accId]: res.balance }));
      setNotice({ type: 'success', text: `${res.bank_name} balance fetched: ${formatINR(res.balance)} (${res.disclaimer})` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleSetPrimaryBank = async (accId: string) => {
    try {
      await api.setPrimaryBankAccount(accId);
      setNotice({ type: 'success', text: 'Primary UPI settlement bank updated.' });
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleSaveBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benName || !benVpa) return;
    try {
      await api.saveBeneficiary({ name: benName, vpa: benVpa, nickname: benNick || 'Saved Contact' });
      setBenName('');
      setBenVpa('');
      setBenNick('');
      setShowAddBen(false);
      setNotice({ type: 'success', text: 'Beneficiary saved to quick transfer directory.' });
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleDeleteBeneficiary = async (id: string) => {
    try {
      await api.deleteBeneficiary(id);
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleRespondRequest = async (id: string, action: 'APPROVE' | 'DECLINE') => {
    try {
      const res = await api.respondPaymentRequest(id, action);
      setNotice({ type: 'success', text: `Collect request ${action === 'APPROVE' ? 'approved & settled' : 'declined'} (${res.status}).` });
      await refreshUser();
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleScanAndPayExecute = async () => {
    setUpiBusy(true);
    setNotice(null);
    try {
      const amt = parseFloat(scanAmount);
      const res = await api.sendUpiMoney({
        recipient_name: scanMerchantName,
        recipient_vpa: scanVpa,
        amount: amt,
        note: 'QR Scan & Pay Settlement',
        direction: 'qr_pay',
        payment_source: 'wallet'
      });
      setScanConfirmStep(false);
      setSelectedReceipt(res.transaction);
      setNotice({
        type: 'success',
        text: `QR Payment of ${formatINR(amt)} to ${scanMerchantName} completed (${res.transaction.transaction_ref}).`
      });
      await refreshUser();
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'QR payment failed' });
    } finally {
      setUpiBusy(false);
    }
  };

  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateDynamicQr({
        amount: parseFloat(dynQrAmount) || undefined,
        note: dynQrNote,
        qr_type: 'dynamic'
      });
      setGeneratedQr(res.qr);
      setNotice({ type: 'success', text: `Dynamic QR generated (${res.qr.reference_code}).` });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Could not generate QR' });
    }
  };

  const handleFetchBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setFetchedBill(null);
    setBillBusy(true);
    try {
      const res = await api.fetchBill({
        category: selectedBillCat.id,
        operator: billOperator,
        account_identifier: billAccountNo.trim()
      });
      setFetchedBill(res);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to fetch bill details' });
    } finally {
      setBillBusy(false);
    }
  };

  const handlePayBill = async () => {
    if (!fetchedBill) return;
    setBillBusy(true);
    setNotice(null);
    try {
      const res = await api.payBill({
        category: selectedBillCat.id,
        operator: billOperator,
        account_identifier: billAccountNo.trim(),
        amount: fetchedBill.amount_due || fetchedBill.bill_amount,
        payment_mode: 'wallet',
        idempotency_key: `BBPS-${Date.now()}`
      });
      setFetchedBill(null);
      setSelectedReceipt({
        transaction_ref: res.transaction_reference,
        counterparty_name: billOperator,
        counterparty_vpa: billAccountNo,
        amount: res.amount_paid,
        status: res.status,
        payment_mode: 'BBPS Wallet Settlement',
        created_at: res.paid_at,
        note: res.compliance_notice
      });
      setNotice({ type: 'success', text: `Paid ${formatINR(res.amount_paid)} to ${billOperator} (${res.transaction_reference}).` });
      await refreshUser();
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Bill payment failed' });
    } finally {
      setBillBusy(false);
    }
  };

  const handleWalletTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const amt = parseFloat(walletAmount);
    if (!amt || amt <= 0) return;
    setUpiBusy(true);
    try {
      if (walletAction === 'add') {
        const res = await api.addWalletMoney(amt, walletChannel);
        setNotice({ type: 'success', text: `${res.message} · Ref: ${res.reference}` });
      } else {
        const res = await api.withdrawWalletMoney(amt, walletBank);
        setNotice({ type: 'success', text: `${res.message} · Ref: ${res.reference}` });
      }
      await refreshUser();
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Wallet operation failed' });
    } finally {
      setUpiBusy(false);
    }
  };

  const handleCreateMandate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMandatePayee) return;
    try {
      await api.createAutopayMandate({
        biller_or_payee: newMandatePayee,
        category: newMandateCat,
        amount: parseFloat(newMandateAmt) || 1000,
        frequency: 'Monthly',
        next_trigger_date: '2026-12-05'
      });
      setNewMandatePayee('');
      setNotice({ type: 'success', text: 'Recurring UPI AutoPay mandate registered in sandbox.' });
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to create mandate' });
    }
  };

  const handleToggleMandate = async (id: string, nextStatus: string) => {
    try {
      await api.updateAutopayMandate(id, nextStatus);
      setNotice({ type: 'success', text: `Mandate updated to ${nextStatus}.` });
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleRefundRequest = async (txRef: string) => {
    try {
      const res = await api.requestUpiRefund({
        transaction_ref: txRef,
        reason: 'Customer initiated refund / dispute check from Payments Hub'
      });
      setNotice({ type: 'success', text: `Refund ticket ${res.ticket.ticket_no} opened for ${txRef}.` });
      await loadAllPaymentData();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-16">
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-7 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--ac)] text-[var(--ai)] grid place-items-center mx-auto">
            <Send className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Tatito Payments, UPI &amp; BBPS Hub</h1>
          <p className="text-sm text-[var(--mut)]">
            Log in to send or receive money via UPI sandbox, scan QR codes, pay 16+ recharge &amp; utility bill categories, or manage your Tatito Escrow Wallet.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/login" className="bg-[var(--ac)] text-[var(--ai)] px-5 py-2.5 rounded-[10px] font-semibold text-sm">
              Login to Continue
            </Link>
            <Link to="/register" className="border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] px-5 py-2.5 rounded-[10px] font-semibold text-sm">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'upi', label: 'Send & Receive (UPI)', icon: Send },
    { id: 'qr', label: 'Scan & QR Codes', icon: QrCode },
    { id: 'bills', label: 'Recharges & Bills (16)', icon: Smartphone },
    { id: 'wallet', label: 'Tatito Wallet', icon: Wallet },
    { id: 'autopay', label: 'UPI AutoPay', icon: Repeat },
    { id: 'history', label: 'History & Statements', icon: Receipt },
  ];

  const filteredWalletTxns = walletTxns.filter((t) => {
    if (ledgerFilter === 'all') return true;
    return t.transaction_type === ledgerFilter;
  });

  // Combined searchable transactions for History tab
  const unifiedHistory = [
    ...(upiData?.transactions || []).map((t: any) => ({
      id: t.id,
      ref: t.transaction_ref,
      name: t.counterparty_name,
      identifier: t.counterparty_vpa,
      channel: 'UPI',
      mode: t.payment_mode,
      status: t.status || 'DEMO_SUCCESS',
      refund_status: t.refund_status || 'NONE',
      amount: t.amount,
      created_at: t.created_at,
      canRefund: t.refund_status === 'NONE' && t.status !== 'FAILED'
    })),
    ...billHistory.map((b: any) => ({
      id: `bh-${b.id}`,
      ref: b.payment_ref,
      name: b.operator_name,
      identifier: b.account_identifier,
      channel: 'BBPS',
      mode: `BBPS ${b.payment_mode}`,
      status: b.status || 'DEMO_SUCCESS',
      refund_status: 'NONE',
      amount: b.amount,
      created_at: b.created_at,
      canRefund: false
    }))
  ].filter((item) => {
    if (historyStatusFilter !== 'ALL' && item.status !== historyStatusFilter) return false;
    if (historyChannelFilter !== 'ALL' && item.channel !== historyChannelFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      return (
        String(item.ref).toLowerCase().includes(q) ||
        String(item.name).toLowerCase().includes(q) ||
        String(item.identifier).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportHistoryCsv = () => {
    let csv = 'Reference,Counterparty,Identifier,Channel,Mode,Status,Amount_INR,Timestamp\n';
    unifiedHistory.forEach((h) => {
      csv += `"${h.ref}","${h.name}","${h.identifier}","${h.channel}","${h.mode}","${h.status}",${h.amount},"${h.created_at}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tatito_Payment_Statement_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-[18px] pt-[22px] pb-[72px] space-y-6">
      
      {/* Top Hero Header */}
      <div className="bg-[var(--ac)] text-[var(--ai)] rounded-[22px] p-6 sm:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-bold text-[var(--ac2)] uppercase tracking-wider mb-1">
            SANDBOX UPI · QR · BBPS · ESCROW WALLET
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold m-0">
            Tatito Payments &amp; Bill Desk
          </h1>
          <p className="text-xs sm:text-sm text-white/85 mt-1 m-0">
            Primary VPA: <strong className="text-[var(--ac2)] font-mono">{upiData?.primary_vpa || 'ramesh@tatitoupi'}</strong> · Never shares or stores UPI PINs.
          </p>
        </div>

        <div className="bg-white/14 rounded-2xl px-5 py-3.5 min-w-[220px]">
          <div className="text-xs text-white/80">Available Wallet Balance</div>
          <div className="text-2xl font-extrabold font-tabular text-white">
            {formatINR(walletBalance)}
          </div>
          <div className="text-[11px] text-[var(--ac2)] font-semibold">
            {(upiData?.linked_accounts || []).length || 2} Linked Bank Accounts
          </div>
        </div>
      </div>

      <Link className="inline-block underline font-semibold" to="/collections">Provider test collections →</Link>
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                on
                  ? 'bg-[var(--ac)] text-[var(--ai)]'
                  : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ac)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SEND & RECEIVE MONEY (UPI SANDBOX) */}
      {activeTab === 'upi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--ink)] m-0">UPI Money Transfer (Sandbox)</h2>
              <div className="flex gap-1 bg-[var(--bg)] p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUpiMode('send')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer ${upiMode === 'send' ? 'bg-[var(--ac)] text-[var(--ai)]' : 'text-[var(--mut)]'}`}
                >
                  Send Money
                </button>
                <button
                  type="button"
                  onClick={() => setUpiMode('request')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer ${upiMode === 'request' ? 'bg-[var(--ac)] text-[var(--ai)]' : 'text-[var(--mut)]'}`}
                >
                  Request Money
                </button>
                <button
                  type="button"
                  onClick={() => setUpiMode('self')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer ${upiMode === 'self' ? 'bg-[var(--ac)] text-[var(--ai)]' : 'text-[var(--mut)]'}`}
                >
                  Self Transfer
                </button>
              </div>
            </div>

            {/* Saved Beneficiaries & Quick Add */}
            {upiMode !== 'self' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--mut)] font-semibold">Saved Beneficiaries:</span>
                  <button
                    type="button"
                    onClick={() => setShowAddBen(!showAddBen)}
                    className="inline-flex items-center gap-1 text-[var(--lt)] font-semibold cursor-pointer hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {showAddBen ? 'Cancel' : 'Add Beneficiary'}
                  </button>
                </div>

                {showAddBen && (
                  <form onSubmit={handleSaveBeneficiary} className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={benName}
                      onChange={(e) => setBenName(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="UPI ID or Mobile"
                      value={benVpa}
                      onChange={(e) => setBenVpa(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                    />
                    <input
                      type="text"
                      placeholder="Nickname"
                      value={benNick}
                      onChange={(e) => setBenNick(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-[var(--ac)] text-[var(--ai)] font-semibold cursor-pointer">
                      Save Payee
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap gap-2">
                  {(upiData?.beneficiaries || []).map((c: any) => (
                    <div
                      key={c.id}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-medium bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientName(c.name);
                          setRecipientVpa(c.vpa);
                        }}
                        className="cursor-pointer hover:text-[var(--lt)]"
                      >
                        {c.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBeneficiary(c.id)}
                        className="text-[var(--mut)] hover:text-rose-500 cursor-pointer"
                        title="Remove beneficiary"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleUpiSubmit} className="space-y-3">
              {upiMode === 'self' ? (
                <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs space-y-1">
                  <div className="font-bold text-[var(--ink)]">From: State Bank of India (Kadapa) •••• 4821</div>
                  <div className="font-bold text-[var(--lt)]">To: Union Bank of India (Trunk Road) •••• 9104</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-[var(--mut)]">
                    {upiMode === 'request' ? 'Payer Name' : 'Recipient Name'}
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    />
                  </label>
                  <label className="block text-xs text-[var(--mut)]">
                    UPI ID / Mobile Number
                    <input
                      type="text"
                      required
                      value={recipientVpa}
                      onChange={(e) => setRecipientVpa(e.target.value)}
                      placeholder="name@upi or 10-digit mobile"
                      className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs text-[var(--mut)]">
                  Amount (₹)
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-base font-bold font-tabular"
                  />
                </label>

                {upiMode !== 'request' && (
                  <label className="block text-xs text-[var(--mut)]">
                    Debit From (Sandbox Source)
                    <select
                      value={paymentSource}
                      onChange={(e) => setPaymentSource(e.target.value as 'wallet' | 'bank')}
                      className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    >
                      <option value="wallet">Tatito Wallet ({formatINR(walletBalance)})</option>
                      <option value="bank">Linked Primary Bank (UPI Sandbox)</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs text-[var(--mut)]">
                  Remarks / Note
                  <input
                    type="text"
                    value={upiNote}
                    onChange={(e) => setUpiNote(e.target.value)}
                    placeholder="Optional payment note"
                    className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                  />
                </label>

                {upiMode !== 'request' && (
                  <label className="block text-xs text-[var(--mut)]">
                    Sandbox Outcome Mode
                    <select
                      value={testOutcome}
                      onChange={(e) => setTestOutcome(e.target.value as 'success' | 'pending' | 'failure')}
                      className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    >
                      <option value="success">Normal Sandbox Success</option>
                      <option value="pending">Test Pending Confirmation</option>
                      <option value="failure">Test Failed / Bank Decline</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[11px] text-[var(--mut)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--lt)] shrink-0" />
                <span>
                  Security Rule: Tatito never requests or stores your confidential UPI PIN or banking password.
                </span>
              </div>

              <button
                type="submit"
                disabled={upiBusy}
                className="w-full py-2.5 px-4 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-sm cursor-pointer hover:opacity-95 disabled:opacity-50"
              >
                {upiBusy
                  ? 'Processing Sandbox Transfer...'
                  : upiMode === 'request'
                  ? `Request ${formatINR(Number(upiAmount || 0))}`
                  : upiMode === 'self'
                  ? `Execute Self Transfer of ${formatINR(Number(upiAmount || 0))} [Demo]`
                  : `Send ${formatINR(Number(upiAmount || 0))} Now [Demo]`}
              </button>
            </form>
          </div>

          {/* Right Column: Linked Accounts & Payment Requests */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--ink)] m-0">Linked Bank Accounts</h3>
                <button
                  type="button"
                  onClick={() => setShowLinkBank(!showLinkBank)}
                  className="text-xs font-semibold text-[var(--lt)] cursor-pointer hover:underline"
                >
                  {showLinkBank ? 'Close' : '+ Link Bank'}
                </button>
              </div>

              {showLinkBank && (
                <form onSubmit={handleLinkBank} className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Bank Name (e.g. HDFC Bank Kadapa)"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Account Number"
                      value={newBankAccNo}
                      onChange={(e) => setNewBankAccNo(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="IFSC Code"
                      value={newBankIfsc}
                      onChange={(e) => setNewBankIfsc(e.target.value.toUpperCase())}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full py-1.5 rounded-lg bg-[var(--ac)] text-[var(--ai)] font-semibold cursor-pointer">
                    Link Bank Account [Sandbox]
                  </button>
                </form>
              )}

              {(upiData?.linked_accounts || []).map((acc: any) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[var(--lt)]" />
                        <span>{acc.bank_name}</span>
                      </div>
                      <div className="text-[var(--mut)] font-mono">{acc.masked_account} · {acc.ifsc}</div>
                      <div className="text-[11px] font-mono text-[var(--lt)]">{acc.upi_vpa}</div>
                    </div>
                    <div className="text-right">
                      {acc.is_primary ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">PRIMARY</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryBank(acc.id)}
                          className="text-[10px] font-semibold text-[var(--lt)] hover:underline cursor-pointer"
                        >
                          Set Primary
                        </button>
                      )}
                      {checkedBalances[acc.id] !== undefined && (
                        <div className="font-bold font-tabular text-[var(--ink)] mt-0.5">
                          {formatINR(checkedBalances[acc.id])}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => handleCheckBankBalance(acc.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--lt)] hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Check Sandbox Balance
                    </button>
                    <span className="text-[10px] text-[var(--mut)]">NPCI PIN Safe</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-3">
              <h3 className="text-base font-bold text-[var(--ink)] m-0">Incoming &amp; Outgoing Collect Requests</h3>
              {(upiData?.payment_requests || []).map((r: any) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--ink)]">{r.payer_name} ({r.payer_vpa})</div>
                      <div className="text-[var(--mut)]">{r.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-tabular text-[var(--ink)]">{formatINR(r.amount)}</div>
                      <span className="text-[10px] font-semibold text-amber-600">{r.status}</span>
                    </div>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(r.id, 'APPROVE')}
                        className="flex-1 py-1.5 rounded-lg bg-[var(--ac)] text-[var(--ai)] font-semibold cursor-pointer"
                      >
                        Approve &amp; Pay [Demo]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(r.id, 'DECLINE')}
                        className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--mut)] cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCAN & PAY + CUSTOMER / DYNAMIC QR CODES */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
            <h2 className="text-lg font-bold text-[var(--ink)] m-0">Scan &amp; Pay Merchant QR</h2>
            <p className="text-xs text-[var(--mut)] m-0">
              Select a verified Kadapa merchant QR preset or enter a scanned UPI VPA below, then confirm the payment step.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { name: 'SV Provision Store', vpa: 'svstore.kdp@tatitoupi', amt: '450' },
                { name: 'Rayalaseema Agro Mart', vpa: 'rayalaseemamart@tatitoupi', amt: '1250' },
                { name: 'Kadapa Medical Hall', vpa: 'kdpmeds@tatitoupi', amt: '380' },
              ].map((m) => (
                <button
                  key={m.vpa}
                  type="button"
                  onClick={() => {
                    setScanMerchantName(m.name);
                    setScanVpa(m.vpa);
                    setScanAmount(m.amt);
                    setScanConfirmStep(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ac)] cursor-pointer"
                >
                  Scan: {m.name}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs text-[var(--mut)]">
                Scanned Merchant Name
                <input
                  type="text"
                  value={scanMerchantName}
                  onChange={(e) => setScanMerchantName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                />
              </label>
              <label className="block text-xs text-[var(--mut)]">
                Scanned Merchant VPA
                <input
                  type="text"
                  value={scanVpa}
                  onChange={(e) => setScanVpa(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm font-mono"
                />
              </label>
              <label className="block text-xs text-[var(--mut)]">
                Payment Amount (₹)
                <input
                  type="number"
                  min="1"
                  value={scanAmount}
                  onChange={(e) => setScanAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-base font-bold font-tabular"
                />
              </label>

              {!scanConfirmStep ? (
                <button
                  type="button"
                  onClick={() => setScanConfirmStep(true)}
                  className="w-full py-2.5 px-4 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-sm cursor-pointer"
                >
                  Proceed to Confirmation Step →
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-[var(--bg)] border-2 border-[var(--ac)] space-y-3">
                  <div className="text-xs font-bold text-[var(--lt)] uppercase">Confirm QR Payment</div>
                  <div className="text-sm text-[var(--ink)]">
                    Pay <strong className="font-tabular">{formatINR(Number(scanAmount))}</strong> to <strong>{scanMerchantName}</strong> ({scanVpa}) from Tatito Wallet?
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={upiBusy}
                      onClick={handleScanAndPayExecute}
                      className="flex-1 py-2 px-3 rounded-lg bg-[var(--ac)] text-[var(--ai)] font-semibold text-xs cursor-pointer"
                    >
                      {upiBusy ? 'Settling...' : 'Confirm & Pay Now [Demo]'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanConfirmStep(false)}
                      className="px-3 py-2 rounded-lg border border-[var(--line)] text-xs text-[var(--mut)] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
            <h2 className="text-lg font-bold text-[var(--ink)] m-0">My Receive QR &amp; Dynamic QR</h2>
            <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] text-center space-y-2">
              <div className="w-36 h-36 mx-auto rounded-xl bg-white p-3 border border-[var(--line)] grid grid-cols-5 grid-rows-5 gap-1">
                {Array.from({ length: 25 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xs ${
                      idx % 2 === 0 || idx === 3 || idx === 7 || idx === 17 ? 'bg-[#0d5c4b]' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="font-bold text-sm text-[var(--ink)]">{user?.full_name || 'Ramesh Kumar'}</div>
              <div className="text-xs font-mono text-[var(--lt)]">
                {generatedQr ? generatedQr.vpa : upiData?.primary_vpa || 'ramesh@tatitoupi'}
              </div>
              {generatedQr?.amount && (
                <div className="text-sm font-extrabold font-tabular text-[var(--ink)]">
                  Dynamic Amount: {formatINR(generatedQr.amount)} · Ref: {generatedQr.reference_code}
                </div>
              )}
              <div className="text-[11px] font-mono text-[var(--mut)] break-all px-2">
                {generatedQr?.payload_uri || 'upi://pay?pa=ramesh@tatitoupi&pn=Ramesh%20Kumar&cu=INR'}
              </div>
            </div>

            <form onSubmit={handleGenerateQr} className="space-y-3 pt-2 border-t border-[var(--line)]">
              <div className="text-xs font-bold text-[var(--ink)]">Generate Dynamic Amount QR Code</div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Amount (₹)"
                  value={dynQrAmount}
                  onChange={(e) => setDynQrAmount(e.target.value)}
                  className="px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm font-tabular"
                />
                <input
                  type="text"
                  placeholder="Invoice / Note"
                  value={dynQrNote}
                  onChange={(e) => setDynQrNote(e.target.value)}
                  className="px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-[10px] bg-[var(--ac2)] text-[#2a1d00] font-semibold text-xs cursor-pointer"
              >
                Generate Dynamic QR with Amount
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: 16-CATEGORY RECHARGES & BILL PAYMENTS */}
      {activeTab === 'bills' && (
        <div className="space-y-5">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5">
            <h2 className="text-lg font-bold text-[var(--ink)] m-0 mb-3">
              Select Recharge or Bill Category (16 BBPS Categories)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-2.5">
              {BILL_CATEGORIES.map((cat) => {
                const active = selectedBillCat.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedBillCat(cat);
                      setBillOperator(cat.defaultOp);
                      setFetchedBill(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                      active
                        ? 'bg-[var(--ac)] text-[var(--ai)] border-[var(--ac)] font-semibold'
                        : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ac)]'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleFetchBill} className="mt-5 pt-5 border-t border-[var(--line)] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs text-[var(--mut)] mb-1">Provider / Biller</label>
                <input
                  type="text"
                  required
                  value={billOperator}
                  onChange={(e) => setBillOperator(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs text-[var(--mut)] mb-1">{selectedBillCat.placeholder}</label>
                <input
                  type="text"
                  required
                  value={billAccountNo}
                  onChange={(e) => setBillAccountNo(e.target.value)}
                  placeholder={selectedBillCat.placeholder}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm font-tabular"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={billBusy}
                  className="w-full py-2.5 px-4 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-sm cursor-pointer"
                >
                  {billBusy ? '...' : 'Fetch Bill'}
                </button>
              </div>
            </form>

            {fetchedBill && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <div className="text-xs text-[var(--mut)]">Customer Name · {fetchedBill.operator}</div>
                    <div className="text-base font-bold text-[var(--ink)]">{fetchedBill.customer_name}</div>
                    <div className="text-xs text-[var(--mut)] font-tabular">
                      Bill No: {fetchedBill.bill_number} · Due Date: {fetchedBill.due_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--mut)]">Amount Due</div>
                    <div className="text-2xl font-extrabold font-tabular text-[var(--ink)]">
                      {formatINR(fetchedBill.amount_due || fetchedBill.bill_amount)}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--mut)]">{fetchedBill.notice}</div>
                <button
                  type="button"
                  disabled={billBusy}
                  onClick={handlePayBill}
                  className="w-full py-2.5 px-4 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-sm cursor-pointer"
                >
                  {billBusy ? 'Settling...' : `Confirm & Pay ${formatINR(fetchedBill.amount_due || fetchedBill.bill_amount)} from Wallet [Demo]`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TATITO WALLET, KYC LIMITS & LEDGER */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--ink)] m-0">Wallet Add / Withdraw</h2>
                <div className="flex gap-1 bg-[var(--bg)] p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setWalletAction('add')}
                    className={`px-3 py-1 rounded-md cursor-pointer ${walletAction === 'add' ? 'bg-[var(--ac)] text-[var(--ai)]' : 'text-[var(--mut)]'}`}
                  >
                    + Add Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletAction('withdraw')}
                    className={`px-3 py-1 rounded-md cursor-pointer ${walletAction === 'withdraw' ? 'bg-[var(--ac)] text-[var(--ai)]' : 'text-[var(--mut)]'}`}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <form onSubmit={handleWalletTransfer} className="space-y-3">
                <label className="block text-xs text-[var(--mut)]">
                  Amount (₹)
                  <input
                    type="number"
                    min="100"
                    max="500000"
                    required
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-base font-bold font-tabular"
                  />
                </label>

                {walletAction === 'add' ? (
                  <label className="block text-xs text-[var(--mut)]">
                    Payment Method (Sandbox)
                    <select
                      value={walletChannel}
                      onChange={(e) => setWalletChannel(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    >
                      <option value="upi_sandbox">UPI Sandbox (Zero Fee)</option>
                      <option value="netbanking">NetBanking Sandbox (SBI / HDFC)</option>
                      <option value="rupay_debit">RuPay Debit Card Sandbox</option>
                    </select>
                  </label>
                ) : (
                  <label className="block text-xs text-[var(--mut)]">
                    Destination Bank Account
                    <input
                      type="text"
                      value={walletBank}
                      onChange={(e) => setWalletBank(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={upiBusy}
                  className="w-full py-2.5 px-4 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-sm cursor-pointer"
                >
                  {walletAction === 'add'
                    ? `Add ${formatINR(Number(walletAmount || 0))} to Wallet [Demo]`
                    : `Withdraw ${formatINR(Number(walletAmount || 0))} to Bank [Demo]`}
                </button>
              </form>
            </div>

            {/* Wallet KYC & RBI PPI Limits Card */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--ink)]">Wallet KYC &amp; Transaction Limits</span>
                <span className="font-mono font-bold text-[var(--lt)]">
                  {walletData?.limits?.kyc_tier || 'FULL_KYC_SANDBOX'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
                  <div className="text-[10px] text-[var(--mut)]">Per Txn Limit</div>
                  <div className="font-bold font-tabular text-[var(--ink)]">{formatINR(walletData?.limits?.per_txn_limit ?? 100000)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
                  <div className="text-[10px] text-[var(--mut)]">Daily Limit</div>
                  <div className="font-bold font-tabular text-[var(--ink)]">{formatINR(walletData?.limits?.daily_limit ?? 200000)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
                  <div className="text-[10px] text-[var(--mut)]">Monthly Cap</div>
                  <div className="font-bold font-tabular text-[var(--ink)]">{formatINR(walletData?.limits?.monthly_limit ?? 1000000)}</div>
                </div>
              </div>
              <div className="text-[11px] text-[var(--mut)]">
                {walletData?.limits?.rbi_ppi_notice || 'Simulated PPI escrow limits shown for demonstration only.'}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[var(--ink)] m-0">Reconciled Wallet Statement</h2>
              <div className="flex gap-1 bg-[var(--bg)] p-1 rounded-lg text-xs font-semibold">
                {(['all', 'credit', 'debit'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLedgerFilter(f)}
                    className={`px-2.5 py-1 rounded-md capitalize cursor-pointer ${
                      ledgerFilter === f ? 'bg-[var(--ac)] text-[var(--ai)]' : 'text-[var(--mut)]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] text-left text-[var(--mut)]">
                    <th className="py-2 px-2">Ref</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                    <th className="py-2 px-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWalletTxns.map((t) => (
                    <tr key={t.id} className="border-b last:border-b-0 border-[var(--line)]">
                      <td className="py-2.5 px-2 font-mono text-[var(--ink)]">{t.reference_id}</td>
                      <td className="py-2.5 px-2 uppercase font-semibold text-[var(--lt)]">{t.transaction_type}</td>
                      <td className="py-2.5 px-2 text-[var(--mut)]">{t.description}</td>
                      <td className="py-2.5 px-2 text-right font-bold font-tabular text-[var(--ink)]">
                        {t.transaction_type === 'credit' ? '+' : '-'}{formatINR(t.amount)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-tabular text-[var(--mut)]">
                        {formatINR(t.balance_after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: UPI AUTOPAY & RECURRING MANDATES */}
      {activeTab === 'autopay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
            <h2 className="text-lg font-bold text-[var(--ink)] m-0">Active Recurring Mandates (EMI, SIP &amp; Bills)</h2>
            <p className="text-xs text-[var(--mut)] m-0">
              Pause, resume, or revoke scheduled recurring payments at any time.
            </p>
            <div className="space-y-3">
              {mandates.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--ink)]">{m.biller_or_payee}</div>
                    <div className="text-xs text-[var(--mut)] font-tabular">
                      {m.category} · {m.frequency} · Next Due: <strong>{m.next_trigger_date}</strong> · Ref: {m.mandate_ref}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-tabular text-sm text-[var(--ink)] mr-2">
                      {formatINR(m.amount)}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--line)] text-[var(--lt)]">
                      {m.status}
                    </span>
                    {m.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleMandate(m.id, 'PAUSED')}
                        className="p-1.5 rounded-lg border border-[var(--line)] text-amber-600 hover:bg-[var(--card)] cursor-pointer"
                        title="Pause Mandate"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleMandate(m.id, 'ACTIVE')}
                        className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--lt)] hover:bg-[var(--card)] cursor-pointer"
                        title="Resume Mandate"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleMandate(m.id, 'CANCELLED')}
                      className="p-1.5 rounded-lg border border-[var(--line)] text-rose-500 hover:bg-[var(--card)] cursor-pointer"
                      title="Cancel Mandate"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-3">
            <h3 className="text-base font-bold text-[var(--ink)] m-0">Setup New UPI AutoPay Mandate</h3>
            <form onSubmit={handleCreateMandate} className="space-y-3">
              <label className="block text-xs text-[var(--mut)]">
                Biller / Payee Name
                <input
                  type="text"
                  required
                  placeholder="e.g. Sun Direct DTH or Home Rent"
                  value={newMandatePayee}
                  onChange={(e) => setNewMandatePayee(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                />
              </label>
              <label className="block text-xs text-[var(--mut)]">
                Category
                <select
                  value={newMandateCat}
                  onChange={(e) => setNewMandateCat(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                >
                  <option>Loan EMI</option>
                  <option>Mutual Fund SIP</option>
                  <option>Utility Bill</option>
                  <option>Subscription / Broadband</option>
                </select>
              </label>
              <label className="block text-xs text-[var(--mut)]">
                Max Auto-Debit Amount (₹)
                <input
                  type="number"
                  min="100"
                  required
                  value={newMandateAmt}
                  onChange={(e) => setNewMandateAmt(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-sm font-tabular"
                />
              </label>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-sm cursor-pointer"
              >
                Authorize Sandbox Mandate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENT HISTORY, SEARCH, FILTERS, CSV STATEMENTS & REFUNDS */}
      {activeTab === 'history' && (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[16px] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--ink)] m-0">
              Unified UPI &amp; Bill Payment History ({unifiedHistory.length})
            </h2>
            <button
              type="button"
              onClick={handleExportHistoryCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--ac)] text-[var(--ai)] text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Statement (CSV)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-[var(--mut)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by ref, recipient, biller or VPA..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DEMO_SUCCESS">Success (Sandbox)</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={historyChannelFilter}
                onChange={(e) => setHistoryChannelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs"
              >
                <option value="ALL">All Channels</option>
                <option value="UPI">UPI Transfers &amp; QR</option>
                <option value="BBPS">BBPS Recharges &amp; Bills</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[var(--mut)]">
                  <th className="py-2.5 px-3">Ref No</th>
                  <th className="py-2.5 px-3">Counterparty / Biller</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unifiedHistory.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0 border-[var(--line)]">
                    <td className="py-2.5 px-3 font-mono text-[var(--ink)]">{item.ref}</td>
                    <td className="py-2.5 px-3 text-[var(--ink)]">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-[var(--mut)]">{item.identifier}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--mut)]">{item.mode}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          item.status === 'FAILED'
                            ? 'text-rose-500'
                            : item.status === 'PENDING'
                            ? 'text-amber-600'
                            : 'text-[var(--lt)]'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.refund_status !== 'NONE' && (
                        <span className="block text-[10px] text-amber-600">{item.refund_status}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-tabular text-[var(--ink)]">
                      {formatINR(item.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReceipt({
                            transaction_ref: item.ref,
                            counterparty_name: item.name,
                            counterparty_vpa: item.identifier,
                            amount: item.amount,
                            status: item.status,
                            payment_mode: item.mode,
                            created_at: item.created_at
                          })
                        }
                        className="text-xs font-semibold text-[var(--lt)] hover:underline cursor-pointer"
                      >
                        Receipt
                      </button>
                      {item.canRefund && (
                        <button
                          type="button"
                          onClick={() => handleRefundRequest(item.ref)}
                          className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                        >
                          Request Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Digital Transaction Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <div className="text-[11px] font-bold text-[var(--lt)] uppercase">Tatito Digital Payment Receipt</div>
                <div className="text-base font-bold text-[var(--ink)]">{selectedReceipt.status || 'DEMO_SUCCESS'}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-xs font-semibold text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="text-center py-2">
              <div className="text-xs text-[var(--mut)]">Amount Settled (Sandbox)</div>
              <div className="text-3xl font-extrabold font-tabular text-[var(--ink)]">
                {formatINR(selectedReceipt.amount)}
              </div>
            </div>

            <div className="space-y-2 text-xs border-y border-[var(--line)] py-3">
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Transaction Reference</span>
                <span className="font-mono font-bold text-[var(--ink)]">{selectedReceipt.transaction_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Payee / Counterparty</span>
                <span className="font-semibold text-[var(--ink)]">{selectedReceipt.counterparty_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Identifier / VPA</span>
                <span className="font-mono text-[var(--ink)]">{selectedReceipt.counterparty_vpa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Payment Channel</span>
                <span className="text-[var(--ink)]">{selectedReceipt.payment_mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Timestamp</span>
                <span className="font-tabular text-[var(--ink)]">
                  {new Date(selectedReceipt.created_at || Date.now()).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[var(--mut)] leading-relaxed">
              SANDBOX RECEIPT: Generated by Tatito Financial Services (M/s. Tatito Projects, Kadapa) for demonstration purposes.
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-[10px] bg-[var(--ac)] text-[var(--ai)] font-semibold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

