import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Users, 
  ArrowLeft, 
  UserPlus, 
  Wrench, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // New staff modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Electrical');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [staffData, dashMetrics] = await Promise.all([
        api.getStaff(),
        api.getDashboardMetrics()
      ]);
      setStaffList(staffData);
      setMetrics(dashMetrics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createStaff({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: 'staff',
        specialization,
        phone: phone.trim()
      });
      setSuccess(`Staff account created for ${fullName}`);
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      await loadStaffData();
    } catch (err) {
      setError(err.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const getWorkload = (staffId) => {
    if (!metrics || !metrics.staff_workload) return null;
    return metrics.staff_workload.find(s => s.staff_id === staffId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Operations Command
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Maintenance Staff Directory & Workload
          </h1>
          <p className="text-xs text-slate-500">
            Assigned trade specialists, response metrics, and capacity management.
          </p>
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setError(''); setSuccess(''); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add Technician
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="font-bold">×</button>
        </div>
      )}

      {/* Staff Cards */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading technician records...</div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No maintenance staff records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => {
            const wl = getWorkload(s.id);
            return (
              <div 
                key={s.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-900">{s.full_name}</h3>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      <Wrench className="w-3 h-3 text-blue-600" />
                      {s.specialization || 'General Maintenance'}
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active" />
                </div>

                <div className="text-xs text-slate-500 space-y-1 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone || 'No phone recorded'}</span>
                  </div>
                </div>

                {wl && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Active</span>
                      <strong className="text-sm font-bold text-blue-600">{wl.active_tasks}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Resolved</span>
                      <strong className="text-sm font-bold text-emerald-600">{wl.completed_tasks}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Overdue</span>
                      <strong className={`text-sm font-bold ${wl.overdue_tasks > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {wl.overdue_tasks}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Maintenance Technician</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@hostelpulse.com"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trade Specialization *</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Electrical">Electrical Specialist</option>
                  <option value="Plumbing">Plumbing Specialist</option>
                  <option value="Cleanliness">Housekeeping & Sanitation</option>
                  <option value="Furniture">Carpentry & Furniture</option>
                  <option value="Internet">Network & Wi-Fi Tech</option>
                  <option value="General">General Campus Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
