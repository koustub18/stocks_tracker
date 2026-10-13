import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { TradeExecution, SettlementStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { roundTo } from '../../utils/precision';

interface EditTradeModalProps {
  trade: TradeExecution | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTradeModal: React.FC<EditTradeModalProps> = ({ trade, isOpen, onClose }) => {
  const { updateTrade } = useApp();

  if (!trade) return null;

  const [tradeDate, setTradeDate] = useState(trade.tradeDate);
  const [buyDate, setBuyDate] = useState(trade.buyDate || trade.tradeDate);
  const [sellDate, setSellDate] = useState(trade.sellDate || trade.tradeDate);
  const [buyPrice, setBuyPrice] = useState(trade.buyPrice.toString());
  const [sellPrice, setSellPrice] = useState(trade.sellPrice?.toString() || '');
  const [quantity, setQuantity] = useState(trade.quantity.toString());
  const [capitalUsed, setCapitalUsed] = useState(
    trade.capitalUsed !== undefined ? trade.capitalUsed.toString() : (trade.buyPrice * trade.quantity).toString()
  );
  const [manualCharges, setManualCharges] = useState(
    trade.expectedCharges !== undefined ? trade.expectedCharges.toString() : trade.totalCharges.toString()
  );
  const [settlementStatus, setSettlementStatus] = useState<SettlementStatus>(
    trade.settlementStatus || (trade.status === 'CLOSED' ? 'SETTLED' : 'PENDING')
  );
  const [actualPnL, setActualPnL] = useState(
    trade.actualPnL !== undefined ? trade.actualPnL.toString() : trade.netPnL.toString()
  );
  const [settlementDate, setSettlementDate] = useState(
    trade.settlementDate || trade.sellDate || trade.tradeDate
  );
  const [notes, setNotes] = useState(trade.notes || '');

  // Reset local state when opened with a new trade
  useEffect(() => {
    if (trade) {
      setTradeDate(trade.tradeDate);
      setBuyDate(trade.buyDate || trade.tradeDate);
      setSellDate(trade.sellDate || trade.tradeDate);
      setBuyPrice(trade.buyPrice.toString());
      setSellPrice(trade.sellPrice?.toString() || '');
      setQuantity(trade.quantity.toString());
      setCapitalUsed(
        trade.capitalUsed !== undefined ? trade.capitalUsed.toString() : (trade.buyPrice * trade.quantity).toString()
      );
      setManualCharges(
        trade.expectedCharges !== undefined ? trade.expectedCharges.toString() : trade.totalCharges.toString()
      );
      setSettlementStatus(trade.settlementStatus || (trade.status === 'CLOSED' ? 'SETTLED' : 'PENDING'));
      setActualPnL(trade.actualPnL !== undefined ? trade.actualPnL.toString() : trade.netPnL.toString());
      setSettlementDate(trade.settlementDate || trade.sellDate || trade.tradeDate);
      setNotes(trade.notes || '');
    }
  }, [trade]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedQty = parseFloat(quantity);
    const parsedBuyPrice = parseFloat(buyPrice);
    const parsedSellPrice = parseFloat(sellPrice);
    const parsedCharges = parseFloat(manualCharges) || 0;
    const parsedCapital = parseFloat(capitalUsed) || (parsedBuyPrice * parsedQty);

    if (isNaN(parsedQty) || parsedQty <= 0) return;
    if (isNaN(parsedBuyPrice) || parsedBuyPrice <= 0) return;

    const hasSell = !isNaN(parsedSellPrice) && parsedSellPrice > 0;
    const grossPnL = hasSell ? roundTo((parsedSellPrice - parsedBuyPrice) * parsedQty, 2) : 0;
    const netPnL = hasSell ? roundTo(grossPnL - parsedCharges, 2) : 0;

    const isSettled = hasSell && settlementStatus === 'SETTLED';
    const parsedActualPnL = isSettled ? (parseFloat(actualPnL) || netPnL) : undefined;

    await updateTrade(trade.id, {
      tradeDate,
      buyDate,
      sellDate: hasSell ? sellDate : undefined,
      quantity: parsedQty,
      buyPrice: parsedBuyPrice,
      sellPrice: hasSell ? parsedSellPrice : undefined,
      status: hasSell ? 'CLOSED' : 'OPEN',
      capitalUsed: parsedCapital,
      expectedCharges: parsedCharges,
      totalCharges: parsedCharges,
      grossPnL,
      netPnL,
      settlementStatus: isSettled ? 'SETTLED' : 'PENDING',
      actualPnL: parsedActualPnL,
      settlementDate: isSettled ? settlementDate : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Trade: ${trade.symbol}`}
      subtitle={`Type: ${trade.tradeType} • Status: ${trade.status}`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-200">
          Editing this trade will automatically recalculate your daily balances and realized P&L reports.
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Buy Date</label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => {
                setBuyDate(e.target.value);
                setTradeDate(e.target.value);
              }}
              required
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Sell Date</label>
            <input
              type="date"
              value={sellDate}
              onChange={(e) => setSellDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        {/* Price & Quantity */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Buy Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Sell Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Unsold"
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        {/* Capital Used & Charges */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Capital Invested / Margin (₹)
            </label>
            <input
              type="number"
              step="any"
              value={capitalUsed}
              onChange={(e) => setCapitalUsed(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Brokerage / Charges (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={manualCharges}
              onChange={(e) => setManualCharges(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        {/* Settlement section */}
        <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">Settlement Status</span>
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
              <button
                type="button"
                onClick={() => setSettlementStatus('PENDING')}
                className={`px-3 py-1 rounded ${settlementStatus === 'PENDING' ? 'bg-amber-600 text-white' : 'text-gray-400'}`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setSettlementStatus('SETTLED')}
                className={`px-3 py-1 rounded ${settlementStatus === 'SETTLED' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}
              >
                Settled
              </button>
            </div>
          </div>

          {settlementStatus === 'SETTLED' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Actual Net P&L (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={actualPnL}
                  onChange={(e) => setActualPnL(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Settlement Date
                </label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
