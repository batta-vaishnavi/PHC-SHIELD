import React from 'react';
import { Settings as SettingsIcon, Server, Database, Sparkles, Shield, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Settings = () => {
  const { stats, isDemoActive, hasData } = useApp();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-teal-600" />
          System Telemetry & Environment Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Backend server status, machine learning engines, Gemini AI SDK integration, and persistent database health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend & Runtime */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center gap-2.5 border-b pb-3 text-slate-900 font-bold text-sm">
            <Server className="w-4 h-4 text-teal-600" />
            <span>Backend Runtime Services</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FastAPI Server</span>
              <span className="font-mono font-bold text-emerald-700">v1.0.0 (Operational)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Database Engine</span>
              <span className="font-mono font-bold text-slate-800">SQLite (Local) / Postgres (Cloud)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Live Data State</span>
              <span className="font-bold text-slate-800">{hasData ? "Active Telemetry" : "Empty (Initial Launch)"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Demo Mode Tagging</span>
              <span className="font-bold text-slate-800">{isDemoActive ? "DEMO ACTIVE" : "CLEAN"}</span>
            </div>
          </div>
        </div>

        {/* AI & ML Engines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center gap-2.5 border-b pb-3 text-slate-900 font-bold text-sm">
            <Cpu className="w-4 h-4 text-teal-600" />
            <span>AI & Optimization Algorithms</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Demand Forecasting ML</span>
              <span className="font-mono font-bold text-teal-700">scikit-learn Ridge Regressor</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Redistribution Solver</span>
              <span className="font-mono font-bold text-teal-700">Google OR-Tools GLOP Linear Solver</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Gemini SDK Integration</span>
              <span className="font-mono font-bold text-slate-800">google-genai SDK (Backend-Only)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Federated Learning</span>
              <span className="font-mono font-bold text-indigo-700">NumPy FedAvg Simulation Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
