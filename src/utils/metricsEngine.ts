import {
  BuyLot,
  CashTransaction,
  DailyLedgerEntry,
  DashboardMetrics,
  StockHoldingSummary,
  TradeExecution
} from '../types';
import { addMoney, roundTo, subMoney } from './precision';

/**
 * Groups active buy lots into consolidated stock holdings with unrealized P&L
 */
export function buildStockHoldings(
  buyLots: BuyLot[],
  cmpMap: Record<string, number> = {}
): StockHoldingSummary[] {
  const map = new Map<string, BuyLot[]>();

  for (const lot of buyLots) {
    if (lot.remainingQuantity > 0) {
      const list = map.get(lot.symbol) || [];
      list.push(lot);
      map.set(lot.symbol, list);
    }
  }

  const summaries: StockHoldingSummary[] = [];

  for (const [symbol, lots] of map.entries()) {
    let totalQty = 0;
    let totalCost = 0;
    const stockName = lots[0].stockName || symbol;
    const exchange = lots[0].exchange || 'NSE';

    for (const lot of lots) {
      totalQty += lot.remainingQuantity;
      totalCost = addMoney(totalCost, lot.remainingQuantity * lot.buyPrice);
    }

    const avgBuyPrice = totalQty > 0 ? roundTo(totalCost / totalQty, 2) : 0;
    // Current Market Price: from lot.cmp or cmpMap or fallback to avgBuyPrice
    const cmp = cmpMap[symbol] ?? lots[0].cmp ?? avgBuyPrice;
    const currentValue = roundTo(totalQty * cmp, 2);
    const unrealizedPnL = roundTo(currentValue - totalCost, 2);
    const unrealizedPnLPercent = totalCost > 0 ? roundTo((unrealizedPnL / totalCost) * 100, 2) : 0;

    summaries.push({
      symbol,
      stockName,
      exchange,
      totalQuantity: totalQty,
      averageBuyPrice: avgBuyPrice,
      totalInvested: totalCost,
      currentMarketPrice: cmp,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      lots,
    });
  }

  return summaries.sort((a, b) => b.totalInvested - a.totalInvested);
}

/**
 * Calculates all 13 core dashboard metrics and advanced trading performance indicators
 */
