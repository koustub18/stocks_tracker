import { describe, it, expect } from 'vitest';
import {
  calculateBuySideCharges,
  calculateSellSideCharges,
  calculateFullTradeCharges,
  calculatePnL,
  allocateBuyChargesForPartialSale,
  DEFAULT_APP_SETTINGS
} from '../utils/chargesCalculator';

describe('Indian Equity Statutory Charges Calculator', () => {
  it('Case 1: Profitable Intraday Trade (MIS)', () => {
    // Buy 100 shares @ Rs 500, Sell 100 shares @ Rs 520
    const qty = 100;
    const buyPrice = 500;
    const sellPrice = 520;

    const charges = calculateFullTradeCharges(qty, buyPrice, sellPrice, 'INTRADAY', 'NSE', DEFAULT_APP_SETTINGS);
    
    // Intraday: STT only on sell side (0.025%)
    expect(charges.buyCharges.stt).toBe(0);
    expect(charges.sellCharges.stt).toBeGreaterThan(0);
    // DP charges must be 0 for intraday
    expect(charges.sellCharges.dpCharges).toBe(0);

    const pnl = calculatePnL(qty, buyPrice, sellPrice, charges.buyCharges.totalCharges, charges.sellCharges.totalCharges);
    // Gross P&L = (520 - 500) * 100 = 2000
    expect(pnl.grossPnL).toBe(2000);
    expect(pnl.totalCharges).toBe(charges.totalCharges);
    // Net P&L = Gross - Charges
    expect(pnl.netPnL).toBe(2000 - charges.totalCharges);
    expect(pnl.netPnL).toBeGreaterThan(0);
  });

  it('Case 2: Loss-Making Intraday Trade (MIS)', () => {
    // Buy 100 shares @ Rs 500, Sell 100 shares @ Rs 480
    const qty = 100;
    const buyPrice = 500;
    const sellPrice = 480;

    const charges = calculateFullTradeCharges(qty, buyPrice, sellPrice, 'INTRADAY', 'NSE', DEFAULT_APP_SETTINGS);
    const pnl = calculatePnL(qty, buyPrice, sellPrice, charges.buyCharges.totalCharges, charges.sellCharges.totalCharges);

    // Gross P&L = -2000
    expect(pnl.grossPnL).toBe(-2000);
    // Net P&L = -2000 - charges
    expect(pnl.netPnL).toBe(-2000 - charges.totalCharges);
    expect(pnl.netPnL).toBeLessThan(-2000);
  });

  it('Case 3: Profitable Delivery Trade (CNC)', () => {
    // Buy 50 shares @ Rs 1000, Sell 50 shares @ Rs 1100
    const qty = 50;
    const buyPrice = 1000;
    const sellPrice = 1100;

    const charges = calculateFullTradeCharges(qty, buyPrice, sellPrice, 'DELIVERY', 'NSE', DEFAULT_APP_SETTINGS);

    // Delivery: STT on both buy (0.1%) and sell (0.1%)
    expect(charges.buyCharges.stt).toBeGreaterThan(0);
    expect(charges.sellCharges.stt).toBeGreaterThan(0);

    const pnl = calculatePnL(qty, buyPrice, sellPrice, charges.buyCharges.totalCharges, charges.sellCharges.totalCharges);
    // Gross P&L = (1100 - 1000) * 50 = 5000
    expect(pnl.grossPnL).toBe(5000);
    expect(pnl.netPnL).toBe(5000 - charges.totalCharges);
  });

  it('Case 4: Delivery trade with DP charges on selling', () => {
    // Delivery sell must include DP charges (default Rs 15.93)
    const qty = 10;
    const sellPrice = 200;

    const sellCharges = calculateSellSideCharges(qty, sellPrice, 'DELIVERY', 'NSE', DEFAULT_APP_SETTINGS);
    expect(sellCharges.dpCharges).toBe(15.93);
    expect(sellCharges.totalCharges).toBeGreaterThanOrEqual(15.93);

    // But intraday sell has 0 DP charges
    const intradaySellCharges = calculateSellSideCharges(qty, sellPrice, 'INTRADAY', 'NSE', DEFAULT_APP_SETTINGS);
    expect(intradaySellCharges.dpCharges).toBe(0);
  });

  it('Case 5: Partial sale of purchased shares & proportionate buy charges', () => {
    // Bought 100 shares with Rs 60 in buy charges
    const originalQty = 100;
    const originalBuyCharges = 60;
    
    // Sell 40 shares
    const qtySold = 40;
    const allocatedCharges = allocateBuyChargesForPartialSale(originalQty, qtySold, originalBuyCharges);
    
    // Proportion: 40/100 * 60 = 24.00
    expect(allocatedCharges).toBe(24.00);

    // Remaining buy charges for remaining 60 shares
    const remainingBuyCharges = originalBuyCharges - allocatedCharges;
    expect(remainingBuyCharges).toBe(36.00);
  });

  it('Case 15: Manual charges overriding estimated charges', () => {
    const qty = 100;
    const buyPrice = 100;
    const sellPrice = 120;

    // Suppose estimated charges would be calculated, but broker contract note says Rs 45.50
    const manualBuyCharges = 20.25;
    const manualSellCharges = 25.25;
    const totalManual = 45.50;

    const pnl = calculatePnL(qty, buyPrice, sellPrice, manualBuyCharges, manualSellCharges);
    // Gross = (120 - 100) * 100 = 2000
    expect(pnl.grossPnL).toBe(2000);
    expect(pnl.totalCharges).toBe(totalManual);
    expect(pnl.netPnL).toBe(2000 - 45.50);
  });
});
