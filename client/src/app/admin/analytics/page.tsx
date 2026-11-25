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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-[#B1D3B9]/60 gap-4">
        <div>
          <span className="px-3 py-1 bg-[#E6F2DD] text-[#1e3831] text-xs font-bold rounded-full uppercase border border-[#B1D3B9]">
            Campus Overview
          </span>
          <h1 className="text-3xl font-extrabold text-[#1e3831] mt-2">Hostel Occupancy & Satisfaction Reports</h1>
        </div>

        <select
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#B1D3B9] bg-white text-sm font-semibold text-[#1e3831] focus:ring-1 focus:ring-[#659287] focus:outline-none"
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
            label: 'Confirmed Placements',
            value: cycleMetrics?.totalAssigned ?? '—',
            sub: `${cycleMetrics?.waitlistCount ?? 0} currently on waiting list`,
            icon: Users,
            color: 'text-[#1e3831]',
          },
          {
            label: '1st Choice Satisfaction',
            value: cycleMetrics ? `${cycleMetrics.preferenceSatisfaction.firstChoicePercent}%` : '—',
            sub: cycleMetrics ? `+${cycleMetrics.preferenceSatisfaction.secondChoicePercent}% received 2nd choice` : 'Awaiting allocation run',
            icon: CheckCircle,
            color: 'text-[#659287]',
          },
          {
            label: 'Average Compatibility',
            value: cycleMetrics ? `${cycleMetrics.averageCompatibilityScore}%` : '—',
            sub: 'Living habit match score',
            icon: BarChart3,
            color: 'text-[#1e3831]',
          },
          {
            label: 'Warden Adjustments',
            value: cycleMetrics?.overrides?.count ?? '—',
            sub: cycleMetrics ? `${cycleMetrics.overrides.overrideRatePercent}% accommodation adjustments` : 'Audit trail active',
            icon: AlertTriangle,
            color: 'text-[#659287]',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white p-5 rounded-2xl border border-[#B1D3B9] shadow-xs"
            >
              <div className="flex items-center justify-between text-[#659287] text-xs font-bold uppercase">
                <span>{kpi.label}</span>
                <Icon className="w-4 h-4 text-[#659287]" />
              </div>
              <p className={`text-3xl font-extrabold mt-2 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-[#3f5c53] mt-1">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Occupancy Heatmap */}
      <div className="bg-white rounded-3xl border border-[#B1D3B9] shadow-xs p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[#1e3831] flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-[#659287]" />
          Residential Building Occupancy Overview
        </h2>

        {!occupancy || occupancy.length === 0 ? (
          <p className="text-xs text-[#3f5c53]">
            No occupancy records available. Register hostels and rooms in the Hostel Directory to see live breakdowns.
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
                      <span className="font-bold text-[#1e3831]">{h.name}</span>
                      <span className="ml-2 text-xs font-bold text-[#1e3831] bg-[#E6F2DD] border border-[#B1D3B9] px-2 py-0.5 rounded-full">
                        {h.code}
                      </span>
                    </div>
                    <div className="text-xs text-[#3f5c53] space-x-3">
                      <span>Occupied: <strong>{h.occupiedBeds}</strong></span>
                      <span>Vacant: <strong>{h.vacantBeds}</strong></span>
                      <span>Maintenance: <strong>{h.maintenanceBeds}</strong></span>
                      <span className="font-bold text-[#1e3831]">{occPct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-[#E6F2DD] rounded-full overflow-hidden flex border border-[#B1D3B9]/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occPct}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-[#659287] h-full"
                    />
                    <div className="bg-[#88BDA4] h-full" style={{ width: `${maintPct}%` }} />
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
