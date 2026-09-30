import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, Snowflake, Trash2, Edit2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';

export const MedicineStock = () => {
  const { showToast, refreshStats } = useApp();
  const [stocks, setStocks] = useState([]);
  const [phcs, setPhcs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPhc, setSelectedPhc] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);

  // Form states initialized to empty
  const [stockForm, setStockForm] = useState({
    phc_id: '',
    medicine_id: '',
    current_stock: '',
    daily_consumption: ''
  });

  const [medForm, setMedForm] = useState({
    name: '',
    category: '',
    unit: 'strips',
    min_stock_threshold: '',
    lead_time_days: '',
    shelf_life_days: '365',
    cold_chain_required: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stocksData, phcsData, medsData] = await Promise.all([
        apiClient.getStock({ phc_id: selectedPhc || undefined }),
        apiClient.getPhcs(),
        apiClient.getMedicines({ category: categoryFilter || undefined })
      ]);
      setStocks(stocksData);
      setPhcs(phcsData);
      setMedicines(medsData);
    } catch (err) {
      showToast('Failed to load medicine stock inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPhc, categoryFilter]);

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        phc_id: stockForm.phc_id,
        medicine_id: parseInt(stockForm.medicine_id),
        current_stock: parseFloat(stockForm.current_stock),
        daily_consumption: parseFloat(stockForm.daily_consumption)
      };

      if (payload.current_stock < 0 || payload.daily_consumption < 0) {
        showToast("Stock and daily consumption must be non-negative.", "error");
        return;
      }

      await apiClient.saveStock(payload);
      showToast("Medicine stock entry updated successfully!", "success");
      setShowStockModal(false);
      setStockForm({ phc_id: '', medicine_id: '', current_stock: '', daily_consumption: '' });
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to record stock.", "error");
    }
  };

  const handleMedicineSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: medForm.name.trim(),
        category: medForm.category.trim(),
        unit: medForm.unit.trim() || 'units',
        min_stock_threshold: parseFloat(medForm.min_stock_threshold || '50'),
        lead_time_days: parseInt(medForm.lead_time_days || '7'),
        shelf_life_days: parseInt(medForm.shelf_life_days || '365'),
        cold_chain_required: medForm.cold_chain_required
      };

      if (payload.min_stock_threshold < 0 || payload.lead_time_days < 0) {
        showToast("Threshold and lead time must be non-negative.", "error");
        return;
      }

      await apiClient.createMedicine(payload);
      showToast(`Medicine '${payload.name}' registered to formulary!`, 'success');
      setShowMedModal(false);
      setMedForm({ name: '', category: '', unit: 'strips', min_stock_threshold: '', lead_time_days: '', shelf_life_days: '365', cold_chain_required: false });
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to create medicine.", "error");
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm("Delete this inventory stock record?")) return;
    try {
      await apiClient.deleteStock(id);
      showToast("Stock entry removed.", "success");
      await loadData();
      await refreshStats();
    } catch (err) {
      showToast("Failed to delete stock.", "error");
    }
  };

  const categories = Array.from(new Set(medicines.map(m => m.category).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" />
            Medicine Stock & Formulary Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time inventory buffers, daily consumption velocities, cold-chain compliance, and runway days.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMedModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Formulary</span>
          </button>
          <button
            onClick={() => setShowStockModal(true)}
            disabled={phcs.length === 0 || medicines.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Stock Entry</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <select
          value={selectedPhc}
          onChange={(e) => setSelectedPhc(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white flex-1"
        >
          <option value="">All Health Centres ({phcs.length})</option>
          {phcs.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.district})</option>
          ))}
        </select>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stocks Table or Empty State */}
      {stocks.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No medicine data available yet."
          description="Register essential medicines and record PHC stock quantities to monitor inventory health."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMedModal(true)}
                className="px-4 py-2 rounded-lg bg-navy-800 text-white text-xs font-bold"
              >
                Add Medicine to Formulary
              </button>
            </div>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Facility</th>
                  <th className="p-3">Medicine & Category</th>
                  <th className="p-3">On-Hand Stock</th>
                  <th className="p-3">Daily Burn Rate</th>
                  <th className="p-3">Lead Time</th>
                  <th className="p-3">Days Remaining</th>
                  <th className="p-3">Cold Chain</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.map((s) => {
                  const days = s.days_remaining;
                  const isShortage = days !== null && s.lead_time_days !== null && days < s.lead_time_days;
                  const isWarning = days !== null && s.lead_time_days !== null && days < s.lead_time_days + 3 && !isShortage;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{s.phc_name || s.phc_id}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">{s.medicine_name}</span>
                        <span className="text-[11px] text-slate-500">{s.medicine_category}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {s.current_stock.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{s.medicine_unit}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {s.daily_consumption} <span className="text-[10px] text-slate-500">/ day</span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{s.lead_time_days || '—'} days</td>
                      <td className="p-3">
                        {days !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              isShortage
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {days} days
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">— (N/A)</span>
                        )}
                      </td>
                      <td className="p-3">
                        {s.cold_chain_required ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <Snowflake className="w-3 h-3" />
                            2°C - 8°C
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Ambient</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteStock(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete Stock"
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

      {/* Record Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Medicine Stock Entry</h3>
              <button onClick={() => setShowStockModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select PHC Facility *</label>
                <select
                  required
                  value={stockForm.phc_id}
                  onChange={(e) => setStockForm({ ...stockForm, phc_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">-- Choose PHC --</option>
                  {phcs.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.district})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Medicine *</label>
                <select
                  required
                  value={stockForm.medicine_id}
                  onChange={(e) => setStockForm({ ...stockForm, medicine_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current On-Hand Stock *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="e.g. 150"
                    value={stockForm.current_stock}
                    onChange={(e) => setStockForm({ ...stockForm, current_stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Daily Consumption Rate *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="e.g. 15"
                    value={stockForm.daily_consumption}
                    onChange={(e) => setStockForm({ ...stockForm, daily_consumption: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Stock Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Medicine to Formulary</h3>
              <button onClick={() => setShowMedModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMedicineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Antibiotic"
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="strips / vials"
                    value={medForm.unit}
                    onChange={(e) => setMedForm({ ...medForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Safety Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={medForm.min_stock_threshold}
                    onChange={(e) => setMedForm({ ...medForm, min_stock_threshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Supplier Lead Time (Days)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 7"
                    value={medForm.lead_time_days}
                    onChange={(e) => setMedForm({ ...medForm, lead_time_days: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cold_chain"
                  checked={medForm.cold_chain_required}
                  onChange={(e) => setMedForm({ ...medForm, cold_chain_required: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <label htmlFor="cold_chain" className="font-semibold text-slate-700 select-none">
                  Requires Cold-Chain Refrigeration (2°C - 8°C)
                </label>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white font-bold"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
