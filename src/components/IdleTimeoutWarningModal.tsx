/**
 * AC — Idle Timeout Warning Modal
 * Appears at 4m30s of user inactivity to warn of pending canonical session reset at 5m00s.
 */

import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface IdleTimeoutWarningModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const IdleTimeoutWarningModal: React.FC<IdleTimeoutWarningModalProps> = ({
  isOpen,
  onContinue
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md p-6 bg-white rounded-3xl border border-stone-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-900">
              Cảnh báo thời gian chờ phiên
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Phiên này sẽ bắt đầu lại sau 30 giây vì không có hoạt động.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tiếp tục phiên</span>
          </button>
        </div>
      </div>
    </div>
  );
};
