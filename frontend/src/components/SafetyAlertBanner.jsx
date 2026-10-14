import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export default function SafetyAlertBanner({ notes, matchedKeywords = [] }) {
  return (
    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg mb-4 text-rose-950 shadow-xs">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-rose-900 text-sm">SAFETY HAZARD REVIEW FLAGGED</h4>
            <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">
              Immediate Attention
            </span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            {notes || "Hazard triggers detected. This ticket has been prioritized and dispatched to senior wardens and maintenance supervisors."}
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-rose-700/80">
            <Info className="w-3.5 h-3.5" />
            <span>
              Disclaimer: HostelPulse is a digital triage system. In case of active fire, gas leak, or immediate physical peril, alert campus emergency services or the security gate post directly.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
