import Dexie, { type Table } from 'dexie';
import { AppSettings, BuyLot, CashTransaction, TradeExecution } from '../types';
import { DEFAULT_APP_SETTINGS } from '../utils/chargesCalculator';

export class TradingDatabase extends Dexie {
  trades!: Table<TradeExecution, string>;
  buyLots!: Table<BuyLot, string>;
  cashTransactions!: Table<CashTransaction, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('PersonalStockTradingDB');
    this.version(1).stores({
      trades: 'id, symbol, tradeDate, tradeType, status, buyDate, sellDate, createdAt',
      buyLots: 'id, tradeId, symbol, buyDate, remainingQuantity',
      cashTransactions: 'id, date, type, createdAt',
      settings: 'id',
    });
  }
}

export const db = new TradingDatabase();

/**
 * Initializes settings if not already present.
 */
export async function initializeDatabase(): Promise<AppSettings> {
  let settings = await db.settings.get('default');
  if (!settings) {
    settings = { ...DEFAULT_APP_SETTINGS };
    await db.settings.put(settings);
  }
  return settings;
}
