'use client';

import React, { useState } from 'react';
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

export default function InventoryAndCyclesPage() {
  const queryClient = useQueryClient();
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
      setBanner({ type: 'success', text: `Hostel '${h.name}' created.` });
      setHostelForm({ name: '', code: '', gender: 'MALE' });
      queryClient.invalidateQueries({ queryKey: ['inventory-hostels'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const createBlock = useMutation({
    mutationFn: async () => (await api.post('/inventory/blocks', blockForm)).data.data,
    onSuccess: (b) => {
      setBanner({ type: 'success', text: `Block '${b.name}' added.` });
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
        text: `Room ${res.room.roomNumber} created with ${res.beds.length} vacant beds.`,
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
      setBanner({ type: 'success', text: `Allocation cycle '${c.title}' created in DRAFT state.` });
      queryClient.invalidateQueries({ queryKey: ['cycles-all'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  const updateCycleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/cycles/${id}/status`, { status })).data.data,
    onSuccess: (c) => {
      setBanner({ type: 'success', text: `Cycle '${c.title}' status updated to ${c.status}.` });
      queryClient.invalidateQueries({ queryKey: ['cycles-all'] });
    },
    onError: (err) => setBanner({ type: 'error', text: getErrorMessage(err) }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200 uppercase">
            Modules M1 & M2 · Admin Console
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Inventory & Cycle Manager</h1>
        </div>

        <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl">
          {(['inventory', 'cycles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 text-xs font-bold uppercase rounded-lg transition ${
                activeTab === tab ? 'text-indigo-700' : 'text-slate-600'
              }`}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="inv-tab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                />
              )}
              <span className="relative z-10">{tab === 'inventory' ? 'Hostels & Beds' : 'Allocation Cycles'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Hostels', val: stats?.totalHostels ?? 0 },
          { label: 'Rooms', val: stats?.totalRooms ?? 0 },
          { label: 'Total Beds', val: stats?.totalBeds ?? 0 },
          { label: 'Vacant Beds', val: stats?.vacantBeds ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold uppercase text-slate-500">{s.label}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{s.val}</p>
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forms Column */}
          <div className="space-y-6">
            {/* Add Hostel */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createHostel.mutate();
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> 1. Register Hostel
              </h2>
              <input
                type="text"
                required
                placeholder="Hostel Name (e.g. APJ Kalam Hall)"
                value={hostelForm.name}
                onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Code (BH-1)"
                  value={hostelForm.code}
                  onChange={(e) => setHostelForm({ ...hostelForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
                <select
                  value={hostelForm.gender}
                  onChange={(e) => setHostelForm({ ...hostelForm, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="COED">Co-Ed</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createHostel.isPending}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
              >
                Create Hostel
              </button>
            </form>

            {/* Add Block */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createBlock.mutate();
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> 2. Add Block
              </h2>
              <select
                required
                value={blockForm.hostelId}
                onChange={(e) => setBlockForm({ ...blockForm, hostelId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="">Select Hostel...</option>
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
                  placeholder="Block Name (East)"
                  value={blockForm.name}
                  onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (BLK-A)"
                  value={blockForm.code}
                  onChange={(e) => setBlockForm({ ...blockForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={createBlock.isPending}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
              >
                Create Block
              </button>
            </form>

            {/* Add Room */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoom.mutate();
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-indigo-600" /> 3. Add Room & Auto-Beds
              </h2>
              <select
                required
                value={roomForm.hostelId}
                onChange={(e) => setRoomForm({ ...roomForm, hostelId: e.target.value, blockId: '' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="">Select Hostel...</option>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="">Select Block...</option>
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
                  className="px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Floor"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 0 })}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Beds"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) || 1 })}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value as any })}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white flex-1"
                >
                  <option value="SINGLE">SINGLE</option>
                  <option value="DOUBLE">DOUBLE</option>
                  <option value="TRIPLE">TRIPLE</option>
                  <option value="DORMITORY">DORMITORY</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomForm.isAccessible}
                    onChange={(e) => setRoomForm({ ...roomForm, isAccessible: e.target.checked })}
                    className="accent-indigo-600"
                  />
                  Accessible
                </label>
              </div>
              <button
                type="submit"
                disabled={createRoom.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Create Room + Beds
              </button>
            </form>
          </div>

          {/* Hostels Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Registered Hostels ({hostels?.length ?? 0})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hostels?.map((h) => (
                <motion.div
                  key={h._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {h.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-2">{h.name}</h3>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
                      {h.gender}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-indigo-500" />
                      Capacity: <strong>{h.totalCapacity} beds</strong>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{h._id.slice(-6)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Cycle */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCycle.mutate();
            }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5"
          >
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Create Allocation Cycle
            </h2>
            <input
              type="text"
              required
              placeholder="Cycle Title"
              value={cycleForm.title}
              onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="2026-2027"
                value={cycleForm.academicYear}
                onChange={(e) => setCycleForm({ ...cycleForm, academicYear: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
              <input
                type="number"
                min={1}
                max={8}
                value={cycleForm.semester}
                onChange={(e) => setCycleForm({ ...cycleForm, semester: parseInt(e.target.value, 10) || 1 })}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Window Start</label>
              <input
                type="datetime-local"
                value={cycleForm.windowStart}
                onChange={(e) => setCycleForm({ ...cycleForm, windowStart: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Window End</label>
              <input
                type="datetime-local"
                value={cycleForm.windowEnd}
                onChange={(e) => setCycleForm({ ...cycleForm, windowEnd: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Deterministic Seed</label>
              <input
                type="number"
                value={cycleForm.randomSeed}
                onChange={(e) => setCycleForm({ ...cycleForm, randomSeed: parseInt(e.target.value, 10) || 42 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={createCycle.isPending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
            >
              Create Cycle
            </button>
          </form>

          {/* Cycles List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-lg font-extrabold text-slate-900">Allocation Cycles ({cycles?.length ?? 0})</h2>
            {cycles?.map((c) => (
              <div
                key={c._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700">
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {c.academicYear} · Sem {c.semester} · Seed {c.randomSeed}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Applicants: {c.totalApplicantsCount} · Allocated: {c.allocatedCount} · Waitlisted:{' '}
                    {c.waitlistedCount}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['OPEN', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateCycleStatus.mutate({ id: c._id, status: st })}
                      disabled={c.status === st}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                      Set {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
