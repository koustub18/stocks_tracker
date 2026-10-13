import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { AddTradeView } from './components/Trades/AddTradeView';
import { HoldingsView } from './components/Holdings/HoldingsView';
import { TradeHistoryView } from './components/Trades/TradeHistoryView';
import { CashLedgerView } from './components/Ledger/CashLedgerView';
import { ReportsView } from './components/Reports/ReportsView';
import { SettingsView } from './components/Settings/SettingsView';
import { CashTxnModal } from './components/Ledger/CashTxnModal';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const { isLoading } = useApp();

  const handleSelectLotToSell = (lotId: string) => {
    setActiveTab('add-trade');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center font-mono text-emerald-400">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <span>INITIALIZING PERSISTENT LOCAL STORAGE (Dexie IndexedDB)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCashModal={() => setIsCashModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={setActiveTab}
            onOpenCashModal={() => setIsCashModalOpen(true)}
          />
        )}

        {activeTab === 'add-trade' && (
          <AddTradeView
            onTradeAdded={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'holdings' && (
          <HoldingsView
            onSelectLotToSell={handleSelectLotToSell}
          />
        )}

        {activeTab === 'history' && <TradeHistoryView />}

        {activeTab === 'ledger' && (
          <CashLedgerView
            onOpenCashModal={() => setIsCashModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-3 text-center text-[11px] font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Stock Trading & P&L Tracker • Indian Equity (NSE/BSE)</span>
          <span>Offline First • Dexie IndexedDB • Zero Remote APIs</span>
        </div>
      </footer>

      {/* Cash Modal */}
      <CashTxnModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
