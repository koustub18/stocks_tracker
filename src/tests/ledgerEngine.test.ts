import { describe, it, expect } from 'vitest';
import { buildDailyLedger } from '../utils/ledgerEngine';
import { CashTransaction, TradeExecution } from '../types';

describe('Daily Balance & Ledger Engine', () => {
  it('Prompt Example: Balance updates automatically with trades, deposits & withdrawals', () => {
    // Example from prompt:
    // Opening balance: 2000
    // Day 1: Net profit 200 -> Day 1 closing: 2200
    // Day 2: Net loss 100 -> Day 2 closing: 2100

    const initialCapital = 2000;
    const trades: TradeExecution[] = [
      {
        id: 't1',
        symbol: 'TATASTEEL',
        stockName: 'Tata Steel',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-01',
        buyDate: '2026-10-01',
        buyTime: '09:30',
        sellDate: '2026-10-01',
        sellTime: '15:15',
        quantity: 100,
        buyPrice: 150,
        sellPrice: 152.5,
        status: 'CLOSED',
        grossPnL: 250,
        buyChargesAllocated: 25,
        sellCharges: 25,
        totalCharges: 50,
        netPnL: 200, // Net profit 200
        isManualCharges: false,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 't2',
        symbol: 'INFY',
        stockName: 'Infosys',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-02',
        buyDate: '2026-10-02',
        buyTime: '10:00',
        sellDate: '2026-10-02',
        sellTime: '14:00',
        quantity: 50,
        buyPrice: 1500,
        sellPrice: 1498,
        status: 'CLOSED',
        grossPnL: -100,
        buyChargesAllocated: 0,
        sellCharges: 0,
        totalCharges: 0,
        netPnL: -100, // Net loss 100
        isManualCharges: true,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    const ledger = buildDailyLedger(initialCapital, [], trades);
    expect(ledger.length).toBe(2);

    // Day 1
    expect(ledger[0].date).toBe('2026-10-01');
    expect(ledger[0].openingBalance).toBe(2000);
    expect(ledger[0].netTradingPnL).toBe(200);
    expect(ledger[0].closingBalance).toBe(2200);

    // Day 2
    expect(ledger[1].date).toBe('2026-10-02');
    expect(ledger[1].openingBalance).toBe(2200);
    expect(ledger[1].netTradingPnL).toBe(-100);
    expect(ledger[1].closingBalance).toBe(2100);
  });

  it('Case 8: Deposits and Withdrawals formula verification', () => {
    // Formula from prompt Section 6:
    // Opening balance: 2000
    // Deposit: 500
    // Net trading profit: 200
    // Withdrawal: 100
    // Closing balance: 2600

    const initialCapital = 2000;
    const cashTxns: CashTransaction[] = [
      { id: 'c1', date: '2026-10-01', type: 'DEPOSIT', amount: 500, createdAt: 1 },
      { id: 'c2', date: '2026-10-01', type: 'WITHDRAWAL', amount: 100, createdAt: 2 },
    ];
    const trades: TradeExecution[] = [
      {
        id: 't1',
        symbol: 'RELIANCE',
        stockName: 'Reliance',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-01',
        buyDate: '2026-10-01',
        buyTime: '10:00',
        sellDate: '2026-10-01',
        sellTime: '15:00',
        quantity: 10,
        buyPrice: 2500,
        sellPrice: 2525,
        status: 'CLOSED',
        grossPnL: 250,
        buyChargesAllocated: 25,
        sellCharges: 25,
        totalCharges: 50,
        netPnL: 200,
        isManualCharges: false,
        createdAt: 3,
        updatedAt: 3,
      },
    ];

    const ledger = buildDailyLedger(initialCapital, cashTxns, trades);
    expect(ledger.length).toBe(1);
    expect(ledger[0].openingBalance).toBe(2000);
    expect(ledger[0].deposits).toBe(500);
    expect(ledger[0].withdrawals).toBe(100);
    expect(ledger[0].netTradingPnL).toBe(200);
    expect(ledger[0].closingBalance).toBe(2600);
  });

  it('Case 7: Editing historical trade automatically recalculates subsequent balances', () => {
    const initialCapital = 1000;
    const tradesDay1: TradeExecution[] = [
      {
        id: 't1',
        symbol: 'SBIN',
        stockName: 'SBI',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-01',
        buyDate: '2026-10-01',
        buyTime: '09:15',
        sellDate: '2026-10-01',
        sellTime: '15:15',
        quantity: 50,
        buyPrice: 800,
        sellPrice: 810,
        status: 'CLOSED',
        grossPnL: 500,
        buyChargesAllocated: 50,
        sellCharges: 50,
        totalCharges: 100,
        netPnL: 400, // Originally 400 profit
        isManualCharges: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    const tradesDay2: TradeExecution[] = [
      {
        id: 't2',
        symbol: 'WIPRO',
        stockName: 'Wipro',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-02',
        buyDate: '2026-10-02',
        buyTime: '09:15',
        sellDate: '2026-10-02',
        sellTime: '15:15',
        quantity: 50,
        buyPrice: 500,
        sellPrice: 502,
        status: 'CLOSED',
        grossPnL: 100,
        buyChargesAllocated: 10,
        sellCharges: 10,
        totalCharges: 20,
        netPnL: 80,
        isManualCharges: false,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    const initialLedger = buildDailyLedger(initialCapital, [], [...tradesDay1, ...tradesDay2]);
    expect(initialLedger[0].closingBalance).toBe(1400); // 1000 + 400
    expect(initialLedger[1].openingBalance).toBe(1400);
    expect(initialLedger[1].closingBalance).toBe(1480); // 1400 + 80

    // Now edit t1: netPnL becomes 600 instead of 400
    const editedTradesDay1: TradeExecution[] = [
      {
        ...tradesDay1[0],
        netPnL: 600,
      },
    ];

    const recalculatedLedger = buildDailyLedger(initialCapital, [], [...editedTradesDay1, ...tradesDay2]);
    expect(recalculatedLedger[0].closingBalance).toBe(1600); // 1000 + 600
    expect(recalculatedLedger[1].openingBalance).toBe(1600); // Propagates!
    expect(recalculatedLedger[1].closingBalance).toBe(1680); // 1600 + 80
  });

  it('Case 12: Prevention of duplicate P&L entries and open position handling', () => {
    // Open position must NOT add any profit or change closing balance
    const initialCapital = 5000;
    const openTrade: TradeExecution = {
      id: 'open1',
      symbol: 'HDFCBANK',
      stockName: 'HDFC Bank',
      exchange: 'NSE',
      tradeType: 'DELIVERY',
      tradeDate: '2026-10-01',
      buyDate: '2026-10-01',
      buyTime: '10:00',
      quantity: 10,
      buyPrice: 1600,
      status: 'OPEN', // OPEN!
      grossPnL: 0,
      buyChargesAllocated: 20,
      sellCharges: 0,
      totalCharges: 20,
      netPnL: 0,
      isManualCharges: false,
      createdAt: 1,
      updatedAt: 1,
    };

    const ledger = buildDailyLedger(initialCapital, [], [openTrade]);
    // Since trade is OPEN, no P&L is realized and no closed date entry is added
    expect(ledger.length).toBe(0);
  });

  it('Case 13: Same-day multiple trades', () => {
    const initialCapital = 10000;
    const sameDayTrades: TradeExecution[] = [
      {
        id: 't1',
        symbol: 'TCS',
        stockName: 'TCS',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-05',
        buyDate: '2026-10-05',
        buyTime: '09:30',
        sellDate: '2026-10-05',
        sellTime: '11:30',
        quantity: 10,
        buyPrice: 3500,
        sellPrice: 3550,
        status: 'CLOSED',
        grossPnL: 500,
        buyChargesAllocated: 25,
        sellCharges: 25,
        totalCharges: 50,
        netPnL: 450,
        isManualCharges: false,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 't2',
        symbol: 'INFY',
        stockName: 'Infosys',
        exchange: 'NSE',
        tradeType: 'INTRADAY',
        tradeDate: '2026-10-05',
        buyDate: '2026-10-05',
        buyTime: '12:00',
        sellDate: '2026-10-05',
        sellTime: '14:30',
        quantity: 20,
        buyPrice: 1500,
        sellPrice: 1485,
        status: 'CLOSED',
        grossPnL: -300,
        buyChargesAllocated: 20,
        sellCharges: 20,
        totalCharges: 40,
        netPnL: -340,
        isManualCharges: false,
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    const ledger = buildDailyLedger(initialCapital, [], sameDayTrades);
    expect(ledger.length).toBe(1);
    expect(ledger[0].tradeCount).toBe(2);
    // Net P&L = 450 - 340 = 110
    expect(ledger[0].netTradingPnL).toBe(110);
    // Closing Balance = 10000 + 110 = 10110
    expect(ledger[0].closingBalance).toBe(10110);
  });
});
