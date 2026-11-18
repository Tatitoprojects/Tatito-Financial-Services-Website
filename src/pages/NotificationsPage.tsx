import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  CheckCheck,
  CreditCard,
  TrendingUp,
  Wifi,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [wsLive, setWsLive] = useState<boolean>(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(Array.isArray(res) ? res : (res?.notifications || []));
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (typeof window === 'undefined' || !('WebSocket' in window)) return;
    let socket: WebSocket | null = null;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const userIdParam = user?.id ? `?userId=${user.id}` : '';
      socket = new WebSocket(`${proto}//${window.location.host}/ws/notifications${userIdParam}`);
      socket.onopen = () => setWsLive(true);
      socket.onclose = () => setWsLive(false);
      socket.onerror = () => setWsLive(false);
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.event === 'NOTIFICATION_EVENT' && payload?.data) {
            setNotifications((prev) => [
              {
                id: Date.now(),
                title: payload.data.title,
                message: payload.data.message,
                type: payload.data.category || 'payments',
                is_read: false,
                created_at: payload.timestamp || new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        } catch {
          // ignore malformed messages
        }
      };
    } catch {
      setWsLive(false);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [user?.id]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const item of unread) {
      try {
        await api.markNotificationRead(item.id);
      } catch {
        // continue
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const filteredNotifications = notifications.filter((item) => {
    const kind = (item.type || item.category || '').toLowerCase();
    if (filter === 'unread') return !item.is_read;
    if (filter === 'loans') return kind.includes('loan');
    if (filter === 'investments') return kind.includes('stock') || kind.includes('invest');
    if (filter === 'payments') return kind.includes('pay') || kind.includes('wallet') || kind.includes('upi');
    return true;
  });

  const getIcon = (type: string) => {
    const lower = type?.toLowerCase() || '';
    if (lower.includes('loan')) return <CheckCircle2 className="w-5 h-5 text-[#003366] dark:text-teal-300" />;
    if (lower.includes('stock') || lower.includes('invest')) return <TrendingUp className="w-5 h-5 text-teal-600" />;
    if (lower.includes('pay') || lower.includes('wallet') || lower.includes('upi')) return <CreditCard className="w-5 h-5 text-emerald-600" />;
    return <Bell className="w-5 h-5 text-blue-600 dark:text-teal-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003366] dark:text-teal-300 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                wsLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <Wifi className="w-3 h-3" /> {wsLive ? 'LIVE WS STREAM' : 'SYNCED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time loan sanctions, EMI debit alerts, UPI receipts, and account security notices
            </p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-slate-600" />
            Mark all as read
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: 'Unread Only' },
            { id: 'loans', label: 'Loans & EMI' },
            { id: 'investments', label: 'Investments & SIP' },
            { id: 'payments', label: 'Wallet & Payments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-[#003366] dark:bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No notifications found</div>
              <p className="text-xs text-slate-400 mt-0.5">You're all caught up on your account alerts.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 transition-colors flex items-start gap-4 ${
                  notif.is_read ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type || notif.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{notif.title}</h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {notif.type || notif.category || 'system'}
                    </span>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[11px] font-semibold text-[#003366] dark:text-teal-300 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
