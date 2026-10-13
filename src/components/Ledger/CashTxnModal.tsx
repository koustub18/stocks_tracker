import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { useApp } from '../../context/AppContext';
import { CashTxnType } from '../../types';

interface CashTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashTxnModal: React.FC<CashTxnModalProps> = ({ isOpen, onClose }) => {
  const { addCashTxn } = useApp();

  const [type, setType] = useState<CashTxnType>('DEPOSIT');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!date) {
      setError('Please choose a valid transaction date.');
      return;
    }

    try {
      await addCashTxn({
        date,
        type,
        amount: parsedAmount,
        notes: notes.trim() || undefined,
      });
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record cash transaction');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Cash Transaction"
      subtitle="Funds deposited or withdrawn from your trading account"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('DEPOSIT')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-all ${
                type === 'DEPOSIT'
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ArrowDownRight size={15} />
              <span>DEPOSIT (Cash In)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('WITHDRAWAL')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-all ${
                type === 'WITHDRAWAL'
                  ? 'bg-rose-950/60 border-rose-600 text-rose-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ArrowUpRight size={15} />
              <span>WITHDRAWAL (Cash Out)</span>
            </button>
          </div>
        </div>

        {/* Date and Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
            Notes / Reference
          </label>
          <input
            type="text"
            placeholder="e.g. Bank transfer, Initial fund, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-mono rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Save Transaction
          </button>
        </div>
      </form>
    </Modal>
  );
};
