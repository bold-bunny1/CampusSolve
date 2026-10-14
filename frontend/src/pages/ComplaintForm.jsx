import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle,
  Sparkles,
  Info
} from 'lucide-react';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Cleanliness',
  'Furniture',
  'Internet',
  'Security',
  'Water Supply',
  'Other'
];

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D'];

export default function ComplaintForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [block, setBlock] = useState(user?.block || 'Block B');
  const [floor, setFloor] = useState(user?.floor !== undefined ? user.floor : 2);
  const [location, setLocation] = useState(user?.room_number || 'Room 204');
  const [impactLevel, setImpactLevel] = useState('Single Room');
  const [urgencyLevel, setUrgencyLevel] = useState('Medium');
  
  // Image file attachment
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Client-side live priority simulation for immediate feedback
  const simulatedPriority = useMemo(() => {
    const text = `${title} ${description}`.toLowerCase();
    const safetyKeywords = ['spark', 'shock', 'fire', 'exposed wire', 'short circuit', 'smoke', 'flood', 'broken lock', 'gas'];
    const isSafety = safetyKeywords.some(kw => text.includes(kw)) || (['Electrical', 'Security', 'Water Supply'].includes(category) && urgencyLevel === 'Emergency');

    let p = 'Medium';
    if (isSafety && (impactLevel !== 'Single Room' || urgencyLevel === 'Emergency')) {
      p = 'Critical';
    } else if (isSafety || urgencyLevel === 'Emergency' || impactLevel === 'Entire Wing/Block') {
      p = 'High';
    } else if (urgencyLevel === 'Low' && impactLevel === 'Single Room' && !['Electrical', 'Security'].includes(category)) {
      p = 'Low';
    } else {
      p = 'Medium';
    }
    return { priority: p, isSafety };
  }, [title, description, category, urgencyLevel, impactLevel]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload JPG, PNG, or WEBP.');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('block', block);
      formData.append('floor', floor);
      formData.append('location', location.trim());
      formData.append('impact_level', impactLevel);
      formData.append('urgency_level', urgencyLevel);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const created = await api.createComplaint(formData);
      navigate(`/complaints/${created.id}`, {
        state: { flashMessage: `Complaint ${created.complaint_id} logged successfully!` }
      });
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link 
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Form Header */}
        <div className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Facility Complaint Intake
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Report a Maintenance Issue</h1>
          <p className="text-slate-400 text-xs mt-1">
            Submit your issue with accurate location and impact details for automated priority assignment and technician dispatch.
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electrical sparks inside corridor switchboard"
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
            />
          </div>

          {/* Category & Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hostel Block <span className="text-red-500">*</span>
              </label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Floor & Specific Room/Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Floor Number <span className="text-red-500">*</span>
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(parseInt(e.target.value, 10))}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value={0}>Ground Floor (0)</option>
                <option value={1}>1st Floor</option>
                <option value={2}>2nd Floor</option>
                <option value={3}>3rd Floor</option>
                <option value={4}>4th Floor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Room Number or Common Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room 204 or Washroom Wing B"
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Impact Level & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Impact Scope <span className="text-red-500">*</span>
              </label>
              <select
                value={impactLevel}
                onChange={(e) => setImpactLevel(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Single Room">Single Room (Isolated)</option>
                <option value="Entire Floor">Entire Floor (Shared)</option>
                <option value="Entire Wing/Block">Entire Wing / Block (Campus-wide)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Low">Low (Minor cosmetic / routine)</option>
                <option value="Medium">Medium (Standard inconvenience)</option>
                <option value="High">High (Impacting basic routine/study)</option>
                <option value="Emergency">Emergency (Active hazard / non-functional utility)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details: when did it start, exact fixture, symptoms (smell, noise, water volume), etc."
              className="w-full text-sm rounded-lg border border-slate-300 p-3 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Real-time Priority Preview Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Live Priority Engine Preview:
              </span>
              <PriorityBadge priority={simulatedPriority.priority} size="md" />
            </div>
            {simulatedPriority.isSafety && (
              <div className="flex items-center gap-2 text-xs text-rose-700 font-medium bg-rose-100/70 p-2 rounded-lg border border-rose-200">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Safety Hazard Trigger Flagged: Triage will trigger immediate Warden escalation.</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              HostelPulse uses deterministic weighting based on category criticalness, impact area, and safety keywords.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attach Photo Evidence (Optional)
            </label>
            
            {!imagePreview ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Click to upload photo</span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 max-w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/student"
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
