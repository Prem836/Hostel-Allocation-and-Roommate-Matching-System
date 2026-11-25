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
  Building,
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
        text: `Eligibility review completed for ${d.evaluated} applicants (${d.eligible} eligible, ${d.ineligible} requiring review).`,
      }),
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const runAllocation = useMutation({
    mutationFn: async () => (await api.post(`/cycles/${cycleId}/allocate`, { runAsync: false })).data.data,
    onSuccess: (res) => {
      setDraftId(res.draft._id);
      setBanner({
        type: 'success',
        text: `Allocation draft generated: ${res.assignedCount} students assigned, ${res.waitlistedCount} waitlisted.`,
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
      setBanner({ type: 'success', text: 'Room reassignment saved to official hostel audit register.' });
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
      setBanner({ type: 'success', text: 'First waitlisted applicant placed into vacant bed.' });
      queryClient.invalidateQueries({ queryKey: ['warden-floor-map'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const approveDraft = useMutation({
    mutationFn: async () =>
      (await api.patch(`/warden/drafts/${draftId}/review`, { status: 'APPROVED' })).data.data,
    onSuccess: () => setBanner({ type: 'success', text: 'Draft approved by Warden. Ready to publish to students.' }),
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const publishDraft = useMutation({
    mutationFn: async () => (await api.post(`/publication/drafts/${draftId}/publish`, {})).data.data,
    onSuccess: (res) => {
      setBanner({
        type: 'success',
        text: `Published successfully! ${res.bedsUpdated} beds confirmed and notifications sent to students.`,
      });
      queryClient.invalidateQueries({ queryKey: ['warden-floor-map'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#B1D3B9]/60 mb-6 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1e3831] bg-[#E6F2DD] px-3 py-1 rounded-full border border-[#B1D3B9]">
            Warden Desk
          </span>
          <h1 className="text-3xl font-extrabold text-[#1e3831] mt-2">Room Allocation & Floor Review</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => evaluateEligibility.mutate()}
            disabled={!cycleId || evaluateEligibility.isPending}
            className="px-3.5 py-2 bg-white border border-[#B1D3B9] hover:bg-[#E6F2DD]/50 rounded-xl text-xs font-bold text-[#1e3831] transition"
          >
            1. Check Eligibility
          </button>
          <button
            onClick={() => runAllocation.mutate()}
            disabled={!cycleId || runAllocation.isPending}
            className="px-3.5 py-2 bg-[#659287] hover:bg-[#527a70] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Play className="w-3.5 h-3.5" /> 2. Generate Draft
          </button>
          <button
            onClick={() => approveDraft.mutate()}
            disabled={!draftId || approveDraft.isPending}
            className="px-3.5 py-2 bg-[#88BDA4] hover:bg-[#73a990] disabled:opacity-40 text-[#1e3831] font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Check className="w-3.5 h-3.5" /> 3. Approve Draft
          </button>
          <button
            onClick={() => publishDraft.mutate()}
            disabled={!draftId || publishDraft.isPending}
            className="px-3.5 py-2 bg-[#1e3831] hover:bg-[#2e5248] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" /> 4. Publish to Students
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-white p-4 rounded-2xl border border-[#B1D3B9] shadow-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Semester Round</label>
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#B1D3B9] text-xs font-semibold bg-white text-[#1e3831]"
          >
            {cycles?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Active Draft Reference</label>
          <input
            type="text"
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            placeholder="Generated automatically on step 2"
            className="w-full px-3 py-2 rounded-xl border border-[#B1D3B9] text-xs font-mono text-[#1e3831]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Hostel Residence</label>
          <select
            value={hostelId}
            onChange={(e) => setHostelId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#B1D3B9] text-xs font-semibold bg-white text-[#1e3831]"
          >
            {hostels?.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} ({h.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Floor Number</label>
          <input
            type="number"
            min={0}
            value={floor}
            onChange={(e) => setFloor(parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 rounded-xl border border-[#B1D3B9] text-xs font-semibold text-[#1e3831]"
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
                ? 'bg-[#E6F2DD] border-[#88BDA4] text-[#1e3831]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#659287]" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor Map Grid */}
      {!draftId ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-[#B1D3B9] text-center">
          <p className="text-sm font-bold text-[#1e3831]">No Draft Loaded</p>
          <p className="text-xs text-[#3f5c53] mt-1">
            Click <strong>2. Generate Draft</strong> to create a proposed room allocation for this semester.
          </p>
        </div>
      ) : isFetching ? (
        <div className="text-center py-12 text-xs text-[#3f5c53]">Loading room layout for floor {floor}...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {floorMap?.rooms?.map((room: any) => (
            <motion.div
              key={room.roomId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-[#B1D3B9] p-5 shadow-xs"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-[#1e3831]">Room {room.roomNumber}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]">
                  {room.roomType}
                </span>
              </div>
              {room.isAccessible && (
                <span className="inline-block text-[10px] font-bold text-[#1e3831] bg-[#B1D3B9]/50 px-2 py-0.5 rounded mb-2">
                  Wheelchair Accessible
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
                          : 'border-[#B1D3B9] bg-[#E6F2DD]/30 hover:border-[#659287] cursor-pointer'
                        : 'border-dashed border-[#B1D3B9] bg-white text-[#659287]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bed className={`w-4 h-4 ${bed.draftAssignment ? 'text-[#659287]' : 'text-[#88BDA4]'}`} />
                      <div>
                        <span className="font-bold text-[#1e3831]">Bed {bed.bedLabel}</span>
                        {bed.draftAssignment ? (
                          <p className="text-[11px] text-[#3f5c53] font-medium">
                            {bed.draftAssignment.studentName}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#88BDA4] italic">Vacant</p>
                        )}
                      </div>
                    </div>

                    {bed.draftAssignment ? (
                      <span className="text-[10px] font-bold text-[#1e3831] bg-[#B1D3B9] px-1.5 py-0.5 rounded">
                        {bed.draftAssignment.matchScore}% match
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          promoteWaitlist.mutate(bed.bedId);
                        }}
                        className="text-[10px] font-bold text-[#659287] hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Assign Next
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
            className="fixed inset-0 bg-[#1e3831]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#B1D3B9] space-y-4"
            >
              <h3 className="text-lg font-bold text-[#1e3831] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#659287]" />
                Room Reassignment / Swap
              </h3>
              <p className="text-xs text-[#3f5c53]">
                Reassigning student <strong>{selectedBed.draftAssignment.studentName}</strong> (
                {selectedBed.draftAssignment.registrationNumber}).
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                  Target Vacant Bed
                </label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-xs bg-white text-[#1e3831]"
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
                <label className="block text-[11px] font-bold text-[#1e3831] uppercase mb-1">
                  Official Justification (min 10 characters)
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Ground floor accommodation requested for medical recovery..."
                  className="w-full text-xs p-3 border border-[#B1D3B9] rounded-xl focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="px-4 py-2 text-xs font-bold text-[#3f5c53] hover:bg-[#E6F2DD] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!targetBedId || overrideReason.trim().length < 10 || overrideMutation.isPending}
                  onClick={() => overrideMutation.mutate()}
                  className="px-4 py-2 bg-[#659287] hover:bg-[#527a70] disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                >
                  {overrideMutation.isPending ? 'Saving...' : 'Confirm Reassignment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
