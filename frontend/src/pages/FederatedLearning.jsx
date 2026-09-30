import React, { useState, useEffect } from 'react';
import {
  Cpu, Play, ShieldCheck, Lock, Network, Database,
  ArrowRight, CheckCircle2, AlertTriangle, Layers, Activity
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const FederatedLearning = () => {
  const { showToast } = useApp();
  const [fedStatus, setFedStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [rounds, setRounds] = useState(5);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getFederatedStatus();
      setFedStatus(data);
    } catch (err) {
      console.error("Failed to load federated status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await apiClient.trainFederated(rounds);
      setFedStatus(res);
      showToast(`Federated simulation completed across ${res.total_districts} district client nodes!`, "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Federated training failed.", "error");
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-teal-600" />
              Federated Learning Prototype Simulation
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-100 text-navy-800 border border-navy-300">
              Prototype Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Decentralized federated averaging (FedAvg) over isolated district healthcare silos without pooling raw telemetry.
          </p>
        </div>

        <button
          onClick={handleTrain}
          disabled={!fedStatus?.can_train || training}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
        >
          <Play className="w-4 h-4 text-teal-200" />
          <span>{training ? "Aggregating Gradients..." : "Run FedAvg Training Cycle"}</span>
        </button>
      </div>

      {/* Edge Privacy Disclaimer Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-navy-900 to-teal-950 text-white p-4 rounded-xl shadow-md border border-teal-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-lg border border-teal-400/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-teal-100">Zero Raw Data Transmission Guarantee</h3>
            <p className="text-xs text-teal-200/80">
              Raw patient & medicine inventory data remains strictly local to each district facility silo; only mathematical weight vector updates are exchanged with the aggregation hub.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 text-center">
          Decentralized Federated Averaging (FedAvg) Architecture Flow
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <Database className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-800">1. District Silo</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Isolated PHC records</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <Cpu className="w-5 h-5 text-navy-700 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-800">2. Local Training</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Ridge model gradient fit</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <Network className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-800">3. Parameter Upload</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Weights & intercepts only</p>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
            <Layers className="w-5 h-5 text-teal-700 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-teal-900">4. FedAvg Hub</h4>
            <p className="text-[10px] text-teal-700 mt-0.5">Sample-weighted aggregation</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-emerald-900">5. Global Dispatch</h4>
            <p className="text-[10px] text-emerald-700 mt-0.5">Resilient global model</p>
          </div>
        </div>
      </div>

      {/* Main Status & Metrics */}
      {!fedStatus || !fedStatus.can_train ? (
        <EmptyState
          icon={Cpu}
          title="Add district data to start federated analysis."
          description="The Federated Learning simulator requires data from at least 2 distinct administrative districts to simulate decentralized local training and server parameter aggregation."
        />
      ) : (
        <div className="space-y-6">
          {/* Global Results KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Participating District Nodes</span>
              <span className="text-2xl font-black text-navy-900 font-mono mt-1 block">
                {fedStatus.total_districts} Silos
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Edge clients connected</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Aggregation Rounds</span>
              <span className="text-2xl font-black text-teal-700 font-mono mt-1 block">
                {fedStatus.rounds_completed} Rounds
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">FedAvg iterative sync</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Global Aggregated MAE</span>
              <span className="text-2xl font-black text-teal-800 font-mono mt-1 block">
                {fedStatus.global_mae !== null ? fedStatus.global_mae : "—"}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Mean Absolute Error</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Global Model R² Fit</span>
              <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                {fedStatus.global_r2 !== null ? `${(fedStatus.global_r2 * 100).toFixed(1)}%` : "—"}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Explained variance</span>
            </div>
          </div>

          {/* District Local vs Global Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Per-District Edge Node Evaluation</h3>
              <p className="text-xs text-slate-500">Comparing local standalone accuracy against global federated generalization</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-3">District Node (Client)</th>
                    <th className="p-3">Private Training Samples</th>
                    <th className="p-3">Local Solo MAE</th>
                    <th className="p-3">Local R² Accuracy</th>
                    <th className="p-3">Federation Weight</th>
                    <th className="p-3">Edge Privacy Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fedStatus.district_metrics.map((dm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{dm.district} District</td>
                      <td className="p-3 font-mono text-slate-700">{dm.data_points} records</td>
                      <td className="p-3 font-mono text-slate-900 font-semibold">{dm.local_mae}</td>
                      <td className="p-3 font-mono text-teal-800 font-bold">{(dm.local_r2 * 100).toFixed(1)}%</td>
                      <td className="p-3 font-mono text-slate-600">
                        {((dm.sample_count / (fedStatus.district_metrics.reduce((a, b) => a + b.sample_count, 0) || 1)) * 100).toFixed(1)}%
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <Lock className="w-3.5 h-3.5" />
                          Encrypted Local Silo
                        </span>
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
