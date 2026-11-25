'use client';

import React from 'react';
import { BarChart3, Building2, CheckCircle, AlertTriangle, Users } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const occupancyData = [
    { code: 'BH-1', name: 'APJ Abdul Kalam Hostel', total: 450, occupied: 432, vacant: 14, maintenance: 4 },
    { code: 'GH-1', name: 'Kalpana Chawla Hostel', total: 380, occupied: 360, vacant: 18, maintenance: 2 },
    { code: 'RH-1', name: 'C.V. Raman Research Block', total: 120, occupied: 96, vacant: 24, maintenance: 0 },
  ];

  const cycleMetrics = {
    totalAssigned: 888,
    waitlistCount: 42,
    avgCompatibility: 89.4,
    firstChoicePct: 76.2,
    secondChoicePct: 16.5,
    thirdChoicePct: 5.1,
    overrideCount: 14,
    overrideRatePct: 1.6,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider border border-purple-200">
            Module M9 · Analytics & Reporting
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Occupancy & Preference Analytics</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time hostel occupancy heatmap, preference satisfaction rates, and warden override audit metrics
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Allocated</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{cycleMetrics.totalAssigned}</p>
          <p className="text-xs text-slate-500 mt-1">{cycleMetrics.waitlistCount} students on waitlist</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>1st Choice Satisfaction</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-2">{cycleMetrics.firstChoicePct}%</p>
          <p className="text-xs text-slate-500 mt-1">+{cycleMetrics.secondChoicePct}% got 2nd choice</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Avg Compatibility</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">{cycleMetrics.avgCompatibility}%</p>
          <p className="text-xs text-slate-500 mt-1">Pairwise lifestyle trait match</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Warden Overrides</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-700 mt-2">{cycleMetrics.overrideCount}</p>
          <p className="text-xs text-slate-500 mt-1">{cycleMetrics.overrideRatePct}% of total assignments</p>
        </div>
      </div>

      {/* Occupancy Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Hostel Occupancy Heatmap
        </h2>

        <div className="space-y-6">
          {occupancyData.map((h) => {
            const pct = Math.round((h.occupied / h.total) * 100);
            return (
              <div key={h.code} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-900">{h.name}</span>
                    <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {h.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-x-3">
                    <span>Occupied: <strong>{h.occupied}</strong></span>
                    <span>Vacant: <strong>{h.vacant}</strong></span>
                    <span>Maint: <strong>{h.maintenance}</strong></span>
                    <span className="font-bold text-slate-900">{pct}%</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-indigo-600 h-full" style={{ width: `${pct}%` }} />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${Math.round((h.maintenance / h.total) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
