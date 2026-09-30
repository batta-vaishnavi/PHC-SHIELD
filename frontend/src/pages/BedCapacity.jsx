import React, { useState, useEffect } from 'react';
import { Bed, Plus, AlertCircle, Trash2, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const BedCapacity = () => {
  const { showToast, refreshStats } = useApp();
  const [beds, setBeds] = useState([]);
  const [phcs, setPhcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    phc_id: '',
    total_beds: '',
    occupied_beds: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bedsData, phcsData] = await Promise.all([
        apiClient.getBeds(),
        apiClient.getPhcs()
      ]);
      setBeds(bedsData);
      setPhcs(phcsData);
    } catch (err) {
      showToast('Failed to load bed capacity records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tot = parseInt(form.total_beds);
    const occ = parseInt(form.occupied_beds);

    if (tot < 0 || occ < 0) {
      showToast("Bed numbers must be non-negative.", "error");
      return;
    }

    if (occ > tot) {
      showToast(`Occupied beds (${occ}) cannot exceed total beds (${tot}).`, "error");
      return;
    }

    try {
      await apiClient.saveBeds({
        phc_id: form.phc_id,
        total_beds: tot,
        occupied_beds: occ
      });

      showToast("Bed capacity updated successfully!", "success");
      setShowModal(false);
      setForm({ phc_id: '', total_beds: '', occupied_beds: '' });
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to save bed capacity.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bed capacity record?")) return;
    try {
      await apiClient.deleteBeds(id);
      showToast("Bed record removed.", "success");
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast("Failed to delete record.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bed className="w-6 h-6 text-teal-600" />
            Inpatient Bed Capacity & Clinical Surge Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track total inpatient bed availability, ward occupancy rates, and critical care expansion headroom.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={phcs.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Update Bed Capacity</span>
        </button>
      </div>

      {/* Bed Table or Empty State */}
      {beds.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No bed availability data available."
          description="Record inpatient and emergency bed quotas across Primary Health Centres to monitor regional hospitalizations."
          actions={
            <button
              onClick={() => setShowModal(true)}
              disabled={phcs.length === 0}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold"
            >
              Set Facility Bed Capacity
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Facility</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Total Beds</th>
                  <th className="p-3">Occupied Beds</th>
                  <th className="p-3">Available Beds</th>
                  <th className="p-3">Occupancy %</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.map((b) => {
                  const isHighOccupancy = b.occupancy_rate >= 85.0;
                  const isModerate = b.occupancy_rate >= 60.0 && !isHighOccupancy;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{b.phc_name || b.phc_id}</td>
                      <td className="p-3 font-medium text-slate-700">{b.district || '—'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{b.total_beds}</td>
                      <td className="p-3 font-mono text-slate-700">{b.occupied_beds}</td>
                      <td className="p-3 font-mono font-bold text-teal-800 text-sm">
                        {b.available_beds}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                isHighOccupancy ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(100, b.occupancy_rate)}%` }}
                            ></div>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              isHighOccupancy ? 'text-rose-700' : isModerate ? 'text-amber-700' : 'text-slate-700'
                            }`}
                          >
                            {b.occupancy_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Configure Bed Capacity</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select PHC Facility *</label>
                <select
                  required
                  value={form.phc_id}
                  onChange={(e) => setForm({ ...form, phc_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">-- Choose PHC --</option>
                  {phcs.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.district})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Bed Capacity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 30"
                    value={form.total_beds}
                    onChange={(e) => setForm({ ...form, total_beds: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Currently Occupied *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 18"
                    value={form.occupied_beds}
                    onChange={(e) => setForm({ ...form, occupied_beds: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
