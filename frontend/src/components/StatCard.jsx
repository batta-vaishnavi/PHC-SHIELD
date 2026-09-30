import React from 'react';

export const StatCard = ({
  title,
  value,
  unit = '',
  subtitle = null,
  icon: Icon,
  variant = 'default', // default, critical, warning, success
  badge = null,
  onClick = null
}) => {
  const variantStyles = {
    default: {
      card: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-navy-50 text-navy-800',
      accent: 'text-slate-900'
    },
    critical: {
      card: 'border-rose-200 bg-rose-50/40 hover:border-rose-300',
      iconBg: 'bg-rose-100 text-rose-600',
      accent: 'text-rose-700'
    },
    warning: {
      card: 'border-amber-200 bg-amber-50/40 hover:border-amber-300',
      iconBg: 'bg-amber-100 text-amber-700',
      accent: 'text-amber-800'
    },
    success: {
      card: 'border-teal-200 bg-teal-50/40 hover:border-teal-300',
      iconBg: 'bg-teal-100 text-teal-700',
      accent: 'text-teal-800'
    }
  }[variant] || variantStyles.default;

  const displayVal = (value === null || value === undefined || value === '') ? '—' : value;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-card transition-all duration-200 ${variantStyles.card} ${
        onClick ? 'cursor-pointer hover:shadow-card-hover transform hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${variantStyles.accent}`}>
              {displayVal}
            </span>
            {unit && displayVal !== '—' && (
              <span className="text-xs font-semibold text-slate-500">{unit}</span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${variantStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
