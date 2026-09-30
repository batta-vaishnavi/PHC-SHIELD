import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary", // primary, danger, teal
  onConfirm,
  onCancel,
  icon: Icon = AlertCircle
}) => {
  if (!isOpen) return null;

  const btnClasses = {
    primary: "bg-navy-800 hover:bg-navy-900 text-white",
    teal: "bg-teal-600 hover:bg-teal-700 text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
  }[confirmVariant] || "bg-teal-600 hover:bg-teal-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 transform transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${confirmVariant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-700'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-600 leading-relaxed">
          {message}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition ${btnClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
