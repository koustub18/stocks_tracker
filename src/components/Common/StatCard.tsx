import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subLabel?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  tooltip?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  subLabel,
  variant = 'default',
  tooltip,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400';
      case 'danger':
        return 'border-rose-500/20 bg-rose-950/20 text-rose-400';
      case 'warning':
        return 'border-amber-500/20 bg-amber-950/20 text-amber-400';
      case 'primary':
        return 'border-cyan-500/20 bg-cyan-950/20 text-cyan-300';
      default:
        return 'border-slate-800 bg-slate-900/60 text-slate-100';
    }
  };

  return (
    <div
      className={`relative p-3.5 rounded-lg border backdrop-blur-xs flex flex-col justify-between transition-all duration-150 hover:border-slate-700 ${getVariantStyles()}`}
      title={tooltip}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono uppercase tracking-wider">
        <span>{label}</span>
        {icon && <span className="opacity-70">{icon}</span>}
      </div>
      <div className="text-xl font-bold font-mono tracking-tight my-0.5">
        {value}
      </div>
      {(subValue || subLabel) && (
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60">
          <span>{subLabel}</span>
          <span className="font-semibold text-slate-300">{subValue}</span>
        </div>
      )}
    </div>
  );
};
