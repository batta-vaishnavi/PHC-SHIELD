import React, { useState } from 'react';
import { Upload, X, CheckCircle2, AlertOctagon, FileText, Download, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';

export const CsvUploadModal = ({ isOpen, onClose }) => {
  const { showToast, refreshStats, setActiveTab } = useApp();
  const [selectedFile, setSelectedFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidating(true);
    setValidationResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.validateCsv(formData);
      setValidationResult(res);
    } catch (err) {
      showToast(err.response?.data?.detail || 'CSV validation failed.', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !validationResult?.can_import) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await apiClient.importCsv(formData);
      showToast(res.message || 'Dataset imported successfully!', 'success');
      await refreshStats();
      onClose();
      setActiveTab('dashboard');
    } catch (err) {
      showToast(err.response?.data?.detail || 'CSV Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const header = "phc_id,phc_name,district,state,country,latitude,longitude,medicine,category,unit,min_threshold,lead_time,shelf_life_days,cold_chain_required,date,stock,daily_consumption,footfall,beds_total,beds_occupied,staff_total,staff_present\n";
    const sampleRows = [
      "PHC-101,Satara Rural PHC,Satara,Maharashtra,India,17.6805,74.0183,Amoxicillin 500mg,Antibiotic,strips,100,7,730,false,2026-09-01,150,15,65,25,12,18,16",
      "PHC-101,Satara Rural PHC,Satara,Maharashtra,India,17.6805,74.0183,Amoxicillin 500mg,Antibiotic,strips,100,7,730,false,2026-09-02,135,16,70,25,14,18,17",
      "PHC-101,Satara Rural PHC,Satara,Maharashtra,India,17.6805,74.0183,Rabies Vaccine,Vaccine,vials,40,10,365,true,2026-09-01,25,4,65,25,12,18,16",
      "PHC-102,Karad Health Station,Satara,Maharashtra,India,17.2885,74.1844,Amoxicillin 500mg,Antibiotic,strips,100,7,730,false,2026-09-01,350,12,80,30,18,20,19",
    ].join("\n");

    const blob = new Blob([header + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'phc_shield_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Healthcare CSV Dataset</h3>
              <p className="text-xs text-slate-500">Multi-facility batch ingestion with schema validation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 flex-1 space-y-5">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-6 text-center transition bg-slate-50/50">
            <input
              type="file"
              id="csv-file-input"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
              <FileText className="w-10 h-10 text-teal-600 mb-2" />
              <span className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to choose or drag CSV file'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Required columns: phc_id, phc_name, district, state, medicine, date, stock, daily_consumption, footfall, beds_total, beds_occupied, staff_total, staff_present, lead_time
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              <Download className="w-3.5 h-3.5" />
              Download Standard CSV Template (.csv)
            </button>
            {validating && <span className="text-xs font-bold text-teal-600 animate-pulse">Validating rows...</span>}
          </div>

          {/* Validation Report */}
          {validationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-100 rounded-lg text-center">
                  <span className="text-xs font-semibold text-slate-500 block">Total Rows</span>
                  <span className="text-lg font-bold text-slate-800">{validationResult.total_rows}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <span className="text-xs font-semibold text-emerald-700 block">Valid Rows</span>
                  <span className="text-lg font-bold text-emerald-800">{validationResult.valid_rows}</span>
                </div>
                <div className={`p-3 rounded-lg text-center border ${validationResult.invalid_rows > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-100'}`}>
                  <span className={`text-xs font-semibold block ${validationResult.invalid_rows > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    Invalid Rows
                  </span>
                  <span className={`text-lg font-bold ${validationResult.invalid_rows > 0 ? 'text-rose-800' : 'text-slate-800'}`}>
                    {validationResult.invalid_rows}
                  </span>
                </div>
              </div>

              {/* Errors Display */}
              {validationResult.errors?.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-2">
                    <AlertOctagon className="w-4 h-4" />
                    Validation Errors ({validationResult.errors.length}):
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-rose-700 font-mono">
                    {validationResult.errors.map((err, i) => (
                      <div key={i} className="bg-white/80 p-1.5 rounded border border-rose-100">
                        {err.row > 0 && <span className="font-bold">Row {err.row}: </span>}
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {validationResult.preview_rows?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Preview (First 5 Rows):</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          {Object.keys(validationResult.preview_rows[0]).slice(0, 7).map((k) => (
                            <th key={k} className="p-2 border-b">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validationResult.preview_rows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {Object.values(row).slice(0, 7).map((val, cIdx) => (
                              <td key={cIdx} className="p-2 truncate max-w-[120px]">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!validationResult?.can_import || importing}
            onClick={handleImport}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg shadow-sm transition ${
              validationResult?.can_import && !importing
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {importing ? (
              <span>Importing Records...</span>
            ) : (
              <>
                <span>Confirm & Ingest Data</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
