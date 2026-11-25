'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Building2, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const [selectedCycleId, setSelectedCycleId] = useState('');

  const { data: cycles } = useQuery({
    queryKey: ['cycles-all'],
    queryFn: async () => {
      const list = (await api.get('/cycles')).data.data as any[];
      if (list.length > 0 && !selectedCycleId) setSelectedCycleId(list[0]._id);
      return list;
    },
  });

  const { data: occupancy } = useQuery({
    queryKey: ['analytics-occupancy'],
    queryFn: async () => (await api.get('/publication/analytics/occupancy')).data.data as any[],
  });

  const { data: cycleMetrics } = useQuery({
    queryKey: ['analytics-cycle', selectedCycleId],
    queryFn: async () => (await api.get(`/publication/analytics/cycles/${selectedCycleId}`)).data.data,
    enabled: !!selectedCycleId,
    retry: false,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full uppercase border border-purple-200">
            Module M9 · Live Analytics
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Occupancy & Preference Analytics</h1>
        </div>

        <select
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
        >
          {cycles?.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title} ({c.status})
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          {
            label: 'Total Allocated',
            value: cycleMetrics?.totalAssigned ?? '—',
            sub: `${cycleMetrics?.waitlistCount ?? 0} on waitlist`,
            icon: Users,
            color: 'text-slate-900',
          },
          {
            label: '1st Choice Satisfaction',
            value: cycleMetrics ? `${cycleMetrics.preferenceSatisfaction.firstChoicePercent}%` : '—',
            sub: cycleMetrics ? `+${cycleMetrics.preferenceSatisfaction.secondChoicePercent}% got 2nd choice` : 'Run allocation first',
            icon: CheckCircle,
            color: 'text-emerald-700',
          },
          {
            label: 'Avg Compatibility',
            value: cycleMetrics ? `${cycleMetrics.averageCompatibilityScore}%` : '—',
            sub: 'Pairwise lifestyle match',
            icon: BarChart3,
            color: 'text-indigo-700',
          },
          {
            label: 'Warden Overrides',
            value: cycleMetrics?.overrides?.count ?? '—',
            sub: cycleMetrics ? `${cycleMetrics.overrides.overrideRatePercent}% override rate` : 'Audited changes',
            icon: AlertTriangle,
            color: 'text-amber-700',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>{kpi.label}</span>
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <p className={`text-3xl font-extrabold mt-2 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Occupancy Heatmap */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Live Hostel Occupancy Heatmap
        </h2>

        {!occupancy || occupancy.length === 0 ? (
          <p className="text-xs text-slate-500">
            No occupancy data available yet. Sign in as Warden/Admin and register hostels in Inventory.
          </p>
        ) : (
          <div className="space-y-6">
            {occupancy.map((h) => {
              const occPct = h.occupancyPercent ?? 0;
              const maintPct = h.totalBeds > 0 ? Math.round((h.maintenanceBeds / h.totalBeds) * 100) : 0;
              return (
                <div key={h.hostelId} className="space-y-2">
                  <div className="flex flex-wrap justify-between items-center text-sm gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{h.name}</span>
                      <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {h.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-x-3">
                      <span>Occupied: <strong>{h.occupiedBeds}</strong></span>
                      <span>Vacant: <strong>{h.vacantBeds}</strong></span>
                      <span>Maint: <strong>{h.maintenanceBeds}</strong></span>
                      <span className="font-extrabold text-slate-900">{occPct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occPct}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-indigo-600 h-full"
                    />
                    <div className="bg-amber-400 h-full" style={{ width: `${maintPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
