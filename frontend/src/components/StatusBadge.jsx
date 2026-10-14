import React from 'react';
import { 
  FileText, 
  Eye, 
  UserCheck, 
  Clock, 
  PauseCircle, 
  CheckCircle2, 
  Archive, 
  RotateCcw 
} from 'lucide-react';

const STATUS_CONFIG = {
  'Submitted': {
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: FileText
  },
  'Acknowledged': {
    bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Eye
  },
  'Assigned': {
    bg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: UserCheck
  },
  'In Progress': {
    bg: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Clock
  },
  'On Hold': {
    bg: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: PauseCircle
  },
  'Resolved': {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2
  },
  'Closed': {
    bg: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    icon: Archive
  },
  'Reopened': {
    bg: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: RotateCcw
  }
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || {
    bg: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Clock
  };
  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${config.bg} ${isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      <Icon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
      {status}
    </span>
  );
}
