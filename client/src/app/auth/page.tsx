'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Hash, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore, UserRole } from '@/store/authStore';

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ emailOrReg: '', password: '' });
  const [regForm, setRegForm] = useState({
    registrationNumber: '',
    email: '',
    password: '',
    fullName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    role: 'STUDENT' as UserRole,
    department: 'CSE',
    yearOfStudy: 2,
    isAccessibleNeed: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', loginForm);
      const { user, token } = res.data.data;
      setAuth(user, token);
      router.push(user.role === 'STUDENT' ? '/student/apply' : '/warden/floor-map');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', regForm);
      const { user, token } = res.data.data;
      setAuth(user, token);
      router.push(user.role === 'STUDENT' ? '/student/apply' : '/inventory');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#E6F2DD]/30 via-[#f7faf5] to-[#ffffff]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-[#B1D3B9] overflow-hidden"
      >
        {/* Switcher */}
        <div className="p-1.5 bg-[#E6F2DD] m-6 mb-0 rounded-2xl grid grid-cols-2 gap-1 border border-[#B1D3B9]/60">
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setError(null);
              }}
              className={`relative py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                mode === tab ? 'text-[#1e3831]' : 'text-[#659287] hover:text-[#1e3831]'
              }`}
            >
              {mode === tab && (
                <motion.span
                  layoutId="auth-tab"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-white rounded-xl shadow-xs border border-[#88BDA4]/40"
                />
              )}
              <span className="relative z-10">{tab === 'login' ? 'Student & Staff Login' : 'New Registration'}</span>
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'login' ? (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div>
                <h1 className="text-2xl font-bold text-[#1e3831]">Sign in to your account</h1>
                <p className="text-xs text-[#3f5c53] mt-1">
                  Enter your official college email address or student registration number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e3831] uppercase mb-1.5">
                  Email or Registration ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#659287] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginForm.emailOrReg}
                    onChange={(e) => setLoginForm({ ...loginForm, emailOrReg: e.target.value })}
                    placeholder="student@university.edu or 2026CSE001"
                    className="w-full pl-10 pr-4 py-2.5 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e3831] uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#659287] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-4 py-2.5 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#659287] hover:bg-[#527a70] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                {loading ? 'Verifying credentials...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRegister}
              className="space-y-3.5"
            >
              <div>
                <h1 className="text-2xl font-bold text-[#1e3831]">Create Your Student Profile</h1>
                <p className="text-xs text-[#3f5c53] mt-1">
                  Fill in your academic and hostel profile details to get started.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#659287] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-9 pr-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                    Registration No.
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-[#659287] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regForm.registrationNumber}
                      onChange={(e) => setRegForm({ ...regForm, registrationNumber: e.target.value })}
                      placeholder="e.g. 2026CSE001"
                      className="w-full pl-9 pr-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                    Campus Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="student@university.edu"
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                    Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Create a secure password"
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none text-[#1e3831]"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                    Account Role
                  </label>
                  <select
                    value={regForm.role}
                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none text-[#1e3831]"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="WARDEN">Hostel Warden</option>
                    <option value="CHIEF_WARDEN">Chief Warden</option>
                    <option value="HOSTEL_ADMIN">Hostel Administrator</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#3f5c53] pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.isAccessibleNeed}
                  onChange={(e) => setRegForm({ ...regForm, isAccessibleNeed: e.target.checked })}
                  className="accent-[#659287] w-4 h-4 rounded"
                />
                Require ground-floor or wheelchair accessible accommodation
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#659287] hover:bg-[#527a70] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition mt-2"
              >
                {loading ? 'Creating student profile...' : 'Complete Registration'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
