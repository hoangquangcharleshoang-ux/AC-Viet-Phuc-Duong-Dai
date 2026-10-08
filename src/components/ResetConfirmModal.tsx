import React, { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-2xl p-6 sm:p-7 space-y-5 transform transition-all animate-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3
              id="reset-modal-title"
              className="text-base font-semibold text-stone-900 leading-snug tracking-tight"
            >
              Bạn muốn xóa bản phối hiện tại và bắt đầu lại?
            </h3>
            <p className="text-xs text-stone-500 font-normal leading-relaxed">
              Các gợi ý trang phục, bản phối chi tiết và ảnh minh họa trong phiên sẽ được làm mới về ban đầu.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 shadow-sm transition-colors cursor-pointer"
          >
            Bắt đầu lại
          </button>
        </div>
      </div>
    </div>
  );
};
