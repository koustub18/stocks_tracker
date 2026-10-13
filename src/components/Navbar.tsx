import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  History,
  BookOpen,
  BarChart3,
  Settings,
  CircleDollarSign,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, getPnLColorClass } from '../utils/formatters';

export type NavTab = 'dashboard' | 'add-trade' | 'holdings' | 'history' | 'ledger' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenCashModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCashModal,
}) => {
  const { metrics, buyLots, trades } = useApp();

  const activeHoldingsCount = buyLots.filter((l) => l.remainingQuantity > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'add-trade', label: 'Add Trade', icon: <PlusCircle size={15} /> },
    {
      id: 'holdings',
      label: 'Holdings',
      icon: <Briefcase size={15} />,
      badge: activeHoldingsCount > 0 ? activeHoldingsCount : undefined,
    },
    {
      id: 'history',
      label: 'Trade History',
      icon: <History size={15} />,
      badge: trades.length > 0 ? trades.length : undefined,
    },
    { id: 'ledger', label: 'Cash Ledger', icon: <BookOpen size={15} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-mono font-bold text-sm text-slate-100 tracking-wider">
                NSE/BSE <span className="text-emerald-400">P&L TRACKER</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>OFFLINE STORAGE (IndexedDB)</span>
            </div>
          </div>

          {/* Real-time Quick Balance Ticker */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px]">AVAIL CASH:</span>
              <span className="font-bold text-cyan-300">
                {formatINR(metrics.currentAvailableTradingBalance)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px]">TOTAL BALANCE:</span>
              <span className="font-bold text-slate-100">
                {formatINR(metrics.totalTradingBalance)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px]">TODAY:</span>
              <span className={`font-bold ${getPnLColorClass(metrics.todayNetPnL)}`}>
                {formatINR(metrics.todayNetPnL, { showSign: true })}
              </span>
            </div>

            <button
              onClick={onOpenCashModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-xs"
              title="Add Deposit or Withdrawal"
            >
              <CircleDollarSign size={13} className="text-emerald-400" />
              <span>Deposit / Withdraw</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
