/**
 * AC — Header & Product Workflow Navigation
 * Consumer-facing sequence:
 * Bối cảnh → Gợi ý → Hiểu Việt phục → Bản phối → Lookbook → Khám phá
 * Features:
 * - Same-page smooth scroll navigation
 * - IntersectionObserver active section tracking
 * - Warm amber active state accent
 * - Responsive scrollable bar on smaller viewports
 * - prefers-reduced-motion compliance
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, MessageSquare, ChevronRight } from 'lucide-react';

export const WORKFLOW_STAGES = [
  { id: 'section-context', label: 'Bối cảnh' },
  { id: 'section-recommendations', label: 'Gợi ý' },
  { id: 'section-cultural-understanding', label: 'Hiểu Việt phục' },
  { id: 'section-blueprint', label: 'Bản phối' },
  { id: 'section-lookbook', label: 'Lookbook' },
  { id: 'section-exploration', label: 'Khám phá' }
];

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
  const [activeStageId, setActiveStageId] = useState<string>('section-context');

  // IntersectionObserver to highlight active workflow stage as user scrolls
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveStageId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    WORKFLOW_STAGES.forEach(stage => {
      const el = document.getElementById(stage.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleStageClick = (stageId: string) => {
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Subtle feedback pulse on target section heading
      const heading = el.querySelector('h1, h2, h3');
      if (heading) {
        heading.classList.add('transition-colors', 'duration-500', 'text-[#C26715]');
        setTimeout(() => {
          heading.classList.remove('text-[#C26715]');
        }, 650);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg">
            AC
          </span>
          <span className="text-stone-300 font-light">|</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-stone-700 uppercase">
            Việt Phục Đương Đại
          </span>
        </div>

        {/* Workflow Navigation Bar */}
        <nav
          aria-label="Workflow navigation"
          className="hidden md:flex items-center gap-1 lg:gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-2xl px-2"
        >
          {WORKFLOW_STAGES.map((stage, idx) => {
            const isActive = activeStageId === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  onClick={() => handleStageClick(stage.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-100/90 text-amber-950 font-semibold border border-amber-300/80 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                  }`}
                >
                  {stage.label}
                </button>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isEvaluating && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50/90 text-amber-800 border border-amber-200 animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin text-amber-600" />
              <span className="hidden sm:inline">Đang đánh giá...</span>
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

      {/* Mobile Workflow Stages Scrollable Ribbon */}
      <div className="md:hidden border-t border-stone-100/80 bg-white/60 px-3 py-1.5 overflow-x-auto flex items-center gap-1 scrollbar-none">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isActive = activeStageId === stage.id;
          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => handleStageClick(stage.id)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300'
                    : 'text-stone-500'
                }`}
              >
                {stage.label}
              </button>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <span className="text-stone-300 text-[10px] shrink-0">•</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </header>
  );
};
