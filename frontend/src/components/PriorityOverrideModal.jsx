import React, { useState } from 'react';
import { X, Sliders, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function PriorityOverrideModal({ isOpen, onClose, complaint, onOverridden }) {
  const [priority, setPriority] = useState(complaint?.priority || 'High');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a substantive justification for the priority override (min 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const updated = await api.overridePriority(complaint.id, {
        priority,
        reason: reason.trim()
      });
      onOverridden(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to override priority.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Override Complaint Priority</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">{complaint.complaint_id}:</span> {complaint.title}
            <div className="mt-1">Current Calculated Priority: <strong className="text-slate-900">{complaint.priority}</strong></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Engine Reason: {complaint.priority_reason}</div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Priority Level <span className="text-red-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              <option value="Critical">Critical (Immediate SLA: 6h)</option>
              <option value="High">High (Standard SLA: 24h)</option>
              <option value="Medium">Medium (Standard SLA: 48h)</option>
              <option value="Low">Low (Routine SLA: 72h)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Administrative Justification Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Physical inspection revealed pipe damage extends behind wall; escalating to High priority."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
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
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
