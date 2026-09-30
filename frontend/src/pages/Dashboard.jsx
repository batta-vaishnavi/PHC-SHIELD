import React, { useState, useEffect } from 'react';
import {
  Building2, Pill, Users, Bed, UserCheck, AlertTriangle,
  TrendingUp, Sparkles, MapPin, ArrowRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { RiskBadge } from '../components/RiskBadge';
import { MapView } from '../components/MapView';

export const Dashboard = () => {
  const { hasData, stats, refreshStats, setActiveTab, setExplainModalData, showToast } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [phcs, setPhcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [explainingSummary, setExplainingSummary] = useState(false);

  useEffect(() => {
    if (hasData) {
      loadDashboardDetails();
    }
  }, [hasData]);

  const loadDashboardDetails = async () => {
    setLoading(true);
    try {
      const [alertsData, phcsData] = await Promise.all([
        apiClient.getAlerts(),
        apiClient.getPhcs()
      ]);
      setAlerts(alertsData);
      setPhcs(phcsData);
    } catch (err) {
      console.error("Failed to load dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainCritical = async () => {
    setExplainingSummary(true);
    try {
      const res = await apiClient.getCriticalSummary();
      setExplainModalData({
        title: "Statewide Critical PHC Executive Summary",
        subtitle: `Clinical assessment covering ${res.critical_count} critical inventory nodes`,
        summary: res.summary
      });
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to generate AI executive summary.", "error");
    } finally {
      setExplainingSummary(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Healthcare Supply Chain Intelligence Command
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry, predictive demand modeling, and decentralized logistics resilience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasData && stats?.critical_phcs > 0 && (
            <button
              onClick={handleExplainCritical}
              disabled={explainingSummary}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-teal-700 to-navy-900 hover:from-teal-800 hover:to-navy-950 text-white text-xs font-bold shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>{explainingSummary ? "Analyzing with Gemini..." : "Gemini Executive Brief"}</span>
            </button>
          )}

          <button
            onClick={refreshStats}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600 transition shadow-xs"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total PHCs"
          value={hasData ? stats?.total_phcs : null}
          icon={Building2}
          subtitle={hasData ? "Monitored facilities" : null}
          onClick={() => setActiveTab('phcs')}
        />
        <StatCard
          title="Critical PHCs"
          value={hasData ? stats?.critical_phcs : null}
          icon={AlertTriangle}
          variant={stats?.critical_phcs > 0 ? "critical" : "default"}
          subtitle={stats?.critical_phcs > 0 ? "Require immediate restock" : "All facilities nominal"}
          onClick={() => setActiveTab('alerts')}
        />
        <StatCard
          title="Medicine Stock"
          value={hasData ? stats?.total_stock_units : null}
          unit="units"
          icon={Pill}
          subtitle={hasData ? "On-hand inventory" : null}
          onClick={() => setActiveTab('stock')}
        />
        <StatCard
          title="Total Footfall"
          value={hasData ? stats?.total_footfall : null}
          unit="patients"
          icon={Users}
          subtitle={hasData ? "Historical recorded" : null}
          onClick={() => setActiveTab('footfall')}
        />
        <StatCard
          title="Available Beds"
          value={hasData ? stats?.available_beds : null}
          unit={stats?.total_beds ? `/ ${stats.total_beds}` : ''}
          icon={Bed}
          subtitle={hasData && stats?.bed_occupancy_pct !== null ? `${stats.bed_occupancy_pct}% occupancy` : null}
          onClick={() => setActiveTab('beds')}
        />
        <StatCard
          title="Staff Attendance"
          value={hasData && stats?.staff_attendance_pct !== null ? `${stats.staff_attendance_pct}%` : null}
          icon={UserCheck}
          variant={stats?.staff_attendance_pct && stats.staff_attendance_pct < 75 ? "warning" : "default"}
          subtitle={hasData ? "Active roster rate" : null}
          onClick={() => setActiveTab('staff')}
        />
      </div>

      {/* Main Content Area */}
      {!hasData ? (
        <EmptyState showDefaultFirstLaunchButtons={true} />
      ) : (
        <div className="space-y-6">
          {/* Active Alerts and Map Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active Alerts Table */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-card">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Active Supply Risk Early Warnings</h3>
                    <p className="text-[11px] text-slate-500">Calculated based on stock, predicted demand & supplier lead time</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No critical alerts detected across facilities.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="p-2.5">Facility & District</th>
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5">Risk Level</th>
                        <th className="p-2.5">Coverage</th>
                        <th className="p-2.5">Expected Stock-out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {alerts.slice(0, 5).map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-800 block">{a.phc_name}</span>
                            <span className="text-[11px] text-slate-500">{a.district}</span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-800">{a.medicine_name}</td>
                          <td className="p-2.5">
                            <RiskBadge level={a.risk_level} size="sm" />
                          </td>
                          <td className="p-2.5 font-mono text-slate-700">
                            {a.coverage_days !== null ? `${a.coverage_days} days` : "—"}
                          </td>
                          <td className="p-2.5 text-slate-600 font-medium">
                            {a.expected_stockout_date ? String(a.expected_stockout_date) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Geospatial Risk Map */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-card flex flex-col">
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-900">Regional PHC Network Map</h3>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  Full Map
                </button>
              </div>

              <div className="flex-1 min-h-[300px]">
                <MapView phcs={phcs} alerts={alerts} height="320px" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
