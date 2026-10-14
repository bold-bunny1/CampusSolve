import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ReopenModal({ isOpen, onClose, complaint, onReopened }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a reason explaining why the issue is still persisting (min 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const updated = await api.reopenComplaint(complaint.id, {
        reason: reason.trim()
      });
      onReopened(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reopen complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-rose-950">Reopen Complaint Ticket</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-800">{complaint.complaint_id}:</span> {complaint.title}
            <div className="mt-1 text-slate-500">
              Previous Resolution: "{complaint.resolution_notes || 'Marked resolved'}"
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Why is the issue still persisting? <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The leak resumed this morning after pressure increased; the joint is still dripping."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
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
              className="px-5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Reopening...' : 'Reopen Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
