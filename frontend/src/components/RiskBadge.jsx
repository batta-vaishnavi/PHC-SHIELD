import React from 'react';

export const RiskBadge = ({ level, size = 'md' }) => {
  const normalized = (level || 'LOW').toUpperCase();

  const config = {
    HIGH: {
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      pulse: 'bg-rose-400',
      label: 'CRITICAL / HIGH'
    },
    MEDIUM: {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      pulse: 'bg-amber-400',
      label: 'MEDIUM RISK'
    },
    LOW: {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      pulse: 'bg-emerald-400',
      label: 'HEALTHY / LOW'
    }
  }[normalized] || {
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-400',
    pulse: 'bg-slate-300',
    label: normalized
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase rounded-full border shadow-xs ${config.bg} ${sizeClass}`}>
      <span className="flex h-2 w-2 relative">
        {normalized === 'HIGH' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulse}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
      </span>
      {config.label}
    </span>
  );
};
