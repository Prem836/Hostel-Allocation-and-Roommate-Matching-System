'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FileDown,
  CheckCircle2,
  Building,
  BedDouble,
  Sparkles,
  ShieldCheck,
  Clock,
  Lock,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function StudentResultPage() {
  const { user } = useAuthStore();
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { data: cycles } = useQuery({
    queryKey: ['cycles-all'],
    queryFn: async () => {
      const list = (await api.get('/cycles')).data.data as any[];
      if (list.length > 0 && !selectedCycleId) {
        const pub = list.find((c) => c.status === 'PUBLISHED') || list[0];
        setSelectedCycleId(pub._id);
      }
      return list;
    },
  });

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['my-result', selectedCycleId, user?._id],
    queryFn: async () => {
      const res = await api.get(`/publication/cycles/${selectedCycleId}/my-result`);
      return res.data.data;
    },
    enabled: !!selectedCycleId && !!user && user.role === 'STUDENT',
    retry: false,
  });

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/publication/cycles/${selectedCycleId}/my-letter`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hostel-allocation-letter-${selectedCycleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <Lock className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900">Sign in to View Allocation Result</h1>
          <Link
            href="/auth"
            className="mt-5 inline-flex px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase border border-blue-200">
            Module M9 · Student Result
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Hostel Allotment Result</h1>
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

      {isLoading ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-sm text-slate-500">
          Loading allocation result...
        </div>
      ) : error ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center">
          <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Not Published Yet</h2>
          <p className="text-xs text-slate-600 mt-1">{getErrorMessage(error)}</p>
        </div>
      ) : result?.status === 'ALLOCATED' && result.assignment ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-emerald-900">Accommodation Confirmed & Published</h2>
                <p className="text-xs text-emerald-800">
                  Published on {new Date(result.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <FileDown className="w-4 h-4" />
              {downloading ? 'Generating PDF...' : 'Download Allotment Letter (PDF)'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Assigned Hostel</p>
                  <p className="text-base font-extrabold text-slate-900">
                    {result.assignment.hostelId?.name} ({result.assignment.hostelId?.code})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Room & Bed</p>
                  <p className="text-base font-extrabold text-slate-900">
                    Floor {result.assignment.roomId?.floor} · Room {result.assignment.roomId?.roomNumber} · Bed{' '}
                    {result.assignment.bedId?.bedLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {result.assignment.roomId?.roomType}
                    {result.assignment.roomId?.isAccessible ? ' · Accessible Provision' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:border-l border-slate-100 md:pl-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Compatibility Score</p>
                  <p className="text-base font-extrabold text-emerald-700">
                    {result.assignment.matchScore}% Match
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Assignment ID</p>
                  <p className="text-xs font-mono font-bold text-slate-800">{result.assignment._id}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : result?.status === 'WAITLISTED' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
          <h2 className="text-lg font-bold">Waitlisted — Rank #{result.waitlistRank}</h2>
          <p className="text-xs mt-1">
            You are currently on the ordered waitlist ({result.waitlistStatus}). You will be automatically
            notified if a bed becomes vacant.
          </p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm text-slate-600">
          No allocation record found for your account in this cycle.
        </div>
      )}
    </div>
  );
}
