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
      link.setAttribute('download', `hostel-allotment-slip-${selectedCycleId}.pdf`);
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
        <div className="bg-white p-8 rounded-3xl border border-[#B1D3B9] shadow-xs">
          <Lock className="w-10 h-10 text-[#659287] mx-auto mb-3" />
          <h1 className="text-xl font-bold text-[#1e3831]">Sign in to View Allotment Result</h1>
          <p className="text-xs text-[#3f5c53] mt-2 mb-6">
            Log in with your university account to verify your room assignment and download your official allotment slip.
          </p>
          <Link
            href="/auth"
            className="inline-flex px-6 py-2.5 rounded-xl bg-[#659287] hover:bg-[#527a70] text-white text-sm font-semibold transition"
          >
            Sign In with Campus ID
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="px-3 py-1 bg-[#E6F2DD] text-[#1e3831] text-xs font-semibold rounded-full border border-[#B1D3B9]">
            Official Residence Notice
          </span>
          <h1 className="text-3xl font-extrabold text-[#1e3831] mt-2">Room Allotment Status</h1>
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

      {isLoading ? (
        <div className="bg-white p-10 rounded-3xl border border-[#B1D3B9] text-center text-sm text-[#3f5c53]">
          Retrieving your allotment status...
        </div>
      ) : error ? (
        <div className="bg-white p-10 rounded-3xl border border-[#B1D3B9] text-center">
          <Clock className="w-10 h-10 text-[#659287] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#1e3831]">Results Pending Publication</h2>
          <p className="text-xs text-[#3f5c53] mt-1 max-w-md mx-auto">
            {getErrorMessage(error) || 'The warden office has not finalized the allocations for this cycle yet. Please check back after official announcement.'}
          </p>
        </div>
      ) : result?.status === 'ALLOCATED' && result.assignment ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-5 bg-[#E6F2DD] border border-[#88BDA4] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#659287] shrink-0" />
              <div>
                <h2 className="text-base font-bold text-[#1e3831]">Hostel Room Confirmed & Allotted</h2>
                <p className="text-xs text-[#3f5c53]">
                  Officially confirmed on {new Date(result.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#659287] hover:bg-[#527a70] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <FileDown className="w-4 h-4" />
              {downloading ? 'Preparing PDF...' : 'Download Official Allotment Slip (PDF)'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#B1D3B9] shadow-xs p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#659287] uppercase">Allotted Hostel</p>
                  <p className="text-base font-bold text-[#1e3831]">
                    {result.assignment.hostelId?.name} ({result.assignment.hostelId?.code})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#659287] uppercase">Room & Bed Details</p>
                  <p className="text-base font-bold text-[#1e3831]">
                    Floor {result.assignment.roomId?.floor} · Room {result.assignment.roomId?.roomNumber} · Bed{' '}
                    {result.assignment.bedId?.bedLabel}
                  </p>
                  <p className="text-xs text-[#3f5c53]">
                    {result.assignment.roomId?.roomType} Room
                    {result.assignment.roomId?.isAccessible ? ' · Ground-floor Accessible' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:border-l border-[#B1D3B9]/50 md:pl-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#659287] uppercase">Roommate Harmony Score</p>
                  <p className="text-base font-bold text-[#1e3831]">
                    {result.assignment.matchScore}% Living Compatibility
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F2DD] text-[#659287] border border-[#B1D3B9] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#659287] uppercase">Allotment Verification Reference</p>
                  <p className="text-xs font-mono font-bold text-[#1e3831]">{result.assignment._id}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : result?.status === 'WAITLISTED' ? (
        <div className="bg-[#E6F2DD] border border-[#88BDA4] rounded-2xl p-6 text-[#1e3831]">
          <h2 className="text-lg font-bold">Waitlisted — Queue Position #{result.waitlistRank}</h2>
          <p className="text-xs text-[#3f5c53] mt-1">
            You are currently on the verified waiting list ({result.waitlistStatus}). As enrolled students cancel or change rooms, the warden desk will notify you immediately via email.
          </p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-[#B1D3B9] text-center text-sm text-[#3f5c53]">
          No active application or allocation found for this round. Please submit an application during the open window.
        </div>
      )}
    </div>
  );
}
