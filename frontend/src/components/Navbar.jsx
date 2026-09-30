import React from 'react';
import { Shield, Upload, Play, Trash2, Bell, Sparkles, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar = () => {
  const {
    isDemoActive,
    hasData,
    stats,
    setShowCsvModal,
    setShowDemoModal,
    setShowClearDemoModal,
    setActiveTab,
  } = useApp();

  return (
    <header className="bg-navy-900 text-white border-b border-navy-750 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-glow-teal group-hover:scale-105 transition transform">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">PHC-SHIELD</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-950 text-teal-400 border border-teal-800">
                Track 3: Resilience
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-normal hidden md:block">
              Federated AI for Smart Health & Supply Chain Resilience
            </p>
          </div>
        </div>

        {/* Right: Actions & Live State */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Active Alerts Pill */}
          {hasData && stats?.active_alerts > 0 && (
            <button
              onClick={() => setActiveTab('alerts')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>{stats.active_alerts} Alerts</span>
            </button>
          )}

          {/* Upload CSV */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-600 transition"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          {/* Load / Clear Demo Mode Button */}
          {isDemoActive ? (
            <button
              onClick={() => setShowClearDemoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Demo</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDemoModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 text-teal-200" />
              <span>Load Demo Data</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
