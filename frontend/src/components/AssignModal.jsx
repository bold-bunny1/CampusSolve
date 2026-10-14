import React, { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AssignModal({ isOpen, onClose, complaint, onAssigned }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getStaff()
        .then(setStaffList)
        .catch(err => setError('Failed to load staff list'));
      
      if (complaint?.assigned_staff_id) {
        setSelectedStaffId(complaint.assigned_staff_id);
      } else {
        setSelectedStaffId('');
      }

      if (complaint?.target_resolution_date) {
        const d = new Date(complaint.target_resolution_date);
        setTargetDate(d.toISOString().slice(0, 16));
      } else {
        setTargetDate('');
      }
    }
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select a maintenance staff member.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const updated = await api.assignStaff(complaint.id, {
        assigned_staff_id: parseInt(selectedStaffId, 10),
        target_resolution_date: targetDate ? new Date(targetDate).toISOString() : null,
        notes: notes.trim() || undefined
      });
      onAssigned(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign staff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Assign Maintenance Staff</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700">{complaint.complaint_id}: {complaint.title}</div>
            <div className="mt-1">Location: {complaint.block}, Floor {complaint.floor} ({complaint.location})</div>
            <div>Category: {complaint.category} | Priority: {complaint.priority}</div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            >
              <option value="">-- Choose technician --</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.specialization || 'General'}) - {s.phone || s.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Resolution Date & Time (SLA)
            </label>
            <input
              type="datetime-local"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to keep default SLA rule ({complaint.priority} priority SLA).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring replacement 16A circuit breaker and tester..."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
