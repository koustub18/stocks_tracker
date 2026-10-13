import { AppSettings, ChargeBreakdown, Exchange, TradeCharges, TradeType } from '../types';
import { addMoney, roundTo, toPaise, toRupees } from './precision';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'default',
  initialTradingCapital: 0,
  currency: 'INR',
  defaultExchange: 'NSE',

  // Brokerage Defaults (Discount broker model: Zerodha / Groww standard)
  brokerageType: 'FLAT',
  flatBrokerageDelivery: 0,        // Rs 0 for delivery equity
  flatBrokerageIntraday: 20,       // Rs 20 max for intraday equity
  percentageBrokerageDelivery: 0,
  percentageBrokerageIntraday: 0.03, // 0.03% or Rs 20, whichever is lower
  maxBrokeragePerOrder: 20,

  // Statutory Rates (Current verified Indian equity rates)
  sttDeliveryBuyPercent: 0.1,       // 0.1% on buy
  sttDeliverySellPercent: 0.1,      // 0.1% on sell
  sttIntradaySellPercent: 0.025,    // 0.025% on sell
  exchangeTxnNSEPercent: 0.00297,   // 0.00297% on turnover
  exchangeTxnBSEPercent: 0.00375,   // 0.00375% on turnover
  sebiTurnoverPercent: 0.0001,      // Rs 10 per crore (0.0001%)
  gstPercent: 18.0,                 // 18% on (Brokerage + Exch + SEBI)
  stampDutyDeliveryBuyPercent: 0.015, // 0.015% on buy
  stampDutyIntradayBuyPercent: 0.003, // 0.003% on buy
  dpChargesDeliverySell: 15.93,     // Rs 15.93 per scrip per day (Rs 13.50 + 18% GST)

  effectiveDateNotice: 'Indian Equity Regulatory Rates (SEBI & Finance Act rules: NSE/BSE Equity Segment)',
  ratesVerifiedWarning: 'Rates are configurable estimates based on standard broker schedules. For audit accuracy, use your broker contract note values via the manual override option.'
};

/**
 * Calculates brokerage for an order leg (buy or sell) based on settings.
 */
export function calculateLegBrokerage(
  turnover: number,
  tradeType: TradeType,
  settings: AppSettings
): number {
  if (turnover <= 0) return 0;

  if (tradeType === 'DELIVERY') {
    if (settings.brokerageType === 'ZERO') return 0;
    if (settings.brokerageType === 'FLAT') return roundTo(settings.flatBrokerageDelivery, 2);
    // Percentage
    const calculated = (turnover * settings.percentageBrokerageDelivery) / 100;
    return roundTo(Math.min(calculated, settings.maxBrokeragePerOrder || 20), 2);
  } else {
    // INTRADAY
    if (settings.brokerageType === 'ZERO') return 0;
    // Standard rule: Lower of flat or percentage
    const percentageAmt = (turnover * settings.percentageBrokerageIntraday) / 100;
    const flatAmt = settings.flatBrokerageIntraday;
    const brokerage = Math.min(percentageAmt, flatAmt);
    return roundTo(brokerage, 2);
  }
}

/**
 * Calculates buy-side charges in rupees for a specific trade.
 */
export function calculateBuySideCharges(
  quantity: number,
  buyPrice: number,
  tradeType: TradeType,
  exchange: Exchange,
  settings: AppSettings = DEFAULT_APP_SETTINGS
): ChargeBreakdown {
  const buyTurnover = roundTo(quantity * buyPrice, 2);
  if (buyTurnover <= 0) {
    return {
      brokerage: 0,
      stt: 0,
      exchangeCharges: 0,
      sebiTurnoverFee: 0,
      gst: 0,
      stampDuty: 0,
      dpCharges: 0,
      totalCharges: 0,
    };
  }

  const brokerage = calculateLegBrokerage(buyTurnover, tradeType, settings);

  // STT: Delivery = 0.1% on buy; Intraday = 0% on buy
  const sttRate = tradeType === 'DELIVERY' ? settings.sttDeliveryBuyPercent : 0;
  // Indian tax rules round STT to nearest integer rupee on contract notes
  const rawStt = (buyTurnover * sttRate) / 100;
  const stt = Math.round(rawStt);

  // Exchange Txn Charges
  const exchRate = exchange === 'NSE' ? settings.exchangeTxnNSEPercent : settings.exchangeTxnBSEPercent;
  const exchangeCharges = roundTo((buyTurnover * exchRate) / 100, 2);

  // SEBI Turnover Fee (Rs 10 / Crore)
  const sebiTurnoverFee = roundTo((buyTurnover * settings.sebiTurnoverPercent) / 100, 2);

  // GST: 18% on (Brokerage + Exchange Txn + SEBI)
  const gstServices = brokerage + exchangeCharges + sebiTurnoverFee;
  const gst = roundTo((gstServices * settings.gstPercent) / 100, 2);

  // Stamp Duty (Charged only on Buy side)
  const stampDutyRate = tradeType === 'DELIVERY' ? settings.stampDutyDeliveryBuyPercent : settings.stampDutyIntradayBuyPercent;
  const rawStampDuty = (buyTurnover * stampDutyRate) / 100;
  const stampDuty = Math.round(rawStampDuty); // Rounded to nearest rupee on contract notes

  // DP Charges: No DP charges on buy side
  const dpCharges = 0;

  const totalPaise = toPaise(brokerage) +
    toPaise(stt) +
    toPaise(exchangeCharges) +
    toPaise(sebiTurnoverFee) +
    toPaise(gst) +
    toPaise(stampDuty) +
    toPaise(dpCharges);

  return {
    brokerage,
    stt,
    exchangeCharges,
    sebiTurnoverFee,
    gst,
    stampDuty,
    dpCharges,
    totalCharges: toRupees(totalPaise),
  };
}

