/**
 * AC — Modern Aurora Minimal Header
 * Minimalist typography: AC | VIỆT PHỤC ĐƯƠNG ĐẠI
 * Clean right side with no clutter
 */

import React from 'react';
import { Sparkles, RotateCcw, MessageSquare } from 'lucide-react';

interface NavbarProps {
  isEvaluating?: boolean;
  hasActiveSession?: boolean;
  onResetSession?: () => void;
  onOpenChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isEvaluating,
  hasActiveSession,
  onResetSession,
  onOpenChat
}) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity: AC | VIỆT PHỤC ĐƯƠNG ĐẠI */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg">
            AC
          </span>
          <span className="text-stone-300 font-light">|</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-stone-700 uppercase">
            Việt Phục Đương Đại
          </span>
        </div>

        {/* Right side: Clean space, subtle evaluating pill if active, Chat button, Reset button if active session */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isEvaluating && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50/90 text-amber-800 border border-amber-200 animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin text-amber-600" />
              <span>Đang đánh giá bản phối...</span>
            </span>
          )}

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
              title="Mở trợ lý đối thoại AC Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Hỏi AC</span>
            </button>
          )}

          {hasActiveSession && onResetSession && (
            <button
              type="button"
              onClick={() => {
                console.log('[SessionReset] BUTTON_CLICKED');
                onResetSession();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-full bg-stone-100/60 hover:bg-stone-100 border border-stone-200/60 transition-colors cursor-pointer"
              title="Bắt đầu lại bản phối mới"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Bắt đầu lại</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

