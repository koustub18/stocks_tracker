import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmKeyword?: string; // If set, user must type this keyword (e.g. 'RESET')
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmKeyword,
  isDanger = false,
}) => {
  const [typedKeyword, setTypedKeyword] = useState('');

  const handleConfirm = () => {
    if (confirmKeyword && typedKeyword !== confirmKeyword) return;
    onConfirm();
    setTypedKeyword('');
    onClose();
  };

  const isButtonDisabled = !!confirmKeyword && typedKeyword !== confirmKeyword;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${isDanger ? 'bg-rose-950/60 text-rose-400' : 'bg-amber-950/60 text-amber-400'}`}>
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>

        {confirmKeyword && (
          <div className="pt-2">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Type <span className="font-bold text-rose-400">{confirmKeyword}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedKeyword}
              onChange={(e) => setTypedKeyword(e.target.value)}
              placeholder={confirmKeyword}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isButtonDisabled}
            className={`px-4 py-2 text-xs font-mono rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
