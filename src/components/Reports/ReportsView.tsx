import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDateReadable, getPnLColorClass } from '../../utils/formatters';
import { PnLChart } from '../Dashboard/PnLChart';
import { Badge } from '../Common/Badge';

export const ReportsView: React.FC = () => {
  const { trades, ledger, metrics } = useApp();

  const [reportTab, setReportTab] = useState<'weekly' | 'monthly' | 'type'>('weekly');

  // Only settled trades count for realized performance reports
  const settledTrades = useMemo(() => {
    return trades.filter((t) =>
      t.settlementStatus === 'SETTLED' || (t.status === 'CLOSED' && t.settlementStatus === undefined)
    );
  }, [trades]);

  // Delivery vs Intraday Performance
  const typePerformance = useMemo(() => {
    const stats = {
      DELIVERY: { count: 0, wins: 0, losses: 0, net: 0, charges: 0 },
      INTRADAY: { count: 0, wins: 0, losses: 0, net: 0, charges: 0 },
    };

    for (const t of settledTrades) {
      const type = t.tradeType;
      const actual = t.actualPnL !== undefined ? t.actualPnL : t.netPnL;
      const chg = t.expectedCharges !== undefined ? t.expectedCharges : t.totalCharges;

      stats[type].count++;
      stats[type].net += actual;
      stats[type].charges += chg;

      if (actual > 0) stats[type].wins++;
      else if (actual < 0) stats[type].losses++;
    }

    return stats;
  }, [settledTrades]);

  // Weekly Grouping
  const weeklyPerformance = useMemo(() => {
    const map = new Map<string, {
      weekLabel: string;
      startDate: string;
      trades: number;
      wins: number;
      losses: number;
      netPnL: number;
    }>();

    for (const t of settledTrades) {
      const dateStr = t.settlementDate || t.sellDate || t.tradeDate;
      const d = new Date(dateStr);
      // Find Monday of the week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];

      const current = map.get(weekKey) || {
        weekLabel: `Week of ${formatDateReadable(weekKey)}`,
        startDate: weekKey,
        trades: 0,
        wins: 0,
        losses: 0,
        netPnL: 0,
      };

      const actual = t.actualPnL !== undefined ? t.actualPnL : t.netPnL;
      current.trades++;
      current.netPnL += actual;
      if (actual > 0) current.wins++;
      else if (actual < 0) current.losses++;

      map.set(weekKey, current);
    }

    return Array.from(map.values()).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [settledTrades]);

  // Monthly Grouping
  const monthlyPerformance = useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      monthLabel: string;
      trades: number;
      wins: number;
      losses: number;
      netPnL: number;
    }>();

    for (const t of settledTrades) {
      const dateStr = t.settlementDate || t.sellDate || t.tradeDate;
      const monthKey = dateStr.substring(0, 7); // YYYY-MM
      const [year, month] = monthKey.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthLabel = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      const current = map.get(monthKey) || {
        monthKey,
        monthLabel,
        trades: 0,
        wins: 0,
        losses: 0,
        netPnL: 0,
      };

      const actual = t.actualPnL !== undefined ? t.actualPnL : t.netPnL;
      current.trades++;
      current.netPnL += actual;
      if (actual > 0) current.wins++;
      else if (actual < 0) current.losses++;

      map.set(monthKey, current);
    }

    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [settledTrades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Trading Reports & Performance</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Performance based strictly on actual settled broker profit/loss
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setReportTab('weekly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              reportTab === 'weekly' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Weekly P&L
          </button>
          <button
            onClick={() => setReportTab('monthly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              reportTab === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly P&L
          </button>
          <button
            onClick={() => setReportTab('type')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              reportTab === 'type' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Intraday vs Delivery
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Total Actual Profit</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            +{formatINR(metrics.totalRealizedNetProfit || 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {metrics.winningTradesCount} winning trades
          </p>
        </div>

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span>Total Actual Loss</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            -{formatINR(metrics.totalRealizedNetLoss || 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {metrics.losingTradesCount} losing trades
          </p>
        </div>

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-blue-400 font-medium">
            <span>Net Realized P&L</span>
            <Award className="w-4 h-4" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${getPnLColorClass(metrics.totalNetRealizedPnL)}`}>
            {formatINR(metrics.totalNetRealizedPnL, { showSign: true })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            All settled trades
          </p>
        </div>

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Win Rate</span>
            <span className="text-xs font-bold text-white">{metrics.winRate}%</span>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.winningTradesCount}W / {metrics.losingTradesCount}L
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {settledTrades.length} settled trades total
          </p>
        </div>
      </div>

      {/* Equity & P&L Curve */}
      <PnLChart ledger={ledger} />

      {/* Tab Content */}
      {reportTab === 'weekly' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Weekly Actual Net Profit / Loss</span>
            </h3>
            <span className="text-xs text-gray-400">Chronological weeks</span>
          </div>

          {weeklyPerformance.length === 0 ? (
            <div className="p-8 text-center bg-gray-950/40 rounded-xl border border-gray-800 text-gray-500 text-sm">
              No settled trades yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/70 text-gray-400 uppercase text-[11px] border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Week</th>
                    <th className="px-4 py-3 text-center">Trades</th>
                    <th className="px-4 py-3 text-center">Win / Loss</th>
                    <th className="px-4 py-3 text-right">Actual Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {weeklyPerformance.map((w) => (
                    <tr key={w.startDate} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">{w.weekLabel}</td>
                      <td className="px-4 py-3.5 text-center text-gray-300">{w.trades}</td>
                      <td className="px-4 py-3.5 text-center text-gray-300">
                        <span className="text-emerald-400 font-semibold">{w.wins}W</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-rose-400 font-semibold">{w.losses}L</span>
                      </td>
                      <td className={`px-4 py-3.5 text-right font-bold ${getPnLColorClass(w.netPnL)}`}>
                        {formatINR(w.netPnL, { showSign: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reportTab === 'monthly' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Monthly Actual Net Profit / Loss</span>
            </h3>
            <span className="text-xs text-gray-400">Monthly breakdown</span>
          </div>

          {monthlyPerformance.length === 0 ? (
            <div className="p-8 text-center bg-gray-950/40 rounded-xl border border-gray-800 text-gray-500 text-sm">
              No settled trades yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/70 text-gray-400 uppercase text-[11px] border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-center">Trades</th>
                    <th className="px-4 py-3 text-center">Win / Loss</th>
                    <th className="px-4 py-3 text-right">Actual Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {monthlyPerformance.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">{m.monthLabel}</td>
                      <td className="px-4 py-3.5 text-center text-gray-300">{m.trades}</td>
                      <td className="px-4 py-3.5 text-center text-gray-300">
                        <span className="text-emerald-400 font-semibold">{m.wins}W</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-rose-400 font-semibold">{m.losses}L</span>
                      </td>
                      <td className={`px-4 py-3.5 text-right font-bold ${getPnLColorClass(m.netPnL)}`}>
                        {formatINR(m.netPnL, { showSign: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reportTab === 'type' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Intraday vs. Delivery Performance</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Card */}
            <div className="p-5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="emerald">Delivery (Cash)</Badge>
                <span className="text-xs text-gray-400">{typePerformance.DELIVERY.count} trades</span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-gray-400">Actual Realized P&L</div>
                <div className={`text-2xl font-bold mt-1 ${getPnLColorClass(typePerformance.DELIVERY.net)}`}>
                  {formatINR(typePerformance.DELIVERY.net, { showSign: true })}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                <span>Wins: <strong className="text-emerald-400">{typePerformance.DELIVERY.wins}</strong></span>
                <span>Losses: <strong className="text-rose-400">{typePerformance.DELIVERY.losses}</strong></span>
                <span>Charges: <strong>{formatINR(typePerformance.DELIVERY.charges)}</strong></span>
              </div>
            </div>

            {/* Intraday Card */}
            <div className="p-5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="cyan">Intraday (Margin)</Badge>
                <span className="text-xs text-gray-400">{typePerformance.INTRADAY.count} trades</span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-gray-400">Actual Realized P&L</div>
                <div className={`text-2xl font-bold mt-1 ${getPnLColorClass(typePerformance.INTRADAY.net)}`}>
                  {formatINR(typePerformance.INTRADAY.net, { showSign: true })}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                <span>Wins: <strong className="text-emerald-400">{typePerformance.INTRADAY.wins}</strong></span>
                <span>Losses: <strong className="text-rose-400">{typePerformance.INTRADAY.losses}</strong></span>
                <span>Charges: <strong>{formatINR(typePerformance.INTRADAY.charges)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
