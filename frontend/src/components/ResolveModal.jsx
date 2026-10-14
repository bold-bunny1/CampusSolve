import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ResolveModal({ isOpen, onClose, complaint, onResolved }) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 5) {
      setError('Please provide specific resolution notes detailing the work completed (min 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const updated = await api.resolveComplaint(complaint.id, {
        resolution_notes: resolutionNotes.trim()
      });
      onResolved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-950">Complete & Resolve Complaint</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-800">{complaint.complaint_id}: {complaint.title}</div>
            <div className="mt-0.5 text-slate-500">Location: {complaint.block}, {complaint.location}</div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Details / Actions Taken <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced faulty 16A MCB breaker, checked line resistance, tested all connected corridor fixtures. Supply restored and stable."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Resolution timestamp and time-to-resolve will be automatically computed and logged into the audit ledger.
            </p>
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
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Mark as Resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
