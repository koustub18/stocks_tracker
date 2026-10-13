// Complete TypeScript type definitions for the Stock Trading & P&L Tracker

export type TradeType = 'DELIVERY' | 'INTRADAY';
export type TradeSide = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'PARTIALLY_CLOSED';
export type Exchange = 'NSE' | 'BSE';

export interface ChargeBreakdown {
  brokerage: number;          // In Rupees
  stt: number;                // Securities Transaction Tax
  exchangeCharges: number;    // NSE/BSE transaction turnover charges
  sebiTurnoverFee: number;    // SEBI turnover charges
  gst: number;                // GST (18%) on brokerage + exch + sebi
  stampDuty: number;          // Stamp duty on buy turnover
  dpCharges: number;          // Depository Participant charges on delivery sell
  totalCharges: number;       // Sum of all charges
}

export interface TradeCharges {
  buyCharges: ChargeBreakdown;
  sellCharges: ChargeBreakdown;
  totalCharges: number;
  isManualOverride: boolean;
  manualNotes?: string;
}

export interface BuyLot {
  id: string;                 // Unique Lot ID
  tradeId: string;            // Parent trade ID
  symbol: string;
  stockName: string;
  buyDate: string;            // YYYY-MM-DD
  buyTime: string;            // HH:MM:SS or HH:MM
  exchange: Exchange;
  originalQuantity: number;
  remainingQuantity: number;
  buyPrice: number;           // Per share
  totalBuyCharges: number;    // Total charges for full lot
  remainingBuyCharges: number;// Remaining allocated buy charges
  notes?: string;
  cmp?: number;               // Current Market Price for unrealized P&L
}

export type SettlementStatus = 'PENDING' | 'SETTLED';

export interface TradeExecution {
  id: string;
  symbol: string;
  stockName: string;
  exchange: Exchange;
  tradeType: TradeType;
  tradeDate: string;          // YYYY-MM-DD
  buyDate: string;            // YYYY-MM-DD
  buyTime?: string;           // HH:MM
  sellDate?: string;          // YYYY-MM-DD (for closed trades)
  sellTime?: string;          // HH:MM
  quantity: number;           // Executed quantity
  buyPrice: number;
  sellPrice?: number;
  status: TradeStatus;        // OPEN | CLOSED | PARTIALLY_CLOSED
  selectedLotId?: string;     // If exiting a specific buy lot

  // Simple workflow fields
  capitalUsed?: number;        // Actual money invested / margin used
  expectedCharges?: number;    // Manual expected brokerage and charges
  settlementStatus?: SettlementStatus; // 'PENDING' | 'SETTLED'
  actualPnL?: number;         // Amount confirmed after broker credits/settles
  settlementDate?: string;    // Date credited by broker
  
  // Financial P&L
  grossPnL: number;           // (sellPrice - buyPrice) * quantity (0 if open)
  buyChargesAllocated: number;
  sellCharges: number;
  totalCharges: number;
  netPnL: number;             // grossPnL - buyChargesAllocated - sellCharges (0 if open)
  
  // Detailed charge breakdown
  chargesBreakdown?: {
    buy: ChargeBreakdown;
    sell: ChargeBreakdown;
  };
  isManualCharges: boolean;
  
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type CashTxnType = 'INITIAL' | 'DEPOSIT' | 'WITHDRAWAL';

export interface CashTransaction {
  id: string;
  date: string;               // YYYY-MM-DD
  type: CashTxnType;
  amount: number;             // Always positive
  notes?: string;
  createdAt: number;
}

export interface DailyLedgerEntry {
  date: string;               // YYYY-MM-DD
  openingBalance: number;
  deposits: number;
  withdrawals: number;
  netTradingPnL: number;
  grossTradingPnL: number;
  tradingCharges: number;
  tradeCount: number;
  closingBalance: number;
  deployedCapitalInOpenHoldings: number; // Capital locked in open delivery trades
  availableCashBalance: number;          // Closing Balance minus capital in open trades
  transactions: {
    cashTxns: CashTransaction[];
    trades: TradeExecution[];
  };
}

export interface AppSettings {
  id: string; // 'default'
  initialTradingCapital: number;
  currency: string;
  defaultExchange: Exchange;
  
  // Configurable Indian Equity Rates
  brokerageType: 'ZERO' | 'FLAT' | 'PERCENTAGE';
  flatBrokerageDelivery: number;     // e.g. 0 for Zerodha delivery
  flatBrokerageIntraday: number;     // e.g. 20 for Zerodha intraday
  percentageBrokerageDelivery: number;// e.g. 0.05%
  percentageBrokerageIntraday: number;// e.g. 0.03%
  maxBrokeragePerOrder: number;      // e.g. 20
  
  // Statutory Rates
  sttDeliveryBuyPercent: number;     // 0.1%
  sttDeliverySellPercent: number;    // 0.1%
  sttIntradaySellPercent: number;    // 0.025%
  exchangeTxnNSEPercent: number;     // 0.00297%
  exchangeTxnBSEPercent: number;     // 0.00375%
  sebiTurnoverPercent: number;       // 0.0001% (Rs 10 / Crore)
  gstPercent: number;                // 18%
  stampDutyDeliveryBuyPercent: number;// 0.015%
  stampDutyIntradayBuyPercent: number;// 0.003%
  dpChargesDeliverySell: number;     // Rs 15.93 per scrip
  
  effectiveDateNotice: string;       // e.g., "Updated as per SEBI & Finance Act rules (Effective 2024-2025)"
  ratesVerifiedWarning: string;
}

export interface StockHoldingSummary {
  symbol: string;
  stockName: string;
  exchange: Exchange;
  totalQuantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentMarketPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  lots: BuyLot[];
}

export interface DashboardMetrics {
  currentAvailableTradingBalance: number; // Liquid cash ready for trades
  totalTradingBalance: number;            // Equity at cost = Opening + Deposits - Withdrawals + Net Realized P&L
  totalPortfolioEquity: number;           // Total Balance + Unrealized P&L
  totalDeposits: number;
  totalWithdrawals: number;
  totalRealizedGrossProfit: number;
  totalRealizedGrossLoss: number;
  totalCharges: number;
  totalNetRealizedPnL: number;
  totalCompletedTrades: number;
  winningTradesCount: number;
  losingTradesCount: number;
  breakevenTradesCount: number;
  winRate: number;                        // Percentage 0-100
  profitFactor: number;                   // Gross Profit / Gross Loss
  avgProfitWinningTrade: number;
  avgLossLosingTrade: number;
  todayNetPnL: number;
  monthlyNetPnL: number;
  unrealizedPnL: number;
  openPositionsMarketValue: number;
  openPositionsCostBasis: number;
  totalRealizedNetProfit: number;
  totalRealizedNetLoss: number;
  moneyTiedUpInOpenTrades: number;
  pendingSettlementsCount: number;
  bestTradingDay: { date: string; netPnL: number } | null;
  worstTradingDay: { date: string; netPnL: number } | null;
  maxDrawdown: { amount: number; percentage: number; peakDate: string; troughDate: string } | null;
}
