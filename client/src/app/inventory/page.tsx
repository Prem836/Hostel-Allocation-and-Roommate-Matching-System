'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  DoorOpen,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function InventoryAndCyclesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdminOrWarden = user && ['HOSTEL_ADMIN', 'SYSADMIN', 'CHIEF_WARDEN', 'WARDEN'].includes(user.role);

  const [activeTab, setActiveTab] = useState<'inventory' | 'cycles'>('inventory');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forms
  const [hostelForm, setHostelForm] = useState({
    name: '',
    code: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'COED',
  });
  const [blockForm, setBlockForm] = useState({ hostelId: '', name: '', code: '', floorsCount: 3 });
  const [roomForm, setRoomForm] = useState({
    hostelId: '',
    blockId: '',
    roomNumber: '',
    floor: 1,
    roomType: 'DOUBLE' as 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY',
    capacity: 2,
    isAccessible: false,
  });

  const [cycleForm, setCycleForm] = useState({
    academicYear: '2026-2027',
    semester: 1,
    title: 'Fall 2026 Hostel Allocation',
    windowStart: new Date(Date.now() - 3600_000).toISOString().slice(0, 16),
    windowEnd: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 16),
    randomSeed: 42,
  });

  // Queries
  const { data: hostels } = useQuery({
    queryKey: ['inventory-hostels'],
    queryFn: async () => (await api.get('/inventory/hostels')).data.data as any[],
  });

  const { data: blocks } = useQuery({
    queryKey: ['inventory-blocks', roomForm.hostelId],
    queryFn: async () => (await api.get(`/inventory/hostels/${roomForm.hostelId}/blocks`)).data.data as any[],
    enabled: !!roomForm.hostelId,
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => (await api.get('/inventory/stats')).data.data,
  });

  const { data: cycles } = useQuery({
    queryKey: ['cycles-all'],
    queryFn: async () => (await api.get('/cycles')).data.data as any[],
  });

  // Mutations
  const createHostel = useMutation({
    mutationFn: async () => (await api.post('/inventory/hostels', hostelForm)).data.data,
    onSuccess: (h) => {
      setBanner({ type: 'success', text: `Hostel residence '${h.name}' added to campus directory.` });
      setHostelForm({ name: '', code: '', gender: 'MALE' });
      queryClient.invalidateQueries({ queryKey: ['inventory-hostels'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const createBlock = useMutation({
    mutationFn: async () => (await api.post('/inventory/blocks', blockForm)).data.data,
    onSuccess: (b) => {
      setBanner({ type: 'success', text: `Residential wing '${b.name}' added successfully.` });
      setBlockForm({ ...blockForm, name: '', code: '' });
      queryClient.invalidateQueries({ queryKey: ['inventory-blocks'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const createRoom = useMutation({
    mutationFn: async () => (await api.post('/inventory/rooms', roomForm)).data.data,
    onSuccess: (res) => {
      setBanner({
        type: 'success',
        text: `Room ${res.room.roomNumber} configured with ${res.beds.length} beds.`,
      });
      setRoomForm({ ...roomForm, roomNumber: '' });
      queryClient.invalidateQueries({ queryKey: ['inventory-hostels'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const createCycle = useMutation({
    mutationFn: async () =>
      (
        await api.post('/cycles', {
          ...cycleForm,
          windowStart: new Date(cycleForm.windowStart).toISOString(),
          windowEnd: new Date(cycleForm.windowEnd).toISOString(),
        })
      ).data.data,
    onSuccess: (c) => {
      setBanner({ type: 'success', text: `New allotment window '${c.title}' scheduled.` });
      queryClient.invalidateQueries({ queryKey: ['cycles-all'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const updateCycleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/cycles/${id}/status`, { status })).data.data,
    onSuccess: (c) => {
      setBanner({ type: 'success', text: `Allotment round '${c.title}' is now ${c.status}.` });
      queryClient.invalidateQueries({ queryKey: ['cycles-all'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#B1D3B9]/60">
        <div>
          <span className="px-3 py-1 bg-[#E6F2DD] text-[#1e3831] text-xs font-bold rounded-full border border-[#B1D3B9] uppercase">
            {isAdminOrWarden ? 'Housing Administration' : 'Campus Living Directory'}
          </span>
          <h1 className="text-3xl font-extrabold text-[#1e3831] mt-2">Hostel Directory & Allotment Windows</h1>
        </div>

        <div className="flex gap-1 bg-[#E6F2DD] p-1 rounded-xl border border-[#B1D3B9]/60">
          {(['inventory', 'cycles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 text-xs font-bold uppercase rounded-lg transition ${
                activeTab === tab ? 'text-[#1e3831]' : 'text-[#659287]'
              }`}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="inv-tab"
                  className="absolute inset-0 bg-white rounded-lg shadow-xs border border-[#88BDA4]/40"
                />
              )}
              <span className="relative z-10">{tab === 'inventory' ? 'Hostels & Rooms' : 'Allotment Windows'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Campus Hostels', val: stats?.totalHostels ?? 0 },
          { label: 'Residential Rooms', val: stats?.totalRooms ?? 0 },
          { label: 'Bed Capacity', val: stats?.totalBeds ?? 0 },
          { label: 'Vacant Spaces', val: stats?.vacantBeds ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-[#B1D3B9] shadow-xs">
            <p className="text-[11px] font-bold uppercase text-[#659287]">{s.label}</p>
            <p className="text-2xl font-extrabold text-[#1e3831] mt-1">{s.val}</p>
          </div>
        ))}
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

      {activeTab === 'inventory' ? (
        <div className={`grid grid-cols-1 ${isAdminOrWarden ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
          {/* Forms Column (Admins & Wardens Only) */}
          {isAdminOrWarden && (
            <div className="space-y-6">
              {/* Add Hostel */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createHostel.mutate();
                }}
                className="bg-white p-5 rounded-2xl border border-[#B1D3B9] shadow-xs space-y-3"
              >
                <h2 className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#659287]" /> 1. Register Hostel Residence
                </h2>
                <input
                  type="text"
                  required
                  placeholder="Hostel Name (e.g. Tagore Hall)"
                  value={hostelForm.name}
                  onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Code (e.g. TH-1)"
                    value={hostelForm.code}
                    onChange={(e) => setHostelForm({ ...hostelForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                  <select
                    value={hostelForm.gender}
                    onChange={(e) => setHostelForm({ ...hostelForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white text-[#1e3831]"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="COED">Co-Ed</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={createHostel.isPending}
                  className="w-full py-2.5 bg-[#659287] hover:bg-[#527a70] text-white text-xs font-bold rounded-xl transition"
                >
                  Add Hostel
                </button>
              </form>

              {/* Add Block */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createBlock.mutate();
                }}
                className="bg-white p-5 rounded-2xl border border-[#B1D3B9] shadow-xs space-y-3"
              >
                <h2 className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#659287]" /> 2. Add Building Wing / Block
                </h2>
                <select
                  required
                  value={blockForm.hostelId}
                  onChange={(e) => setBlockForm({ ...blockForm, hostelId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white text-[#1e3831]"
                >
                  <option value="">Select Hostel Residence...</option>
                  {hostels?.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.code})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Wing Name (e.g. North Wing)"
                    value={blockForm.name}
                    onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Code (BLK-A)"
                    value={blockForm.code}
                    onChange={(e) => setBlockForm({ ...blockForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createBlock.isPending}
                  className="w-full py-2.5 bg-[#88BDA4] hover:bg-[#73a990] text-[#1e3831] text-xs font-bold rounded-xl transition"
                >
                  Add Wing
                </button>
              </form>

              {/* Add Room */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createRoom.mutate();
                }}
                className="bg-white p-5 rounded-2xl border border-[#B1D3B9] shadow-xs space-y-3"
              >
                <h2 className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-[#659287]" /> 3. Add Room & Beds
                </h2>
                <select
                  required
                  value={roomForm.hostelId}
                  onChange={(e) => setRoomForm({ ...roomForm, hostelId: e.target.value, blockId: '' })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white text-[#1e3831]"
                >
                  <option value="">Select Hostel Residence...</option>
                  {hostels?.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.code})
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={roomForm.blockId}
                  onChange={(e) => setRoomForm({ ...roomForm, blockId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white text-[#1e3831]"
                >
                  <option value="">Select Wing / Block...</option>
                  {blocks?.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Room # (101)"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Floor"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 0 })}
                    className="px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Beds"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value as any })}
                    className="px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm bg-white flex-1 text-[#1e3831]"
                  >
                    <option value="SINGLE">SINGLE</option>
                    <option value="DOUBLE">DOUBLE</option>
                    <option value="TRIPLE">TRIPLE</option>
                    <option value="DORMITORY">DORMITORY</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-[#1e3831] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomForm.isAccessible}
                      onChange={(e) => setRoomForm({ ...roomForm, isAccessible: e.target.checked })}
                      className="accent-[#659287]"
                    />
                    Accessible
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={createRoom.isPending}
                  className="w-full py-2.5 bg-[#659287] hover:bg-[#527a70] text-white text-xs font-bold rounded-xl transition"
                >
                  Save Room & Beds
                </button>
              </form>
            </div>
          )}

          {/* Hostels Grid */}
          <div className={`${isAdminOrWarden ? 'lg:col-span-2' : 'w-full'} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1e3831] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#659287]" />
                Campus Residences ({hostels?.length ?? 0})
              </h2>
              {!isAdminOrWarden && (
                <span className="text-xs text-[#3f5c53]">Browse available campus hostels</span>
              )}
            </div>
            <div className={`grid grid-cols-1 ${isAdminOrWarden ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {hostels?.map((h) => (
                <motion.div
                  key={h._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-5 rounded-2xl border border-[#B1D3B9] shadow-xs hover:border-[#88BDA4] transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-[#1e3831] bg-[#E6F2DD] px-2.5 py-0.5 rounded-full border border-[#B1D3B9]">
                        {h.code}
                      </span>
                      <h3 className="font-bold text-[#1e3831] text-base mt-2">{h.name}</h3>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#E6F2DD] text-[#3f5c53]">
                      {h.gender}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#B1D3B9]/50 flex items-center justify-between text-xs text-[#3f5c53]">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-[#659287]" />
                      Capacity: <strong>{h.totalCapacity} beds</strong>
                    </span>
                    <span className="text-[11px] text-[#659287] font-mono">{h._id.slice(-6)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${isAdminOrWarden ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
          {/* Create Cycle (Admins & Wardens Only) */}
          {isAdminOrWarden && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCycle.mutate();
              }}
              className="bg-white p-6 rounded-2xl border border-[#B1D3B9] shadow-xs space-y-3.5"
            >
              <h2 className="text-base font-bold text-[#1e3831] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#659287]" /> Schedule Application Window
              </h2>
              <input
                type="text"
                required
                placeholder="Round Title (e.g. Fall 2026 Room Allotment)"
                value={cycleForm.title}
                onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm focus:border-[#659287] focus:ring-1 focus:ring-[#659287] focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="2026-2027"
                  value={cycleForm.academicYear}
                  onChange={(e) => setCycleForm({ ...cycleForm, academicYear: e.target.value })}
                  className="px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={cycleForm.semester}
                  onChange={(e) => setCycleForm({ ...cycleForm, semester: parseInt(e.target.value, 10) || 1 })}
                  className="px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Applications Open</label>
                <input
                  type="datetime-local"
                  value={cycleForm.windowStart}
                  onChange={(e) => setCycleForm({ ...cycleForm, windowStart: e.target.value })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Applications Close</label>
                <input
                  type="datetime-local"
                  value={cycleForm.windowEnd}
                  onChange={(e) => setCycleForm({ ...cycleForm, windowEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#659287] mb-1">Auditing Reference Seed</label>
                <input
                  type="number"
                  value={cycleForm.randomSeed}
                  onChange={(e) => setCycleForm({ ...cycleForm, randomSeed: parseInt(e.target.value, 10) || 42 })}
                  className="w-full px-3 py-2 border border-[#B1D3B9] rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={createCycle.isPending}
                className="w-full py-2.5 bg-[#659287] hover:bg-[#527a70] text-white text-xs font-bold rounded-xl transition"
              >
                Open Application Window
              </button>
            </form>
          )}

          {/* Cycles List */}
          <div className={`${isAdminOrWarden ? 'lg:col-span-2' : 'w-full max-w-4xl mx-auto'} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1e3831]">Scheduled Allotment Rounds ({cycles?.length ?? 0})</h2>
              {!isAdminOrWarden && (
                <span className="text-xs text-[#3f5c53]">Current and upcoming room application windows</span>
              )}
            </div>

            {cycles?.map((c) => (
              <div
                key={c._id}
                className="bg-white p-5 rounded-2xl border border-[#B1D3B9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : c.status === 'CLOSED'
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-[#E6F2DD] text-[#1e3831] border border-[#B1D3B9]'
                    }`}>
                      {c.status === 'OPEN' ? 'ACCEPTING APPLICATIONS' : c.status}
                    </span>
                    <span className="text-xs text-[#3f5c53]">
                      Academic Year {c.academicYear} · Semester {c.semester}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1e3831] mt-1.5">{c.title}</h3>
                  <div className="text-xs text-[#3f5c53] mt-1 space-y-0.5">
                    <p>
                      <strong>Application Window:</strong> {new Date(c.windowStart).toLocaleDateString()} — {new Date(c.windowEnd).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-[#659287]">
                      Applicants: {c.totalApplicantsCount} · Allotted: {c.allocatedCount} · Waiting List: {c.waitlistedCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdminOrWarden ? (
                    ['OPEN', 'CLOSED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => updateCycleStatus.mutate({ id: c._id, status: st })}
                        disabled={c.status === st}
                        className="px-3 py-1.5 rounded-lg border border-[#B1D3B9] text-xs font-bold text-[#1e3831] hover:bg-[#E6F2DD] disabled:opacity-40 transition"
                      >
                        Set {st}
                      </button>
                    ))
                  ) : (
                    c.status === 'OPEN' ? (
                      <Link
                        href="/student/apply"
                        className="px-4 py-2 bg-[#659287] hover:bg-[#527a70] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        Apply for Room
                      </Link>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg">
                        Round {c.status.toLowerCase()}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
