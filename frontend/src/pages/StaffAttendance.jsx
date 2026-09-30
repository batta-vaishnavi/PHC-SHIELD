import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Calendar, Trash2, X, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const StaffAttendance = () => {
  const { showToast, refreshStats } = useApp();
  const [attendances, setAttendances] = useState([]);
  const [phcs, setPhcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    phc_id: '',
    record_date: new Date().toISOString().split('T')[0],
    total_staff: '',
    present_staff: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [attData, phcsData] = await Promise.all([
        apiClient.getAttendance(),
        apiClient.getPhcs()
      ]);
      setAttendances(attData);
      setPhcs(phcsData);
    } catch (err) {
      showToast('Failed to load staff attendance logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tot = parseInt(form.total_staff);
    const pres = parseInt(form.present_staff);

    if (tot < 0 || pres < 0) {
      showToast("Staff numbers must be non-negative.", "error");
      return;
    }

    if (pres > tot) {
      showToast(`Present staff (${pres}) cannot exceed total staff roster (${tot}).`, "error");
      return;
    }

    try {
      await apiClient.recordAttendance({
        phc_id: form.phc_id,
        record_date: form.record_date,
        total_staff: tot,
        present_staff: pres,
        absent_staff: tot - pres
      });

      showToast("Staff attendance logged successfully!", "success");
      setShowModal(false);
      setForm({
        phc_id: '',
        record_date: new Date().toISOString().split('T')[0],
        total_staff: '',
        present_staff: ''
      });
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to record staff attendance.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance log?")) return;
    try {
      await apiClient.deleteAttendance(id);
      showToast("Attendance record removed.", "success");
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
            <UserCheck className="w-6 h-6 text-teal-600" />
            Healthcare Staff Attendance & Roster Reliability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor doctor, nurse, and pharmacist shift attendance rates and workforce readiness.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={phcs.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Staff Attendance</span>
        </button>
      </div>

      {/* Attendance Table or Empty State */}
      {attendances.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No staff attendance records available."
          description="Log daily staff rosters across facilities to analyze human resource availability."
          actions={
            <button
              onClick={() => setShowModal(true)}
              disabled={phcs.length === 0}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold"
            >
              Log Daily Attendance
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
                  <th className="p-3">Facility Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Total Roster</th>
                  <th className="p-3">Present Staff</th>
                  <th className="p-3">Absent Staff</th>
                  <th className="p-3">Attendance Rate %</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.map((a) => {
                  const isLow = a.attendance_rate < 75.0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-medium text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {a.record_date}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{a.phc_name || a.phc_id}</td>
                      <td className="p-3 font-medium text-slate-700">{a.district || '—'}</td>
                      <td className="p-3 font-mono text-slate-800">{a.total_staff}</td>
                      <td className="p-3 font-mono font-bold text-teal-800">{a.present_staff}</td>
                      <td className="p-3 font-mono text-slate-500">{a.absent_staff}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            isLow ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {a.attendance_rate}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(a.id)}
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
              <h3 className="text-base font-bold text-slate-900">Log Daily Shift Attendance</h3>
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
                  <label className="font-semibold text-slate-700 block mb-1">Shift Date *</label>
                  <input
                    type="date"
                    required
                    value={form.record_date}
                    onChange={(e) => setForm({ ...form, record_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Staff Roster *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 15"
                    value={form.total_staff}
                    onChange={(e) => setForm({ ...form, total_staff: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Present on Shift *</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 13"
                  value={form.present_staff}
                  onChange={(e) => setForm({ ...form, present_staff: e.target.value })}
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
                  Save Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
