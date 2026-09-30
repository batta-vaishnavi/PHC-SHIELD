import React from 'react';
import { AlertTriangle, Trash2, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DemoBanner = () => {
  const { isDemoActive, setShowClearDemoModal } = useApp();

  if (!isDemoActive) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-2 text-xs md:text-sm font-semibold shadow-md flex items-center justify-between border-b border-amber-400">
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
        </span>
        <span className="uppercase tracking-wider font-extrabold flex items-center gap-1.5">
          <Database className="w-4 h-4" />
          DEMO MODE — SYNTHETIC DATA
        </span>
        <span className="hidden md:inline font-normal text-slate-900 ml-2">
          (Data generated with deterministic random seed. All calculations and simulations use tagged demo rows.)
        </span>
      </div>
      <button
        onClick={() => setShowClearDemoModal(true)}
        className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-medium transition shadow-sm"
      >
        <Trash2 className="w-3.5 h-3.5 text-amber-400" />
        Clear Demo Data
      </button>
    </div>
  );
};
