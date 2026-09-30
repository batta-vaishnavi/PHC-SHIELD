import React, { useState, useEffect } from 'react';
import {
  Flame, Play, ShieldAlert, Sparkles, AlertTriangle,
  ArrowRightLeft, Building2, Pill, Activity, CheckCircle2
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/RiskBadge';
import { EmptyState } from '../components/EmptyState';

export const EmergencySimulation = () => {
  const { showToast, hasData } = useApp();
  const [phcs, setPhcs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Simulation Request Parameters
  const [simForm, setSimForm] = useState({
    emergency_name: 'Monsoon Dengue & Malaria Outbreak Surge',
    demand_increase_pct: 65,
    duration_days: 14,
    affected_districts: [],
    affected_medicine_ids: []
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [phcsData, medsData] = await Promise.all([
          apiClient.getPhcs(),
          apiClient.getMedicines()
        ]);
        setPhcs(phcsData);
        setMedicines(medsData);
      } catch (err) {
        console.error("Failed to load emergency options:", err);
      }
    };
    loadOptions();
  }, []);

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!hasData) {
      showToast("Please enter data or load demo dataset before running simulation.", "error");
      return;
    }

    setSimulating(true);
    setSimResult(null);

    try {
      const payload = {
        emergency_name: simForm.emergency_name,
        demand_increase_pct: parseFloat(simForm.demand_increase_pct),
        duration_days: parseInt(simForm.duration_days),
        affected_districts: simForm.affected_districts,
        affected_medicine_ids: simForm.affected_medicine_ids
      };

      const res = await apiClient.runEmergencySimulation(payload);
      setSimResult(res);
      showToast(`Emergency scenario '${res.emergency_name}' simulated in memory!`, "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Emergency simulation failed.", "error");
    } finally {
      setSimulating(false);
    }
  };

  const uniqueDistricts = Array.from(new Set(phcs.map(p => p.district).filter(Boolean)));

  const toggleDistrict = (d) => {
    setSimForm(prev => ({
      ...prev,
      affected_districts: prev.affected_districts.includes(d)
        ? prev.affected_districts.filter(x => x !== d)
        : [...prev.affected_districts, d]
    }));
  };

  const toggleMedicine = (id) => {
    setSimForm(prev => ({
      ...prev,
      affected_medicine_ids: prev.affected_medicine_ids.includes(id)
        ? prev.affected_medicine_ids.filter(x => x !== id)
        : [...prev.affected_medicine_ids, id]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-600" />
              Emergency Healthcare Surge & Crisis Simulator
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase">
              Sandbox Stress-Test
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Model epidemic spikes, seasonal outbreaks, and sudden supply shocks without modifying live database inventory.
          </p>
        </div>
      </div>

      {/* Safety Non-Destructive Banner */}
      <div className="bg-navy-900 text-white p-4 rounded-xl border border-navy-700 shadow-md flex items-center gap-3">
        <div className="p-2 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Non-Destructive In-Memory Engine</span>
          <span className="text-xs text-slate-400">
            Simulations calculate hypothetical demand multipliers entirely in-memory. Persistent facility records remain unchanged.
          </span>
        </div>
      </div>

      {/* Simulation Configuration Form */}
      <form onSubmit={handleRunSimulation} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Configure Emergency Stress Scenario</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-xs text-slate-700 block mb-1">Emergency Incident Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cyclone Coastal Outbreak Surge"
              value={simForm.emergency_name}
              onChange={(e) => setSimForm({ ...simForm, emergency_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="font-bold text-xs text-slate-700 block mb-1">
              Simulated Demand Increase %: <span className="text-rose-600 font-black">+{simForm.demand_increase_pct}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={simForm.demand_increase_pct}
              onChange={(e) => setSimForm({ ...simForm, demand_increase_pct: e.target.value })}
              className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="font-bold text-xs text-slate-700 block mb-1">Estimated Surge Duration (Days)</label>
            <input
              type="number"
              min="3"
              max="90"
              required
              value={simForm.duration_days}
              onChange={(e) => setSimForm({ ...simForm, duration_days: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Affected Filter Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {uniqueDistricts.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Target Districts ({simForm.affected_districts.length === 0 ? "All Selected" : `${simForm.affected_districts.length} Selected`}):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                {uniqueDistricts.map((d) => {
                  const isSel = simForm.affected_districts.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDistrict(d)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        isSel ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {medicines.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Target Medicines ({simForm.affected_medicine_ids.length === 0 ? "All Selected" : `${simForm.affected_medicine_ids.length} Selected`}):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                {medicines.map((m) => {
                  const isSel = simForm.affected_medicine_ids.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMedicine(m.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        isSel ? 'bg-teal-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t flex justify-end">
          <button
            type="submit"
            disabled={simulating || !hasData}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md transition"
          >
            <Play className="w-4 h-4 text-rose-200" />
            <span>{simulating ? "Simulating Emergency Surge..." : "Run Emergency Simulation"}</span>
          </button>
        </div>
      </form>

      {/* Simulation Results Display */}
      {simResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Impact KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-card">
              <span className="text-xs font-semibold text-rose-700 block uppercase">Critical Facilities Impacted</span>
              <span className="text-2xl font-black text-rose-900 font-mono mt-1 block">
                {simResult.critical_phcs_count} PHCs
              </span>
              <span className="text-[11px] text-rose-600 mt-1 block">Escalated to critical risk</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Deficit Medicine Types</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {simResult.shortage_medicines_count} Medicines
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Exceed safety runway</span>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl shadow-card">
              <span className="text-xs font-semibold text-teal-800 block uppercase">Surge Transfers Needed</span>
              <span className="text-2xl font-black text-teal-900 font-mono mt-1 block">
                {simResult.redistribution_plan.total_transfers} Routes
              </span>
              <span className="text-[11px] text-teal-700 mt-1 block">Buffer balancing actions</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Surge Multiplier</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                +{simResult.demand_increase_pct}%
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Over {simResult.duration_days} days</span>
            </div>
          </div>

          {/* Gemini Emergency Intelligence Briefing */}
          {simResult.gemini_summary && (
            <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-card">
              <div className="flex items-center gap-2.5 border-b pb-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-teal-600 to-navy-900 text-white rounded-lg">
                  <Sparkles className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Gemini Emergency Incident Briefing</h3>
                  <p className="text-xs text-slate-500">Incident Command impact analysis generated from simulated metrics</p>
                </div>
              </div>

              <div className="whitespace-pre-line text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                {simResult.gemini_summary}
              </div>
            </div>
          )}

          {/* Simulated Risk Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Surge Emergency Alert Table</h3>
              <p className="text-xs text-slate-500">Facilities where burn rate surge collapses days remaining below supplier lead time</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-3">Facility</th>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Simulated Daily Demand</th>
                    <th className="p-3">Coverage Under Surge</th>
                    <th className="p-3">Simulated Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {simResult.simulated_alerts.map((sa, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{sa.phc_name} ({sa.district})</td>
                      <td className="p-3 font-medium text-slate-800">{sa.medicine_name}</td>
                      <td className="p-3 font-mono font-bold text-rose-700">{sa.predicted_daily_demand} u/day</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{sa.coverage_days} days</td>
                      <td className="p-3">
                        <RiskBadge level={sa.risk_level} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