/**
 * Calculates sell-side charges in rupees for a specific trade.
 */
export function calculateSellSideCharges(
  quantity: number,
  sellPrice: number,
  tradeType: TradeType,
  exchange: Exchange,
  settings: AppSettings = DEFAULT_APP_SETTINGS
): ChargeBreakdown {
  const sellTurnover = roundTo(quantity * sellPrice, 2);
  if (sellTurnover <= 0) {
    return {
      brokerage: 0,
      stt: 0,
      exchangeCharges: 0,
      sebiTurnoverFee: 0,
      gst: 0,
      stampDuty: 0,
      dpCharges: 0,
      totalCharges: 0,
    };
  }

  const brokerage = calculateLegBrokerage(sellTurnover, tradeType, settings);

  // STT: Delivery = 0.1% on sell; Intraday = 0.025% on sell
  const sttRate = tradeType === 'DELIVERY' ? settings.sttDeliverySellPercent : settings.sttIntradaySellPercent;
  const rawStt = (sellTurnover * sttRate) / 100;
  const stt = Math.round(rawStt);

  // Exchange Txn Charges
  const exchRate = exchange === 'NSE' ? settings.exchangeTxnNSEPercent : settings.exchangeTxnBSEPercent;
  const exchangeCharges = roundTo((sellTurnover * exchRate) / 100, 2);

  // SEBI Turnover Fee
  const sebiTurnoverFee = roundTo((sellTurnover * settings.sebiTurnoverPercent) / 100, 2);

  // GST: 18% on (Brokerage + Exchange Txn + SEBI)
  const gstServices = brokerage + exchangeCharges + sebiTurnoverFee;
  const gst = roundTo((gstServices * settings.gstPercent) / 100, 2);

  // Stamp Duty: 0 on Sell side
  const stampDuty = 0;

  // DP Charges: Applies on Delivery Sell (flat per scrip per day)
  const dpCharges = tradeType === 'DELIVERY' ? roundTo(settings.dpChargesDeliverySell, 2) : 0;

  const totalPaise = toPaise(brokerage) +
    toPaise(stt) +
    toPaise(exchangeCharges) +
    toPaise(sebiTurnoverFee) +
    toPaise(gst) +
    toPaise(stampDuty) +
    toPaise(dpCharges);

  return {
    brokerage,
    stt,
    exchangeCharges,
    sebiTurnoverFee,
    gst,
    stampDuty,
    dpCharges,
    totalCharges: toRupees(totalPaise),
  };
}

/**
 * Calculates total trade charges with full breakdown.
 */
export function calculateFullTradeCharges(
  quantity: number,
  buyPrice: number,
  sellPrice: number,
  tradeType: TradeType,
  exchange: Exchange,
  settings: AppSettings = DEFAULT_APP_SETTINGS
): TradeCharges {
  const buyCharges = calculateBuySideCharges(quantity, buyPrice, tradeType, exchange, settings);
  const sellCharges = calculateSellSideCharges(quantity, sellPrice, tradeType, exchange, settings);
  const totalCharges = addMoney(buyCharges.totalCharges, sellCharges.totalCharges);

  return {
    buyCharges,
    sellCharges,
    totalCharges,
    isManualOverride: false,
  };
}

/**
 * Calculate Gross P&L and Net P&L.
 * Gross P&L = (Sell Price - Buy Price) * Quantity Sold
 * Net P&L = Gross P&L - Total Buy Charges Allocated - Total Sell Charges
 */
export function calculatePnL(
  quantitySold: number,
  buyPrice: number,
  sellPrice: number,
  buyChargesAllocated: number,
  sellCharges: number
): { grossPnL: number; netPnL: number; totalCharges: number } {
  const buyValue = roundTo(quantitySold * buyPrice, 2);
  const sellValue = roundTo(quantitySold * sellPrice, 2);
  const grossPnL = roundTo(sellValue - buyValue, 2);

  const totalCharges = addMoney(buyChargesAllocated, sellCharges);
  const netPnL = roundTo(grossPnL - totalCharges, 2);

  return {
    grossPnL,
    netPnL,
    totalCharges,
  };
}

/**
 * Proportionally allocates buy charges for a partial sale.
 * e.g., bought 100 shares with Rs 50 buy charges, selling 40 shares allocates Rs 20.
 */
export function allocateBuyChargesForPartialSale(
  originalQuantity: number,
  quantitySold: number,
  totalBuyCharges: number
): number {
  if (originalQuantity <= 0 || quantitySold <= 0) return 0;
  const ratio = quantitySold / originalQuantity;
  return roundTo(totalBuyCharges * ratio, 2);
}
