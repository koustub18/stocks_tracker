import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'slate' | 'indigo';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'xs',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
      case 'rose':
        return 'bg-rose-950/70 text-rose-400 border-rose-800/60';
      case 'amber':
        return 'bg-amber-950/70 text-amber-400 border-amber-800/60';
      case 'cyan':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60';
      case 'indigo':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return 'px-1.5 py-0.5 text-[10px] font-mono';
      case 'sm':
        return 'px-2 py-0.5 text-xs font-mono';
      case 'md':
        return 'px-2.5 py-1 text-sm font-mono';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium uppercase tracking-wider ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {children}
    </span>
  );
};
