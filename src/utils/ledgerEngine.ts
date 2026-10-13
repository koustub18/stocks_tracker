import { BuyLot, CashTransaction, DailyLedgerEntry, TradeExecution } from '../types';
import { addMoney, roundTo, subMoney, toPaise, toRupees } from './precision';

/**
 * Calculates chronological daily ledger entries from initial capital, cash transactions, and trades.
 * Recalculates all balances deterministically from day 0 to the latest date.
 */
export function buildDailyLedger(
  initialCapital: number,
  cashTransactions: CashTransaction[],
  trades: TradeExecution[],
  buyLots: BuyLot[] = []
): DailyLedgerEntry[] {
  // Collect all unique dates from cash transactions and closed trades
  const dateSet = new Set<string>();

  for (const txn of cashTransactions) {
    if (txn.date) dateSet.add(txn.date);
  }

  for (const trade of trades) {
    // Closed trades realize P&L on settlementDate, sellDate, or tradeDate. Only settled trades realize P&L.
    const isSettled = trade.settlementStatus === 'SETTLED' || (trade.status === 'CLOSED' && trade.settlementStatus === undefined);
    if (isSettled) {
      const exitDate = trade.settlementDate || trade.sellDate || trade.tradeDate;
      if (exitDate) dateSet.add(exitDate);
    }
  }

  // If no transactions exist, return empty
  if (dateSet.size === 0) {
    return [];
  }

  const sortedDates = Array.from(dateSet).sort();

  // Group cash txns by date
  const cashByDate = new Map<string, CashTransaction[]>();
  for (const txn of cashTransactions) {
    const list = cashByDate.get(txn.date) || [];
    list.push(txn);
    cashByDate.set(txn.date, list);
  }

  // Group settled trades by realization date (settlementDate, sellDate, or tradeDate)
  const tradesByDate = new Map<string, TradeExecution[]>();
  for (const trade of trades) {
    const isSettled = trade.settlementStatus === 'SETTLED' || (trade.status === 'CLOSED' && trade.settlementStatus === undefined);
    if (isSettled) {
      const exitDate = trade.settlementDate || trade.sellDate || trade.tradeDate;
      const list = tradesByDate.get(exitDate) || [];
      list.push(trade);
      tradesByDate.set(exitDate, list);
    }
  }

  const ledger: DailyLedgerEntry[] = [];
  let runningOpeningBalance = roundTo(initialCapital, 2);

  for (const date of sortedDates) {
    const dayCashTxns = cashByDate.get(date) || [];
    const dayTrades = tradesByDate.get(date) || [];

    // Sum deposits and withdrawals
    let dayDeposits = 0;
    let dayWithdrawals = 0;

    for (const txn of dayCashTxns) {
      if (txn.type === 'DEPOSIT') {
        dayDeposits = addMoney(dayDeposits, txn.amount);
      } else if (txn.type === 'WITHDRAWAL') {
        dayWithdrawals = addMoney(dayWithdrawals, txn.amount);
      } else if (txn.type === 'INITIAL') {
        // Explicit initial deposit transaction on this date
        dayDeposits = addMoney(dayDeposits, txn.amount);
      }
    }

    // Sum realized P&L and charges for settled trades on this date
    let dayNetPnL = 0;
    let dayGrossPnL = 0;
    let dayTradingCharges = 0;

    for (const trade of dayTrades) {
      const realizedPnL = trade.actualPnL !== undefined ? trade.actualPnL : trade.netPnL;
      dayNetPnL = addMoney(dayNetPnL, realizedPnL);
      dayGrossPnL = addMoney(dayGrossPnL, trade.grossPnL);
      dayTradingCharges = addMoney(dayTradingCharges, trade.expectedCharges !== undefined ? trade.expectedCharges : trade.totalCharges);
    }

    // Formula: Closing Balance = Opening Balance + Deposits - Withdrawals + Net Realized Trading P&L
    // Using integer paise math:
    const openingPaise = toPaise(runningOpeningBalance);
    const depositsPaise = toPaise(dayDeposits);
    const withdrawalsPaise = toPaise(dayWithdrawals);
    const netPnLPaise = toPaise(dayNetPnL);

    const closingPaise = openingPaise + depositsPaise - withdrawalsPaise + netPnLPaise;
    const closingBalance = toRupees(closingPaise);

    // Calculate deployed capital in open holdings up to this date
    let deployedCapitalInHoldings = 0;
    for (const lot of buyLots) {
      // If the lot was bought on or before this date and has remaining shares
      if (lot.buyDate <= date && lot.remainingQuantity > 0) {
        const lotCost = roundTo(lot.remainingQuantity * lot.buyPrice, 2);
        const lotCharges = roundTo(lot.remainingBuyCharges || 0, 2);
        deployedCapitalInHoldings = addMoney(deployedCapitalInHoldings, addMoney(lotCost, lotCharges));
      }
    }

    // Available liquid cash = Closing Balance - Deployed Capital
    const availableCashBalance = subMoney(closingBalance, deployedCapitalInHoldings);

    ledger.push({
      date,
      openingBalance: runningOpeningBalance,
      deposits: dayDeposits,
      withdrawals: dayWithdrawals,
      netTradingPnL: dayNetPnL,
      grossTradingPnL: dayGrossPnL,
      tradingCharges: dayTradingCharges,
      tradeCount: dayTrades.length,
      closingBalance,
      deployedCapitalInOpenHoldings: deployedCapitalInHoldings,
      availableCashBalance,
      transactions: {
        cashTxns: dayCashTxns,
        trades: dayTrades,
      },
    });

    // Closing balance becomes opening balance of next day
    runningOpeningBalance = closingBalance;
  }

  return ledger;
}