export function calculateDashboardMetrics(
  initialCapital: number,
  cashTransactions: CashTransaction[],
  trades: TradeExecution[],
  buyLots: BuyLot[],
  ledger: DailyLedgerEntry[],
  cmpMap: Record<string, number> = {}
): DashboardMetrics {
  // Cash aggregates
  let totalDeposits = 0;
  let totalWithdrawals = 0;

  for (const txn of cashTransactions) {
    if (txn.type === 'DEPOSIT') {
      totalDeposits = addMoney(totalDeposits, txn.amount);
    } else if (txn.type === 'WITHDRAWAL') {
      totalWithdrawals = addMoney(totalWithdrawals, txn.amount);
    } else if (txn.type === 'INITIAL') {
      totalDeposits = addMoney(totalDeposits, txn.amount);
    }
  }

  // Filter for settled trades
  const settledTrades = trades.filter((t) =>
    t.settlementStatus === 'SETTLED' || (t.status === 'CLOSED' && t.settlementStatus === undefined)
  );

  let totalGrossProfit = 0;
  let totalGrossLoss = 0;
  let totalCharges = 0;
  let totalNetRealizedPnL = 0;
  let totalRealizedNetProfit = 0;
  let totalRealizedNetLoss = 0;
  let winningTradesCount = 0;
  let losingTradesCount = 0;
  let breakevenTradesCount = 0;
  let sumWinProfit = 0;
  let sumLoss = 0;

  for (const trade of settledTrades) {
    const tradeCharges = trade.expectedCharges !== undefined ? trade.expectedCharges : trade.totalCharges;
    const realizedPnL = trade.actualPnL !== undefined ? trade.actualPnL : trade.netPnL;

    totalCharges = addMoney(totalCharges, tradeCharges);
    totalNetRealizedPnL = addMoney(totalNetRealizedPnL, realizedPnL);

    if (trade.grossPnL > 0) {
      totalGrossProfit = addMoney(totalGrossProfit, trade.grossPnL);
    } else if (trade.grossPnL < 0) {
      totalGrossLoss = addMoney(totalGrossLoss, Math.abs(trade.grossPnL));
    }

    if (realizedPnL > 0) {
      winningTradesCount++;
      totalRealizedNetProfit = addMoney(totalRealizedNetProfit, realizedPnL);
      sumWinProfit = addMoney(sumWinProfit, realizedPnL);
    } else if (realizedPnL < 0) {
      losingTradesCount++;
      totalRealizedNetLoss = addMoney(totalRealizedNetLoss, Math.abs(realizedPnL));
      sumLoss = addMoney(sumLoss, Math.abs(realizedPnL));
    } else {
      breakevenTradesCount++;
    }
  }

  // Calculate money currently tied up in open trades / pending settlements
  let moneyTiedUpInOpenTrades = 0;
  let pendingSettlementsCount = 0;

  for (const trade of trades) {
    const isPending = trade.settlementStatus === 'PENDING' || trade.status === 'OPEN';
    if (isPending) {
      pendingSettlementsCount++;
      const tradeCapital = trade.capitalUsed ?? (trade.buyPrice * trade.quantity);
      moneyTiedUpInOpenTrades = addMoney(moneyTiedUpInOpenTrades, tradeCapital);
    }
  }

  const totalCompletedTrades = settledTrades.length;
  const winRate = totalCompletedTrades > 0 ? roundTo((winningTradesCount / totalCompletedTrades) * 100, 2) : 0;
  const avgProfitWinningTrade = winningTradesCount > 0 ? roundTo(sumWinProfit / winningTradesCount, 2) : 0;
  const avgLossLosingTrade = losingTradesCount > 0 ? roundTo(sumLoss / losingTradesCount, 2) : 0;
  const profitFactor = totalGrossLoss > 0 ? roundTo(totalGrossProfit / totalGrossLoss, 2) : totalGrossProfit > 0 ? 999 : 0;

  // Open positions and unrealized P&L
  const holdings = buildStockHoldings(buyLots, cmpMap);
  let openPositionsCostBasis = 0;
  let openPositionsMarketValue = 0;
  let totalUnrealizedPnL = 0;

  for (const h of holdings) {
    openPositionsCostBasis = addMoney(openPositionsCostBasis, h.totalInvested);
    openPositionsMarketValue = addMoney(openPositionsMarketValue, h.currentValue);
    totalUnrealizedPnL = addMoney(totalUnrealizedPnL, h.unrealizedPnL);
  }

  // Deployed capital in open holdings includes buy charges
  let deployedCapitalInOpenHoldings = 0;
  for (const lot of buyLots) {
    if (lot.remainingQuantity > 0) {
      const lotCost = roundTo(lot.remainingQuantity * lot.buyPrice, 2);
      const lotCharges = roundTo(lot.remainingBuyCharges || 0, 2);
      deployedCapitalInOpenHoldings = addMoney(deployedCapitalInOpenHoldings, addMoney(lotCost, lotCharges));
    }
  }

  // Balances
  // Total Trading Balance = Initial Capital + Deposits - Withdrawals + Net Realized Trading P&L
  const totalTradingBalance = roundTo(initialCapital + totalDeposits - totalWithdrawals + totalNetRealizedPnL, 2);
  // Current Available Trading Balance = Total Trading Balance - Deployed Capital in Open Holdings/Trades
  // Note: if buyLots already tracked deployedCapitalInOpenHoldings, avoid double-subtracting with moneyTiedUpInOpenTrades
  const effectiveLockedCapital = deployedCapitalInOpenHoldings > 0 ? deployedCapitalInOpenHoldings : moneyTiedUpInOpenTrades;
  const currentAvailableTradingBalance = subMoney(totalTradingBalance, effectiveLockedCapital);
  // Total Portfolio Equity = Current Available Cash + Open Positions Market Value
  const totalPortfolioEquity = addMoney(currentAvailableTradingBalance, openPositionsMarketValue);

  // Today & Monthly P&L
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7); // YYYY-MM

  let todayNetPnL = 0;
  let monthlyNetPnL = 0;

  for (const trade of settledTrades) {
    const exitDate = trade.settlementDate || trade.sellDate || trade.tradeDate;
    const realizedPnL = trade.actualPnL !== undefined ? trade.actualPnL : trade.netPnL;
    if (exitDate === todayStr) {
      todayNetPnL = addMoney(todayNetPnL, realizedPnL);
    }
    if (exitDate && exitDate.startsWith(currentYearMonth)) {
      monthlyNetPnL = addMoney(monthlyNetPnL, realizedPnL);
    }
  }

  // Best and worst trading day from ledger
  let bestDay: { date: string; netPnL: number } | null = null;
  let worstDay: { date: string; netPnL: number } | null = null;

  for (const entry of ledger) {
    if (entry.tradeCount > 0) {
      if (!bestDay || entry.netTradingPnL > bestDay.netPnL) {
        bestDay = { date: entry.date, netPnL: entry.netTradingPnL };
      }
      if (!worstDay || entry.netTradingPnL < worstDay.netPnL) {
        worstDay = { date: entry.date, netPnL: entry.netTradingPnL };
      }
    }
  }

  // Maximum Drawdown based on daily balance curve
  let maxDrawdown: { amount: number; percentage: number; peakDate: string; troughDate: string } | null = null;
  if (ledger.length > 0) {
    let peakBalance = initialCapital > 0 ? initialCapital : (ledger[0]?.openingBalance || 0);
    let peakDate = ledger[0]?.date || '';
    let maxDdAmount = 0;
    let maxDdPct = 0;
    let maxDdTroughDate = '';
    let maxDdPeakDate = '';

    for (const entry of ledger) {
      if (entry.closingBalance > peakBalance) {
        peakBalance = entry.closingBalance;
        peakDate = entry.date;
      } else if (peakBalance > 0) {
        const ddAmount = roundTo(peakBalance - entry.closingBalance, 2);
        const ddPct = roundTo((ddAmount / peakBalance) * 100, 2);
        if (ddAmount > maxDdAmount) {
          maxDdAmount = ddAmount;
          maxDdPct = ddPct;
          maxDdPeakDate = peakDate;
          maxDdTroughDate = entry.date;
        }
      }
    }

    if (maxDdAmount > 0) {
      maxDrawdown = {
        amount: maxDdAmount,
        percentage: maxDdPct,
        peakDate: maxDdPeakDate,
        troughDate: maxDdTroughDate,
      };
    }
  }

  return {
    currentAvailableTradingBalance,
    totalTradingBalance,
    totalPortfolioEquity,
    totalDeposits,
    totalWithdrawals,
    totalRealizedGrossProfit: totalGrossProfit,
    totalRealizedGrossLoss: totalGrossLoss,
    totalCharges,
    totalNetRealizedPnL,
    totalCompletedTrades,
    winningTradesCount,
    losingTradesCount,
    breakevenTradesCount,
    winRate,
    profitFactor,
    avgProfitWinningTrade,
    avgLossLosingTrade,
    todayNetPnL,
    monthlyNetPnL,
    unrealizedPnL: totalUnrealizedPnL,
    openPositionsMarketValue,
    openPositionsCostBasis,
    totalRealizedNetProfit,
    totalRealizedNetLoss,
    moneyTiedUpInOpenTrades,
    pendingSettlementsCount,
    bestTradingDay: bestDay,
    worstTradingDay: worstDay,
    maxDrawdown,
  };
}
