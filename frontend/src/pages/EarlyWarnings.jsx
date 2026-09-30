import React, { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, Calendar, ShieldCheck, Filter, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/RiskBadge';
import { EmptyState } from '../components/EmptyState';

export const EarlyWarnings = () => {
  const { showToast, setExplainModalData } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [explainingId, setExplainingId] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAlerts({ risk_level: riskFilter || undefined });
      setAlerts(data);
    } catch (err) {
      showToast('Failed to load risk alerts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [riskFilter]);

  const handleExplain = async (a) => {
    setExplainingId(a.id);
    try {
      const res = await apiClient.explainRisk(a.phc_id, a.medicine_id);
      setExplainModalData({
        title: `Clinical Risk Assessment: ${a.medicine_name}`,
        subtitle: `${a.phc_name} (${a.district}) — Risk Level: ${a.risk_level}`,
        explanation: res.explanation
      });
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to generate AI explanation.", "error");
    } finally {
      setExplainingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Supply Chain Early Warnings & Stock-Out Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated alerts triggered when inventory coverage drops below lead times or safety stock thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white font-medium"
          >
            <option value="">All Active Alert Levels</option>
            <option value="HIGH">Critical / High Risk Only</option>
            <option value="MEDIUM">Medium Risk Only</option>
          </select>

          <button
            onClick={loadAlerts}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600 transition"
            title="Refresh Alerts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts List or Empty State */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No active alerts."
          description="All recorded medicine stocks currently exceed safety buffer levels and supplier lead times."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const isHigh = a.risk_level === 'HIGH';

            return (
              <div
                key={a.id}
                className={`bg-white rounded-xl border p-5 shadow-card transition-all ${
                  isHigh ? 'border-rose-200 hover:border-rose-300' : 'border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{a.medicine_name}</h3>
                        <RiskBadge level={a.risk_level} size="sm" />
                        <span className="text-xs text-slate-500">at {a.phc_name} ({a.district})</span>
                      </div>

                      {/* Calculated Reason */}
                      <p className="text-xs text-slate-700 mt-2 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {a.calculated_reason}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>
                          Stock Coverage: <strong className="text-slate-900 font-mono">{a.coverage_days !== null ? `${a.coverage_days} days` : '0 days'}</strong>
                        </span>
                        {a.expected_stockout_date && (
                          <span className="flex items-center gap-1 text-rose-700 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            Expected Stock-out: {String(a.expected_stockout_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Explain Button */}
                  <button
                    onClick={() => handleExplain(a)}
                    disabled={explainingId === a.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold shadow-sm transition self-start sm:self-auto shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>{explainingId === a.id ? "Analyzing..." : "Explain with Gemini"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
