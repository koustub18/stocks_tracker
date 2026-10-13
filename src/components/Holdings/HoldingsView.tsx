import React, { useState } from 'react';
import {
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Edit2,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, getPnLColorClass, getPnLBadgeClass } from '../../utils/formatters';
import { Badge } from '../Common/Badge';

export const HoldingsView: React.FC<{
  onSelectLotToSell?: (lotId: string) => void;
}> = ({ onSelectLotToSell }) => {
  const { holdings, updateCMP, metrics } = useApp();

  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  const handleStartEditCMP = (symbol: string, currentPrice: number) => {
    setEditingSymbol(symbol);
    setEditingPrice(currentPrice.toString());
  };

  const handleSaveCMP = async (symbol: string) => {
    const parsed = parseFloat(editingPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      await updateCMP(symbol, parsed);
    }
    setEditingSymbol(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-400" />
            <span>OPEN DELIVERY HOLDINGS & LOTS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track cost basis, buy lots, and unrealized profit/loss by updating Current Market Price (CMP)
          </p>
        </div>

        {/* Portfolio Summary Pill */}
        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Invested Capital</span>
            <span className="font-bold text-slate-200">{formatINR(metrics.openPositionsCostBasis)}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Current Value</span>
            <span className="font-bold text-cyan-300">{formatINR(metrics.openPositionsMarketValue)}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Unrealized P&L</span>
            <span className={`font-bold ${getPnLColorClass(metrics.unrealizedPnL)}`}>
              {formatINR(metrics.unrealizedPnL, { showSign: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      {holdings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <Layers size={36} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-mono font-bold text-slate-300">No Open Holdings Found</h3>
          <p className="text-xs font-mono text-slate-500 max-w-md mx-auto mt-1">
            When you record an open Delivery trade, it appears here with lot-by-lot tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {holdings.map((stock) => (
            <div
              key={stock.symbol}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4"
            >
              {/* Stock Consolidated Summary Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono text-slate-100">{stock.symbol}</span>
                      <Badge variant="cyan">{stock.exchange}</Badge>
                      <span className="text-xs font-mono text-slate-400">{stock.stockName}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Holding: <strong className="text-slate-200">{stock.totalQuantity}</strong> shares •
                      Avg Cost: <strong className="text-slate-200">{formatINR(stock.averageBuyPrice)}</strong> •
                      Invested: <strong className="text-slate-200">{formatINR(stock.totalInvested)}</strong>
                    </div>
                  </div>
                </div>

                {/* CMP Editor & Unrealized P&L */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Current Market Price (CMP)</span>
                    {editingSymbol === stock.symbol ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.05"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          className="w-24 px-2 py-1 bg-slate-950 border border-emerald-500 rounded text-xs font-mono text-slate-100"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCMP(stock.symbol)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditCMP(stock.symbol, stock.currentMarketPrice)}
                        className="flex items-center gap-1.5 cursor-pointer group mt-0.5"
                        title="Click to update CMP"
                      >
                        <span className="text-sm font-bold font-mono text-slate-200 group-hover:text-emerald-400">
                          {formatINR(stock.currentMarketPrice)}
                        </span>
                        <Edit2 size={12} className="text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    )}
                  </div>

                  <div className="text-right min-w-[120px]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Unrealized P&L</span>
                    <span className={`text-sm font-bold font-mono ${getPnLColorClass(stock.unrealizedPnL)}`}>
                      {formatINR(stock.unrealizedPnL, { showSign: true })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      ({stock.unrealizedPnLPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-lots list */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                  Individual Buy Lots ({stock.lots.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {stock.lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Bought {lot.buyDate}</span>
                        <span className="text-slate-400 text-[11px]">{lot.buyTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Remaining:</span>
                        <span className="text-emerald-400 font-bold">{lot.remainingQuantity} / {lot.originalQuantity} shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Buy Price:</span>
                        <span className="text-slate-200">{formatINR(lot.buyPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cost Basis:</span>
                        <span className="text-slate-200">{formatINR(lot.remainingQuantity * lot.buyPrice)}</span>
                      </div>

                      {onSelectLotToSell && (
                        <div className="pt-1.5 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => onSelectLotToSell(lot.id)}
                            className="w-full py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/60 text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>Exit / Sell this Lot</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
