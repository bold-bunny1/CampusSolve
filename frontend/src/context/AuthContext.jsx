import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  admin: {
    label: 'Hostel Admin (Warden Sharma)',
    email: 'admin@hostelpulse.com',
    password: 'Admin@123',
    role: 'admin',
    desc: 'Hostel-wide visibility, staff assignment, priority override, SLA & recurring reports'
  },
  student: {
    label: 'Student (Arjun Mehta - Room 204)',
    email: 'arjun@student.com',
    password: 'Student@123',
    role: 'student',
    desc: 'Block B, 2nd Floor, Room 204. View submitted issues, track progress, reopen resolved tickets'
  },
  student_priya: {
    label: 'Student (Priya Sharma - Room 102)',
    email: 'priya@student.com',
    password: 'Student@123',
    role: 'student',
    desc: 'Block A, 1st Floor, Room 102. Tests strict resident privacy isolation'
  },
  staff_electrician: {
    label: 'Maintenance Staff (Rajesh - Electrician)',
    email: 'electrician@hostelpulse.com',
    password: 'Staff@123',
    role: 'staff',
    desc: 'Assigned electrical repairs, updates work notes, records technical resolutions'
  },
  staff_plumber: {
    label: 'Maintenance Staff (Manoj - Plumber)',
    email: 'plumber@hostelpulse.com',
    password: 'Staff@123',
    role: 'staff',
    desc: 'Assigned plumbing tickets, water supply leakage, valve maintenance'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hostelpulse_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Session expired or invalid, logging out', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('hostelpulse_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('hostelpulse_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('hostelpulse_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (demoKey) => {
    const target = DEMO_USERS[demoKey];
    if (target) {
      return await login(target.email, target.password);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchDemoRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
