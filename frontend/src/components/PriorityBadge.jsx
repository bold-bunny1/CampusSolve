import React from 'react';
import { AlertOctagon, AlertTriangle, Clock, ArrowDown } from 'lucide-react';

const PRIORITY_CONFIG = {
  'Critical': {
    bg: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    dot: 'bg-rose-600',
    icon: AlertOctagon
  },
  'High': {
    bg: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
    dot: 'bg-amber-500',
    icon: AlertTriangle
  },
  'Medium': {
    bg: 'bg-sky-100 text-sky-800 border-sky-300 font-medium',
    dot: 'bg-sky-500',
    icon: Clock
  },
  'Low': {
    bg: 'bg-slate-100 text-slate-700 border-slate-300 font-normal',
    dot: 'bg-slate-400',
    icon: ArrowDown
  }
};

export default function PriorityBadge({ priority, size = 'sm', showIcon = true }) {
  const config = PRIORITY_CONFIG[priority] || {
    bg: 'bg-gray-100 text-gray-700 border-gray-300',
    dot: 'bg-gray-400',
    icon: Clock
  };
  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-md shadow-xs ${config.bg} ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}>
      {showIcon && <Icon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />}
      <span>{priority}</span>
    </span>
  );
}
