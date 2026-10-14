import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import AssignModal from '../components/AssignModal';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import { 
  FileText, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Repeat, 
  Users, 
  ShieldAlert, 
  Search, 
  Filter, 
  ArrowUpRight, 
  BarChart2, 
  Layers, 
  Sliders, 
  UserCheck, 
  Percent, 
  Timer
} from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);

  // Modals
  const [activeComplaintForAssign, setActiveComplaintForAssign] = useState(null);
  const [activeComplaintForOverride, setActiveComplaintForOverride] = useState(null);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashMetrics, compList] = await Promise.all([
        api.getDashboardMetrics(),
        api.listComplaints({
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          category: categoryFilter || undefined,
          block: blockFilter || undefined,
          is_overdue: overdueOnly ? true : undefined,
          is_recurring: recurringOnly ? true : undefined,
        })
      ]);
      setMetrics(dashMetrics);
      setComplaints(compList);
    } catch (err) {
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, categoryFilter, blockFilter, overdueOnly, recurringOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hostel Operations & Triage Command
          </h1>
          <p className="text-xs text-slate-500">
            Real-time complaint telemetry, deterministic SLA enforcement, and recurring hazard oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/recurring"
            className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Recurring Clusters ({metrics?.recurring_groups_count || 0})
          </Link>
          <Link
            to="/admin/staff"
            className="px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4" />
            Staff Roster
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* 9 Core KPI Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Complaints */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Complaints</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.total_complaints}</div>
            <span className="text-[10px] text-slate-400">All registered tickets</span>
          </div>

          {/* New / Submitted */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">New / Untriaged</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{metrics.new_complaints}</div>
            <span className="text-[10px] text-slate-400">Awaiting acknowledgment</span>
          </div>

          {/* In Progress */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">In Progress</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{metrics.in_progress_complaints}</div>
            <span className="text-[10px] text-slate-400">Under active repair</span>
          </div>

          {/* Critical & High */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Critical & High</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">{metrics.critical_and_high}</div>
            <span className="text-[10px] text-slate-400">Safety & high priority</span>
          </div>

          {/* Overdue */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Overdue SLA</span>
            <div className={`text-2xl font-extrabold mt-1 ${metrics.overdue_complaints > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {metrics.overdue_complaints}
            </div>
            <span className="text-[10px] text-red-500 font-medium">Resolution target breached</span>
          </div>

          {/* Recurring Clusters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Recurring Clusters</span>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">{metrics.recurring_groups_count}</div>
            <span className="text-[10px] text-slate-400">Location hotspot patterns</span>
          </div>

          {/* Resolved */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Resolved / Closed</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.resolved_complaints}</div>
            <span className="text-[10px] text-slate-400">Closed tickets</span>
          </div>

          {/* Avg Resolution Hours */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Avg Resolution Time</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.average_resolution_hours}h</div>
            <span className="text-[10px] text-slate-400">Mean time to repair</span>
          </div>

          {/* Resolution Rate */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Resolution Rate</span>
            <div className="text-2xl font-extrabold text-teal-600 mt-1">{metrics.resolution_rate_percent}%</div>
            <span className="text-[10px] text-slate-400">Closed vs total</span>
          </div>
        </div>
      )}

      {/* Visual Analytics Distributions */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints by Category */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Complaints by Category
              </h3>
              <BarChart2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {metrics.by_category.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span className="text-slate-500 font-mono">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.max(item.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complaints by Block */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Complaints by Hostel Block
              </h3>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {metrics.by_block.map((item) => (
                <div key={item.block} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.block}</span>
                    <span className="text-slate-500 font-mono">{item.count} tickets</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.count / Math.max(1, metrics.total_complaints)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Workload */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Technician Workloads
              </h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3 overflow-y-auto max-h-64">
              {metrics.staff_workload.map((staff) => (
                <div key={staff.staff_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{staff.full_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{staff.specialization || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                    <span>Active: <strong className="text-blue-700">{staff.active_tasks}</strong></span>
                    <span>•</span>
                    <span>Completed: <strong className="text-emerald-700">{staff.completed_tasks}</strong></span>
                    {staff.overdue_tasks > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-600 font-bold">Overdue: {staff.overdue_tasks}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Master Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Master Complaint Registry</h2>
              <p className="text-xs text-slate-500">Live operational ledger across all hostel wings</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID, title, room..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 w-44 sm:w-60 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
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
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="">All Blocks</option>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Block D">Block D</option>
              </select>
            </form>
          </div>

          {/* Quick toggle filters */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded text-red-600"
              />
              <span className={overdueOnly ? 'text-red-700 font-bold' : ''}>Show Overdue Tickets Only</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={recurringOnly}
                onChange={(e) => setRecurringOnly(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span className={recurringOnly ? 'text-purple-700 font-bold' : ''}>Show Recurring Issues Only</span>
            </label>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Resident & Location</th>
                <th className="py-3 px-4">Priority & SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">Loading records...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No complaints matching filter criteria.</td>
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
                          onClick={() => setActiveComplaintForAssign(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Assign technician"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveComplaintForOverride(c)}
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

      {/* Assignment Modal */}
      {activeComplaintForAssign && (
        <AssignModal
          isOpen={!!activeComplaintForAssign}
          onClose={() => setActiveComplaintForAssign(null)}
          complaint={activeComplaintForAssign}
          onAssigned={() => { setActiveComplaintForAssign(null); loadData(); }}
        />
      )}

      {/* Override Modal */}
      {activeComplaintForOverride && (
        <PriorityOverrideModal
          isOpen={!!activeComplaintForOverride}
          onClose={() => setActiveComplaintForOverride(null)}
          complaint={activeComplaintForOverride}
          onOverridden={() => { setActiveComplaintForOverride(null); loadData(); }}
        />
      )}
    </div>
  );
}
