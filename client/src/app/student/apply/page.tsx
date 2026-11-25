'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
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
      const list = res.data.data as any[];
      if (list.length > 0 && rankedHostelIds.length === 0) {
        setRankedHostelIds(list.slice(0, 3).map((h) => h._id));
      }
      return list;
    },
  });

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
      setBanner({ type: 'success', text: 'Application submitted! Proceed to rank your hostel preferences.' });
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
      setBanner({ type: 'success', text: 'Preferences saved! Complete the compatibility survey next.' });
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
        text: 'Lifestyle questionnaire encrypted with AES-256-GCM and saved securely!',
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
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <Lock className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900">Sign in to Access Student Hub</h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            You must be logged in as a student to apply for hostel accommodation, rank preferences, and
            submit your lifestyle survey.
          </p>
          <Link
            href="/auth"
            className="inline-flex px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition"
          >
            Go to Sign In / Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-200">
            Student Application Hub · M2 / M4 / M5
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Apply & Match</h1>
        </div>

        {/* Cycle Selector */}
        <div className="min-w-[240px]">
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Allocation Cycle
          </label>
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-2xl mb-6">
        {[
          { num: 1 as const, label: '1. Application (M2)', icon: ClipboardCheck },
          { num: 2 as const, label: '2. Preferences (M4)', icon: ListOrdered },
          { num: 3 as const, label: '3. Compatibility (M5)', icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          const active = step === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`relative py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                active ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="student-step"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Application Status Badge */}
      {myApp && (
        <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-700">Current Application Status: </span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
              {myApp.status}
            </span>
          </div>
          {myApp.ineligibilityReasons?.length > 0 && (
            <span className="text-rose-600 font-medium">
              Reasons: {myApp.ineligibilityReasons.join('; ')}
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
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5"
          >
            <h2 className="text-xl font-extrabold text-slate-900">Submit Hostel Application</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current CGPA (0 - 10)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={appForm.cgpa}
                  onChange={(e) => setAppForm({ ...appForm, cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Home Distance from Campus (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={appForm.distanceFromCampusKm}
                  onChange={(e) =>
                    setAppForm({ ...appForm, distanceFromCampusKm: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appForm.feeCleared}
                  onChange={(e) => setAppForm({ ...appForm, feeCleared: e.target.checked })}
                  className="accent-indigo-600 w-4 h-4 rounded"
                />
                Institutional & tuition fees are cleared
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appForm.isAccessibleRequired}
                  onChange={(e) => setAppForm({ ...appForm, isAccessibleRequired: e.target.checked })}
                  className="accent-indigo-600 w-4 h-4 rounded"
                />
                Require accessible / ground-floor accommodation
              </label>
            </div>

            <button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={!selectedCycleId || applyMutation.isPending}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition"
            >
              {applyMutation.isPending ? 'Submitting...' : 'Submit Application & Continue'}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Rank Hostel & Room Preferences</h2>
              <p className="text-xs text-slate-500 mt-1">
                Order your preferred hostels from 1st choice to 3rd choice.
              </p>
            </div>

            <div className="space-y-2">
              {rankedHostelIds.map((hId, idx) => {
                const h = hostels?.find((x) => x._id === hId);
                return (
                  <div
                    key={hId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{h?.name || hId}</p>
                        <p className="text-[11px] text-slate-500">
                          {h?.code} · {h?.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveHostel(idx, -1)}
                        className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
                      >
                        <ArrowUp className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHostel(idx, 1)}
                        className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
                      >
                        <ArrowDown className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Preferred Room Types
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
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {rt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Optional Roommate Registration Number
              </label>
              <input
                type="text"
                value={requestedRoommateRegNumber}
                onChange={(e) => setRequestedRoommateRegNumber(e.target.value)}
                placeholder="e.g. 2026CSE002"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => prefMutation.mutate()}
              disabled={rankedHostelIds.length === 0 || prefMutation.isPending}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition"
            >
              {prefMutation.isPending ? 'Saving...' : 'Save Preferences & Continue'}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Lifestyle Compatibility Survey</h2>
              <p className="text-xs text-slate-500 mt-1">
                Encrypted with AES-256-GCM at rest. Only aggregate compatibility scores are used.
              </p>
            </div>

            {[
              {
                key: 'sleepSchedule' as const,
                label: 'Sleep Schedule',
                icon: Moon,
                left: 'Night Owl',
                right: 'Early Bird',
              },
              {
                key: 'studyHabit' as const,
                label: 'Study Environment',
                icon: BookOpen,
                left: 'In Room',
                right: 'Library',
              },
              {
                key: 'cleanliness' as const,
                label: 'Room Cleanliness',
                icon: Sparkles,
                left: 'Relaxed',
                right: 'Very Tidy',
              },
              {
                key: 'noiseTolerance' as const,
                label: 'Noise Tolerance',
                icon: Volume2,
                left: 'Pin-Drop Silence',
                right: 'Social / Music',
              },
              {
                key: 'smokingTolerance' as const,
                label: 'Smoking Preference',
                icon: Cigarette,
                left: 'Strictly Non-Smoking',
                right: 'Flexible',
              },
            ].map((trait) => {
              const Icon = trait.icon;
              const val = survey[trait.key];
              return (
                <div key={trait.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-indigo-600" /> {trait.label}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {val < 0.4 ? trait.left : val > 0.6 ? trait.right : 'Balanced'} ({val})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={val}
                    onChange={(e) => setSurvey({ ...survey, [trait.key]: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              );
            })}

            <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={survey.consentGiven}
                onChange={(e) => setSurvey({ ...survey, consentGiven: e.target.checked })}
                className="mt-0.5 accent-indigo-600 w-4 h-4 rounded"
              />
              <span>
                <strong>DPDP Consent:</strong> I consent to processing my lifestyle habits strictly for
                compatibility scoring. Raw responses are encrypted and never shown to other students.
              </span>
            </label>

            <button
              type="button"
              onClick={() => surveyMutation.mutate()}
              disabled={!survey.consentGiven || surveyMutation.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition"
            >
              {surveyMutation.isPending ? 'Encrypting & Saving...' : 'Submit & Encrypt Survey'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
