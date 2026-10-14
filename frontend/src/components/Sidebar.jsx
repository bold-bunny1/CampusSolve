import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Layers, 
  Repeat, 
  Users, 
  Bell, 
  Wrench,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const getLinks = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { to: '/admin/complaints', label: 'All Complaints', icon: FileText },
        { to: '/admin/recurring', label: 'Recurring Issues', icon: Repeat },
        { to: '/admin/staff', label: 'Staff Management', icon: Users },
        { to: '/notifications', label: 'Notification Center', icon: Bell },
      ];
    } else if (user?.role === 'staff') {
      return [
        { to: '/staff', label: 'Assigned Workload', icon: Wrench },
        { to: '/notifications', label: 'Task Notifications', icon: Bell },
      ];
    } else {
      // Student
      return [
        { to: '/student', label: 'Resident Dashboard', icon: LayoutDashboard },
        { to: '/student/new-complaint', label: 'Report a Problem', icon: PlusCircle, highlight: true },
        { to: '/notifications', label: 'Notification Center', icon: Bell },
      ];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
        />
      )}

      <aside className={`
        fixed top-14 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {user?.role === 'admin' ? 'Administration' : user?.role === 'staff' ? 'Technician Portal' : 'Student Portal'}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin' || link.to === '/student' || link.to === '/staff'}
                onClick={() => onClose?.()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors
                  ${link.highlight && !isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20' : ''}
                  ${isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom system status / help */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              SLA Engine Active
            </span>
            <span className="text-slate-400 text-[10px]">v1.0.0</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            HostelPulse operations triage system with transparent rule-based priority routing.
          </p>
        </div>
      </aside>
    </>
  );
}
