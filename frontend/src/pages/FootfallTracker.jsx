import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, Activity, Trash2, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const FootfallTracker = () => {
  const { showToast, refreshStats } = useApp();
  const [footfalls, setFootfalls] = useState([]);
  const [phcs, setPhcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhc, setSelectedPhc] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    phc_id: '',
    record_date: new Date().toISOString().split('T')[0],
    patient_count: '',
    disease_category: 'General Outpatient',
    emergency_cases: '',
    outpatient_cases: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [footfallData, phcsData] = await Promise.all([
        apiClient.getFootfall({ phc_id: selectedPhc || undefined }),
        apiClient.getPhcs()
      ]);
      setFootfalls(footfallData);
      setPhcs(phcsData);
    } catch (err) {
      showToast('Failed to load footfall records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPhc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalPatients = parseInt(form.patient_count);
      const emergency = form.emergency_cases !== '' ? parseInt(form.emergency_cases) : 0;
      const outpatient = form.outpatient_cases !== '' ? parseInt(form.outpatient_cases) : totalPatients - emergency;

      if (totalPatients < 0 || emergency < 0 || outpatient < 0) {
        showToast("Patient numbers must be non-negative.", "error");
        return;
      }

      await apiClient.recordFootfall({
        phc_id: form.phc_id,
        record_date: form.record_date,
        patient_count: totalPatients,
        disease_category: form.disease_category,
        emergency_cases: emergency,
        outpatient_cases: outpatient
      });

      showToast("Daily patient footfall recorded!", "success");
      setShowModal(false);
      setForm({
        phc_id: '',
        record_date: new Date().toISOString().split('T')[0],
        patient_count: '',
        disease_category: 'General Outpatient',
        emergency_cases: '',
        outpatient_cases: ''
      });
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to record footfall.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this footfall log?")) return;
    try {
      await apiClient.deleteFootfall(id);
      showToast("Footfall entry removed.", "success");
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
            <Users className="w-6 h-6 text-teal-600" />
            Patient Footfall & Epidemiology Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical patient traffic volume, outpatient vs emergency triage, and disease category trends.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={phcs.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Daily Footfall</span>
        </button>
      </div>

      {/* Filter */}
      {phcs.length > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filter by Facility:</label>
          <select
            value={selectedPhc}
            onChange={(e) => setSelectedPhc(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            <option value="">All Health Centres ({phcs.length})</option>
            {phcs.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.district})</option>
            ))}
          </select>
        </div>
      )}

      {/* Table or Empty State */}
      {footfalls.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No footfall logs recorded yet."
          description="Record daily patient attendance to track local epidemiological demand and surge patterns."
          actions={
            <button
              onClick={() => setShowModal(true)}
              disabled={phcs.length === 0}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold"
            >
              Log Daily Footfall
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Record Date</th>
                  <th className="p-3">PHC Facility</th>
                  <th className="p-3">Total Patients</th>
                  <th className="p-3">Outpatient Cases</th>
                  <th className="p-3">Emergency Cases</th>
                  <th className="p-3">Primary Diagnosis / Category</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {footfalls.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-medium text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {f.record_date}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{f.phc_name || f.phc_id}</td>
                    <td className="p-3 font-mono font-bold text-teal-800 text-sm">
                      {f.patient_count.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-slate-700">{f.outpatient_cases}</td>
                    <td className="p-3 font-mono text-rose-700 font-bold">{f.emergency_cases}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {f.disease_category}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
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
              <h3 className="text-base font-bold text-slate-900">Log Daily Patient Footfall</h3>
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
                  <label className="font-semibold text-slate-700 block mb-1">Record Date *</label>
                  <input
                    type="date"
                    required
                    value={form.record_date}
                    onChange={(e) => setForm({ ...form, record_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Patient Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 75"
                    value={form.patient_count}
                    onChange={(e) => setForm({ ...form, patient_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Outpatient Cases</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 65"
                    value={form.outpatient_cases}
                    onChange={(e) => setForm({ ...form, outpatient_cases: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Emergency Cases</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={form.emergency_cases}
                    onChange={(e) => setForm({ ...form, emergency_cases: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Disease / Diagnosis Group</label>
                <input
                  type="text"
                  placeholder="e.g. Respiratory Infection, Vector-Borne / Fever"
                  value={form.disease_category}
                  onChange={(e) => setForm({ ...form, disease_category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                />
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
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
