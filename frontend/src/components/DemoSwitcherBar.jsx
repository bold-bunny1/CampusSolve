import React from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Shield, User, Wrench, Sparkles } from 'lucide-react';

export default function DemoSwitcherBar() {
  const { user, switchDemoRole } = useAuth();

  const demoAccounts = [
    { key: 'admin', label: 'Admin (Warden)', icon: Shield, color: 'hover:bg-purple-50 text-purple-700' },
    { key: 'student', label: 'Student (Arjun 204)', icon: User, color: 'hover:bg-blue-50 text-blue-700' },
    { key: 'student_priya', label: 'Student (Priya 102)', icon: User, color: 'hover:bg-cyan-50 text-cyan-700' },
    { key: 'staff_electrician', label: 'Staff (Electrician)', icon: Wrench, color: 'hover:bg-amber-50 text-amber-700' },
    { key: 'staff_plumber', label: 'Staff (Plumber)', icon: Wrench, color: 'hover:bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2 text-slate-300">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-semibold text-slate-200">Hackathon Demo Switcher:</span>
        <span className="hidden sm:inline text-slate-400">1-click test roles:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {demoAccounts.map(({ key, label, icon: Icon, color }) => {
          const isCurrent = user?.email === DEMO_USERS[key].email;
          return (
            <button
              key={key}
              onClick={() => switchDemoRole(key)}
              title={DEMO_USERS[key].desc}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
