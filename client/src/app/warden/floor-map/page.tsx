'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bed,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Play,
  Send,
  UserPlus,
  Check,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';

export default function WardenFloorMapPage() {
  const queryClient = useQueryClient();

  const [cycleId, setCycleId] = useState('');
  const [draftId, setDraftId] = useState('');
  const [hostelId, setHostelId] = useState('');
  const [floor, setFloor] = useState(1);

  const [selectedBed, setSelectedBed] = useState<any | null>(null);
  const [targetBedId, setTargetBedId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: cycles } = useQuery({
    queryKey: ['cycles-all'],
    queryFn: async () => {
      const list = (await api.get('/cycles')).data.data as any[];
      if (list.length > 0 && !cycleId) setCycleId(list[0]._id);
      return list;
    },
  });

  const { data: hostels } = useQuery({
    queryKey: ['inventory-hostels'],
    queryFn: async () => {
      const list = (await api.get('/inventory/hostels')).data.data as any[];
      if (list.length > 0 && !hostelId) setHostelId(list[0]._id);
      return list;
    },
  });

  const { data: floorMap, isFetching } = useQuery({
    queryKey: ['warden-floor-map', draftId, hostelId, floor],
    queryFn: async () => {
      const res = await api.get(`/warden/drafts/${draftId}/floor-map`, {
        params: { hostelId, floor },
      });
      return res.data.data;
    },
    enabled: !!draftId && !!hostelId,
  });

  const evaluateEligibility = useMutation({
    mutationFn: async () => (await api.post(`/cycles/${cycleId}/evaluate-eligibility`, {})).data.data,
    onSuccess: (d) =>
      setBanner({
        type: 'success',
        text: `Evaluated ${d.evaluated} applications: ${d.eligible} eligible, ${d.ineligible} ineligible.`,
      }),
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const runAllocation = useMutation({
    mutationFn: async () => (await api.post(`/cycles/${cycleId}/allocate`, { runAsync: false })).data.data,
    onSuccess: (res) => {
      setDraftId(res.draft._id);
      setBanner({
        type: 'success',
        text: `Draft #${res.draft.draftNumber} generated (Seed ${res.draft.seed}): ${res.assignedCount} assigned, ${res.waitlistedCount} waitlisted.`,
      });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const overrideMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/warden/overrides', {
          assignmentId: selectedBed.draftAssignment.assignmentId,
          targetBedId,
          reason: overrideReason,
        })
      ).data.data,
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Manual override saved and logged to immutable AuditEntry.' });
      setSelectedBed(null);
      setOverrideReason('');
      setTargetBedId('');
      queryClient.invalidateQueries({ queryKey: ['warden-floor-map'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const promoteWaitlist = useMutation({
    mutationFn: async (vacantBedId: string) =>
      (
        await api.post(`/warden/drafts/${draftId}/promote-waitlist`, {
          cycleId,
          targetBedId: vacantBedId,
        })
      ).data.data,
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Top waitlisted student promoted into vacant bed.' });
      queryClient.invalidateQueries({ queryKey: ['warden-floor-map'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const approveDraft = useMutation({
    mutationFn: async () =>
      (await api.patch(`/warden/drafts/${draftId}/review`, { status: 'APPROVED' })).data.data,
    onSuccess: () => setBanner({ type: 'success', text: 'Draft APPROVED! Ready for atomic publication.' }),
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const publishDraft = useMutation({
    mutationFn: async () => (await api.post(`/publication/drafts/${draftId}/publish`, {})).data.data,
    onSuccess: (res) => {
      setBanner({
        type: 'success',
        text: `Published atomically! ${res.bedsUpdated} live beds updated & ${res.notificationsDispatched} notifications sent.`,
      });
      queryClient.invalidateQueries({ queryKey: ['warden-floor-map'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  // Collect all vacant beds in current floor view for easy override targeting
  const vacantBedsOnFloor: { id: string; label: string }[] = [];
  floorMap?.rooms?.forEach((r: any) => {
    r.beds.forEach((b: any) => {
      if (!b.draftAssignment) {
        vacantBedsOnFloor.push({ id: b.bedId, label: `Room ${r.roomNumber} · Bed ${b.bedLabel}` });
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 mb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Modules M6 · M7 · M8 · M9
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Warden Allocation & Floor Map</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => evaluateEligibility.mutate()}
            disabled={!cycleId || evaluateEligibility.isPending}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
          >
            1. Evaluate Eligibility
          </button>
          <button
            onClick={() => runAllocation.mutate()}
            disabled={!cycleId || runAllocation.isPending}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5" /> 2. Run Seeded Engine
          </button>
          <button
            onClick={() => approveDraft.mutate()}
            disabled={!draftId || approveDraft.isPending}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Check className="w-3.5 h-3.5" /> 3. Approve Draft
          </button>
          <button
            onClick={() => publishDraft.mutate()}
            disabled={!draftId || publishDraft.isPending}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" /> 4. Publish Live
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cycle</label>
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            {cycles?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Draft ID</label>
          <input
            type="text"
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            placeholder="Auto-filled on Run Engine"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hostel</label>
          <select
            value={hostelId}
            onChange={(e) => setHostelId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            {hostels?.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} ({h.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Floor</label>
          <input
            type="number"
            min={0}
            value={floor}
            onChange={(e) => setFloor(parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
          />
        </div>
      </div>

      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              banner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor Map Grid */}
      {!draftId ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
          <p className="text-sm font-bold text-slate-700">No Draft Selected</p>
          <p className="text-xs text-slate-500 mt-1">
            Click <strong>2. Run Seeded Engine</strong> above (or paste a Draft ID) to inspect the floor bed map.
          </p>
        </div>
      ) : isFetching ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading floor bed map...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {floorMap?.rooms?.map((room: any) => (
            <motion.div
              key={room.roomId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-extrabold text-slate-900">Room {room.roomNumber}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {room.roomType}
                </span>
              </div>
              {room.isAccessible && (
                <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-2">
                  Accessible Room
                </span>
              )}
              <div className="space-y-2 mt-2">
                {room.beds.map((bed: any) => (
                  <div
                    key={bed.bedId}
                    onClick={() => {
                      if (bed.draftAssignment) {
                        setSelectedBed(bed);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                      bed.draftAssignment
                        ? bed.draftAssignment.isOverridden
                          ? 'border-amber-300 bg-amber-50 cursor-pointer'
                          : 'border-slate-200 bg-slate-50 hover:border-indigo-300 cursor-pointer'
                        : 'border-dashed border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bed className={`w-4 h-4 ${bed.draftAssignment ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="font-bold text-slate-800">Bed {bed.bedLabel}</span>
                        {bed.draftAssignment ? (
                          <p className="text-[11px] text-slate-600 font-medium">
                            {bed.draftAssignment.studentName}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Vacant</p>
                        )}
                      </div>
                    </div>

                    {bed.draftAssignment ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        {bed.draftAssignment.matchScore}%
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          promoteWaitlist.mutate(bed.bedId);
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Promote
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Override Modal */}
      <AnimatePresence>
        {selectedBed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Manual Bed Override
              </h3>
              <p className="text-xs text-slate-600">
                Reassigning <strong>{selectedBed.draftAssignment.studentName}</strong> (
                {selectedBed.draftAssignment.registrationNumber}).
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Target Vacant Bed
                </label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="">Select vacant bed on this floor...</option>
                  {vacantBedsOnFloor.map((vb) => (
                    <option key={vb.id} value={vb.id}>
                      {vb.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mandatory Reason (min 10 chars)
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide explicit justification for audit trail..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!targetBedId || overrideReason.trim().length < 10 || overrideMutation.isPending}
                  onClick={() => overrideMutation.mutate()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                >
                  {overrideMutation.isPending ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
