import React from 'react';
import { DailyLedgerEntry } from '../../types';
import { formatINR, formatDateIndian } from '../../utils/formatters';

interface PnLChartProps {
  ledger: DailyLedgerEntry[];
}

export const PnLChart: React.FC<PnLChartProps> = ({ ledger }) => {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs font-mono text-slate-500 border border-slate-800 rounded-xl bg-slate-950/40">
        No trading days recorded yet. Add trades or cash transactions to view equity curve.
      </div>
    );
  }

  // Points for closing balances
  const points = ledger.map((entry) => ({
    date: entry.date,
    balance: entry.closingBalance,
    netPnL: entry.netTradingPnL,
  }));

  const balances = points.map((p) => p.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const range = maxBalance - minBalance || 1;

  // Chart dimensions
  const width = 800;
  const height = 180;
  const padding = 20;

  const getX = (index: number) => {
    if (points.length <= 1) return width / 2;
    return padding + (index / (points.length - 1)) * (width - 2 * padding);
  };

  const getY = (val: number) => {
    return height - padding - ((val - minBalance) / range) * (height - 2 * padding);
  };

  // Generate SVG path for line
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.balance)}`)
    .join(' ');

  // Area under line
  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  const isOverallProfitable = (points[points.length - 1]?.balance || 0) >= (points[0]?.balance || 0);

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-bold text-slate-200 uppercase tracking-wider">
          Daily Balance & Equity Curve
        </span>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Min: <strong className="text-slate-300">{formatINR(minBalance)}</strong></span>
          <span>Max: <strong className="text-slate-300">{formatINR(maxBalance)}</strong></span>
          <span>Days: <strong className="text-emerald-400">{points.length}</strong></span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                stopColor={isOverallProfitable ? '#10b981' : '#f43f5e'}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={isOverallProfitable ? '#10b981' : '#f43f5e'}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={getY(minBalance)}
            x2={width - padding}
            y2={getY(minBalance)}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={getY(maxBalance)}
            x2={width - padding}
            y2={getY(maxBalance)}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill="url(#equityGrad)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={isOverallProfitable ? '#34d399' : '#fb7185'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(p.balance)}
              r="3.5"
              className={isOverallProfitable ? 'fill-emerald-400 stroke-slate-900' : 'fill-rose-400 stroke-slate-900'}
              strokeWidth="2"
            >
              <title>{`${formatDateIndian(p.date)}: ${formatINR(p.balance)}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      {/* Axis dates */}
      <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 pt-1 border-t border-slate-800/80">
        <span>{formatDateIndian(points[0].date)}</span>
        {points.length > 2 && (
          <span>{formatDateIndian(points[Math.floor(points.length / 2)].date)}</span>
        )}
        <span>{formatDateIndian(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
};
