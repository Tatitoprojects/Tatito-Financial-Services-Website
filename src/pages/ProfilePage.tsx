import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  ShieldCheck,
  CreditCard,
  Building2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  KeyRound,
  Smartphone,
  Globe,
  Fingerprint,
  LogOut,
  Trash2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [demat, setDemat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number>(25000);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMessage, setDepositMessage] = useState<string | null>(null);

  // KYC form state
  const [panNumber, setPanNumber] = useState('');
  const [panLoading, setPanLoading] = useState(false);
  const [panResult, setPanResult] = useState<any>(null);
  const [panError, setPanError] = useState<string | null>(null);

  // Security, Password, Sessions, Login History & Preferences
  const [settings, setSettings] = useState<any>({
    preferred_language: 'English',
    push_alerts: true,
    email_alerts: true,
    sms_alerts: false,
    biometric_lock_enabled: false,
    mask_balances_by_default: false,
    deletion_requested: false,
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityNotice, setSecurityNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [accountActionReason, setAccountActionReason] = useState('');
  const [confirmActionType, setConfirmActionType] = useState<'deactivate' | 'request_deletion' | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, kycData, dematData, settingsData, sessionsData, historyData] = await Promise.allSettled([
        api.getProfile(),
        api.getKycStatus(),
        api.getDemat(),
        api.getUserSettings(),
        api.getSessions(),
        api.getLoginHistory(),
      ]);

      if (profileData.status === 'fulfilled') setProfile(profileData.value?.user || profileData.value);
      if (kycData.status === 'fulfilled') setKycStatus(kycData.value);
      if (dematData.status === 'fulfilled') setDemat(dematData.value?.demat);
      if (settingsData.status === 'fulfilled' && settingsData.value?.settings) {
        setSettings(settingsData.value.settings);
      }
      if (sessionsData.status === 'fulfilled' && Array.isArray(sessionsData.value?.sessions)) {
        setSessions(sessionsData.value.sessions);
      }
      if (historyData.status === 'fulfilled' && Array.isArray(historyData.value?.history)) {
        setLoginHistory(historyData.value.history);
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount <= 0) return;
    setDepositLoading(true);
    setDepositMessage(null);
    try {
      await api.depositWallet(depositAmount);
      setDepositMessage(`Successfully credited ₹${depositAmount.toLocaleString('en-IN')} to Tatito Wallet!`);
      await refreshUser();
      await loadData();
    } catch (err: any) {
      setDepositMessage(err?.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleVerifyPan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanLoading(true);
    setPanError(null);
    setPanResult(null);
    try {
      const res = await api.verifyPan(panNumber.toUpperCase(), user?.full_name);
      setPanResult(res);
      await loadData();
      await refreshUser();
    } catch (err: any) {
      setPanError(err?.message || 'PAN verification failed');
    } finally {
      setPanLoading(false);
    }
  };

  const handleUpdateSettings = async (patch: Record<string, any>) => {
    setSecurityBusy(true);
    setSecurityNotice(null);
    try {
      const res = await api.updateUserSettings(patch);
      if (res?.settings) setSettings(res.settings);
      setSecurityNotice({ type: 'success', text: 'Security & communication preferences saved.' });
    } catch (err: any) {
      setSecurityNotice({ type: 'error', text: err?.message || 'Failed to update settings' });
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityBusy(true);
    setSecurityNotice(null);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setSecurityNotice({ type: 'success', text: res.message || 'Password changed securely.' });
    } catch (err: any) {
      setSecurityNotice({ type: 'error', text: err?.message || 'Failed to change password.' });
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSecurityBusy(true);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, is_active: false } : s)));
      setSecurityNotice({ type: 'success', text: `Device session ${sessionId} signed out.` });
    } catch (err: any) {
      setSecurityNotice({ type: 'error', text: err?.message || 'Failed to revoke session.' });
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleAccountAction = async (action: 'deactivate' | 'request_deletion') => {
    setSecurityBusy(true);
    setSecurityNotice(null);
    try {
      const res = await api.requestAccountAction({ action, reason: accountActionReason });
      setConfirmActionType(null);
      setAccountActionReason('');
      setSecurityNotice({ type: 'success', text: res.message });
      await loadData();
    } catch (err: any) {
      setSecurityNotice({ type: 'error', text: err?.message || 'Could not process account request.' });
    } finally {
      setSecurityBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Profile Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#003366] dark:bg-teal-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#003366] dark:text-teal-200 border border-blue-200 uppercase">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Account ID: <span className="font-mono">{user?.id}</span> &bull; {user?.email} &bull; +91 {user?.phone || '9876543210'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Branch Jurisdiction: Kadapa (YSR District), Andhra Pradesh {profile?.city ? `• ${profile.city}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Wallet Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#003366] text-white p-5 rounded-2xl min-w-[260px] shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-200">
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="w-4 h-4 text-teal-400" /> Tatito Liquid Wallet
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Instant</span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white mt-2">
              {settings?.mask_balances_by_default
                ? '₹ •••••••'
                : `₹${(user?.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-blue-200/70 mt-1">Available for EMI payments & stock investments</div>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): KYC Status, Demat Profile, Security & Devices */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statutory KYC Verification Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#003366] dark:text-teal-400" />
                  <h2 className="text-base font-bold text-slate-900">Statutory KYC Compliance</h2>
                </div>
                <div>
                  {user?.kyc_status === 'verified' ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Verified
                    </span>
                  ) : user?.kyc_status === 'submitted' || user?.kyc_status === 'pending' ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Under Verification
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Verification Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Identity Document:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {kycStatus?.pan_number ? `PAN •••••${kycStatus.pan_number.slice(-4)}` : 'Not Linked'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider Status:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {kycStatus?.status || user?.kyc_status || 'UNVERIFIED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Simulated Sandbox Flag:</span>
                  <span className="font-mono text-slate-700">
                    {kycStatus?.is_simulated !== false ? 'SIMULATED_SANDBOX_DEMO' : 'LIVE_VERIFIED'}
                  </span>
                </div>
              </div>

              {/* 7-Stage Enterprise KYC Progress Checklist */}
              {Array.isArray(kycStatus?.kyc_stages) && (
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider">7-Stage NBFC KYC Verification Pipeline</span>
                    <span className="font-tabular text-slate-500">
                      {kycStatus.kyc_stages.filter((s: any) => s.completed).length} / 7 Stages Recorded
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {kycStatus.kyc_stages.map((st: any) => (
                      <div key={st.stage} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">Stage {st.stage}: {st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.status}</div>
                        </div>
                        <CheckCircle2 className={`w-4 h-4 ${st.completed ? 'text-teal-600' : 'text-slate-300'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In-page PAN verification form */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                  Verify PAN or Submit Full 7-Stage KYC Dossier
                </h3>
                <form onSubmit={handleVerifyPan} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                  <button
                    type="submit"
                    disabled={panLoading || panNumber.length < 10}
                    className="px-5 py-2 bg-[#003366] dark:bg-teal-700 hover:opacity-90 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {panLoading ? 'Verifying...' : 'Validate PAN'}
                  </button>
                  <button
                    type="button"
                    disabled={panLoading || panNumber.length < 10}
                    onClick={async () => {
                      setPanLoading(true);
                      setPanError(null);
                      try {
                        const res = await api.submitKycDossier({
                          pan_number: panNumber.toUpperCase(),
                          aadhaar_number: '998877665544',
                          address_line: 'D.No 4/128, RS Road, Kadapa, AP - 516001',
                          employment_type: 'Salaried',
                          annual_income: 840000,
                          bank_account_no: '30998877665',
                          ifsc_code: 'SBIN0000830',
                        });
                        setPanResult(res);
                        await loadData();
                        await refreshUser();
                      } catch (err: any) {
                        setPanError(err?.message || 'KYC Dossier submission failed');
                      } finally {
                        setPanLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
                  >
                    Submit 7-Stage KYC
                  </button>
                </form>

                {panError && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{panError}</span>
                  </div>
                )}

                {panResult && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {panResult.message || 'KYC Record Submitted (Sandbox Simulation)'}
                    </div>
                    <div>Status: <span className="font-mono font-bold">{panResult.status || 'SANDBOX_SIMULATED'}</span></div>
                    <div className="text-[11px] text-emerald-600">Reference: {panResult.verification_reference || panResult.provider_ref}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Demat & Trading Profile */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#003366] dark:text-teal-400" />
                  <h2 className="text-base font-bold text-slate-900">Demat & Depository Account</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {demat?.status || 'ACTIVE'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Depository Participant</span>
                  <span className="font-semibold text-slate-800 text-sm">{demat?.depository || 'NSDL'}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">DP ID: {demat?.dp_id || 'IN300128'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Beneficiary Owner (BO ID)</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">
                    {demat?.bo_id || '1029384756'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Linked to PAN</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Settlement Bank</span>
                  <span className="font-medium text-slate-800">{demat?.bank_name || 'State Bank of India'}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">A/C: {demat?.account_masked || '••••••7890'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Trading Segment Permissions</span>
                  <span className="font-medium text-slate-800">Equity Cash & Mutual Funds</span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">Enabled for Tatito Wealth</span>
                </div>
              </div>
            </div>

            {/* Security, Password & Biometric Controls */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-teal-600" />
                  <h2 className="text-base font-bold text-slate-900">Security, Password & Privacy Controls</h2>
                </div>
                <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  ZERO-PIN STORAGE
                </span>
              </div>

              {securityNotice && (
                <div className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${
                  securityNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {securityNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{securityNotice.text}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>NPCI & RBI Security Compliance:</strong> Tatito Financial Services never collects, transmits, or stores your UPI PIN, netbanking password, or card CVV. Bank-grade PIN verification occurs strictly on your issuing bank/NPCI gateway.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Fingerprint className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-bold text-slate-900">Biometric App Lock</div>
                      <div className="text-[10px] text-slate-500">WebAuthn / device unlock</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.biometric_lock_enabled)}
                    disabled={securityBusy}
                    onChange={(e) => handleUpdateSettings({ biometric_lock_enabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>

                <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-bold text-slate-900">Mask Wallet Balances</div>
                      <div className="text-[10px] text-slate-500">Hide amounts on profile header</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.mask_balances_by_default)}
                    disabled={securityBusy}
                    onChange={(e) => handleUpdateSettings({ mask_balances_by_default: e.target.checked })}
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>
              </div>

              <form onSubmit={handleChangePassword} className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider">Update Account Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="password"
                    required
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="New Password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={securityBusy}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg disabled:opacity-50"
                  >
                    {securityBusy ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Active Devices & Login History */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Smartphone className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Active Sessions, Devices & Login History</h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider">Active & Recent Sessions</div>
                {loading && sessions.length === 0 ? (
                  <div className="text-slate-400">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-slate-400">No session telemetry recorded yet.</div>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{s.device || 'Tatito Web Client'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {s.channel} · IP {s.ip} · {new Date(s.last_active_at || s.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>
                      {s.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={securityBusy}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1 hover:opacity-80"
                        >
                          <LogOut className="w-3 h-3" /> Sign Out
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Revoked</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="font-bold text-slate-700 uppercase tracking-wider">Recent Login Audit Log</div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {loginHistory.slice(0, 5).map((h) => (
                    <div key={h.id} className="p-2.5 bg-slate-50 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-slate-900">{h.channel}</span> ·{' '}
                        <span className="text-slate-500">{h.email_or_phone}</span>
                      </div>
                      <div className="font-mono text-slate-500">
                        {h.status} · {new Date(h.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  {loginHistory.length === 0 && (
                    <div className="p-3 text-slate-400 text-center">No recent logins recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Wallet Funds, Preferences & Account Governance */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-[#003366] dark:text-teal-400" />
                <h2 className="text-base font-bold text-slate-900">Manage Wallet Balance</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Add funds directly to your Tatito account to service loan EMIs, invest in stocks, or start SIP mandates.
              </p>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Select Deposit Amount (₹)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        depositAmount === amt
                          ? 'bg-blue-50 border-[#003366] text-[#003366] dark:text-teal-200'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="number"
                    min={500}
                    step={1000}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={depositLoading || depositAmount <= 0}
                  className="w-full py-2.5 px-4 bg-[#003366] dark:bg-teal-700 hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {depositLoading ? 'Crediting Wallet...' : `Add ₹${depositAmount.toLocaleString('en-IN')} to Wallet`}
                </button>

                {depositMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    {depositMessage}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1 text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Safe Escrow Account Banking
                </div>
                <div>Funds held in designated partner escrow accounts for customer financial activities.</div>
              </div>
            </div>

            {/* Language & Notification Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Globe className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Language & Alerts</h2>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Preferred Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['English', 'Telugu', 'Hindi'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      disabled={securityBusy}
                      onClick={() => handleUpdateSettings({ preferred_language: lang })}
                      className={`py-1.5 rounded-lg border font-semibold transition-all ${
                        settings.preferred_language === lang
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {[
                  { key: 'push_alerts', label: 'Real-time WebSocket Push Alerts' },
                  { key: 'email_alerts', label: 'Loan & Statement Email Receipts' },
                  { key: 'sms_alerts', label: 'SMS Transaction Alerts (Sandbox)' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings[item.key])}
                      disabled={securityBusy}
                      onChange={(e) => handleUpdateSettings({ [item.key]: e.target.checked })}
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Account Lifecycle Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Account Deactivation & Closure</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Temporarily lock self-service access or submit a statutory 7-day RBI/NBFC cooling-off deletion request.
              </p>

              {settings.deletion_requested && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
                  Account deletion request recorded and awaiting cooling-off confirmation.
                </div>
              )}

              {confirmActionType ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="font-bold text-rose-800">
                    Confirm {confirmActionType === 'deactivate' ? 'Temporary Deactivation' : 'Account Deletion Request'}
                  </div>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={accountActionReason}
                    onChange={(e) => setAccountActionReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-rose-200 rounded bg-white text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={securityBusy}
                      onClick={() => handleAccountAction(confirmActionType)}
                      className="flex-1 py-1.5 bg-rose-600 text-white font-bold rounded-lg"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmActionType(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmActionType('deactivate')}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg"
                  >
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmActionType('request_deletion')}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg"
                  >
                    Request Deletion
                  </button>
                </div>
              )}
            </div>

            {/* Kadapa Head Office Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-900 text-sm">M/s. Tatito Projects</div>
              <div>Kadapa Branch & Regional Financial Headquarters</div>
              <div>YSR District, Andhra Pradesh - 516001</div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                Helpline: +91 8562 245678 &bull; support@tatitoprojects.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
