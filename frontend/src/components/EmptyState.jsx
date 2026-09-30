import React from 'react';
import { Database, Plus, Upload, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const EmptyState = ({
  icon: Icon = Database,
  title = "No healthcare data available yet.",
  description = "Get started by adding records, importing a dataset via CSV, or loading the synthetic demonstration suite.",
  actions = null,
  showDefaultFirstLaunchButtons = false,
  onAddPhc = null,
  onAddMedicine = null,
  onAddStock = null,
  onAddFootfall = null,
  onAddBed = null,
  onAddStaff = null,
}) => {
  const { setShowCsvModal, setShowDemoModal, setActiveTab } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 md:p-12 text-center max-w-3xl mx-auto shadow-sm my-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
        {description}
      </p>

      {showDefaultFirstLaunchButtons ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => onAddPhc ? onAddPhc() : setActiveTab('phcs')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add PHC
          </button>
          <button
            onClick={() => onAddMedicine ? onAddMedicine() : setActiveTab('medicines')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Medicine Data
          </button>
          <button
            onClick={() => onAddFootfall ? onAddFootfall() : setActiveTab('footfall')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Footfall Data
          </button>
          <button
            onClick={() => onAddBed ? onAddBed() : setActiveTab('beds')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bed Data
          </button>
          <button
            onClick={() => onAddStaff ? onAddStaff() : setActiveTab('staff')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Staff Data
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            Upload CSV
          </button>
          <button
            onClick={() => setShowDemoModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white text-xs font-semibold shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5 text-teal-300" />
            Load Demo Dataset
          </button>
        </div>
      ) : (
        actions && <div className="mt-6 flex items-center justify-center gap-3">{actions}</div>
      )}
    </div>
  );
};
