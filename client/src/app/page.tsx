'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ClipboardCheck,
  MapPin,
  BarChart3,
  FileDown,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Cpu,
} from 'lucide-react';
import { api } from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
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
    <main className="relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-emerald-100/40 blur-3xl rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Project P03 · Track J Full-Stack Platform
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Fair Hostel Allocation &{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Roommate Matching
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Policy-driven deterministic bed allocation with AES-256 encrypted lifestyle surveys,
            interactive warden floor maps, and atomic transactional publication.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/student/apply"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition"
            >
              Open Student Hub
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/warden/floor-map"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-sm font-bold flex items-center gap-2 shadow-sm transition"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Warden Review Board
            </Link>
          </div>
        </motion.section>

        {/* Live System Telemetry Strip */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {[
            { label: 'Total Hostels', value: stats?.totalHostels ?? '—', sub: 'Active blocks' },
            { label: 'Total Beds', value: stats?.totalBeds ?? '—', sub: `${stats?.vacantBeds ?? '—'} vacant` },
            {
              label: 'Live Occupancy',
              value: stats ? `${stats.occupancyRatePercent}%` : '—',
              sub: `${stats?.occupiedBeds ?? 0} occupied`,
            },
            {
              label: 'Active Cycle',
              value: activeCycle ? activeCycle.status : 'NONE',
              sub: activeCycle ? activeCycle.title : 'Create one in Inventory',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1 truncate">{stat.sub}</p>
            </div>
          ))}
        </motion.section>

        {/* Role Workflow Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {[
            {
              href: '/student/apply',
              badge: 'M2 · M4 · M5',
              title: 'Student Application Hub',
              desc: 'Apply to open cycles, rank hostel preferences, and submit your encrypted lifestyle survey.',
              icon: ClipboardCheck,
              color: 'from-blue-500 to-indigo-600',
            },
            {
              href: '/student/result',
              badge: 'M9 Letter',
              title: 'Result & PDF Letter',
              desc: 'View published room & bed allotments, compatibility score, and download your official PDF letter.',
              icon: FileDown,
              color: 'from-emerald-500 to-teal-600',
            },
            {
              href: '/inventory',
              badge: 'M1 · M2',
              title: 'Inventory & Cycles',
              desc: 'Manage hostels, blocks, accessible rooms, bulk CSV imports, and open/close allocation cycles.',
              icon: Building2,
              color: 'from-violet-500 to-purple-600',
            },
            {
              href: '/warden/floor-map',
              badge: 'M6 · M7 · M8',
              title: 'Warden Floor Bed Map',
              desc: 'Run seeded allocation drafts, inspect floor maps, log overrides with reasons, and publish.',
              icon: MapPin,
              color: 'from-amber-500 to-orange-600',
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
                whileHover={{ y: -4 }}
              >
                <Link
                  href={card.href}
                  className="block h-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {card.badge}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{card.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">
                    Launch <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </section>

        {/* Governance Guarantees */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 text-slate-100 rounded-3xl p-8 sm:p-10 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Draft vs. Live Separation</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Allocation runs only write drafts. Live bed occupancy updates atomically inside a MongoDB
                transaction after explicit Warden approval.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Deterministic Seeded Engine</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Every allocation draft stores its PRNG seed so wardens can reproduce identical results
                and verify zero hard-constraint violations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">DPDP Privacy by Design</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Lifestyle survey responses are encrypted with AES-256-GCM at rest and never exposed to
                other students—only aggregate match scores are used.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
