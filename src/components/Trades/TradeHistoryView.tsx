import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Trash2,
  Edit,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TradeExecution } from '../../types';
import { formatINR, formatDateIndian, getPnLColorClass } from '../../utils/formatters';
import { generateTradesCSV, triggerFileDownload } from '../../utils/exportImport';
import { Badge } from '../Common/Badge';
import { EditTradeModal } from './EditTradeModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';

export const TradeHistoryView: React.FC = () => {
  const { trades, deleteTrade, updateTrade } = useApp();

  // Search & Filters State
  const [searchSymbol, setSearchSymbol] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DELIVERY' | 'INTRADAY'>('ALL');
  const [filterSettlement, setFilterSettlement] = useState<'ALL' | 'SETTLED' | 'PENDING'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected trade for edit / delete
  const [editingTrade, setEditingTrade] = useState<TradeExecution | null>(null);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Stock search
      if (searchSymbol.trim()) {
        const query = searchSymbol.trim().toUpperCase();
        const matches = trade.symbol.includes(query) || trade.stockName.toUpperCase().includes(query);
        if (!matches) return false;
      }

      // Type filter
      if (filterType !== 'ALL' && trade.tradeType !== filterType) {
        return false;
      }

      // Settlement filter
      if (filterSettlement === 'SETTLED') {
        const isSettled = trade.settlementStatus === 'SETTLED' || (trade.status === 'CLOSED' && trade.settlementStatus === undefined);
        if (!isSettled) return false;
      }
      if (filterSettlement === 'PENDING') {
        const isPending = trade.settlementStatus === 'PENDING' || trade.status === 'OPEN';
        if (!isPending) return false;
      }

      // Date filter
      const tDate = trade.tradeDate;
      if (startDate && tDate < startDate) return false;
      if (endDate && tDate > endDate) return false;

      return true;
    });
  }, [trades, searchSymbol, filterType, filterSettlement, startDate, endDate]);

  const handleExportCSV = () => {
    const csvContent = generateTradesCSV(filteredTrades);
    triggerFileDownload(csvContent, `stock_trades_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleConfirmDelete = async () => {
    if (deletingTradeId) {
      await deleteTrade(deletingTradeId);
      setDeletingTradeId(null);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Trade History</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            All recorded trades with expected vs. actual settled broker profit/loss
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredTrades.length === 0}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-40 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/60 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Symbol Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search stock..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Trade Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types (Delivery & Intraday)</option>
            <option value="DELIVERY">Delivery Only</option>
            <option value="INTRADAY">Intraday Only</option>
          </select>

          {/* Settlement Status Filter */}
          <select
            value={filterSettlement}
            onChange={(e) => setFilterSettlement(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Settlement Statuses</option>
            <option value="SETTLED">Settled Only</option>
            <option value="PENDING">Pending Settlement / Open</option>
          </select>

          {/* Date range inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="From date"
              className="w-1/2 px-2.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
            <span className="text-gray-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="To date"
              className="w-1/2 px-2.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800/80">
          <span>
            Showing <strong className="text-white">{filteredTrades.length}</strong> of {trades.length} trades
          </span>
          {(searchSymbol || filterType !== 'ALL' || filterSettlement !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchSymbol('');
                setFilterType('ALL');
                setFilterSettlement('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 text-gray-400 uppercase tracking-wider text-[11px] border-b border-gray-800">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Date</th>
                <th className="px-3.5 py-3 font-semibold">Stock</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 text-right font-semibold">Buy Price</th>
                <th className="px-3 py-3 text-right font-semibold">Sell Price</th>
                <th className="px-3 py-3 text-right font-semibold">Qty</th>
                <th className="px-3 py-3 text-right font-semibold">Capital Used</th>
                <th className="px-3.5 py-3 text-right font-semibold">Expected P&L</th>
                <th className="px-3.5 py-3 text-right font-semibold">Actual P&L</th>
                <th className="px-3 py-3 text-center font-semibold">Status</th>
                <th className="px-3 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    No trades match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const capUsed = t.capitalUsed !== undefined ? t.capitalUsed : (t.buyPrice * t.quantity);
                  const isSettled = t.settlementStatus === 'SETTLED' || (t.status === 'CLOSED' && t.settlementStatus === undefined);
                  const actual = t.actualPnL !== undefined ? t.actualPnL : t.netPnL;

                  return (
                    <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-3.5 py-3.5 text-gray-300 whitespace-nowrap">
                        {formatDateIndian(t.tradeDate)}
                      </td>
                      <td className="px-3.5 py-3.5">
                        <div className="font-bold text-white">{t.symbol}</div>
                        {t.notes && <div className="text-[10px] text-gray-500 truncate max-w-[130px]">{t.notes}</div>}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant={t.tradeType === 'DELIVERY' ? 'emerald' : 'cyan'}>
                          {t.tradeType === 'DELIVERY' ? 'Delivery' : 'Intraday'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5 text-right text-gray-300">
                        {formatINR(t.buyPrice)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-gray-300">
                        {t.sellPrice !== undefined ? formatINR(t.sellPrice) : '--'}
                      </td>
                      <td className="px-3 py-3.5 text-right font-medium text-gray-200">
                        {t.quantity}
                      </td>
                      <td className="px-3 py-3.5 text-right text-gray-400">
                        {formatINR(capUsed)}
                      </td>
                      <td className="px-3.5 py-3.5 text-right font-medium">
                        {t.status === 'CLOSED' ? (
                          <span className={getPnLColorClass(t.netPnL)}>
                            {formatINR(t.netPnL, { showSign: true })}
                          </span>
                        ) : (
                          <span className="text-gray-500">Open</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3.5 text-right font-bold">
                        {isSettled ? (
                          <span className={getPnLColorClass(actual)}>
                            {formatINR(actual, { showSign: true })}
                          </span>
                        ) : (
                          <span className="text-amber-400/90 text-[11px] font-normal">Pending</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
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
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSettled && t.status === 'CLOSED' && (
                            <button
                              onClick={() => handleQuickSettle(t)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-medium transition-colors cursor-pointer"
                              title="Mark as Settled"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => setEditingTrade(t)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-colors cursor-pointer"
                            title="Edit trade"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTradeId(t.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition-colors cursor-pointer"
                            title="Delete trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTradeModal
        trade={editingTrade}
        isOpen={!!editingTrade}
        onClose={() => setEditingTrade(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTradeId}
        onClose={() => setDeletingTradeId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? Any settled P&L will be removed from your balances and recalculations will update immediately."
        confirmText="Delete Trade"
        isDanger={true}
      />
    </div>
  );
};
