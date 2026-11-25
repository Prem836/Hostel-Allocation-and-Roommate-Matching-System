'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ClipboardCheck,
  MapPin,
  BarChart3,
  FileText,
  LogOut,
  LogIn,
  Bell,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const NAV_LINKS = [
  { href: '/', label: 'Overview', icon: Sparkles },
  { href: '/student/apply', label: 'Student Hub', icon: ClipboardCheck },
  { href: '/student/result', label: 'My Result & PDF', icon: FileText },
  { href: '/inventory', label: 'Inventory & Cycles', icon: Building2 },
  { href: '/warden/floor-map', label: 'Warden Bed Map', icon: MapPin },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['my-notifications', user?._id],
    queryFn: async () => {
      const res = await api.get('/publication/notifications');
      return res.data.data as any[];
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            H
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold text-slate-900 leading-none">HostelSync</p>
            <p className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase mt-0.5">
              Policy & Matching
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  active ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/70 -z-0"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 relative transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Notifications
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600">
                          {notifications?.length || 0} recent
                        </span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((n: any) => (
                            <div
                              key={n._id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                            >
                              <p className="font-bold text-slate-900">{n.title}</p>
                              <p className="text-slate-600 mt-0.5">{n.message}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-4">
                            No notifications yet.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/70">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-[10px] font-semibold text-indigo-600">{user.role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In / Register
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
          >
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
