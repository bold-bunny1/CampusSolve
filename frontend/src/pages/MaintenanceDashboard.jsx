import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ResolveModal from '../components/ResolveModal';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  PauseCircle, 
  ArrowUpRight, 
  MapPin, 
  Search, 
  Filter, 
  ShieldAlert,
  Calendar
} from 'lucide-react';

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedForResolve, setSelectedForResolve] = useState(null);
  const [holdModalTicket, setHoldModalTicket] = useState(null);
  const [holdReason, setHoldReason] = useState('');

  const navigate = useNavigate();

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.listComplaints({
        my_tasks_only: true,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search.trim() || undefined
      });
      setComplaints(data);
    } catch (err) {
      setError(err.message || 'Failed to load technician assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, categoryFilter]);

  const handleStartWork = async (ticket) => {
    try {
      await api.updateStatus(ticket.id, {
        status: 'In Progress',
        notes: 'Technician arrived on site and commenced diagnostics'
      });
      await loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmHold = async () => {
    if (!holdReason.trim()) return;
    try {
      await api.updateStatus(holdModalTicket.id, {
        status: 'On Hold',
        notes: 'Placed on hold by technician',
        hold_reason: holdReason.trim()
      });
      setHoldModalTicket(null);
      setHoldReason('');
      await loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to put on hold');
    }
  };

  const handleResumeWork = async (ticket) => {
    try {
      await api.updateStatus(ticket.id, {
        status: 'In Progress',
        notes: 'Resumed repair after hold period'
      });
      await loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to resume work');
    }
  };

  // Metrics
  const totalAssigned = complaints.length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const overdueCount = complaints.filter(c => c.is_overdue).length;
  const criticalCount = complaints.filter(c => ['Critical', 'High'].includes(c.priority)).length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-medium border border-amber-400/30">
            Technician Station • {user?.specialization || 'Maintenance Specialist'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Assigned Work Orders: {user?.full_name}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            Execute maintenance workflows, track target resolution SLAs, log on-site diagnostic notes, and record official resolutions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Assigned</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalAssigned}</div>
          <span className="text-[10px] text-slate-400">Lifetime queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Critical & High</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{criticalCount}</div>
          <span className="text-[10px] text-rose-500 font-medium">Urgent attention</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">In Progress</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</div>
          <span className="text-[10px] text-slate-400">Active repairs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Overdue Tasks</span>
          <div className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <span className="text-[10px] text-red-500 font-medium">Breached SLA target</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Completed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
          <span className="text-[10px] text-slate-400">Closed work orders</span>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Work Queue</h2>
            <p className="text-xs text-slate-500">Only tasks assigned to your technician account are displayed</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket title, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTasks()}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 w-44 sm:w-56 focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned (New)</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Furniture">Furniture</option>
              <option value="Internet">Internet</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>

        {/* Task Cards */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading your assigned tickets...</div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No pending work orders</h3>
            <p className="text-xs text-slate-500">Your assignment queue is clear.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <div 
                key={c.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {c.complaint_id}
                    </span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    {c.is_safety_hazard && (
                      <span className="text-[11px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600" /> Safety Alert
                      </span>
                    )}
                    {c.is_overdue && (
                      <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase">
                        Overdue ({c.overdue_by_hours}h)
                      </span>
                    )}
                  </div>

                  <h3 
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    {c.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{c.block}, Floor {c.floor} ({c.location})</strong>
                    </span>
                    <span>•</span>
                    <span>Category: <strong>{c.category}</strong></span>
                    <span>•</span>
                    <span>Scope: <strong>{c.impact_level}</strong></span>
                  </div>
                </div>

                {/* Technician Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {c.status === 'Assigned' && (
                    <button
                      onClick={() => handleStartWork(c)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start Work
                    </button>
                  )}

                  {c.status === 'In Progress' && (
                    <>
                      <button
                        onClick={() => { setHoldModalTicket(c); setHoldReason(''); }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <PauseCircle className="w-3.5 h-3.5" /> Hold
                      </button>

                      <button
                        onClick={() => setSelectedForResolve(c)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                      </button>
                    </>
                  )}

                  {c.status === 'On Hold' && (
                    <button
                      onClick={() => handleResumeWork(c)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Resume Work
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    View Record <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {selectedForResolve && (
        <ResolveModal
          isOpen={!!selectedForResolve}
          onClose={() => setSelectedForResolve(null)}
          complaint={selectedForResolve}
          onResolved={() => { setSelectedForResolve(null); loadTasks(); }}
        />
      )}

      {/* Hold Reason Modal */}
      {holdModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Hold Reason for Ticket {holdModalTicket.complaint_id}</h3>
            <p className="text-xs text-slate-500">
              State why the repair is paused. The SLA clock will freeze until work is resumed.
            </p>
            <textarea
              rows={3}
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="e.g. Waiting for spare circuit breaker delivery from campus stores..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHoldModalTicket(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHold}
                disabled={!holdReason.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
