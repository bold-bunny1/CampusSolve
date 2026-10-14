import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const homePath = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/student';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-blue-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-200 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mt-1">
        The requested URL does not match any operational route in HostelPulse.
      </p>
      <Link
        to={homePath}
        className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
      >
        <Home className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}
