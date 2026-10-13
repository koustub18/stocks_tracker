import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, ShieldCheck, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TradeType, SettlementStatus, TradeStatus } from '../../types';
import { formatINR } from '../../utils/formatters';
import { roundTo } from '../../utils/precision';

interface AddTradeViewProps {
  onTradeAdded?: () => void;
}

export const AddTradeView: React.FC<AddTradeViewProps> = ({ onTradeAdded }) => {
  const { addTrade } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Core Form Fields
  const [stockName, setStockName] = useState('');
  const [tradeDate, setTradeDate] = useState(todayStr);
  const [tradeType, setTradeType] = useState<TradeType>('DELIVERY');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [capitalUsed, setCapitalUsed] = useState<string>('');
  const [isCapitalOverridden, setIsCapitalOverridden] = useState(false);
  const [expectedCharges, setExpectedCharges] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Settlement Fields
  const [settlementStatus, setSettlementStatus] = useState<SettlementStatus>('SETTLED');
  const [actualPnL, setActualPnL] = useState<string>('');
  const [isActualPnLOverridden, setIsActualPnLOverridden] = useState(false);
  const [settlementDate, setSettlementDate] = useState(todayStr);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-calculate Delivery capital if not manually edited
  useEffect(() => {
    if (tradeType === 'DELIVERY' && !isCapitalOverridden) {
      const bPrice = parseFloat(buyPrice) || 0;
      const qty = parseFloat(quantity) || 0;
      if (bPrice > 0 && qty > 0) {
        setCapitalUsed(String(roundTo(bPrice * qty, 2)));
      } else {
        setCapitalUsed('');
      }
    }
  }, [tradeType, buyPrice, quantity, isCapitalOverridden]);

  // Derived Calculations
  const numBuyPrice = parseFloat(buyPrice) || 0;
  const numSellPrice = parseFloat(sellPrice) || 0;
  const numQuantity = parseFloat(quantity) || 0;
  const numCharges = parseFloat(expectedCharges) || 0;

  const hasSellPrice = numSellPrice > 0;
  const grossPnL = hasSellPrice ? roundTo((numSellPrice - numBuyPrice) * numQuantity, 2) : 0;
  const estimatedNetPnL = hasSellPrice ? roundTo(grossPnL - numCharges, 2) : 0;

  // Auto-suggest actual P&L if user hasn't typed an explicit override
  useEffect(() => {
    if (hasSellPrice && !isActualPnLOverridden) {
      setActualPnL(String(estimatedNetPnL));
    }
  }, [hasSellPrice, estimatedNetPnL, isActualPnLOverridden]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!stockName.trim()) {
      setErrorMessage('Please enter the stock name.');
      return;
    }
    if (numBuyPrice <= 0 || numQuantity <= 0) {
      setErrorMessage('Buying price and quantity must be greater than zero.');
      return;
    }

    const finalCapital = parseFloat(capitalUsed) || (numBuyPrice * numQuantity);
    const isClosed = hasSellPrice;
    const isSettled = isClosed && settlementStatus === 'SETTLED';

    const numActualPnL = isSettled
      ? (parseFloat(actualPnL) || estimatedNetPnL)
      : undefined;

    try {
      await addTrade({
        symbol: stockName.trim().toUpperCase(),
        stockName: stockName.trim().toUpperCase(),
        exchange: 'NSE',
        tradeType,
        tradeDate,
        buyDate: tradeDate,
        buyTime: '09:15',
        sellDate: isClosed ? tradeDate : undefined,
        sellTime: isClosed ? '15:15' : undefined,
        quantity: numQuantity,
        buyPrice: numBuyPrice,
        sellPrice: isClosed ? numSellPrice : undefined,
        status: (isClosed ? 'CLOSED' : 'OPEN') as TradeStatus,
        capitalUsed: finalCapital,
        expectedCharges: numCharges,
        settlementStatus: isSettled ? 'SETTLED' : 'PENDING',
        actualPnL: numActualPnL,
        settlementDate: isSettled ? settlementDate : undefined,
        grossPnL,
        buyChargesAllocated: 0,
        sellCharges: 0,
        totalCharges: numCharges,
        netPnL: estimatedNetPnL,
        isManualCharges: true,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(`Trade for ${stockName.toUpperCase()} saved successfully!`);
      // Reset form
      setStockName('');
      setBuyPrice('');
      setSellPrice('');
      setQuantity('');
      setCapitalUsed('');
      setIsCapitalOverridden(false);
      setExpectedCharges('');
      setNotes('');
      setActualPnL('');
      setIsActualPnLOverridden(false);

      if (onTradeAdded) {
        onTradeAdded();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save trade.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Add a Trade</h1>
          <p className="text-sm text-gray-400 mt-1">
            Simple manual entry. Enter your stock details, estimated charges, and broker settlement.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Trade Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Trade Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setTradeType('DELIVERY');
                setIsCapitalOverridden(false);
              }}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 border ${
                tradeType === 'DELIVERY'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-900/20'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>Delivery (Cash)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeType('INTRADAY');
                setIsCapitalOverridden(false);
              }}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 border ${
                tradeType === 'INTRADAY'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md shadow-amber-900/20'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>Intraday (Margin)</span>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Stock Name / Symbol <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="e.g. RELIANCE, TATASTEEL"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Trade Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Price & Quantity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Buying Price (₹) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Selling Price (₹) <span className="text-xs text-gray-500">(Optional if open)</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Leave blank if unsold"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Quantity <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Capital Used & Charges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-300">
                {tradeType === 'INTRADAY' ? 'Margin / Capital Used (₹)' : 'Actual Capital Invested (₹)'}
              </label>
              <span className="text-xs text-gray-500">
                {tradeType === 'INTRADAY' ? 'Manual margin' : 'Defaults to Buy × Qty'}
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={capitalUsed}
              onChange={(e) => {
                setCapitalUsed(e.target.value);
                setIsCapitalOverridden(true);
              }}
              placeholder={tradeType === 'INTRADAY' ? 'Enter margin used' : 'Auto-calculated'}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-300">
                Expected Brokerage & Charges (₹)
              </label>
              <span className="text-xs text-gray-500">Manual entry</span>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={expectedCharges}
              onChange={(e) => setExpectedCharges(e.target.value)}
              placeholder="e.g. 20"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Real-time P&L Preview (if sell price entered) */}
        {hasSellPrice && (
          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/60 space-y-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              P&L Preview (Estimate)
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800">
                <div className="text-xs text-gray-400">Gross P&L (Sell − Buy) × Qty</div>
                <div className={`text-lg font-bold mt-1 ${grossPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {grossPnL >= 0 ? `+${formatINR(grossPnL)}` : formatINR(grossPnL)}
                </div>
              </div>

              <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800">
                <div className="text-xs text-gray-400">Estimated Net P&L (Gross − Charges)</div>
                <div className={`text-lg font-bold mt-1 flex items-center gap-1.5 ${estimatedNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {estimatedNetPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span>{estimatedNetPnL >= 0 ? `+${formatINR(estimatedNetPnL)}` : formatINR(estimatedNetPnL)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Section (when trade is sold) */}
        {hasSellPrice && (
          <div className="p-5 rounded-xl bg-gray-800/60 border border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Broker Settlement & Actual Profit/Loss
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Only settled profit/loss updates your actual trading balance.
                </p>
              </div>

              {/* Status Toggle */}
              <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                <button
                  type="button"
                  onClick={() => setSettlementStatus('PENDING')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    settlementStatus === 'PENDING'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementStatus('SETTLED')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    settlementStatus === 'SETTLED'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Settled
                </button>
              </div>
            </div>

            {settlementStatus === 'SETTLED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-300">
                      Actual Net P&L Credited (₹) <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-xs text-gray-500">Negative for loss (e.g. -50)</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    value={actualPnL}
                    onChange={(e) => {
                      setActualPnL(e.target.value);
                      setIsActualPnLOverridden(true);
                    }}
                    placeholder="Enter credited amount"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Credit / Settlement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Breakout retest, stoploss hit"
            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Save Trade</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
