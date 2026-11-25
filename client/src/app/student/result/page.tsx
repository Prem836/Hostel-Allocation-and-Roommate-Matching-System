'use client';

import React, { useState } from 'react';
import { FileDown, CheckCircle2, Building, BedDouble, Sparkles, ShieldCheck, Bell } from 'lucide-react';

export default function StudentResultPage() {
  const [downloading, setDownloading] = useState(false);

  // Sample published allocation result for UI preview
  const allocation = {
    cycleTitle: 'Fall 2026 Hostel Allocation',
    academicYear: '2026-2027',
    status: 'ALLOCATED',
    hostelName: 'APJ Abdul Kalam Hostel',
    hostelCode: 'BH-1',
    floor: 1,
    roomNumber: '101',
    roomType: 'DOUBLE',
    bedLabel: 'A',
    isAccessible: true,
    matchScore: 92.5,
    verificationRef: 'A4F9C21E88B0',
    publishedAt: '2026-11-25',
  };

  const handleDownloadLetter = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Official PDF Allotment Letter downloaded (connected to GET /api/v1/publication/cycles/:cycleId/my-letter).');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-200">
            Module M9 · Student Result
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Hostel Allotment Result</h1>
          <p className="text-sm text-slate-600 mt-1">
            {allocation.cycleTitle} · {allocation.academicYear}
          </p>
        </div>

        <button
          onClick={handleDownloadLetter}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <FileDown className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download Allotment Letter (PDF)'}
        </button>
      </div>

      {/* Status Banner */}
      <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 mb-8">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
        <div>
          <h2 className="text-base font-bold text-emerald-900">Accommodation Confirmed & Published</h2>
          <p className="text-xs text-emerald-800 mt-0.5">
            Your bed assignment has been reviewed by the Hostel Warden and officially published.
          </p>
        </div>
      </div>

      {/* Assignment Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Hostel</p>
              <p className="text-base font-bold text-slate-900">
                {allocation.hostelName} ({allocation.hostelCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Room & Bed</p>
              <p className="text-base font-bold text-slate-900">
                Floor {allocation.floor} · Room {allocation.roomNumber} · Bed {allocation.bedLabel}
              </p>
              <p className="text-xs text-slate-500">
                Type: {allocation.roomType} {allocation.isAccessible ? '· Accessible Provision' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Compatibility Score</p>
              <p className="text-base font-bold text-emerald-700">{allocation.matchScore}% Match</p>
              <p className="text-xs text-slate-500">
                Calculated from encrypted lifestyle vectors (raw roommate answers remain private)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Verification Reference</p>
              <p className="text-sm font-mono font-bold text-slate-900">{allocation.verificationRef}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-600" /> Notifications
        </h3>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
          <strong>Hostel Allocation Published:</strong> Your hostel room allocation has been finalized on {allocation.publishedAt}.
        </div>
      </div>
    </div>
  );
}
