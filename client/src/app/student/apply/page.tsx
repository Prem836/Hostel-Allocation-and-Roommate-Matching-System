'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  ListOrdered,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Lock,
  Moon,
  BookOpen,
  Volume2,
  Cigarette,
  ShieldCheck,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function StudentHubPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Step 1: Application form
  const [appForm, setAppForm] = useState({
    cgpa: 8.5,
    feeCleared: true,
    disciplinaryHold: false,
    distanceFromCampusKm: 120,
    isAccessibleRequired: false,
  });

  // Step 2: Preferences
  const [rankedHostelIds, setRankedHostelIds] = useState<string[]>([]);
  const [preferredRoomTypes, setPreferredRoomTypes] = useState<string[]>(['DOUBLE', 'TRIPLE']);
  const [requestedRoommateRegNumber, setRequestedRoommateRegNumber] = useState('');

  // Step 3: Questionnaire
  const [survey, setSurvey] = useState({
    consentGiven: false,
    sleepSchedule: 0.5,
    studyHabit: 0.5,
    cleanliness: 0.8,
    noiseTolerance: 0.3,
    smokingTolerance: 0.0,
    personalNotes: '',
  });

  const { data: cycles } = useQuery({
    queryKey: ['cycles-all'],
    queryFn: async () => {
      const res = await api.get('/cycles');
      const list = res.data.data as any[];
      if (list.length > 0 && !selectedCycleId) {
        const open = list.find((c) => c.status === 'OPEN') || list[0];
        setSelectedCycleId(open._id);
      }
      return list;
    },
  });

  const { data: hostels } = useQuery({
    queryKey: ['hostels-all'],
    queryFn: async () => {
      const res = await api.get('/inventory/hostels');
      return res.data.data as any[];
    },
  });

  React.useEffect(() => {
    if (hostels && hostels.length > 0 && rankedHostelIds.length === 0) {
      setRankedHostelIds(hostels.map((h: any) => h._id));
    }
  }, [hostels, rankedHostelIds.length]);

  const { data: myApp } = useQuery({
    queryKey: ['my-application', selectedCycleId, user?._id],
    queryFn: async () => {
      const res = await api.get(`/cycles/${selectedCycleId}/my-application`);
      return res.data.data;
    },
    enabled: !!selectedCycleId && !!user && user.role === 'STUDENT',
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/cycles/${selectedCycleId}/apply`, appForm);
      return res.data.data;
    },
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Application details recorded. Next, rank your hostel preferences.' });
      queryClient.invalidateQueries({ queryKey: ['my-application'] });
      setStep(2);
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const prefMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/cycles/${selectedCycleId}/preferences`, {
        rankedHostelIds,
        preferredRoomTypes,
        requestedRoommateRegNumber: requestedRoommateRegNumber || undefined,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Hostel choices saved. Please complete your living habits survey.' });
      setStep(3);
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const surveyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/cycles/${selectedCycleId}/questionnaire`, survey);
      return res.data.data;
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        text: 'Your living habit preferences have been safely recorded for roommate compatibility matching.',
      });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const moveHostel = (idx: number, dir: -1 | 1) => {
    const next = [...rankedHostelIds];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setRankedHostelIds(next);
  };

  const toggleRoomType = (rt: string) => {
    setPreferredRoomTypes((prev) =>
      prev.includes(rt) ? (prev.length > 1 ? prev.filter((x) => x !== rt) : prev) : [...prev, rt]
    );
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#B1D3B9] shadow-xs">
          <Lock className="w-10 h-10 text-[#659287] mx-auto mb-3" />
          <h1 className="text-xl font-bold text-[#1e3831]">Student Sign-In Required</h1>
          <p className="text-sm text-[#3f5c53] mt-2 mb-6">
            Please log in with your student credentials to submit your hostel application and preference rankings.
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
            Hostel Application Portal
          </span>
          <h1 className="text-3xl font-extrabold text-[#1e3831] mt-2">Room Allotment & Preferences</h1>
        </div>

        {/* Cycle Selector */}
        <div className="min-w-[240px]">
          <label className="block text-[11px] font-bold uppercase text-[#659287] mb-1">
            Current Allotment Window
          </label>
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#B1D3B9] bg-white text-sm font-semibold text-[#1e3831] focus:ring-1 focus:ring-[#659287] focus:outline-none"
          >
            {cycles?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#E6F2DD] rounded-2xl mb-6 border border-[#B1D3B9]">
        {[
          { num: 1 as const, label: '1. Basic Details', icon: ClipboardList },
          { num: 2 as const, label: '2. Hostel Choices', icon: ListOrdered },
          { num: 3 as const, label: '3. Living Habits', icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          const active = step === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`relative py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                active ? 'text-[#1e3831]' : 'text-[#659287] hover:text-[#1e3831]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="student-step"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs border border-[#88BDA4]/50"
                />
              )}
              <Icon className="w-4 h-4 relative z-10 text-[#659287]" />
              <span className="relative z-10 hidden sm:inline">{s.label}</span>
              <span className="relative z-10 sm:hidden">Step {s.num}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              banner.type === 'success'
                ? 'bg-[#E6F2DD] border-[#88BDA4] text-[#1e3831]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#659287]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Application Status Badge */}
      {myApp && (
        <div className="mb-6 p-4 bg-white rounded-2xl border border-[#B1D3B9] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-[#1e3831]">Application Status: </span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]">
              {myApp.status}
            </span>
          </div>
          {myApp.ineligibilityReasons?.length > 0 && (
            <span className="text-amber-700 font-medium">
              Note: {myApp.ineligibilityReasons.join('; ')}
            </span>
          )}
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-[#B1D3B9] shadow-xs space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-[#1e3831]">Academic & Distance Eligibility</h2>
              <p className="text-xs text-[#3f5c53] mt-1">
                Provide your current academic standing and permanent residence distance to evaluate allotment priority.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1e3831] uppercase mb-1">
                  Cumulative GPA (0.00 – 10.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={appForm.cgpa}
                  onChange={(e) => setAppForm({ ...appForm, cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1e3831] uppercase mb-1">
                  Permanent Home Distance (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={appForm.distanceFromCampusKm}
                  onChange={(e) =>
                    setAppForm({ ...appForm, distanceFromCampusKm: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2.5 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 text-sm text-[#1e3831] cursor-pointer">
                <input
                  type="checkbox"
                  checked={appForm.feeCleared}
                  onChange={(e) => setAppForm({ ...appForm, feeCleared: e.target.checked })}
                  className="accent-[#659287] w-4 h-4 rounded"
                />
                All college tuition and hostel dues are cleared up to date
              </label>
              <label className="flex items-center gap-2.5 text-sm text-[#1e3831] cursor-pointer">
                <input
                  type="checkbox"
                  checked={appForm.isAccessibleRequired}
                  onChange={(e) => setAppForm({ ...appForm, isAccessibleRequired: e.target.checked })}
                  className="accent-[#659287] w-4 h-4 rounded"
                />
                Medical disability or wheelchair accessibility requested (ground floor allotment)
              </label>
            </div>

            <button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={!selectedCycleId || applyMutation.isPending}
              className="w-full py-3 rounded-xl bg-[#659287] hover:bg-[#527a70] disabled:opacity-50 text-white text-sm font-bold shadow-xs transition"
            >
              {applyMutation.isPending ? 'Verifying & Saving...' : 'Save & Continue to Hostel Preferences'}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-[#B1D3B9] shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-[#1e3831]">Rank Your Preferred Hostels</h2>
              <p className="text-xs text-[#3f5c53] mt-1">
                Select your preferred hostels from the campus directory and arrange them in order of preference.
              </p>
            </div>

            {(!hostels || hostels.length === 0) ? (
              <div className="p-5 rounded-2xl bg-[#E6F2DD] border border-[#88BDA4] space-y-3">
                <p className="text-xs font-bold text-[#1e3831]">No Hostels Registered in Database</p>
                <p className="text-xs text-[#3f5c53]">
                  The campus inventory currently has no active hostels. Click below to initialize the standard campus residences automatically into your database.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await api.post('/inventory/seed');
                    queryClient.invalidateQueries({ queryKey: ['hostels-all'] });
                  }}
                  className="px-4 py-2 bg-[#659287] hover:bg-[#527a70] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Initialize Campus Residences
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#659287]">
                    Your Ranked Choices ({rankedHostelIds.length})
                  </p>
                  {rankedHostelIds.map((hId, idx) => {
                    const h = hostels?.find((x) => x._id === hId);
                    return (
                      <div
                        key={hId}
                        className="p-3.5 rounded-xl border border-[#B1D3B9] bg-[#E6F2DD]/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#659287] text-white text-xs font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[#1e3831]">{h?.name || hId}</p>
                            <p className="text-[11px] text-[#3f5c53]">
                              {h?.code} · {h?.gender} Hostel
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveHostel(idx, -1)}
                            className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#B1D3B9]"
                            title="Move higher"
                          >
                            <ArrowUp className="w-4 h-4 text-[#659287]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveHostel(idx, 1)}
                            className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#B1D3B9]"
                            title="Move lower"
                          >
                            <ArrowDown className="w-4 h-4 text-[#659287]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRankedHostelIds((prev) => prev.filter((id) => id !== hId))}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg ml-1"
                            title="Remove choice"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hostels.some((h) => !rankedHostelIds.includes(h._id)) && (
                  <div className="space-y-2 pt-2 border-t border-[#B1D3B9]/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3f5c53]">
                      Available Hostels to Add
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hostels
                        .filter((h) => !rankedHostelIds.includes(h._id))
                        .map((h) => (
                          <button
                            key={h._id}
                            type="button"
                            onClick={() => setRankedHostelIds((prev) => [...prev, h._id])}
                            className="px-3 py-2 rounded-xl border border-[#B1D3B9] bg-white hover:bg-[#E6F2DD] text-xs font-semibold text-[#1e3831] flex items-center gap-1.5 transition"
                          >
                            <span className="font-bold">+</span>
                            <span>{h.name}</span>
                            <span className="text-[10px] text-[#659287]">({h.code})</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1e3831] uppercase mb-2">
                Room Sharing Type Preference
              </label>
              <div className="flex flex-wrap gap-2">
                {['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'].map((rt) => {
                  const selected = preferredRoomTypes.includes(rt);
                  return (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => toggleRoomType(rt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selected
                          ? 'bg-[#659287] text-white border-[#659287]'
                          : 'bg-white text-[#1e3831] border-[#B1D3B9] hover:bg-[#E6F2DD]'
                      }`}
                    >
                      {rt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1e3831] uppercase mb-1">
                Requested Roommate Registration ID (Optional)
              </label>
              <input
                type="text"
                value={requestedRoommateRegNumber}
                onChange={(e) => setRequestedRoommateRegNumber(e.target.value)}
                placeholder="e.g. 2026CSE002"
                className="w-full px-3 py-2.5 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
              />
              <p className="text-[11px] text-[#3f5c53] mt-1">
                If both students list each other as mutual roommate requests, the allotment office will prioritize placing you in the same room.
              </p>
            </div>

            <button
              type="button"
              onClick={() => prefMutation.mutate()}
              disabled={rankedHostelIds.length === 0 || prefMutation.isPending}
              className="w-full py-3 rounded-xl bg-[#659287] hover:bg-[#527a70] disabled:opacity-50 text-white text-sm font-bold shadow-xs transition"
            >
              {prefMutation.isPending ? 'Saving choices...' : 'Save Choices & Go to Living Habits'}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-[#B1D3B9] shadow-xs space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-[#1e3831]">Living Habits & Roommate Compatibility</h2>
              <p className="text-xs text-[#3f5c53] mt-1">
                These lifestyle preferences help us pair roommates with similar routines so you can live comfortably together.
              </p>
            </div>

            {[
              {
                key: 'sleepSchedule' as const,
                label: 'Sleep Routine',
                icon: Moon,
                left: 'Night Owl (Late Sleeper)',
                right: 'Early Riser (Morning Person)',
              },
              {
                key: 'studyHabit' as const,
                label: 'Study Preference',
                icon: BookOpen,
                left: 'Studies in Room',
                right: 'Prefers Library / Reading Room',
              },
              {
                key: 'cleanliness' as const,
                label: 'Room Tidiness Expectation',
                icon: Sparkles,
                left: 'Casual & Relaxed',
                right: 'Spotless & Highly Organized',
              },
              {
                key: 'noiseTolerance' as const,
                label: 'Sound & Music Atmosphere',
                icon: Volume2,
                left: 'Prefers Quiet Study Silence',
                right: 'Enjoys Background Music & Chatting',
              },
              {
                key: 'smokingTolerance' as const,
                label: 'Campus Policy & Fresh Air',
                icon: Cigarette,
                left: 'Strict Smoke-Free Environment',
                right: 'Flexible / Moderate',
              },
            ].map((trait) => {
              const Icon = trait.icon;
              const val = survey[trait.key];
              return (
                <div key={trait.key} className="p-3 rounded-xl bg-[#f7faf5] border border-[#B1D3B9]/60">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-[#1e3831] flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-[#659287]" /> {trait.label}
                    </span>
                    <span className="text-[11px] font-semibold text-[#659287]">
                      {val < 0.4 ? trait.left : val > 0.6 ? trait.right : 'Moderate / Flexible'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={val}
                    onChange={(e) => setSurvey({ ...survey, [trait.key]: parseFloat(e.target.value) })}
                    className="w-full accent-[#659287] cursor-pointer"
                  />
                </div>
              );
            })}

            <label className="p-4 rounded-xl bg-[#E6F2DD]/60 border border-[#B1D3B9] flex items-start gap-3 text-xs text-[#1e3831] cursor-pointer">
              <input
                type="checkbox"
                checked={survey.consentGiven}
                onChange={(e) => setSurvey({ ...survey, consentGiven: e.target.checked })}
                className="mt-0.5 accent-[#659287] w-4 h-4 rounded"
              />
              <span>
                <strong>Confidentiality Declaration:</strong> I authorize the residence life committee to use my lifestyle responses solely to identify compatible roommates. My individual question answers remain confidential.
              </span>
            </label>

            <button
              type="button"
              onClick={() => surveyMutation.mutate()}
              disabled={!survey.consentGiven || surveyMutation.isPending}
              className="w-full py-3 rounded-xl bg-[#659287] hover:bg-[#527a70] disabled:opacity-50 text-white text-sm font-bold shadow-xs transition"
            >
              {surveyMutation.isPending ? 'Saving preferences...' : 'Save Living Habits & Complete Form'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
