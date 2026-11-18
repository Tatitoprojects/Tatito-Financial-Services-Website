import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardStats, LoanApplication, AuditLogItem } from '../types';
import { 
  Download, CheckCircle2, ShieldAlert, Activity, Gift, HeadphonesIcon
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentsMonitor, setPaymentsMonitor] = useState<{ summary: any; transactions: any[] } | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [offersSummary, setOffersSummary] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<
    'loans' | 'users' | 'products' | 'audit' | 'payments' | 'risk' | 'support' | 'offers'
  >('loans');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notice, setNotice] = useState<string>('');

  const loadAdminData = async () => {
    try {
      const [
        statsRes,
        loansRes,
        usersRes,
        logsRes,
        prodsRes,
        payMonRes,
        riskRes,
        supRes,
        offersRes,
      ] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminLoans(statusFilter === 'all' ? undefined : statusFilter),
        api.getAdminUsers(),
        api.getAuditLogs(),
        api.getProducts(),
        api.getAdminPaymentsMonitor(),
        api.getAdminRiskAlerts(),
        api.getAdminSupportTickets(),
        api.getAdminOffersSummary(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (loansRes.status === 'fulfilled' && Array.isArray(loansRes.value)) setLoans(loansRes.value);
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) setUsersList(usersRes.value);
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) setAuditLogs(logsRes.value);
      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) setProducts(prodsRes.value);
      if (payMonRes.status === 'fulfilled') setPaymentsMonitor(payMonRes.value);
      if (riskRes.status === 'fulfilled' && Array.isArray(riskRes.value?.alerts)) setRiskAlerts(riskRes.value.alerts);
      if (supRes.status === 'fulfilled' && Array.isArray(supRes.value?.tickets)) setSupportTickets(supRes.value.tickets);
      if (offersRes.status === 'fulfilled') setOffersSummary(offersRes.value);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [statusFilter]);

  const handleUpdateProductRate = async (prodId: number, newRate: number) => {
    try {
      await api.updateLoanProduct(prodId, { base_interest_rate: newRate });
      setNotice(`Updated interest rate to ${newRate}% p.a. for product #${prodId}.`);
      await loadAdminData();
      setTimeout(() => setNotice(''), 2500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to update product rate');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.updateUserStatus(userId, !currentStatus);
      setNotice(`User status updated to ${!currentStatus ? 'Active' : 'Suspended'}.`);
      await loadAdminData();
      setTimeout(() => setNotice(''), 2500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to update user status');
    }
  };

  const handleQuickLoanDecision = async (loan: LoanApplication, decision: string) => {
    try {
      await api.decideLoan(loan.id, {
        decision,
        remarks: `Executive decision (${decision.toUpperCase()}) recorded by ${user?.full_name || 'Branch Admin'}.`,
        sanctioned_amount: loan.requested_amount,
      });
      setNotice(`Application ${loan.application_no} updated to ${decision.toUpperCase()}.`);
      await loadAdminData();
      setTimeout(() => setNotice(''), 3000);
    } catch (err: any) {
      setNotice(err.message || 'Failed to update loan status');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const note = resolutionNotes[ticketId] || `Marked ${status} by ${user?.full_name || 'Admin'}`;
      await api.updateAdminSupportTicket(ticketId, { status, resolution_note: note });
      setNotice(`Support ticket updated to ${status}.`);
      await loadAdminData();
      setTimeout(() => setNotice(''), 2500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to update support ticket');
    }
  };

  const handleDownloadCsv = async () => {
    try {
      const csv = await api.downloadReportsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Tatito_Loans_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  const formatINR = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            {user?.role === 'super_admin' ? 'Super Admin Executive Console' : 'Executive Control Center'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {user?.role === 'super_admin' ? 'Enterprise Super Admin & Branch Console' : 'Branch Administrator Console'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Officer: <span className="font-semibold text-slate-900">{user?.full_name || 'Ankalaiah Bandlamudi'}</span> ({user?.role?.replace('_', ' ').toUpperCase()}) · Branch: {stats?.branch_name || 'Kadapa Central Hub, Andhra Pradesh'}
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All Loans (CSV)</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Accounts</span>
          <div className="text-2xl font-bold font-tabular text-slate-900">{stats?.total_users || 8} Users</div>
          <div className="text-xs text-slate-400 pt-1">Customers, Agents &amp; Officers</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Dossiers</span>
          <div className="text-2xl font-bold font-tabular text-slate-900">{stats?.total_applications || 12} Total</div>
          <div className="text-xs text-teal-600 font-medium pt-1">{stats?.pending_underwriting || 7} Pending Review</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disbursed Loan Volume</span>
          <div className="text-2xl font-bold font-tabular text-slate-900">{formatINR(stats?.total_disbursed_volume || 250000)}</div>
          <div className="text-xs text-slate-400 pt-1">Kadapa Retail Portfolio</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Wealth AUM</span>
          <div className="text-2xl font-bold font-tabular text-teal-800">{formatINR(stats?.total_wealth_aum || 460636)}</div>
          <div className="text-xs text-emerald-600 font-medium pt-1">Equities, SIPs &amp; Gold ETFs</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'loans' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Loan Queue ({loans.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'payments' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Transactions Monitor ({paymentsMonitor?.transactions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'risk' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Fraud &amp; Risk ({riskAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'support' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Support Queue ({supportTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'offers' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Offers &amp; Rewards
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Users &amp; Roles ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Rates ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: LOAN APPLICATIONS QUEUE */}
      {activeTab === 'loans' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Underwriting Queue</h2>
              <p className="text-xs text-slate-500">Filter, inspect, and enforce credit committee approvals across all products.</p>
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="all">All Application Statuses</option>
              <option value="submitted">Submitted (New)</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="sanctioned">Sanctioned</option>
              <option value="disbursed">Disbursed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">App Reference</th>
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Product &amp; Mode</th>
                  <th className="py-2.5 px-3 text-right">Requested</th>
                  <th className="py-2.5 px-3">Tenure</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Underwriting Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-tabular text-slate-700">
                {loans.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{app.application_no}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{app.applicant_name}</td>
                    <td className="py-3 px-3">
                      <div>{app.product_name || 'Personal Loan'}</div>
                      <div className="text-[10px] text-slate-400">
                        {(app as any).repayment_mode === 'interest_only' ? 'Mode A: Interest-Only' : 'Mode B: Amortized EMI'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(app.requested_amount)}</td>
                    <td className="py-3 px-3">{app.tenure_months}M</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{app.credit_score || 745}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold uppercase tracking-wider text-[11px] ${
                        app.status === 'approved' || app.status === 'sanctioned' || app.status === 'disbursed'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : app.status === 'rejected'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {app.status !== 'approved' && app.status !== 'sanctioned' && app.status !== 'disbursed' && (
                          <button
                            type="button"
                            onClick={() => handleQuickLoanDecision(app, 'approved')}
                            className="px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {app.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleQuickLoanDecision(app, 'sanctioned')}
                            className="px-2 py-1 text-[10px] font-bold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors"
                          >
                            Sanction
                          </button>
                        )}
                        {(app.status === 'approved' || app.status === 'sanctioned') && (
                          <button
                            type="button"
                            onClick={() => handleQuickLoanDecision(app, 'disbursed')}
                            className="px-2 py-1 text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                          >
                            Disburse
                          </button>
                        )}
                        {app.status !== 'rejected' && app.status !== 'disbursed' && (
                          <button
                            type="button"
                            onClick={() => handleQuickLoanDecision(app, 'rejected')}
                            className="px-2 py-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TRANSACTIONS MONITOR */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Unified UPI &amp; BBPS Transactions Monitor
              </h2>
              <p className="text-xs text-slate-500">Live settlement ledger view. Confidential UPI PINs, OTPs, and passwords are never logged or shown.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500">Total Count</div>
              <div className="text-lg font-bold text-slate-900 font-tabular">{paymentsMonitor?.summary?.total_transactions || 0}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-emerald-700">Successful</div>
              <div className="text-lg font-bold text-emerald-900 font-tabular">{paymentsMonitor?.summary?.successful_count || 0}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-amber-700">Pending</div>
              <div className="text-lg font-bold text-amber-900 font-tabular">{paymentsMonitor?.summary?.pending_count || 0}</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <div className="text-rose-700">Failed / Declined</div>
              <div className="text-lg font-bold text-rose-900 font-tabular">{paymentsMonitor?.summary?.failed_count || 0}</div>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
              <div className="text-teal-800">Settled Volume</div>
              <div className="text-lg font-bold text-teal-900 font-tabular">{formatINR(paymentsMonitor?.summary?.total_settled_volume || 0)}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Counterparty / Operator</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Refund</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-tabular text-slate-700">
                {(paymentsMonitor?.transactions || []).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.ref}</td>
                    <td className="py-2.5 px-3 font-mono uppercase">{t.channel}</td>
                    <td className="py-2.5 px-3">{t.party}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(t.amount)}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{t.status}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{t.refund_status}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: FRAUD & RISK ALERTS */}
      {activeTab === 'risk' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Automated Fraud &amp; Velocity Risk Alerts</h2>
              <p className="text-xs text-slate-500">Flags high-value transfers (&ge; ₹25,000), gateway declines, and refund disputes in real time.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {riskAlerts.map((alert) => (
              <div key={alert.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      alert.severity === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : alert.severity === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{alert.rule}</span>
                    <span className="font-mono text-slate-400">#{alert.reference}</span>
                  </div>
                  <p className="text-slate-700">{alert.description}</p>
                </div>
                <span className="font-mono text-[11px] font-bold text-teal-700 shrink-0">{alert.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SUPPORT TICKETS QUEUE */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Dispute &amp; Grievance Queue</h2>
              <p className="text-xs text-slate-500">Respond to customer UPI disputes, loan queries, and wallet tickets with real-time WebSocket updates.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {supportTickets.map((tkt) => (
              <div key={tkt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{tkt.ticket_no}</span> ·{' '}
                    <span className="font-bold text-slate-800">{tkt.subject}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">Category: {tkt.category} · Priority: {tkt.priority}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 self-start">
                    {tkt.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Add official Kadapa desk resolution note..."
                    value={resolutionNotes[tkt.id] || ''}
                    onChange={(e) => setResolutionNotes({ ...resolutionNotes, [tkt.id]: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketStatus(tkt.id, 'IN_PROGRESS')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketStatus(tkt.id, 'RESOLVED')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg"
                  >
                    Resolve Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: OFFERS & REWARDS SUMMARY */}
      {activeTab === 'offers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Rewards, Cashback Campaigns &amp; Promo Coupons</h2>
                <p className="text-xs text-slate-500">Govern active loyalty rules and voucher inventories transparently.</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-500">Customer Reward Points Pool</div>
              <div className="text-lg font-bold font-tabular text-teal-700">{(offersSummary?.total_points_circulating || 0).toLocaleString('en-IN')} pts</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {(offersSummary?.campaigns || []).map((c: any) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{c.title}</span>
                  <span className="text-teal-700 font-mono">{c.code}</span>
                </div>
                <p className="text-slate-600">{c.terms}</p>
                <div className="text-[11px] text-slate-400">Cashback: {c.reward_text || `₹${c.cashback}`} · Expires {c.valid_until || c.expires_at}</div>
              </div>
            ))}
            {(offersSummary?.coupons || []).map((cp: any) => (
              <div key={cp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{cp.brand} — {cp.title}</span>
                  <span className="font-mono text-teal-700">{cp.code}</span>
                </div>
                <div className="text-slate-600">Discount: {cp.discount_text} · Min Txn: ₹{cp.min_spend}</div>
                <div className="text-[11px] text-slate-400">Status: {cp.claimed ? 'Claimed in Sandbox' : 'Active Offer'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USER & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">User &amp; Role Management</h2>
            <p className="text-xs text-slate-500">Monitor active accounts, enforce RBAC roles, and manage account statuses.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Active Role</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-tabular text-slate-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono text-slate-400">#{u.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-3 text-slate-600">{u.email}</td>
                    <td className="py-3 px-3 font-mono">{u.phone}</td>
                    <td className="py-3 px-3 font-semibold capitalize text-teal-800">{u.role.replace('_', ' ')}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEMO RATE CONFIGURATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Demo Loan Product &amp; Rate Configuration</h2>
            <p className="text-xs text-slate-500">Configure benchmark interest rates and borrowing caps for Kadapa branches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{p.product_name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{p.product_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Base Rate (% p.a.):</label>
                  <input
                    type="number"
                    step="0.25"
                    defaultValue={p.base_interest_rate}
                    onBlur={(e) => handleUpdateProductRate(p.id, parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 border border-slate-300 rounded font-bold font-tabular text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-400">(Click outside to save)</span>
                </div>
                <div className="text-[11px] text-slate-500 font-tabular">
                  Sanction Limit: {formatINR(p.min_amount)} to {formatINR(p.max_amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Immutable Security Audit Trail</h2>
            <p className="text-xs text-slate-500">Records all critical financial operations, loan decisions, logins, and registrations.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Reference ID</th>
                  <th className="py-2.5 px-3">Actor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-tabular text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.action_type}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{log.entity_name}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-teal-800">{log.entity_id}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">User #{log.actor_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
