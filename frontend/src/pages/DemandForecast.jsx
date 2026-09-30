import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, AlertTriangle, Calendar, Info, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const DemandForecast = () => {
  const { showToast } = useApp();
  const [phcs, setPhcs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  const [selectedPhc, setSelectedPhc] = useState('');
  const [selectedMed, setSelectedMed] = useState('');
  const [horizon, setHorizon] = useState(14); // 7, 14, 30 days

  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [phcsData, medsData] = await Promise.all([
          apiClient.getPhcs(),
          apiClient.getMedicines()
        ]);
        setPhcs(phcsData);
        setMedicines(medsData);
        if (phcsData.length > 0 && !selectedPhc) setSelectedPhc(phcsData[0].id);
        if (medsData.length > 0 && !selectedMed) setSelectedMed(String(medsData[0].id));
      } catch (err) {
        console.error("Failed to load forecast selectors:", err);
      }
    };
    loadDropdowns();
  }, []);

  const fetchForecast = async () => {
    if (!selectedPhc || !selectedMed) return;
    setLoading(true);
    try {
      const data = await apiClient.getForecast(selectedPhc, parseInt(selectedMed), horizon);
      setForecastData(data);
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to generate forecast.", "error");
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPhc && selectedMed) {
      fetchForecast();
    }
  }, [selectedPhc, selectedMed, horizon]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-600" />
            Machine Learning Demand Forecasting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ridge time-series regression with day-of-week seasonality, 7-day lag features, and rolling momentum windows.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          {[7, 14, 30].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                horizon === h
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h} Days Horizon
            </button>
          ))}
        </div>
      </div>

      {/* Selector Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Select Primary Health Centre:</label>
          <select
            value={selectedPhc}
            onChange={(e) => setSelectedPhc(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            {phcs.length === 0 && <option value="">No PHCs registered</option>}
            {phcs.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.district})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Select Medicine Formulary:</label>
          <select
            value={selectedMed}
            onChange={(e) => setSelectedMed(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            {medicines.length === 0 && <option value="">No medicines registered</option>}
            {medicines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content State */}
      {phcs.length === 0 || medicines.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Enter historical medicine data to generate a forecast."
          description="A minimum of 14 continuous daily consumption records is strictly required by the Ridge ML model to train reliable lag weights."
        />
      ) : loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs font-semibold">Training Ridge Regressor & Computing Forecast...</span>
        </div>
      ) : forecastData?.insufficient_data ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-amber-950">Insufficient data for reliable forecasting.</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto mt-2 leading-relaxed">
            Found {forecastData.historical_count} historical daily records. The algorithm strictly requires at least 14 daily observation data points per PHC + medicine to prevent inaccurate extrapolations.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono bg-white/80 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900">
            <span>Historical Records: {forecastData.historical_count} / 14 required</span>
          </div>
        </div>
      ) : forecastData ? (
        <div className="space-y-6">
          {/* Metrics summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Holdout Test MAE</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-800 font-mono">
                  {forecastData.mae !== null ? forecastData.mae : "—"}
                </span>
                <span className="text-xs text-slate-500">units / day error</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Evaluated on 20% holdout split</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Predicted Daily Burn Rate</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {forecastData.predicted_daily_demand}
                </span>
                <span className="text-xs text-slate-500">units / day</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Next {forecastData.horizon_days} days projection</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Historical Records Used</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy-800 font-mono">
                  {forecastData.historical_count}
                </span>
                <span className="text-xs text-slate-500">days of telemetry</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sufficient for ML convergence
              </span>
            </div>
          </div>

          {/* Recharts Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Actual Historical Consumption vs. Predicted Demand Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Solid blue indicates real historical data; dashed green indicates Ridge model forecasts with 1.2x MAE confidence bounds.
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData.forecast_points} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(str) => str.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" u" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Prediction Line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted Demand"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Actual Consumption Line */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Recorded Demand"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2563eb' }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
