'use client';

import React, { useState } from 'react';
import { Bed, User, ShieldAlert, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

interface BedSlot {
  bedId: string;
  bedLabel: string;
  studentName?: string;
  regNumber?: string;
  matchScore?: number;
  isOverridden?: boolean;
  overrideReason?: string;
}

interface RoomNode {
  roomNumber: string;
  roomType: string;
  isAccessible: boolean;
  beds: BedSlot[];
}

export default function WardenFloorMapPage() {
  const [selectedBed, setSelectedBed] = useState<BedSlot | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Mock Floor Rooms for Floor 1
  const [rooms, setRooms] = useState<RoomNode[]>([
    {
      roomNumber: '101',
      roomType: 'DOUBLE',
      isAccessible: true,
      beds: [
        { bedId: 'b1', bedLabel: 'A', studentName: 'Aarav Sharma', regNumber: '2026BCSE01', matchScore: 92 },
        { bedId: 'b2', bedLabel: 'B', studentName: 'Rohan Gupta', regNumber: '2026BCSE45', matchScore: 88 },
      ],
    },
    {
      roomNumber: '102',
      roomType: 'DOUBLE',
      isAccessible: true,
      beds: [
        { bedId: 'b3', bedLabel: 'A', studentName: 'Vikram Mehta', regNumber: '2026BCSE12', matchScore: 85 },
        { bedId: 'b4', bedLabel: 'B' }, // Vacant in draft
      ],
    },
    {
      roomNumber: '103',
      roomType: 'SINGLE',
      isAccessible: false,
      beds: [
        { bedId: 'b5', bedLabel: 'A', studentName: 'Devansh Verma', regNumber: '2026BME09', matchScore: 95 },
      ],
    },
    {
      roomNumber: '104',
      roomType: 'TRIPLE',
      isAccessible: false,
      beds: [
        { bedId: 'b6', bedLabel: 'A', studentName: 'Aditya Singh', regNumber: '2026BCE11', matchScore: 78 },
        { bedId: 'b7', bedLabel: 'B', studentName: 'Kunal Patel', regNumber: '2026BCE19', matchScore: 80 },
        { bedId: 'b8', bedLabel: 'C', studentName: 'Sahil Jain', regNumber: '2026BCSE88', matchScore: 82 },
      ],
    },
  ]);

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !overrideReason) return;

    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        beds: r.beds.map((b) =>
          b.bedId === selectedBed.bedId
            ? { ...b, isOverridden: true, overrideReason }
            : b
        ),
      }))
    );

    setShowOverrideModal(false);
    setSuccessNotice(`Bed ${selectedBed.bedLabel} reassignment overridden and logged.`);
    setOverrideReason('');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Module M7 · Warden Review
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Interactive Floor Bed Map</h1>
          <p className="text-slate-600 text-sm mt-1">Hostel BH-1 · Floor 1 · Draft #1 Review</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
            Export Draft Summary
          </button>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition">
            Approve Draft →
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successNotice}
        </div>
      )}

      {/* Floor Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div
            key={room.roomNumber}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-extrabold text-slate-900">Room {room.roomNumber}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {room.roomType}
              </span>
            </div>

            {room.isAccessible && (
              <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-3">
                ♿ Accessible / Ground Floor
              </span>
            )}

            <div className="space-y-2 mt-2">
              {room.beds.map((bed) => (
                <div
                  key={bed.bedId}
                  onClick={() => {
                    setSelectedBed(bed);
                    if (bed.studentName) setShowOverrideModal(true);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    bed.studentName
                      ? bed.isOverridden
                        ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                        : 'border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200'
                      : 'border-dashed border-slate-300 bg-white text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bed className={`w-4 h-4 ${bed.studentName ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold text-slate-800">Bed {bed.bedLabel}</span>
                      {bed.studentName ? (
                        <p className="text-[11px] text-slate-600 font-medium">{bed.studentName}</p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Vacant</p>
                      )}
                    </div>
                  </div>

                  {bed.studentName && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                        {bed.matchScore}%
                      </span>
                      {bed.isOverridden && (
                        <p className="text-[9px] font-bold text-amber-700 mt-0.5">OVERRIDDEN</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Override Modal */}
      {showOverrideModal && selectedBed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Manual Bed Override
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Reassigning bed for <strong>{selectedBed.studentName}</strong> ({selectedBed.regNumber}).
            </p>

            <form onSubmit={handleApplyOverride} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mandatory Written Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide explicit reason (e.g. Medical emergency on record, Warden discretionary adjustment)..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideReason.trim().length < 10}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                >
                  Save Override & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
