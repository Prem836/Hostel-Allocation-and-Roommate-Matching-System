export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <div className="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-100 rounded-full">
          Project P03 · Track J Monolith
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Hostel Allocation & Roommate Matching
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Policy-driven deterministic allocation engine with lifestyle compatibility matching, 
          warden floor-map review, and auditable publication.
        </p>
      </header>

      {/* Role Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
            S
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Portal</h2>
          <p className="text-sm text-slate-600 mt-2 mb-4">
            Submit applications, rank hostel & room preferences, and complete the consent-based lifestyle questionnaire.
          </p>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
            Modules: M2, M4, M5, M9
          </span>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
            W
          </div>
          <h2 className="text-xl font-bold text-slate-900">Warden Review Board</h2>
          <p className="text-sm text-slate-600 mt-2 mb-4">
            Inspect the generated draft on an interactive visual floor bed map. Perform manual reassignments with mandatory written reason logging.
          </p>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
            Modules: M6, M7, M8
          </span>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
            A
          </div>
          <h2 className="text-xl font-bold text-slate-900">Hostel Administration</h2>
          <p className="text-sm text-slate-600 mt-2 mb-4">
            Manage bed-level inventory, configure allocation cycles, tune eligibility rules, and finalize transactional publication.
          </p>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded">
            Modules: M1, M3, M9
          </span>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-8 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Key Architectural Invariants Built-in:</h3>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Draft vs. Live Separation:</strong> Draft allocation does not touch live bed occupancy until explicitly approved and published by the warden.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Deterministic Reproducibility:</strong> The allocation algorithm uses a stored seed so any run can be identically reproduced.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Privacy by Design:</strong> Lifestyle questionnaire data is encrypted with AES-256-GCM and never exposed to other students.</span>
          </li>
        </ul>
      </div>
    </main>
  );
}

