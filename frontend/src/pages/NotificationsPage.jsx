import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  ExternalLink, 
  Clock, 
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const navigate = useNavigate();

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.listNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterUnread 
    ? notifications.filter(n => !n.is_read) 
    : notifications;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            In-App Notification Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time updates on your complaint status changes, assignments, technician notes, and resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterUnread
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {filterUnread ? 'Showing Unread' : 'Show All'}
          </button>

          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading notification records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
            <p className="text-xs text-slate-500">You are all caught up on recent hostel announcements and updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => (
              <div 
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`p-4 sm:p-5 hover:bg-slate-50 transition-colors flex items-start gap-4 ${
                  !n.is_read ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-blue-600' : 'bg-slate-300'}`} />

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h3>
                    <span className="text-[11px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>

                  {n.complaint_id && (
                    <div className="pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n);
                          navigate(`/complaints/${n.complaint_id}`);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Inspect Complaint Ticket ({n.complaint_uid}) <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
