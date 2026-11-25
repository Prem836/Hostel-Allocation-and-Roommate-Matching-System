'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ClipboardList,
  FileCheck2,
  LayoutGrid,
  BarChart2,
  LogOut,
  LogIn,
  Bell,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/student/apply', label: 'Room Application', icon: ClipboardList },
  { href: '/student/result', label: 'Allotment Letter', icon: FileCheck2 },
  { href: '/inventory', label: 'Hostel Directory', icon: Building2 },
  { href: '/warden/floor-map', label: 'Warden Desk', icon: LayoutGrid },
  { href: '/admin/analytics', label: 'Occupancy Reports', icon: BarChart2 },
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#E6F2DD]/90 border-b border-[#B1D3B9]/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#659287] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-[#527a70] transition-colors">
            H
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e3831] leading-none tracking-tight">Campus Residence Portal</p>
            <p className="text-[11px] font-medium text-[#659287] mt-0.5">
              Hostel Allotment & Roommate Matching
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#ffffff]/90 p-1 rounded-xl border border-[#B1D3B9]/70 shadow-xs">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  active ? 'text-[#1e3831]' : 'text-[#3f5c53] hover:text-[#1e3831]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-[#E6F2DD] rounded-lg border border-[#88BDA4]/60 -z-0"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10 text-[#659287]" />
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
                  className="p-2 rounded-xl bg-white hover:bg-[#E6F2DD] text-[#3f5c53] border border-[#B1D3B9]/70 relative transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#659287] ring-2 ring-white" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-[#B1D3B9] p-4 z-50"
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-[#E6F2DD] pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#3f5c53]">
                          Campus Notices
                        </span>
                        <span className="text-[11px] font-semibold text-[#659287]">
                          {notifications?.length || 0} updates
                        </span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((n: any) => (
                            <div
                              key={n._id}
                              className="p-2.5 rounded-xl bg-[#E6F2DD]/50 border border-[#B1D3B9]/60 text-xs"
                            >
                              <p className="font-semibold text-[#1e3831]">{n.title}</p>
                              <p className="text-[#3f5c53] mt-0.5">{n.message}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#659287] text-center py-4">
                            No unread notifications right now.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#B1D3B9]/70">
                <div className="w-6 h-6 rounded-full bg-[#659287] text-white text-[11px] font-bold flex items-center justify-center">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-[#1e3831]">{user.fullName}</p>
                  <p className="text-[10px] font-medium text-[#659287] capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-[#3f5c53] hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-xl bg-[#659287] hover:bg-[#527a70] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Student / Staff Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[#B1D3B9] text-[#1e3831]"
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
            className="lg:hidden overflow-hidden border-t border-[#B1D3B9] bg-[#E6F2DD] px-4 py-3 space-y-1"
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
                    active ? 'bg-white text-[#1e3831] border border-[#88BDA4]' : 'text-[#3f5c53] hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#659287]" />
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
