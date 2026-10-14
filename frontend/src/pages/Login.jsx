import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { 
  Activity, 
  Lock, 
  Mail, 
  User, 
  Home, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  Check, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [block, setBlock] = useState('Block B');
  const [floor, setFloor] = useState(2);
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      redirectUser(u);
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: 'student',
        block,
        floor: parseInt(floor, 10),
        room_number: roomNumber.trim(),
        phone: phone.trim()
      });
      redirectUser(u);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (key) => {
    setError('');
    setLoading(true);
    try {
      const u = await switchDemoRole(key);
      redirectUser(u);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (u) => {
    if (u.role === 'admin') navigate('/admin');
    else if (u.role === 'staff') navigate('/staff');
    else navigate('/student');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          HostelPulse
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Intelligent Operations & Centralized Complaint Triage
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl space-y-6">
        {/* Main Auth Card */}
        <div className="bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`pb-3 text-sm font-semibold transition-colors flex-1 text-center border-b-2 ${
                !isRegister 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In to Account
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`pb-3 text-sm font-semibold transition-colors flex-1 text-center border-b-2 ${
                isRegister 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Resident Registration
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isRegister ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. arjun@student.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-medium text-sm rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Block</label>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                  >
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                    <option value="Block D">Block D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Floor</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Room No</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 204"
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Resident Registration'}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts Showcase Section for Hackathon Judges */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Judge & Reviewer Fast-Access
            </span>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              Pre-seeded Demo Accounts
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Click any demo profile to authenticate instantly without typing credentials:
          </p>

          <div className="space-y-2">
            {Object.entries(DEMO_USERS).map(([key, info]) => (
              <div 
                key={key}
                onClick={() => handleQuickDemoLogin(key)}
                className="p-3 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {info.label}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {info.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {info.desc}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600/20 group-hover:bg-blue-600 text-blue-400 group-hover:text-white rounded-lg text-xs font-medium shrink-0 transition-colors"
                >
                  Switch
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
