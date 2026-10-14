import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, ShieldAlert, Activity } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-900/60 text-purple-300 border border-purple-700/50 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Admin / Warden</span>;
      case 'staff':
        return <span className="bg-amber-900/60 text-amber-300 border border-amber-700/50 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Staff: {user?.specialization || 'Maintenance'}</span>;
      default:
        return <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Student: {user?.block} {user?.room_number}</span>;
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              HostelPulse
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Intelligent Operations</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user && getRoleBadge(user.role)}
        <NotificationDropdown />
        
        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.full_name}</div>
            <div className="text-[10px] text-slate-400">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
