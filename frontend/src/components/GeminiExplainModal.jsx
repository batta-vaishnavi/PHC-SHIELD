import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, ShieldAlert } from 'lucide-react';

export const GeminiExplainModal = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.explanation || data.summary || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-navy-800 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {data.title || "Gemini Clinical Intelligence Brief"}
              </h3>
              <p className="text-xs text-slate-500">
                {data.subtitle || "Automated operational insight grounded exclusively on live telemetry"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>AI-generated explanation based on available data. Verify before operational use.</span>
        </div>

        {/* AI Content Body */}
        <div className="overflow-y-auto py-4 flex-1 text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
          {data.explanation ? (
            <div className="whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
              {data.explanation}
            </div>
          ) : data.summary ? (
            <div className="whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
              {data.summary}
            </div>
          ) : (
            <p className="text-slate-400 italic">No explanation content returned.</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Briefing'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
