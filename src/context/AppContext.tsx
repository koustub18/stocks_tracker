import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, initializeDatabase } from '../db';
import {
  AppSettings,
  BuyLot,
  CashTransaction,
  DailyLedgerEntry,
  DashboardMetrics,
  StockHoldingSummary,
  TradeExecution
} from '../types';
import { DEFAULT_APP_SETTINGS } from '../utils/chargesCalculator';
import { BackupData, validateBackupSchema } from '../utils/exportImport';
import { buildDailyLedger } from '../utils/ledgerEngine';
import { buildStockHoldings, calculateDashboardMetrics } from '../utils/metricsEngine';

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  
  trades: TradeExecution[];
  buyLots: BuyLot[];
  cashTransactions: CashTransaction[];
  ledger: DailyLedgerEntry[];
  holdings: StockHoldingSummary[];
  metrics: DashboardMetrics;
  
  // CMP state for stocks (stored in local memory or lot updates)
  cmpMap: Record<string, number>;
  updateCMP: (symbol: string, cmp: number) => Promise<void>;
  
  // Actions
  addTrade: (trade: Omit<TradeExecution, 'id' | 'createdAt' | 'updatedAt'>, lotOptions?: { lotId?: string; isNewLot?: boolean }) => Promise<TradeExecution>;
  updateTrade: (id: string, updated: Partial<TradeExecution>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  
  addCashTxn: (txn: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<CashTransaction>;
  deleteCashTxn: (id: string) => Promise<void>;
  
  // Backup & Restore
  exportAllData: () => BackupData;
  importBackupData: (backup: BackupData) => Promise<{ success: boolean; message: string }>;
  resetAllData: () => Promise<void>;
  
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [trades, setTrades] = useState<TradeExecution[]>([]);
  const [buyLots, setBuyLots] = useState<BuyLot[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [cmpMap, setCmpMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load all initial data from IndexedDB
  const reloadData = async () => {
    try {
      const currentSettings = await initializeDatabase();
      const allTrades = await db.trades.orderBy('tradeDate').reverse().toArray();
      const allLots = await db.buyLots.toArray();
      const allCash = await db.cashTransactions.orderBy('date').toArray();

      setSettings(currentSettings);
      setTrades(allTrades);
      setBuyLots(allLots);
      setCashTransactions(allCash);

      // Hydrate CMP map from stored lots
      const map: Record<string, number> = {};
      for (const lot of allLots) {
        if (lot.cmp && !map[lot.symbol]) {
          map[lot.symbol] = lot.cmp;
        }
      }
      setCmpMap(map);
    } catch (err) {
      console.error('Error loading data from Dexie:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Compute ledger, holdings, and dashboard metrics reactively
  const ledger = React.useMemo(() => {
    return buildDailyLedger(
      settings.initialTradingCapital || 0,
      cashTransactions,
      trades,
      buyLots
    );
  }, [settings.initialTradingCapital, cashTransactions, trades, buyLots]);

  const holdings = React.useMemo(() => {
    return buildStockHoldings(buyLots, cmpMap);
  }, [buyLots, cmpMap]);

  const metrics = React.useMemo(() => {
    return calculateDashboardMetrics(
      settings.initialTradingCapital || 0,
      cashTransactions,
      trades,
      buyLots,
      ledger,
      cmpMap
    );
  }, [settings.initialTradingCapital, cashTransactions, trades, buyLots, ledger, cmpMap]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    await db.settings.put(updated);
    setSettings(updated);
  };

  const updateCMP = async (symbol: string, cmp: number) => {
    setCmpMap((prev) => ({ ...prev, [symbol]: cmp }));
    // Also persist CMP into buy lots for this symbol
    const relatedLots = await db.buyLots.where('symbol').equals(symbol).toArray();
    for (const lot of relatedLots) {
      await db.buyLots.update(lot.id, { cmp });
    }
    // Update local state
    setBuyLots((prev) =>
      prev.map((lot) => (lot.symbol === symbol ? { ...lot, cmp } : lot))
    );
  };

  const addTrade = async (
    tradeData: Omit<TradeExecution, 'id' | 'createdAt' | 'updatedAt'>,
    lotOptions?: { lotId?: string; isNewLot?: boolean }
  ): Promise<TradeExecution> => {
    const tradeId = 'tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = Date.now();

    const trade: TradeExecution = {
      ...tradeData,
      id: tradeId,
      createdAt: now,
      updatedAt: now,
    };

    // If trade is DELIVERY and OPEN, create a new BuyLot
    if (trade.tradeType === 'DELIVERY' && trade.status === 'OPEN') {
      const lotId = 'lot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const buyLot: BuyLot = {
        id: lotId,
        tradeId: trade.id,
        symbol: trade.symbol.toUpperCase(),
        stockName: trade.stockName,
        buyDate: trade.buyDate,
        buyTime: trade.buyTime || '09:15',
        exchange: trade.exchange,
        originalQuantity: trade.quantity,
        remainingQuantity: trade.quantity,
        buyPrice: trade.buyPrice,
        totalBuyCharges: trade.totalCharges,
        remainingBuyCharges: trade.totalCharges,
        notes: trade.notes,
        cmp: trade.buyPrice,
      };

      await db.transaction('rw', db.trades, db.buyLots, async () => {
        await db.trades.add(trade);
        await db.buyLots.add(buyLot);
      });
    } else if (trade.tradeType === 'DELIVERY' && trade.status === 'CLOSED' && lotOptions?.lotId) {
      // Selling from an existing lot
      const targetLot = await db.buyLots.get(lotOptions.lotId);
      if (targetLot) {
        const remainingQty = Math.max(0, targetLot.remainingQuantity - trade.quantity);
        const allocatedBuyCharges = (targetLot.totalBuyCharges * (trade.quantity / targetLot.originalQuantity));
        const remainingCharges = Math.max(0, targetLot.remainingBuyCharges - allocatedBuyCharges);

        await db.transaction('rw', db.trades, db.buyLots, async () => {
          await db.trades.add(trade);
          await db.buyLots.update(targetLot.id, {
            remainingQuantity: remainingQty,
            remainingBuyCharges: remainingCharges,
          });
        });
      } else {
        await db.trades.add(trade);
      }
    } else {
      // Intraday or standalone closed delivery trade
      await db.trades.add(trade);
    }

    await reloadData();
    return trade;
  };

  const updateTrade = async (id: string, updated: Partial<TradeExecution>) => {
    const existing = await db.trades.get(id);
    if (!existing) return;

    const merged = {
      ...existing,
      ...updated,
      updatedAt: Date.now(),
    };

    await db.trades.put(merged);
    await reloadData();
  };

  const deleteTrade = async (id: string) => {
    const trade = await db.trades.get(id);
    if (!trade) return;

    await db.transaction('rw', db.trades, db.buyLots, async () => {
      // If deleting an open trade, delete associated lot
      if (trade.tradeType === 'DELIVERY' && trade.status === 'OPEN') {
        const associatedLots = await db.buyLots.where('tradeId').equals(trade.id).toArray();
        for (const lot of associatedLots) {
          await db.buyLots.delete(lot.id);
        }
      }

      // If deleting a closed trade that exited a lot, restore the quantity to the lot
      if (trade.selectedLotId) {
        const parentLot = await db.buyLots.get(trade.selectedLotId);
        if (parentLot) {
          const restoredQty = parentLot.remainingQuantity + trade.quantity;
          const restoredCharges = parentLot.remainingBuyCharges + trade.buyChargesAllocated;
          await db.buyLots.update(parentLot.id, {
            remainingQuantity: Math.min(parentLot.originalQuantity, restoredQty),
            remainingBuyCharges: Math.min(parentLot.totalBuyCharges, restoredCharges),
          });
        }
      }

      await db.trades.delete(id);
    });

    await reloadData();
  };

  const addCashTxn = async (
    txnData: Omit<CashTransaction, 'id' | 'createdAt'>
  ): Promise<CashTransaction> => {
    const id = 'cash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const txn: CashTransaction = {
      ...txnData,
      id,
      createdAt: Date.now(),
    };
    await db.cashTransactions.add(txn);
    await reloadData();
    return txn;
  };

  const deleteCashTxn = async (id: string) => {
    await db.cashTransactions.delete(id);
    await reloadData();
  };

  const exportAllData = (): BackupData => {
    return {
      version: 1,
      appName: 'PersonalStockTradingTracker',
      exportedAt: new Date().toISOString(),
      counts: {
        trades: trades.length,
        buyLots: buyLots.length,
        cashTransactions: cashTransactions.length,
      },
      settings,
      trades,
      buyLots,
      cashTransactions,
    };
  };

  const importBackupData = async (backup: BackupData): Promise<{ success: boolean; message: string }> => {
    const validation = validateBackupSchema(backup);
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Invalid backup structure.' };
    }

    try {
      await db.transaction('rw', db.trades, db.buyLots, db.cashTransactions, db.settings, async () => {
        await db.trades.clear();
        await db.buyLots.clear();
        await db.cashTransactions.clear();
        await db.settings.clear();

        if (backup.trades && backup.trades.length > 0) {
          await db.trades.bulkAdd(backup.trades);
        }
        if (backup.buyLots && backup.buyLots.length > 0) {
          await db.buyLots.bulkAdd(backup.buyLots);
        }
        if (backup.cashTransactions && backup.cashTransactions.length > 0) {
          await db.cashTransactions.bulkAdd(backup.cashTransactions);
        }
        if (backup.settings) {
          await db.settings.put(backup.settings);
        }
      });

      await reloadData();
      return {
        success: true,
        message: `Imported successfully: ${backup.trades.length} trades, ${backup.cashTransactions.length} cash records.`,
      };
    } catch (err: any) {
      console.error('Import error:', err);
      return { success: false, message: 'Import failed: ' + (err.message || 'Database error') };
    }
  };

  const resetAllData = async () => {
    await db.transaction('rw', db.trades, db.buyLots, db.cashTransactions, db.settings, async () => {
      await db.trades.clear();
      await db.buyLots.clear();
      await db.cashTransactions.clear();
      await db.settings.clear();
      await db.settings.put(DEFAULT_APP_SETTINGS);
    });
    await reloadData();
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        trades,
        buyLots,
        cashTransactions,
        ledger,
        holdings,
        metrics,
        cmpMap,
        updateCMP,
        addTrade,
        updateTrade,
        deleteTrade,
        addCashTxn,
        deleteCashTxn,
        exportAllData,
        importBackupData,
        resetAllData,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
