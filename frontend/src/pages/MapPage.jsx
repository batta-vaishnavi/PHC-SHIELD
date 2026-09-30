import React, { useState, useEffect } from 'react';
import { Map, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/MapView';

export const MapPage = () => {
  const { showToast } = useApp();
  const [phcs, setPhcs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [phcsData, alertsData] = await Promise.all([
        apiClient.getPhcs({ district: districtFilter || undefined }),
        apiClient.getAlerts()
      ]);
      setPhcs(phcsData);
      setAlerts(alertsData);
    } catch (err) {
      showToast('Failed to load geospatial data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [districtFilter]);

  const uniqueDistricts = Array.from(new Set(phcs.map(p => p.district).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-teal-600" />
            Geospatial Healthcare Risk Heatmap
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing real-time facility inventory status, critical shortage alerts, and geographical buffer distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {uniqueDistricts.length > 0 && (
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
            >
              <option value="">All Districts ({uniqueDistricts.length})</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600 transition"
            title="Refresh Map Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
        <MapView phcs={phcs} alerts={alerts} height="600px" />
      </div>
    </div>
  );
};
