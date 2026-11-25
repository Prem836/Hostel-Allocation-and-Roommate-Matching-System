'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Moon, BookOpen, Volume2, Cigarette } from 'lucide-react';

export default function QuestionnairePage() {
  const [consent, setConsent] = useState(false);
  const [sleep, setSleep] = useState(0.5);
  const [study, setStudy] = useState(0.5);
  const [cleanliness, setCleanliness] = useState(0.7);
  const [noise, setNoise] = useState(0.3);
  const [smoking, setSmoking] = useState(0.0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <span className="px-3 py-1 bg-[#E6F2DD] text-[#1e3831] text-xs font-semibold rounded-full border border-[#B1D3B9]">
          Student Living Harmony
        </span>
        <h1 className="text-3xl font-extrabold text-[#1e3831] mt-2">Roommate Compatibility Preferences</h1>
        <p className="text-[#3f5c53] text-sm mt-2 max-w-xl mx-auto">
          Help the residence office pair you with roommates who share similar living habits and study schedules.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 bg-[#E6F2DD]/60 border border-[#88BDA4] rounded-2xl text-center">
          <CheckCircle2 className="w-12 h-12 text-[#659287] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#1e3831]">Preferences Recorded Successfully</h2>
          <p className="text-sm text-[#3f5c53] mt-2">
            Your daily living routine preferences will be considered during room assignments for this semester.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-[#B1D3B9] shadow-xs space-y-6">
          {/* Sleep Schedule */}
          <div className="p-3.5 rounded-xl bg-[#f7faf5] border border-[#B1D3B9]/60">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#659287]" /> Sleep Routine
              </label>
              <span className="text-xs text-[#659287] font-semibold">
                {sleep < 0.4 ? 'Night Owl (Late Sleeper)' : sleep > 0.6 ? 'Early Riser (Morning Person)' : 'Flexible / Moderate'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full accent-[#659287] cursor-pointer"
            />
          </div>

          {/* Study Habit */}
          <div className="p-3.5 rounded-xl bg-[#f7faf5] border border-[#B1D3B9]/60">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#659287]" /> Study Location
              </label>
              <span className="text-xs text-[#659287] font-semibold">
                {study < 0.4 ? 'In the Room' : study > 0.6 ? 'Library / Reading Hall' : 'Mixed'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={study}
              onChange={(e) => setStudy(parseFloat(e.target.value))}
              className="w-full accent-[#659287] cursor-pointer"
            />
          </div>

          {/* Cleanliness */}
          <div className="p-3.5 rounded-xl bg-[#f7faf5] border border-[#B1D3B9]/60">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#659287]" /> Room Tidiness
              </label>
              <span className="text-xs text-[#659287] font-semibold">
                {cleanliness < 0.4 ? 'Casual / Relaxed' : cleanliness > 0.6 ? 'Very Tidy / Organized' : 'Moderate'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={cleanliness}
              onChange={(e) => setCleanliness(parseFloat(e.target.value))}
              className="w-full accent-[#659287] cursor-pointer"
            />
          </div>

          {/* Noise Tolerance */}
          <div className="p-3.5 rounded-xl bg-[#f7faf5] border border-[#B1D3B9]/60">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#659287]" /> Noise Tolerance
              </label>
              <span className="text-xs text-[#659287] font-semibold">
                {noise < 0.4 ? 'Quiet Silence Preferred' : noise > 0.6 ? 'Music & Chatting Welcomed' : 'Moderate'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={noise}
              onChange={(e) => setNoise(parseFloat(e.target.value))}
              className="w-full accent-[#659287] cursor-pointer"
            />
          </div>

          {/* Smoking / Habits */}
          <div className="p-3.5 rounded-xl bg-[#f7faf5] border border-[#B1D3B9]/60">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#1e3831] flex items-center gap-2">
                <Cigarette className="w-4 h-4 text-[#659287]" /> Smoking & Environment
              </label>
              <span className="text-xs text-[#659287] font-semibold">
                {smoking === 0 ? 'Strictly Non-Smoking Roommate Only' : 'Flexible'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.5"
              value={smoking}
              onChange={(e) => setSmoking(parseFloat(e.target.value))}
              className="w-full accent-[#659287] cursor-pointer"
            />
          </div>

          {/* Privacy & Consent Notice */}
          <div className="p-4 bg-[#E6F2DD]/60 border border-[#B1D3B9] rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 accent-[#659287] w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-[#1e3831] cursor-pointer">
              <strong>Confidentiality Declaration:</strong> I authorize the campus residence committee to use these lifestyle responses strictly for roommate pairing. Individual responses remain confidential.
            </label>
          </div>

          <button
            type="submit"
            disabled={!consent}
            className="w-full py-3 px-4 bg-[#659287] hover:bg-[#527a70] disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow-xs"
          >
            Save Living Habits
          </button>
        </form>
      )}
    </div>
  );
}
