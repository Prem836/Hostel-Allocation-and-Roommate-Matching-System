'use client';

import React, { useState } from 'react';
import { Building2, Plus, BedDouble, CheckCircle2, AlertCircle } from 'lucide-react';

interface Hostel {
  _id: string;
  name: string;
  code: string;
  gender: 'MALE' | 'FEMALE' | 'COED';
  totalCapacity: number;
}

export default function InventoryPage() {
  const [hostels, setHostels] = useState<Hostel[]>([
    { _id: '1', name: 'APJ Abdul Kalam Hostel', code: 'BH-1', gender: 'MALE', totalCapacity: 450 },
    { _id: '2', name: 'Kalpana Chawla Hostel', code: 'GH-1', gender: 'FEMALE', totalCapacity: 380 },
    { _id: '3', name: 'C.V. Raman Research Block', code: 'RH-1', gender: 'COED', totalCapacity: 120 },
  ]);

  const [form, setForm] = useState({
    name: '',
    code: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'COED',
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreateHostel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;

    const newHostel: Hostel = {
      _id: Date.now().toString(),
      name: form.name,
      code: form.code.toUpperCase(),
      gender: form.gender,
      totalCapacity: 0,
    };

    setHostels([...hostels, newHostel]);
    setForm({ name: '', code: '', gender: 'MALE' });
    setFeedback(`Hostel '${newHostel.name}' registered successfully.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hostel & Inventory Management</h1>
          <p className="text-slate-600 text-sm mt-1">Module M1 · Bed-level granularity and capacity auditing</p>
        </div>
        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
          Admin Portal
        </span>
      </div>

      {feedback && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add New Hostel
          </h2>
          <form onSubmit={handleCreateHostel} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Hostel Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Tagore Hall"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Hostel Code</label>
              <input
                type="text"
                required
                placeholder="e.g. TH-A"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="COED">Co-Ed (Separate Blocks)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md transition shadow-sm"
            >
              Register Hostel
            </button>
          </form>
        </div>

        {/* Hostel Cards Display */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Registered Hostels ({hostels.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hostels.map((hostel) => (
              <div
                key={hostel._id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {hostel.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{hostel.name}</h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      hostel.gender === 'MALE'
                        ? 'bg-blue-50 text-blue-700'
                        : hostel.gender === 'FEMALE'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {hostel.gender}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-slate-400" />
                    Capacity: <strong>{hostel.totalCapacity} beds</strong>
                  </span>
                  <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                    View Floor Map →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
