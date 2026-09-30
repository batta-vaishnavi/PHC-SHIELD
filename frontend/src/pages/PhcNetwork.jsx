import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Trash2, Edit2, X, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const PhcNetwork = () => {
  const { showToast, refreshStats } = useApp();
  const [phcs, setPhcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhc, setEditingPhc] = useState(null);

  // Form Fields - strictly initialized to empty strings!
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    district: '',
    state: '',
    country: 'India',
    latitude: '',
    longitude: ''
  });

  const loadPhcs = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPhcs({ search, district: districtFilter });
      setPhcs(data);
    } catch (err) {
      showToast('Failed to load PHC records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhcs();
  }, [search, districtFilter]);

  const handleOpenAdd = () => {
    setEditingPhc(null);
    setFormData({
      id: '',
      name: '',
      district: '',
      state: '',
      country: 'India',
      latitude: '',
      longitude: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPhc(p);
    setFormData({
      id: p.id,
      name: p.name,
      district: p.district,
      state: p.state,
      country: p.country || 'India',
      latitude: p.latitude !== null ? String(p.latitude) : '',
      longitude: p.longitude !== null ? String(p.longitude) : ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || 'India',
        latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null,
      };

      if (editingPhc) {
        await apiClient.updatePhc(editingPhc.id, payload);
        showToast(`PHC '${payload.name}' updated successfully!`, 'success');
      } else {
        await apiClient.createPhc(payload);
        showToast(`PHC '${payload.name}' registered successfully!`, 'success');
      }

      setShowAddModal(false);
      await loadPhcs();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save PHC record.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} (${id})?`)) return;
    try {
      await apiClient.deletePhc(id);
      showToast(`PHC '${name}' deleted.`, 'success');
      await loadPhcs();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete PHC.', 'error');
    }
  };

  const uniqueDistricts = Array.from(new Set(phcs.map(p => p.district).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" />
            Primary Health Centre (PHC) Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage regional healthcare facilities, administrative boundaries, and GPS coordinates.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New PHC</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PHC Name, ID, or State..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

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
      </div>

      {/* Main Table or Empty State */}
      {phcs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No PHC facilities registered yet."
          description="Register local Primary Health Centres with their geographic coordinates to enable supply chain optimization."
          actions={
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Add First PHC
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Facility ID</th>
                  <th className="p-3">Facility Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">State / Country</th>
                  <th className="p-3">GPS Coordinates</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phcs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{p.id}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 font-medium text-slate-700">{p.district}</td>
                    <td className="p-3 text-slate-600">{p.state}, {p.country}</td>
                    <td className="p-3">
                      {p.latitude !== null && p.longitude !== null ? (
                        <span className="font-mono text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No GPS data</span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.is_demo ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Synthetic Demo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          User Data
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-teal-700"
                          title="Edit PHC"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Delete PHC"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingPhc ? "Edit Primary Health Centre" : "Register New Primary Health Centre"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PHC Unique ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPhc}
                    placeholder="e.g. PHC-MH-01"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shirur Primary Health Centre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 18.8281"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 74.3789"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {editingPhc ? "Save Changes" : "Create PHC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
