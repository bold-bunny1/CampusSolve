import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SafetyAlertBanner from '../components/SafetyAlertBanner';
import AssignModal from '../components/AssignModal';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import ResolveModal from '../components/ResolveModal';
import ReopenModal from '../components/ReopenModal';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  Calendar, 
  MessageSquare, 
  History, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Send, 
  Sliders, 
  RotateCcw, 
  PauseCircle, 
  PlayCircle,
  Repeat,
  ShieldAlert,
  Info
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  'Submitted',
  'Acknowledged',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed'
];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState(locationState?.state?.flashMessage || '');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);

  // Hold prompt state
  const [isHoldPromptOpen, setIsHoldPromptOpen] = useState(false);
  const [holdReasonText, setHoldReasonText] = useState('');

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaint(id);
      setComplaint(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addComment(complaint.id, {
        message: commentText.trim(),
        is_internal: isInternalNote
      });
      setCommentText('');
      setIsInternalNote(false);
      // Reload complaint to get updated comments and audit history
      await fetchComplaint();
    } catch (err) {
      alert(err.message || 'Failed to add note');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleQuickStatusChange = async (newStatus, notes, holdReason) => {
    try {
      const updated = await api.updateStatus(complaint.id, {
        status: newStatus,
        notes,
        hold_reason: holdReason
      });
      setComplaint(updated);
      setIsHoldPromptOpen(false);
      setHoldReasonText('');
      await fetchComplaint();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading complaint records...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted or Ticket Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested complaint ticket does not exist or access was denied.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isOwner = user?.id === complaint.student_id;
  const isAssignedToMe = isStaff && complaint.assigned_staff_id === user?.id;

  // Lifecycle progress tracker
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(complaint.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          to={isAdmin ? '/admin/complaints' : isStaff ? '/staff' : '/student'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Role action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsAssignOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                {complaint.assigned_staff_id ? 'Reassign Staff' : 'Assign Staff'}
              </button>

              <button
                onClick={() => setIsOverrideOpen(true)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" /> Override Priority
              </button>

              {complaint.status === 'Submitted' && (
                <button
                  onClick={() => handleQuickStatusChange('Acknowledged', 'Warden verified and acknowledged ticket')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                >
                  Acknowledge Ticket
                </button>
              )}
            </>
          )}

          {(isStaff || isAdmin) && complaint.status === 'Assigned' && (
            <button
              onClick={() => handleQuickStatusChange('In Progress', 'Technician started physical inspection')}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Start Work
            </button>
          )}

          {(isStaff || isAdmin) && complaint.status === 'In Progress' && (
            <>
              <button
                onClick={() => setIsHoldPromptOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Put On Hold
              </button>

              <button
                onClick={() => setIsResolveOpen(true)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete & Resolve
              </button>
            </>
          )}

          {(isStaff || isAdmin) && complaint.status === 'On Hold' && (
            <button
              onClick={() => handleQuickStatusChange('In Progress', 'Resumed repair after hold')}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Resume Work
            </button>
          )}

          {(isOwner || isAdmin) && ['Resolved', 'Closed'].includes(complaint.status) && (
            <button
              onClick={() => setIsReopenOpen(true)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reopen Complaint
            </button>
          )}
        </div>
      </div>

      {/* Flash Banner */}
      {flashMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{flashMessage}</span>
          <button onClick={() => setFlashMessage('')} className="text-emerald-600 font-bold">×</button>
        </div>
      )}

      {/* Safety Hazard Warning */}
      {complaint.is_safety_hazard && (
        <SafetyAlertBanner 
          notes={complaint.safety_review_notes}
          matchedKeywords={[]} 
        />
      )}

      {/* Recurring Issue Cluster Alert */}
      {complaint.is_recurring && (
        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-xl text-purple-900 shadow-xs flex items-start gap-3">
          <Repeat className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900">
              Recurring Problem Cluster Identified
            </h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              {complaint.recurring_cluster_info || `Frequent tickets detected in ${complaint.block}, Floor ${complaint.floor} within the last 14 days.`}
            </p>
          </div>
        </div>
      )}

      {/* On Hold Banner */}
      {complaint.status === 'On Hold' && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-purple-900 flex items-start gap-3">
          <PauseCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wide">Ticket Currently On Hold</h4>
            <p className="text-xs text-purple-800 mt-0.5">
              Reason: <strong>{complaint.hold_reason || 'Awaiting spare parts from vendor.'}</strong>
            </p>
            <p className="text-[11px] text-purple-600 mt-1">SLA resolution timer is paused until work resumes.</p>
          </div>
        </div>
      )}

      {/* Overdue Banner */}
      {complaint.is_overdue && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-900 flex items-start gap-3">
          <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wide">SLA Overdue Warning</h4>
            <p className="text-xs text-red-800 mt-0.5">
              This ticket has exceeded its target resolution deadline by approximately <strong>{complaint.overdue_by_hours} hours</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Ticket Header */}
        <div className="p-6 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {complaint.complaint_id}
              </span>
              <StatusBadge status={complaint.status} size="md" />
              <PriorityBadge priority={complaint.priority} size="md" />
              {complaint.priority_overridden && (
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300 font-medium">
                  Warden Overridden
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Logged on {new Date(complaint.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {complaint.title}
          </h1>

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {complaint.block}, Floor {complaint.floor} ({complaint.location})
            </span>
            <span>•</span>
            <span>Category: <strong className="text-slate-800">{complaint.category}</strong></span>
            <span>•</span>
            <span>Impact: <strong className="text-slate-800">{complaint.impact_level}</strong></span>
            <span>•</span>
            <span>Urgency: <strong className="text-slate-800">{complaint.urgency_level}</strong></span>
          </div>
        </div>

        {/* Priority Engine Rationale Card */}
        <div className="p-5 bg-slate-50/70 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Transparent Priority Engine Rationale:
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200">
            {complaint.priority_reason}
            {complaint.priority_override_reason && (
              <span className="block mt-1 text-indigo-700 font-sans font-medium">
                Overridden reason: {complaint.priority_override_reason}
              </span>
            )}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Lifecycle Progress
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = complaint.status === step;
              return (
                <div 
                  key={step} 
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                      : isPast
                      ? 'bg-slate-50 border-slate-300 text-slate-700'
                      : 'bg-white border-dashed border-slate-200 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-400">Step {idx + 1}</div>
                  <div className="text-xs truncate">{step}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description & Photo */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Detailed Description
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {complaint.image_url && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Attached Photo Evidence
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-w-md bg-slate-50">
                <img
                  src={api.resolveImageUrl(complaint.image_url)}
                  alt="Complaint attachment"
                  className="w-full h-auto max-h-72 object-contain"
                />
              </div>
            </div>
          )}

          {/* Resolution Details Card (if resolved) */}
          {complaint.resolved_at && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Resolution Report ({Math.round((complaint.resolution_time_minutes || 0) / 60)}h total repair time)
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {complaint.resolution_notes}
              </p>
              <div className="text-[11px] text-emerald-700 pt-1">
                Resolved by: {complaint.resolved_by?.full_name || 'Assigned Technician'} • {new Date(complaint.resolved_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Resident & Assigned Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
          <div className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submitted By</span>
            <div className="font-semibold text-sm text-slate-900">{complaint.student?.full_name}</div>
            <div className="text-xs text-slate-500">{complaint.student?.email} • {complaint.student?.phone || 'No phone'}</div>
            <div className="text-xs text-slate-500">Hostel: {complaint.block}, Floor {complaint.floor}, {complaint.location}</div>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Maintenance Staff</span>
            {complaint.assigned_staff ? (
              <>
                <div className="font-semibold text-sm text-slate-900">{complaint.assigned_staff.full_name}</div>
                <div className="text-xs text-slate-500">Specialization: {complaint.assigned_staff.specialization || 'General'}</div>
                <div className="text-xs text-slate-500">Contact: {complaint.assigned_staff.phone || complaint.assigned_staff.email}</div>
                {complaint.target_resolution_date && (
                  <div className="text-[11px] text-blue-600 font-medium pt-0.5">
                    Target SLA: {new Date(complaint.target_resolution_date).toLocaleString()}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-400 italic pt-1">
                Technician pending warden assignment
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discussion & Audit Trail Tabbed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discussion / Comments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Work Notes & Resident Communication
            </h3>
          </div>

          {/* Comments Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 divide-y divide-slate-100">
            {complaint.comments && complaint.comments.length > 0 ? (
              complaint.comments.map((cm) => (
                <div key={cm.id} className="pt-3 first:pt-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{cm.user_name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono capitalize">
                        {cm.user_role}
                      </span>
                      {cm.is_internal && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          INTERNAL NOTE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    {cm.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                No discussion comments yet.
              </div>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2">
            {(isAdmin || isStaff) && (
              <label className="flex items-center gap-2 text-xs text-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span className="font-medium">Mark as internal staff/warden note (hidden from resident)</span>
              </label>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isInternalNote ? "Add private internal technician note..." : "Add message or status query..."}
                className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Send note"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Audit History Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Audit History Ledger
            </h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {complaint.history && complaint.history.length > 0 ? (
              complaint.history.map((h, i) => (
                <div key={h.id} className="relative pl-6 pb-2 border-l border-slate-200 last:border-transparent">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 capitalize">
                        {h.action_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      By <strong className="text-slate-700">{h.actor_name}</strong> ({h.actor_role})
                    </div>
                    {h.old_value && h.new_value && (
                      <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-1 rounded inline-block">
                        {h.old_value} → {h.new_value}
                      </div>
                    )}
                    {h.notes && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {h.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                No history entries logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hold Reason Modal Prompt */}
      {isHoldPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Reason for Putting Complaint On Hold</h3>
            <p className="text-xs text-slate-500">
              Provide an operational explanation (e.g., waiting for parts delivery, vendor appointment required).
            </p>
            <textarea
              rows={3}
              value={holdReasonText}
              onChange={(e) => setHoldReasonText(e.target.value)}
              placeholder="e.g. Waiting for spare copper pipe fitting from vendor..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsHoldPromptOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusChange('On Hold', 'Complaint placed on hold by technician', holdReasonText)}
                disabled={!holdReasonText.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modals */}
      <AssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        complaint={complaint}
        onAssigned={(updated) => { setComplaint(updated); fetchComplaint(); }}
      />

      <PriorityOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        complaint={complaint}
        onOverridden={(updated) => { setComplaint(updated); fetchComplaint(); }}
      />

      <ResolveModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        complaint={complaint}
        onResolved={(updated) => { setComplaint(updated); fetchComplaint(); }}
      />

      <ReopenModal
        isOpen={isReopenOpen}
        onClose={() => setIsReopenOpen(false)}
        complaint={complaint}
        onReopened={(updated) => { setComplaint(updated); fetchComplaint(); }}
      />
    </div>
  );
}
