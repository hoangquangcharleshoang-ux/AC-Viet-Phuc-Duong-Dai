/**
 * AC — Header & Product Workflow Navigation
 * Consumer-facing sequence:
 * Bối cảnh → Gợi ý → Hiểu Việt phục → Bản phối → Lookbook → Khám phá
 * Features:
 * - Same-page smooth scroll navigation
 * - IntersectionObserver active section tracking
 * - Warm amber active state accent
 * - Theme switcher dropdown (Sáng / Tối / Theo hệ thống)
 * - Responsive scrollable bar on smaller viewports
 * - prefers-reduced-motion compliance
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCcw, MessageSquare, ChevronRight, Sun, Moon, Monitor, Check } from 'lucide-react';
import { getStoredTheme, applyTheme, ThemeMode } from '../shared/theme';

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
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize initial theme & close menu on outside click
  useEffect(() => {
    applyTheme(themeMode);

    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [themeMode]);

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);
    setIsThemeMenuOpen(false);
  };

  // Active section scroll tracking
  useEffect(() => {
    const updateActiveSection = () => {
      const activationLine = 160; // top offset in px
      let currentActive = WORKFLOW_STAGES[0].id;
      let minDistance = Infinity;

      WORKFLOW_STAGES.forEach(stage => {
        const el = document.getElementById(stage.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= activationLine) {
            const dist = Math.abs(rect.top - activationLine);
            if (dist < minDistance || rect.bottom > activationLine) {
              currentActive = stage.id;
              minDistance = dist;
            }
          }
        }
      });

      // Special case: if at/near bottom of page, highlight last stage
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50
      ) {
        currentActive = WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1].id;
      }

      setActiveStageId(currentActive);
    };

    updateActiveSection();

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleStageClick = (stageId: string) => {
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Subtle feedback pulse on target section heading
      const heading = el.querySelector('h1, h2, h3');
      if (heading) {
        heading.classList.add('transition-colors', 'duration-500', 'text-[var(--accent)]');
        setTimeout(() => {
          heading.classList.remove('text-[var(--accent)]');
        }, 650);
      }
    }
  };

  const getThemeIcon = () => {
    if (themeMode === 'dark') return <Moon className="w-3.5 h-3.5 text-amber-400" />;
    if (themeMode === 'system') return <Monitor className="w-3.5 h-3.5 text-[var(--text-secondary)]" />;
    return <Sun className="w-3.5 h-3.5 text-amber-600" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <span className="font-bold text-[var(--text)] tracking-tight text-base sm:text-lg">
            AC
          </span>
          <span className="text-[var(--text-muted)] font-light">|</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
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
                      ? 'bg-[var(--chip-selected-bg)] text-[var(--chip-selected-text)] font-semibold border border-[var(--chip-selected-border)] shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {stage.label}
                </button>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isEvaluating && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--warn-bg)] text-[var(--warn-text)] border border-[var(--warn-border)] animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin text-[var(--accent)]" />
              <span className="hidden sm:inline">Đang đánh giá bản phối...</span>
            </span>
          )}

          {/* Theme Selector Toggle */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-border)] text-[var(--text)] border border-[var(--surface-border)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Chọn giao diện: Sáng, Tối, hoặc Theo hệ thống"
              title="Giao diện (Sáng / Tối / Theo hệ thống)"
            >
              {getThemeIcon()}
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] shadow-xl py-1 z-50 text-xs text-[var(--text)] transition-all animate-section-reveal"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  type="button"
                  onClick={() => handleSelectTheme('light')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${
                    themeMode === 'light' ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Sáng
                  </span>
                  {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('dark')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${
                    themeMode === 'dark' ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    Tối
                  </span>
                  {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('system')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${
                    themeMode === 'system' ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Theo hệ thống
                  </span>
                  {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </button>
              </div>
            )}
          </div>

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:opacity-90 px-3 py-1.5 rounded-full bg-[var(--chip-selected-bg)] border border-[var(--chip-selected-border)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              title="Mở trợ lý đối thoại AC Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
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
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] px-3 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-border)] border border-[var(--surface-border)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              title="Bắt đầu lại bản phối mới"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="hidden sm:inline">Bắt đầu lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Workflow Stages Scrollable Ribbon */}
      <div className="md:hidden border-t border-[var(--surface-border)] bg-[var(--surface)] px-3 py-1.5 overflow-x-auto flex items-center gap-1 scrollbar-none">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isActive = activeStageId === stage.id;
          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => handleStageClick(stage.id)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[var(--chip-selected-bg)] text-[var(--chip-selected-text)] font-semibold border border-[var(--chip-selected-border)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {stage.label}
              </button>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <span className="text-[var(--text-muted)] text-[10px] shrink-0">•</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </header>
  );
};
