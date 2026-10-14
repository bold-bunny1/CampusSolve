import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpRight,
  ShieldAlert,
  Repeat
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const navigate = useNavigate();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.listComplaints({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined
      });
      setComplaints(data);
    } catch (err) {
      setError(err.message || 'Failed to load your complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  // Metrics
  const total = complaints.length;
  const openCount = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-400/30">
            Resident Portal • {user?.block} • Floor {user?.floor} • {user?.room_number}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Track and submit facility maintenance requests with real-time status updates, priority metrics, and direct technician accountability.
          </p>
        </div>

        <Link
          to="/student/new-complaint"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Report a Problem
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Submitted</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged by your room</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold">Open Issues</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{openCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active resolution queue</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold">In Progress</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Technician on site / active</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Completed tickets</div>
        </div>
      </div>

      {/* Complaint List Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Submitted Complaints</h2>
            <p className="text-xs text-slate-500">
              Only your private requests are accessible under student privacy isolation rules.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search title, ID, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
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
              <option value="Water Supply">Water Supply</option>
              <option value="Other">Other</option>
            </select>
          </form>
        </div>

        {/* List / Table */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">No complaints found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't submitted any maintenance requests matching the current criteria.
            </p>
            <Link
              to="/student/new-complaint"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-2"
            >
              <PlusCircle className="w-4 h-4" /> Report an issue now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/complaints/${c.id}`)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    {c.is_safety_hazard && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] px-2 py-0.5 rounded font-semibold border border-rose-200">
                        <ShieldAlert className="w-3 h-3 text-rose-600" /> Safety Hazard
                      </span>
                    )}
                    {c.is_recurring && (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded font-semibold border border-purple-200">
                        <Repeat className="w-3 h-3 text-purple-600" /> Recurring
                      </span>
                    )}
                    {c.is_overdue && (
                      <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                        Overdue ({c.overdue_by_hours}h)
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                    {c.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Category: <strong className="text-slate-700">{c.category}</strong></span>
                    <span>•</span>
                    <span>Location: <strong className="text-slate-700">{c.block}, Floor {c.floor} ({c.location})</strong></span>
                    <span>•</span>
                    <span>Assigned: <strong className="text-slate-700">{c.assigned_staff_name || 'Pending assignment'}</strong></span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs text-slate-400 shrink-0">
                  <span>{new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="inline-flex items-center gap-1 text-blue-600 font-medium sm:pt-1">
                    Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
