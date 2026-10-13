import React, { useState } from 'react';
import {
  BookOpen,
  CircleDollarSign,
  Download,
  Info,
  ChevronDown,
  ChevronRight,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDateIndian, formatDateReadable, getPnLColorClass } from '../../utils/formatters';
import { generateLedgerCSV, triggerFileDownload } from '../../utils/exportImport';
import { Badge } from '../Common/Badge';
import { ConfirmDialog } from '../Common/ConfirmDialog';

export const CashLedgerView: React.FC<{ onOpenCashModal: () => void }> = ({ onOpenCashModal }) => {
  const { ledger, cashTransactions, deleteCashTxn, settings, metrics } = useApp();

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const sortedLedger = React.useMemo(() => {
    return sortOrder === 'DESC' ? [...ledger].reverse() : [...ledger];
  }, [ledger, sortOrder]);

  const handleExportCSV = () => {
    const csvContent = generateLedgerCSV(ledger);
    triggerFileDownload(csvContent, `daily_ledger_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleConfirmDeleteTxn = async () => {
    if (deletingTxnId) {
      await deleteCashTxn(deletingTxnId);
      setDeletingTxnId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" />
            <span>DAILY BALANCE & CASH LEDGER</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chronological daily equity ledger updated automatically from recorded trades and cash transfers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-800 transition-colors"
          >
            Sort: {sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={ledger.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenCashModal}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <CircleDollarSign size={14} />
            <span>+ Deposit / Withdraw</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-3.5 rounded-xl border border-cyan-800/40 bg-cyan-950/20 text-xs font-mono text-cyan-200 flex items-start gap-2.5">
        <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-cyan-300">
            Accounting Formula: Closing Balance = Opening Balance + Deposits - Withdrawals + Net Realized Trading P&L
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Note: This is an estimated personal ledger, not a live broker cash balance. Sale proceeds of delivery trades return invested capital and are not counted twice as profit. Liquid cash separates funds deployed into open holdings from available free cash.
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="w-8 px-2 py-3 text-center"></th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3 text-right">Opening Balance</th>
                <th className="px-3 py-3 text-right">Deposits (+)</th>
                <th className="px-3 py-3 text-right">Withdrawals (-)</th>
                <th className="px-3 py-3 text-right">Net Trading P&L</th>
                <th className="px-3 py-3 text-right">Closing Balance</th>
                <th className="px-3 py-3 text-right text-cyan-400">Available Liquid Cash</th>
                <th className="px-3 py-3 text-center">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {sortedLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No transactions or trades recorded yet. Start by recording a trade or cash deposit.
                  </td>
                </tr>
              ) : (
                sortedLedger.map((row) => {
                  const isExpanded = expandedDate === row.date;
                  const hasDetails = row.transactions.cashTxns.length > 0 || row.transactions.trades.length > 0;

                  return (
                    <React.Fragment key={row.date}>
                      <tr
                        onClick={() => hasDetails && setExpandedDate(isExpanded ? null : row.date)}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          hasDetails ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="px-2 py-3 text-center text-slate-500">
                          {hasDetails && (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                          )}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-200 whitespace-nowrap">
                          {formatDateIndian(row.date)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {formatINR(row.openingBalance)}
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-400 font-semibold">
                          {row.deposits > 0 ? `+${formatINR(row.deposits)}` : '--'}
                        </td>
                        <td className="px-3 py-3 text-right text-rose-400 font-semibold">
                          {row.withdrawals > 0 ? `-${formatINR(row.withdrawals)}` : '--'}
                        </td>
                        <td className="px-3 py-3 text-right font-bold">
                          {row.tradeCount > 0 ? (
                            <span className={getPnLColorClass(row.netTradingPnL)}>
                              {formatINR(row.netTradingPnL, { showSign: true })}
                            </span>
                          ) : (
                            <span className="text-slate-500">--</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-slate-100">
                          {formatINR(row.closingBalance)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-cyan-300">
                          {formatINR(row.availableCashBalance)}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 text-[10px]">
                          {row.tradeCount > 0 && `${row.tradeCount} trade${row.tradeCount > 1 ? 's' : ''}`}
                          {row.tradeCount > 0 && row.transactions.cashTxns.length > 0 && ' • '}
                          {row.transactions.cashTxns.length > 0 && `${row.transactions.cashTxns.length} cash`}
                          {row.tradeCount === 0 && row.transactions.cashTxns.length === 0 && '--'}
                        </td>
                      </tr>

                      {/* Expanded Sub-Row with daily breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70">
                          <td colSpan={9} className="p-4 border-y border-slate-800">
                            <div className="space-y-4 max-w-4xl mx-auto">
                              {/* Cash Transactions on this date */}
                              {row.transactions.cashTxns.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Cash Transfers on {formatDateReadable(row.date)}
                                  </span>
                                  <div className="divide-y divide-slate-850 rounded-lg border border-slate-800 bg-slate-900/50">
                                    {row.transactions.cashTxns.map((c) => (
                                      <div
                                        key={c.id}
                                        className="p-2.5 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          {c.type === 'DEPOSIT' || c.type === 'INITIAL' ? (
                                            <ArrowDownRight size={14} className="text-emerald-400" />
                                          ) : (
                                            <ArrowUpRight size={14} className="text-rose-400" />
                                          )}
                                          <span className="font-semibold text-slate-200">
                                            {c.type}: {formatINR(c.amount)}
                                          </span>
                                          {c.notes && (
                                            <span className="text-slate-400 text-[11px]">
                                              ({c.notes})
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => setDeletingTxnId(c.id)}
                                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                          title="Delete cash transaction"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Trades Closed on this date */}
                              {row.transactions.trades.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Closed Trades Realized on {formatDateReadable(row.date)}
                                  </span>
                                  <div className="divide-y divide-slate-850 rounded-lg border border-slate-800 bg-slate-900/50">
                                    {row.transactions.trades.map((t) => (
                                      <div
                                        key={t.id}
                                        className="p-2.5 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge variant={t.tradeType === 'DELIVERY' ? 'emerald' : 'cyan'}>
                                            {t.tradeType}
                                          </Badge>
                                          <span className="font-bold text-slate-100">{t.symbol}</span>
                                          <span className="text-slate-400">
                                            ({t.quantity} shares @ Buy {formatINR(t.buyPrice)} &rarr; Sell {formatINR(t.sellPrice || 0)})
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className="text-slate-400 text-[11px]">
                                            Charges: -{formatINR(t.totalCharges)}
                                          </span>
                                          <span className={`font-bold ${getPnLColorClass(t.netPnL)}`}>
                                            Net: {formatINR(t.netPnL, { showSign: true })}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTxnId}
        onClose={() => setDeletingTxnId(null)}
        onConfirm={handleConfirmDeleteTxn}
        title="Delete Cash Transaction"
        message="Are you sure you want to delete this cash deposit or withdrawal? All subsequent daily balances in your cash ledger will be automatically recalculated."
        confirmText="Delete Transaction"
        isDanger={true}
      />
    </div>
  );
};
