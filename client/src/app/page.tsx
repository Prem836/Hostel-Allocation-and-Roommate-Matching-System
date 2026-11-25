'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ClipboardList,
  FileCheck2,
  LayoutGrid,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
} from 'lucide-react';
import { api } from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const res = await api.get('/inventory/stats');
      return res.data.data;
    },
  });

  const { data: cycles } = useQuery({
    queryKey: ['cycles-list'],
    queryFn: async () => {
      const res = await api.get('/cycles');
      return res.data.data as any[];
    },
  });

  const activeCycle = cycles?.find((c) => c.status === 'OPEN') || cycles?.[0];

  return (
    <main className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#E6F2DD]/40 via-[#f7faf5] to-[#ffffff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F2DD] border border-[#B1D3B9] text-[#1e3831] text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5 text-[#659287]" />
            Student Housing & Campus Life Office
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1e3831] leading-tight">
            Fair Room Allotment & <br className="hidden sm:inline" />
            <span className="text-[#659287]">Thoughtful Roommate Pairing</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#3f5c53] leading-relaxed max-w-2xl mx-auto">
            Welcome to the official campus residence portal. Apply for room allocations, rank your hostel preferences, complete your living habits survey, and download your verified allotment slip.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/student/apply"
              className="px-6 py-3 rounded-xl bg-[#659287] hover:bg-[#527a70] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition"
            >
              Start Room Application
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/warden/floor-map"
              className="px-6 py-3 rounded-xl bg-white hover:bg-[#E6F2DD]/50 text-[#1e3831] border border-[#B1D3B9] text-sm font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <LayoutGrid className="w-4 h-4 text-[#659287]" />
              Warden Review Desk
            </Link>
          </div>
        </motion.section>

        {/* Live Hostel Occupancy Strip */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {[
            { label: 'Campus Hostels', value: stats?.totalHostels ?? '—', sub: 'Active residential blocks' },
            { label: 'Total Bed Capacity', value: stats?.totalBeds ?? '—', sub: `${stats?.vacantBeds ?? '—'} currently vacant` },
            {
              label: 'Overall Occupancy',
              value: stats ? `${stats.occupancyRatePercent}%` : '—',
              sub: `${stats?.occupiedBeds ?? 0} confirmed residents`,
            },
            {
              label: 'Current Application Round',
              value: activeCycle ? (activeCycle.status === 'OPEN' ? 'Accepting Applications' : activeCycle.status) : 'Round Upcoming',
              sub: activeCycle ? activeCycle.title : 'Check back shortly',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-5 rounded-2xl border border-[#B1D3B9]/80 shadow-xs hover:border-[#88BDA4] transition"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#659287]">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1e3831] mt-1">{stat.value}</p>
              <p className="text-xs text-[#3f5c53] mt-1 truncate">{stat.sub}</p>
            </div>
          ))}
        </motion.section>

        {/* Role Workflow Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {[
            {
              href: '/student/apply',
              badge: 'Step-by-step',
              title: 'Student Application',
              desc: 'Submit your academic details, rank preferred hostel blocks, and fill out your daily living habits.',
              icon: ClipboardList,
              badgeBg: 'bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]',
            },
            {
              href: '/student/result',
              badge: 'Confirmation',
              title: 'Allotment Letter',
              desc: 'Check your published room and bed number, see your roommate details, and download your official PDF slip.',
              icon: FileCheck2,
              badgeBg: 'bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]',
            },
            {
              href: '/inventory',
              badge: 'Administration',
              title: 'Hostels & Room Blocks',
              desc: 'Manage campus hostels, floors, room types, accessible units, and schedule semester allotment windows.',
              icon: Building2,
              badgeBg: 'bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]',
            },
            {
              href: '/warden/floor-map',
              badge: 'Warden Desk',
              title: 'Interactive Bed Layout',
              desc: 'Review draft allocations floor by floor, reassign rooms for special medical needs, and finalize results.',
              icon: LayoutGrid,
              badgeBg: 'bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                whileHover={{ y: -3 }}
              >
                <Link
                  href={card.href}
                  className="block h-full bg-white rounded-2xl border border-[#B1D3B9]/80 p-5 shadow-xs hover:border-[#88BDA4] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] flex items-center justify-center border border-[#B1D3B9]/70 group-hover:bg-[#659287] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${card.badgeBg}`}>
                      {card.badge}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#1e3831] group-hover:text-[#659287] transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs text-[#3f5c53] mt-2 leading-relaxed">{card.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#659287]">
                    Open Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </section>

        {/* Transparent Campus Principles */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border border-[#B1D3B9] rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e3831]">Fair, Rule-Based Allotment</h3>
              <p className="text-xs text-[#3f5c53] mt-1 leading-relaxed">
                Allocations strictly follow verified university seniority and distance criteria, ensuring every applicant receives an unbiased and transparent room placement.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e3831]">Harmonious Living Compatibility</h3>
              <p className="text-xs text-[#3f5c53] mt-1 leading-relaxed">
                Roommates are paired by comparing daily sleep routines, study habits, and quiet-hour preferences so you feel comfortable and at home throughout the academic year.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e3831]">Privacy & Dignity First</h3>
              <p className="text-xs text-[#3f5c53] mt-1 leading-relaxed">
                Your survey answers and medical accessibility accommodations remain strictly confidential within the housing committee and are never shared publicly.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
