import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import AssignModal from '../components/AssignModal';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Sliders, 
  UserCheck, 
  Clock, 
  Repeat, 
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);

  // Modals
  const [selectedForAssign, setSelectedForAssign] = useState(null);
  const [selectedForOverride, setSelectedForOverride] = useState(null);

  const navigate = useNavigate();

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.listComplaints({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        block: blockFilter || undefined,
        is_overdue: overdueOnly ? true : undefined,
        is_recurring: recurringOnly ? true : undefined,
      });
      setComplaints(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter, categoryFilter, blockFilter, overdueOnly, recurringOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadComplaints();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Comprehensive Complaint Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Audit, reassign, prioritize, and monitor the entire campus complaint lifecycle.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs font-medium">
          Showing <strong>{complaints.length}</strong> matching records
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search complaint ID, resident, location, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Furniture">Furniture</option>
              <option value="Internet">Internet</option>
              <option value="Security">Security</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Other">Other</option>
            </select>
          </form>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded text-red-600"
              />
              <span className={overdueOnly ? 'text-red-700 font-bold' : ''}>Overdue SLA Breach</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={recurringOnly}
                onChange={(e) => setRecurringOnly(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span className={recurringOnly ? 'text-purple-700 font-bold' : ''}>Recurring Hotspots</span>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Resident / Location</th>
                <th className="py-3 px-4">Priority & SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">Loading ledger records...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No complaints matching the selected criteria.</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-600">{c.complaint_id}</div>
                      <div 
                        onClick={() => navigate(`/complaints/${c.id}`)}
                        className="font-semibold text-slate-900 line-clamp-1 hover:text-blue-600 cursor-pointer pt-0.5"
                      >
                        {c.title}
                      </div>
                      <span className="text-[11px] text-slate-400">{c.category}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-900">{c.student_name}</div>
                      <div className="text-[11px] text-slate-500">{c.block}, Floor {c.floor} ({c.location})</div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={c.priority} />
                        {c.is_safety_hazard && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                            Safety
                          </span>
                        )}
                      </div>
                      {c.is_overdue && (
                        <div className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Overdue {c.overdue_by_hours}h
                        </div>
                      )}
                      {c.is_recurring && (
                        <div className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                          <Repeat className="w-3 h-3" /> Recurring
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {c.assigned_staff_name ? (
                        <span className="font-medium">{c.assigned_staff_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedForAssign(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Assign technician"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedForOverride(c)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Override priority"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/complaints/${c.id}`)}
                          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View complete record"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedForAssign && (
        <AssignModal
          isOpen={!!selectedForAssign}
          onClose={() => setSelectedForAssign(null)}
          complaint={selectedForAssign}
          onAssigned={() => { setSelectedForAssign(null); loadComplaints(); }}
        />
      )}

      {selectedForOverride && (
        <PriorityOverrideModal
          isOpen={!!selectedForOverride}
          onClose={() => setSelectedForOverride(null)}
          complaint={selectedForOverride}
          onOverridden={() => { setSelectedForOverride(null); loadComplaints(); }}
        />
      )}
    </div>
  );
}
