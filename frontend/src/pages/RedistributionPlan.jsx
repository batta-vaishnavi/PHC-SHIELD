import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft, Sparkles, ShieldAlert, CheckCircle2,
  Snowflake, MapPin, Truck, AlertTriangle, ArrowRight, RefreshCw
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { RiskBadge } from '../components/RiskBadge';

export const RedistributionPlan = () => {
  const { showToast, setExplainModalData } = useApp();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getRedistribution();
      setPlan(data);
    } catch (err) {
      showToast('Failed to load redistribution recommendations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleGenerate = async () => {
    setOptimizing(true);
    try {
      const res = await apiClient.generateRedistribution();
      setPlan(res);
      if (res.ai_explanation) {
        setExplainModalData({
          title: "Optimized Peer-to-Peer Logistics Brief",
          subtitle: `Balanced allocation across ${res.surplus_nodes} surplus nodes and ${res.shortage_nodes} shortage nodes`,
          explanation: res.ai_explanation
        });
      }
      showToast("Optimized redistribution plan generated!", "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Optimization failed.", "error");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-teal-600" />
            Decentralized Inventory Redistribution Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Solves minimum-cost multi-facility transportation routes using OR-Tools, constrained by Haversine transit distances and cold-chain compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={optimizing || plan?.total_transfers === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>{optimizing ? "Solving Solver..." : "Optimize & Explain with Gemini"}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Clinical Governance Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-950 font-bold shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <span className="uppercase tracking-wider font-extrabold text-amber-900">Clinical Safety Governance: </span>
          <span>Human clinical approval required prior to physical dispatch. All suggested movements are advisory decision support and never execute automatically.</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {plan && plan.total_transfers > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 block uppercase">Recommended Transfers</span>
            <span className="text-2xl font-black text-teal-800 font-mono mt-1 block">
              {plan.total_transfers} routes
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 block uppercase">Surplus Facilities (Sources)</span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
              {plan.surplus_nodes} nodes
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 block uppercase">Deficit Facilities (Receivers)</span>
            <span className="text-2xl font-black text-rose-700 font-mono mt-1 block">
              {plan.shortage_nodes} nodes
            </span>
          </div>
        </div>
      )}

      {/* Transfers List or Empty State */}
      {!plan || plan.total_transfers === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="Enter PHC stock and demand data to generate recommendations."
          description="The linear transportation solver requires facilities with both safety buffer surpluses and critical deficits to model peer-to-peer balancing."
          actions={
            <button
              onClick={handleGenerate}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold"
            >
              Run Redistribution Analysis
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Source Facility (Surplus)</th>
                  <th className="p-3">Destination Facility (Shortage)</th>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Quantity to Move</th>
                  <th className="p-3">Haversine Distance</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Cold Chain</th>
                  <th className="p-3">Optimization Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.transfers.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{t.from_phc_name}</span>
                      <span className="text-[11px] text-slate-500">{t.from_district}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{t.to_phc_name}</span>
                      <span className="text-[11px] text-slate-500">{t.to_district}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{t.medicine_name}</td>
                    <td className="p-3 font-mono font-bold text-teal-800 text-sm">
                      {t.quantity.toLocaleString()} units
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {t.distance_km} km
                    </td>
                    <td className="p-3">
                      <RiskBadge level={t.priority} size="sm" />
                    </td>
                    <td className="p-3">
                      {t.cold_chain_compliant ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Distance Warning
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
