import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  FileJson,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_APP_SETTINGS } from '../../utils/chargesCalculator';
import { formatINR } from '../../utils/formatters';
import { BackupData, triggerFileDownload, validateBackupSchema } from '../../utils/exportImport';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Modal } from '../Common/Modal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportAllData,
    importBackupData,
    resetAllData,
    trades,
    cashTransactions,
    buyLots,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [initialCapital, setInitialCapital] = useState(settings.initialTradingCapital.toString());

  // Synchronize initialCapital when settings change from context
  React.useEffect(() => {
    setInitialCapital(settings.initialTradingCapital.toString());
  }, [settings.initialTradingCapital]);

  const [defaultExchange, setDefaultExchange] = useState(settings.defaultExchange);
  const [brokerageType, setBrokerageType] = useState(settings.brokerageType);
  const [flatBrokerageDelivery, setFlatBrokerageDelivery] = useState(settings.flatBrokerageDelivery.toString());
  const [flatBrokerageIntraday, setFlatBrokerageIntraday] = useState(settings.flatBrokerageIntraday.toString());
  const [percentageBrokerageDelivery, setPercentageBrokerageDelivery] = useState(settings.percentageBrokerageDelivery.toString());
  const [percentageBrokerageIntraday, setPercentageBrokerageIntraday] = useState(settings.percentageBrokerageIntraday.toString());
  const [maxBrokeragePerOrder, setMaxBrokeragePerOrder] = useState(settings.maxBrokeragePerOrder.toString());

  // Statutory Rates
  const [sttDeliveryBuyPercent, setSttDeliveryBuyPercent] = useState(settings.sttDeliveryBuyPercent.toString());
  const [sttDeliverySellPercent, setSttDeliverySellPercent] = useState(settings.sttDeliverySellPercent.toString());
  const [sttIntradaySellPercent, setSttIntradaySellPercent] = useState(settings.sttIntradaySellPercent.toString());
  const [exchangeTxnNSEPercent, setExchangeTxnNSEPercent] = useState(settings.exchangeTxnNSEPercent.toString());
  const [exchangeTxnBSEPercent, setExchangeTxnBSEPercent] = useState(settings.exchangeTxnBSEPercent.toString());
  const [sebiTurnoverPercent, setSebiTurnoverPercent] = useState(settings.sebiTurnoverPercent.toString());
  const [gstPercent, setGstPercent] = useState(settings.gstPercent.toString());
  const [stampDutyDeliveryBuyPercent, setStampDutyDeliveryBuyPercent] = useState(settings.stampDutyDeliveryBuyPercent.toString());
  const [stampDutyIntradayBuyPercent, setStampDutyIntradayBuyPercent] = useState(settings.stampDutyIntradayBuyPercent.toString());
  const [dpChargesDeliverySell, setDpChargesDeliverySell] = useState(settings.dpChargesDeliverySell.toString());

  // Alerts & Dialogs
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importPendingBackup, setImportPendingBackup] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    await updateSettings({
      initialTradingCapital: parseFloat(initialCapital) || 0,
      defaultExchange,
      brokerageType,
      flatBrokerageDelivery: parseFloat(flatBrokerageDelivery) || 0,
      flatBrokerageIntraday: parseFloat(flatBrokerageIntraday) || 0,
      percentageBrokerageDelivery: parseFloat(percentageBrokerageDelivery) || 0,
      percentageBrokerageIntraday: parseFloat(percentageBrokerageIntraday) || 0,
      maxBrokeragePerOrder: parseFloat(maxBrokeragePerOrder) || 20,
      sttDeliveryBuyPercent: parseFloat(sttDeliveryBuyPercent) || 0.1,
      sttDeliverySellPercent: parseFloat(sttDeliverySellPercent) || 0.1,
      sttIntradaySellPercent: parseFloat(sttIntradaySellPercent) || 0.025,
      exchangeTxnNSEPercent: parseFloat(exchangeTxnNSEPercent) || 0.00297,
      exchangeTxnBSEPercent: parseFloat(exchangeTxnBSEPercent) || 0.00375,
      sebiTurnoverPercent: parseFloat(sebiTurnoverPercent) || 0.0001,
      gstPercent: parseFloat(gstPercent) || 18,
      stampDutyDeliveryBuyPercent: parseFloat(stampDutyDeliveryBuyPercent) || 0.015,
      stampDutyIntradayBuyPercent: parseFloat(stampDutyIntradayBuyPercent) || 0.003,
      dpChargesDeliverySell: parseFloat(dpChargesDeliverySell) || 15.93,
    });

    setSaveMessage('Settings saved successfully. All balances and future trade charges updated.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleResetDefaults = () => {
    const d = DEFAULT_APP_SETTINGS;
    setBrokerageType(d.brokerageType);
    setFlatBrokerageDelivery(d.flatBrokerageDelivery.toString());
    setFlatBrokerageIntraday(d.flatBrokerageIntraday.toString());
    setPercentageBrokerageDelivery(d.percentageBrokerageDelivery.toString());
    setPercentageBrokerageIntraday(d.percentageBrokerageIntraday.toString());
    setMaxBrokeragePerOrder(d.maxBrokeragePerOrder.toString());
    setSttDeliveryBuyPercent(d.sttDeliveryBuyPercent.toString());
    setSttDeliverySellPercent(d.sttDeliverySellPercent.toString());
    setSttIntradaySellPercent(d.sttIntradaySellPercent.toString());
    setExchangeTxnNSEPercent(d.exchangeTxnNSEPercent.toString());
    setExchangeTxnBSEPercent(d.exchangeTxnBSEPercent.toString());
    setSebiTurnoverPercent(d.sebiTurnoverPercent.toString());
    setGstPercent(d.gstPercent.toString());
    setStampDutyDeliveryBuyPercent(d.stampDutyDeliveryBuyPercent.toString());
    setStampDutyIntradayBuyPercent(d.stampDutyIntradayBuyPercent.toString());
    setDpChargesDeliverySell(d.dpChargesDeliverySell.toString());
  };

  const handleExportJSON = () => {
    const backup = exportAllData();
    const jsonStr = JSON.stringify(backup, null, 2);
    const filename = `stock_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    triggerFileDownload(jsonStr, filename, 'application/json');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateBackupSchema(parsed);
        if (!validation.isValid) {
          setImportError(validation.error || 'Invalid backup file structure.');
          return;
        }
        setImportPendingBackup(parsed);
      } catch (err: any) {
        setImportError('Failed to parse file: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPendingBackup) return;
    const res = await importBackupData(importPendingBackup);
    if (res.success) {
      setImportPendingBackup(null);
      setSaveMessage(res.message);
    } else {
      setImportError(res.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <SettingsIcon size={18} className="text-emerald-400" />
            <span>PREFERENCES & CHARGES CONFIGURATION</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure capital opening balance, broker charges, statutory tax schedules, and offline backups
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{saveMessage}</span>
        </div>
      )}

      {importError && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{importError}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Capital & Account Base */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            1. Initial Trading Capital & Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Initial Trading Capital (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                Opening balance for day 0 of your ledger
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Currency
              </label>
              <input
                type="text"
                value="INR (Indian Rupee - ₹)"
                disabled
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Default Exchange
              </label>
              <select
                value={defaultExchange}
                onChange={(e) => setDefaultExchange(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="NSE">NSE (National Stock Exchange)</option>
                <option value="BSE">BSE (Bombay Stock Exchange)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Brokerage Structure */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            2. Brokerage Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Brokerage Model
              </label>
              <select
                value={brokerageType}
                onChange={(e) => setBrokerageType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="FLAT">Flat Fee (Zerodha / Groww / Angel style)</option>
                <option value="ZERO">Zero Brokerage (Full discount)</option>
                <option value="PERCENTAGE">Percentage of Turnover</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Flat Delivery Brokerage (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={flatBrokerageDelivery}
                onChange={(e) => setFlatBrokerageDelivery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                Standard: ₹0 for discount brokers
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Flat Intraday Brokerage (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={flatBrokerageIntraday}
                onChange={(e) => setFlatBrokerageIntraday(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                Standard: ₹20 per executed order
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Statutory Taxes & Government Rates */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              3. Indian Regulatory Charges (SEBI, STT, GST, Stamp Duty, DP)
            </h3>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed">
            <Sparkles size={13} className="text-amber-400 inline mr-1" />
            <strong className="text-slate-300">Statutory Notice:</strong> {settings.effectiveDateNotice}.
            Rates are fully configurable and never silently hardcoded.
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                STT Delivery Buy %
              </label>
              <input
                type="number"
                step="0.001"
                value={sttDeliveryBuyPercent}
                onChange={(e) => setSttDeliveryBuyPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                STT Delivery Sell %
              </label>
              <input
                type="number"
                step="0.001"
                value={sttDeliverySellPercent}
                onChange={(e) => setSttDeliverySellPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                STT Intraday Sell %
              </label>
              <input
                type="number"
                step="0.001"
                value={sttIntradaySellPercent}
                onChange={(e) => setSttIntradaySellPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                NSE Exch Txn %
              </label>
              <input
                type="number"
                step="0.00001"
                value={exchangeTxnNSEPercent}
                onChange={(e) => setExchangeTxnNSEPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                BSE Exch Txn %
              </label>
              <input
                type="number"
                step="0.00001"
                value={exchangeTxnBSEPercent}
                onChange={(e) => setExchangeTxnBSEPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                SEBI Turnover %
              </label>
              <input
                type="number"
                step="0.00001"
                value={sebiTurnoverPercent}
                onChange={(e) => setSebiTurnoverPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                GST % on Services
              </label>
              <input
                type="number"
                step="0.1"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Stamp Duty Delivery %
              </label>
              <input
                type="number"
                step="0.001"
                value={stampDutyDeliveryBuyPercent}
                onChange={(e) => setStampDutyDeliveryBuyPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Stamp Duty Intraday %
              </label>
              <input
                type="number"
                step="0.001"
                value={stampDutyIntradayBuyPercent}
                onChange={(e) => setStampDutyIntradayBuyPercent(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                DP Charge (Sell) ₹
              </label>
              <input
                type="number"
                step="0.01"
                value={dpChargesDeliverySell}
                onChange={(e) => setDpChargesDeliverySell(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save size={15} />
            <span>Save Preferences & Rates</span>
          </button>
        </div>
      </form>

      {/* Section 4: Backup, Export & Restore */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Shield size={15} className="text-cyan-400" />
          <span>4. Local Data Safety & Offline Backups</span>
        </h3>
        <p className="text-xs font-mono text-slate-400">
          All data is stored directly in your browser&apos;s IndexedDB. Export regular backups to prevent accidental data loss.
        </p>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
          <div>
            <span>Active Database Records:</span>
            <span className="font-bold text-slate-100 ml-2">
              {trades.length} trades • {buyLots.length} lots • {cashTransactions.length} cash txns
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Export Full JSON Backup</span>
          </button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
            >
              <Upload size={14} className="text-cyan-400" />
              <span>Import JSON Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 5: Danger Zone Reset */}
      <div className="p-5 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-3">
        <h3 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
          <Trash2 size={15} />
          <span>Danger Zone: Reset All Data</span>
        </h3>
        <p className="text-xs font-mono text-slate-400">
          Permanently delete all trades, holdings, buy lots, and cash transaction records from IndexedDB. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-colors"
        >
          Reset All Data
        </button>
      </div>

      {/* Import Confirmation Preview Modal */}
      {importPendingBackup && (
        <Modal
          isOpen={!!importPendingBackup}
          onClose={() => setImportPendingBackup(null)}
          title="Confirm Backup Restore"
          subtitle="Preview contents before overwriting active database"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Backup Created:</span>
                <span className="text-slate-200">{new Date(importPendingBackup.exportedAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Trades:</span>
                <span className="text-emerald-400 font-bold">{importPendingBackup.trades.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cash Records:</span>
                <span className="text-slate-200 font-bold">{importPendingBackup.cashTransactions.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Buy Lots:</span>
                <span className="text-slate-200 font-bold">{importPendingBackup.buyLots.length}</span>
              </div>
            </div>

            <p className="text-rose-400 text-xs">
              Warning: Restoring this backup will replace current records. Existing data is not deleted if import fails.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setImportPendingBackup(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Strong Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetAllData}
        title="Reset Entire Trading Database"
        message="This will wipe all trades, lots, and cash history from your local browser storage. To prevent accidental data loss, please type RESET below to confirm."
        confirmKeyword="RESET"
        confirmText="Permanently Wipe All Data"
        isDanger={true}
      />
    </div>
  );
};
