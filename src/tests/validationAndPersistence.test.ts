import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db';
import { validateBackupSchema, BackupData } from '../utils/exportImport';
import { buildStockHoldings, calculateDashboardMetrics } from '../utils/metricsEngine';
import { BuyLot, TradeExecution } from '../types';
import { toPaise, toRupees, addMoney, subMoney } from '../utils/precision';

describe('Validation, Holdings, and Dexie Persistence', () => {
  it('Precision Test: Accurate integer paise arithmetic without IEEE-754 errors', () => {
    // 0.1 + 0.2 in standard JS is 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    // With our integer paise math:
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(subMoney(100.05, 50.02)).toBe(50.03);
    expect(toPaise(15.93)).toBe(1593);
    expect(toRupees(1593)).toBe(15.93);
  });

  it('Case 6: Multiple buy lots for same stock', () => {
    // Bought Lot 1: 50 shares @ Rs 100 on 2026-10-01
    // Bought Lot 2: 50 shares @ Rs 120 on 2026-10-03
    const lots: BuyLot[] = [
      {
        id: 'lot1',
        tradeId: 't1',
        symbol: 'TATASTEEL',
        stockName: 'Tata Steel',
        buyDate: '2026-10-01',
        buyTime: '10:00',
        exchange: 'NSE',
        originalQuantity: 50,
        remainingQuantity: 50,
        buyPrice: 100,
        totalBuyCharges: 10,
        remainingBuyCharges: 10,
      },
      {
        id: 'lot2',
        tradeId: 't2',
        symbol: 'TATASTEEL',
        stockName: 'Tata Steel',
        buyDate: '2026-10-03',
        buyTime: '11:00',
        exchange: 'NSE',
        originalQuantity: 50,
        remainingQuantity: 50,
        buyPrice: 120,
        totalBuyCharges: 12,
        remainingBuyCharges: 12,
      },
    ];

    const holdings = buildStockHoldings(lots);
    expect(holdings.length).toBe(1);
    expect(holdings[0].symbol).toBe('TATASTEEL');
    expect(holdings[0].totalQuantity).toBe(100);
    // Total invested: (50 * 100) + (50 * 120) = 5000 + 6000 = 11000
    expect(holdings[0].totalInvested).toBe(11000);
    // Weighted average buy price: 11000 / 100 = 110
    expect(holdings[0].averageBuyPrice).toBe(110);
    expect(holdings[0].lots.length).toBe(2);
  });

  it('Case 14: An open position with unrealized P&L', () => {
    const lots: BuyLot[] = [
      {
        id: 'lot1',
        tradeId: 't1',
        symbol: 'RELIANCE',
        stockName: 'Reliance',
        buyDate: '2026-10-01',
        buyTime: '10:00',
        exchange: 'NSE',
        originalQuantity: 10,
        remainingQuantity: 10,
        buyPrice: 2000,
        totalBuyCharges: 25,
        remainingBuyCharges: 25,
      },
    ];

    // CMP is 2200 (profit of 200/share = Rs 2000)
    const cmpMap = { RELIANCE: 2200 };
    const holdings = buildStockHoldings(lots, cmpMap);

    expect(holdings[0].totalInvested).toBe(20000);
    expect(holdings[0].currentValue).toBe(22000);
    expect(holdings[0].unrealizedPnL).toBe(2000);
    expect(holdings[0].unrealizedPnLPercent).toBe(10); // 10% gain
  });

  it('Case 10: Backup and restore schema validation', () => {
    const validBackup: BackupData = {
      version: 1,
      appName: 'PersonalStockTradingTracker',
      exportedAt: new Date().toISOString(),
      counts: { trades: 1, buyLots: 1, cashTransactions: 0 },
      settings: {} as any,
      trades: [
        {
          id: 't1',
          symbol: 'INFY',
          stockName: 'Infosys',
          exchange: 'NSE',
          tradeType: 'INTRADAY',
          tradeDate: '2026-10-01',
          buyDate: '2026-10-01',
          buyTime: '10:00',
          quantity: 10,
          buyPrice: 1500,
          status: 'CLOSED',
          grossPnL: 100,
          buyChargesAllocated: 10,
          sellCharges: 10,
          totalCharges: 20,
          netPnL: 80,
          isManualCharges: false,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      buyLots: [],
      cashTransactions: [],
    };

    // Valid backup passes
    const checkValid = validateBackupSchema(validBackup);
    expect(checkValid.isValid).toBe(true);

    // Invalid app name fails
    const invalidApp = { ...validBackup, appName: 'UnknownApp' };
    expect(validateBackupSchema(invalidApp).isValid).toBe(false);

    // Corrupted trades fails
    const corruptTrades = { ...validBackup, trades: 'not-an-array' };
    expect(validateBackupSchema(corruptTrades).isValid).toBe(false);
  });

  it('Case 9: App reload and offline IndexedDB persistence with Dexie', async () => {
    // Add trade to Dexie
    const testTrade: TradeExecution = {
      id: 'dexie_test_1',
      symbol: 'TCS',
      stockName: 'Tata Consultancy Services',
      exchange: 'NSE',
      tradeType: 'DELIVERY',
      tradeDate: '2026-10-10',
      buyDate: '2026-10-10',
      buyTime: '11:00',
      quantity: 5,
      buyPrice: 4000,
      status: 'OPEN',
      grossPnL: 0,
      buyChargesAllocated: 25,
      sellCharges: 0,
      totalCharges: 25,
      netPnL: 0,
      isManualCharges: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.trades.add(testTrade);

    // Retrieve from Dexie
    const retrieved = await db.trades.get('dexie_test_1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.symbol).toBe('TCS');
    expect(retrieved?.quantity).toBe(5);

    // Clean up
    await db.trades.delete('dexie_test_1');
  });
});
