import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { 
  Repeat, 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  AlertTriangle, 
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function AdminRecurring() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const navigate = useNavigate();

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const data = await api.getRecurringIssues();
      setClusters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await api.scanRecurringIssues();
      setStatusMsg(res.message);
      await fetchClusters();
    } catch (err) {
      alert(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Operations Command
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Repeat className="w-6 h-6 text-purple-600" />
            Recurring Issue & Hotspot Detection
          </h1>
          <p className="text-xs text-slate-500">
            Automated cluster analysis identifying repetitive hostel failure points across locations and categories (14-day rolling window).
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Analyzing Records...' : 'Run Analysis Scan'}
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="font-bold">×</button>
        </div>
      )}

      {/* Clusters List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading recurring clusters...</div>
      ) : clusters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Chronic Recurring Hotspots</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No location has accumulated 2 or more unresolved complaints of the same category within the active 14-day window.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster, idx) => (
            <div 
              key={`${cluster.category}-${cluster.block}-${cluster.floor}-${idx}`}
              className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden"
            >
              {/* Cluster Card Header */}
              <div className="p-5 bg-purple-50/60 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wide bg-purple-200/80 px-2.5 py-0.5 rounded-full">
                      Recurring Cluster
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {cluster.category} Issues
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <strong>{cluster.block} • Floor {cluster.floor}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs text-center">
                    <span className="text-[10px] text-slate-400 block">Total Tickets</span>
                    <strong className="text-purple-700 font-bold">{cluster.total_complaints}</strong>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs text-center">
                    <span className="text-[10px] text-slate-400 block">Unresolved</span>
                    <strong className="text-amber-700 font-bold">{cluster.open_complaints}</strong>
                  </div>
                </div>
              </div>

              {/* Associated Tickets */}
              <div className="p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-600">
                  Associated Tickets in this Cluster:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cluster.complaints.map((ticket) => (
                    <div 
                      key={ticket.id}
                      onClick={() => navigate(`/complaints/${ticket.id}`)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600">{ticket.complaint_id}</span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="text-xs font-semibold text-slate-900 line-clamp-1">{ticket.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{ticket.location}</span>
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
