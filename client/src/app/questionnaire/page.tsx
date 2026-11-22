'use client';

import React, { useState } from 'react';
import { Sparkles, HeartHandshake, CheckCircle2, ShieldCheck, Moon, Sun, BookOpen, Volume2, Cigarette } from 'lucide-react';

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
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
          Module M5 · Roommate Matching
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Lifestyle Compatibility Survey</h1>
        <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
          Help our matching engine find you the most compatible roommates. Your raw answers are 
          <strong> encrypted at rest (AES-256)</strong> and never shared directly with other students.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 bg-white border border-emerald-200 rounded-2xl shadow-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Survey Submitted Successfully!</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your encrypted lifestyle vector has been registered for the upcoming deterministic allocation run.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Sleep Schedule */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" /> Sleep Routine
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {sleep < 0.4 ? 'Night Owl (Late Sleeper)' : sleep > 0.6 ? 'Early Riser' : 'Flexible / Moderate'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Study Habit */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Study Location
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {study < 0.4 ? 'In the Room' : study > 0.6 ? 'In the Library / Reading Hall' : 'Mixed'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={study}
              onChange={(e) => setStudy(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Cleanliness */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Tidiness & Cleanliness
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {cleanliness < 0.4 ? 'Relaxed' : cleanliness > 0.6 ? 'Very Tidy / Organized' : 'Moderate'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={cleanliness}
              onChange={(e) => setCleanliness(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Noise Tolerance */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-600" /> Noise Tolerance in Room
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {noise < 0.4 ? 'Pin-drop Silence Required' : noise > 0.6 ? 'Music & Social Welcomed' : 'Moderate'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={noise}
              onChange={(e) => setNoise(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Smoking / Habits */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Cigarette className="w-4 h-4 text-indigo-600" /> Smoking Environment
              </label>
              <span className="text-xs text-slate-500 font-medium">
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
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Privacy & Consent Notice */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 accent-indigo-600 w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-slate-600 cursor-pointer">
              <strong>Consent to Process:</strong> I hereby consent to the processing of my lifestyle preferences 
              strictly for calculating pairwise roommate compatibility. I understand these answers will be encrypted 
              and will never be publicly displayed.
            </label>
          </div>

          <button
            type="submit"
            disabled={!consent}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow-sm"
          >
            Submit & Encrypt Lifestyle Profile
          </button>
        </form>
      )}
    </div>
  );
}
