import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Lock,
  Clock,
  PlusCircle,
  Edit2,
  Check,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDateIndian, getPnLColorClass } from '../../utils/formatters';
import { Badge } from '../Common/Badge';
import { TradeExecution } from '../../types';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onOpenCashModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { metrics, settings, updateSettings, trades, updateTrade } = useApp();

  const [isEditingStartingBalance, setIsEditingStartingBalance] = useState(false);
  const [startingBalanceInput, setStartingBalanceInput] = useState(
    (settings.initialTradingCapital || 0).toString()
  );

  const handleSaveStartingBalance = async () => {
    const val = parseFloat(startingBalanceInput);
    if (!isNaN(val) && val >= 0) {
      await updateSettings({ initialTradingCapital: val });
    }
    setIsEditingStartingBalance(false);
  };

  const handleQuickSettle = async (trade: TradeExecution) => {
    const today = new Date().toISOString().split('T')[0];
    const actual = trade.actualPnL !== undefined ? trade.actualPnL : trade.netPnL;
    await updateTrade(trade.id, {
      settlementStatus: 'SETTLED',
      actualPnL: actual,
      settlementDate: today,
    });
  };

  const recentTrades = trades.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Starting Balance & Account Summary Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Trading Account Overview
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800/40 font-mono">
                INR (₹)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Personal Trading Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Starting Balance edit */}
            <div className="flex items-center bg-gray-950/80 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-gray-400 mr-2">Starting Capital:</span>
              {isEditingStartingBalance ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={startingBalanceInput}
                    onChange={(e) => setStartingBalanceInput(e.target.value)}
                    className="w-24 bg-gray-900 border border-blue-500 rounded px-2 py-0.5 text-white text-xs"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveStartingBalance}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                    title="Save"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {formatINR(settings.initialTradingCapital || 0)}
                  </span>
                  <button
                    onClick={() => {
                      setStartingBalanceInput((settings.initialTradingCapital || 0).toString());
                      setIsEditingStartingBalance(true);
                    }}
                    className="text-gray-400 hover:text-blue-400 cursor-pointer"
                    title="Edit starting balance"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigateTab('add-trade')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Trade</span>
            </button>
          </div>
        </div>

        {/* The 7 Core Metrics as specified */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* 1. Current Available Balance */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-blue-500/30">
            <div className="flex items-center justify-between text-xs text-blue-400 font-medium mb-1">
              <span>Current Available Balance</span>
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {formatINR(metrics.currentAvailableTradingBalance)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Total capital minus money tied up in open trades
            </p>
          </div>

          {/* 2. Total Actual Net Profit */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-emerald-500/20">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium mb-1">
              <span>Total Actual Net Profit</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              +{formatINR(metrics.totalRealizedNetProfit || 0)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Sum of all profitable settled trades
            </p>
          </div>

          {/* 3. Total Actual Net Loss */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-rose-500/20">
            <div className="flex items-center justify-between text-xs text-rose-400 font-medium mb-1">
              <span>Total Actual Net Loss</span>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              -{formatINR(metrics.totalRealizedNetLoss || 0)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Sum of all loss-making settled trades
            </p>
          </div>

          {/* 4. Today's Realized P&L */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-1">
              <span>Today's Realized P&L</span>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold mt-1 ${getPnLColorClass(metrics.todayNetPnL)}`}>
              {formatINR(metrics.todayNetPnL, { showSign: true })}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Credited settlements today
            </p>
          </div>

          {/* 5. This Month's Realized P&L */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-1">
              <span>This Month's Realized P&L</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold mt-1 ${getPnLColorClass(metrics.monthlyNetPnL)}`}>
              {formatINR(metrics.monthlyNetPnL, { showSign: true })}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Total credited settlements this month
            </p>
          </div>

          {/* 6. Money Currently Tied Up in Open Trades */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-amber-500/20">
            <div className="flex items-center justify-between text-xs text-amber-400 font-medium mb-1">
              <span>Capital Tied Up In Open Trades</span>
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-1">
              {formatINR(metrics.moneyTiedUpInOpenTrades || 0)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Margin / cash currently committed in active trades
            </p>
          </div>

          {/* 7. Pending Settlements */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-1">
              <span>Pending Settlements</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {metrics.pendingSettlementsCount || 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Trades awaiting broker credit confirmation
            </p>
          </div>

          {/* Ledger Rule Explainer Card */}
          <div className="p-4 rounded-xl bg-gray-950/40 border border-gray-800 flex flex-col justify-center">
            <div className="text-xs font-semibold text-gray-300 mb-1">
              Balance Accounting Rule
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Expected P&L is never added to cash. Only settled broker profits/losses update your balance. Deployed trade margin is held separately until closed.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Trades</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Latest activity and settlement status
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('trades')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
          >
            View all ({trades.length}) &rarr;
          </button>
        </div>

        {recentTrades.length === 0 ? (
          <div className="p-8 text-center bg-gray-950/40 rounded-xl border border-gray-800 text-gray-500 text-sm">
            No trades recorded yet. Click "Add Trade" to record your first stock trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/70 text-gray-400 uppercase text-[11px] border-b border-gray-800">
                <tr>
                  <th className="px-3.5 py-3">Date</th>
                  <th className="px-3.5 py-3">Stock</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3 text-right">Buy</th>
                  <th className="px-3 py-3 text-right">Sell</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right">Capital</th>
                  <th className="px-3.5 py-3 text-right">Expected P&L</th>
                  <th className="px-3.5 py-3 text-right">Actual P&L</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {recentTrades.map((t) => {
                  const isSettled = t.settlementStatus === 'SETTLED' || (t.status === 'CLOSED' && t.settlementStatus === undefined);
                  const actual = t.actualPnL !== undefined ? t.actualPnL : t.netPnL;
                  const cap = t.capitalUsed !== undefined ? t.capitalUsed : (t.buyPrice * t.quantity);

                  return (
                    <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-3.5 py-3 text-gray-300 whitespace-nowrap">
                        {formatDateIndian(t.tradeDate)}
                      </td>
                      <td className="px-3.5 py-3 font-bold text-white">
                        {t.symbol}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={t.tradeType === 'DELIVERY' ? 'emerald' : 'cyan'}>
                          {t.tradeType === 'DELIVERY' ? 'Delivery' : 'Intraday'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-300">
                        {formatINR(t.buyPrice)}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-300">
                        {t.sellPrice !== undefined ? formatINR(t.sellPrice) : '--'}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-200">
                        {t.quantity}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-400">
                        {formatINR(cap)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-medium">
                        {t.status === 'CLOSED' ? (
                          <span className={getPnLColorClass(t.netPnL)}>
                            {formatINR(t.netPnL, { showSign: true })}
                          </span>
                        ) : (
                          <span className="text-gray-500">Open</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold">
                        {isSettled ? (
                          <span className={getPnLColorClass(actual)}>
                            {formatINR(actual, { showSign: true })}
                          </span>
                        ) : (
                          <span className="text-amber-400/90 text-[11px] font-normal">Pending</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            isSettled
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {isSettled ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isSettled ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {!isSettled && t.status === 'CLOSED' ? (
                          <button
                            onClick={() => handleQuickSettle(t)}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-medium cursor-pointer"
                          >
                            Settle
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigateTab('trades')}
                            className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
