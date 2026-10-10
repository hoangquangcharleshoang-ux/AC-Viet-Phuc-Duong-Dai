/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Cultural Visual QA Card Component
 *
 * Requirements:
 * - "Ảnh Hiện Trước, QA Theo Sau": Automatic visual verification on lookbook render
 * - Neutral User-Friendly labeling (PRESERVES_IDENTITY, CONTEXT_SENSITIVE, WEAKENS_RECOGNIZABILITY, CHANGES_CORE_IDENTIFICATION, INSUFFICIENT_EVIDENCE)
 * - Trait-level breakdown with badges (PASS, PARTIAL, FAIL, NOT_ASSESSABLE)
 * - Outfit Fidelity panel (Palette, Fabric, Lower garment, Footwear, Accessories, Unexpected items)
 * - Dual-Source Grounded Revision Plan display
 * - User Agency CTA button: "Tinh chỉnh theo thẩm định ✦" (Max 2 Revisions limit)
 * - Embeds Trait Transitions tracking across versions without percentage scores
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Eye,
  Palette,
  Layers,
  RotateCw,
  Wand2,
  ArrowRight,
  Lock
} from 'lucide-react';
import {
  CulturalVisualQAOutput,
  CulturalIdentityStatus,
  TraitVerdict,
  VisualQAState,
  GroundedCorrectionPlan,
  LookbookRevisionItem
} from '../types/index';
import {
  getAccessoryLabel,
  getFabricLabel,
  getLowerGarmentLabel,
  getFootwearLabel,
  PALETTES
} from '../data/canonicalCatalog';
import { TraitTransitionsView } from './TraitTransitionsView';
import {
  classifyRefinementInput,
  RefinementClassificationResult
} from '../shared/refinementClassifier';

interface CulturalQACardProps {
  qaState: VisualQAState;
  generationId?: string;
  boundFingerprint?: string;
  garmentId?: string;
  isGeneratingLookbook?: boolean;
  lookbookStatus?: string;
  lookbookErrorMessage?: string;
  revisionIndex?: number;
  correctionPlan?: GroundedCorrectionPlan;
  revisions?: LookbookRevisionItem[];
  onVerify: () => void;
  onTriggerRevision?: () => void;
  onTriggerUserGuidedRevision?: (refinementText: string) => void;
  onRetryRevision?: (revisionIndex: number, newRefinementText?: string) => void;
  onReturnToSandbox?: () => void;
  onColorChange?: (paletteId: string) => void;
}

export const CulturalQACard: React.FC<CulturalQACardProps> = ({
  qaState,
  generationId,
  boundFingerprint,
  garmentId,
  isGeneratingLookbook = false,
  lookbookStatus,
  lookbookErrorMessage,
  revisionIndex = 0,
  correctionPlan,
  revisions = [],
  onVerify,
  onTriggerRevision,
  onTriggerUserGuidedRevision,
  onRetryRevision,
  onReturnToSandbox,
  onColorChange
}) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'FIDELITY' | 'TRANSITIONS'>('IDENTITY');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [isRefinementOpen, setIsRefinementOpen] = useState<boolean>(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState<boolean>(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const [userRefinementInput, setUserRefinementInput] = useState<string>('');
  const [refinementPreviewState, setRefinementPreviewState] = useState<'idle' | 'analyzing' | 'ready'>('idle');
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [previewAnalysis, setPreviewAnalysis] = useState<RefinementClassificationResult | null>(null);

  const prevGenIdRef = React.useRef(generationId);
  useEffect(() => {
    if (generationId !== prevGenIdRef.current) {
      setUserRefinementInput('');
      setRefinementPreviewState('idle');
      setPreviewAnalysis(null);
      setRefinementError(null);
      prevGenIdRef.current = generationId;
    }
  }, [generationId]);

  const prevGeneratingRef = React.useRef(isGeneratingLookbook);
  useEffect(() => {
    if (prevGeneratingRef.current && !isGeneratingLookbook) {
      if (lookbookStatus === 'error') {
        setRefinementError(lookbookErrorMessage || 'Quá trình tạo phiên bản tinh chỉnh không thành công. Vui lòng thử lại.');
      } else if (lookbookStatus === 'success') {
        setRefinementError(null);
        setRefinementPreviewState('idle');
        setPreviewAnalysis(null);
        setUserRefinementInput('');
      }
    }
    prevGeneratingRef.current = isGeneratingLookbook;
  }, [isGeneratingLookbook, lookbookStatus, lookbookErrorMessage]);

  // If no generationId exists yet, card does not render
  if (!generationId) {
    return null;
  }

  // -------------------------------------------------------------------------
  // Helper: Status Styling
  // -------------------------------------------------------------------------
  const getStatusBadge = (status: CulturalIdentityStatus) => {
    switch (status) {
      case 'PRESERVES_IDENTITY':
        return {
          badge: 'bg-[var(--pass-bg)] text-[var(--pass-text)] border border-[var(--pass-border)]',
          icon: <ShieldCheck className="w-4 h-4 text-[var(--pass-text)]" />,
          dot: 'bg-[var(--pass-text)]',
          desc: 'Các đặc trưng quan sát được trong ảnh phù hợp với những đặc trưng cốt lõi AC đang đối chiếu.'
        };
      case 'CONTEXT_SENSITIVE':
        return {
          badge: 'bg-[var(--chip-selected-bg)] text-[var(--chip-selected-text)] border border-[var(--chip-selected-border)]',
          icon: <Sparkles className="w-4 h-4 text-[var(--accent)]" />,
          dot: 'bg-[var(--accent)]',
          desc: 'Trang phục giữ vững cốt lõi nhận diện, kết hợp hài hòa với các biến tấu thời trang đương đại.'
        };
      case 'WEAKENS_RECOGNIZABILITY':
        return {
          badge: 'bg-[var(--warn-bg)] text-[var(--warn-text)] border border-[var(--warn-border)]',
          icon: <AlertTriangle className="w-4 h-4 text-[var(--warn-text)]" />,
          dot: 'bg-[var(--warn-text)]',
          desc: 'Một số đặc trưng thứ cấp hoặc chi tiết cổ áo/ống tay bị lai tạp làm giảm nét nhận diện đặc thù.'
        };
      case 'CHANGES_CORE_IDENTIFICATION':
        return {
          badge: 'bg-[var(--fail-bg)] text-[var(--fail-text)] border border-[var(--fail-border)]',
          icon: <XCircle className="w-4 h-4 text-[var(--fail-text)]" />,
          dot: 'bg-[var(--fail-text)]',
          desc: 'Có đặc trưng thiết yếu bị biến đổi trực tiếp, làm diện mạo dịch chuyển khỏi dáng áo nền ban đầu.'
        };
      case 'INSUFFICIENT_EVIDENCE':
      default:
        return {
          badge: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--surface-border)]',
          icon: <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />,
          dot: 'bg-[var(--text-muted)]',
          desc: 'Góc chụp hoặc bố cục ảnh chưa cung cấp đủ bằng chứng trực quan để khẳng định trọn vẹn.'
        };
    }
  };

  const getVerdictBadge = (verdict: TraitVerdict) => {
    switch (verdict) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--pass-bg)] text-[var(--pass-text)] border border-[var(--pass-border)]">
            <CheckCircle2 className="w-3 h-3 text-[var(--pass-text)]" />
            <span>Đặc trưng rõ</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--warn-bg)] text-[var(--warn-text)] border border-[var(--warn-border)]">
            <AlertTriangle className="w-3 h-3 text-[var(--warn-text)]" />
            <span>Chưa hoàn toàn rõ</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--fail-bg)] text-[var(--fail-text)] border border-[var(--fail-border)]">
            <XCircle className="w-3 h-3 text-[var(--fail-text)]" />
            <span>Cần tinh chỉnh</span>
          </span>
        );
      case 'NOT_ASSESSABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--surface-border)]">
            <Eye className="w-3 h-3 text-[var(--text-muted)]" />
            <span>Chưa thể xác nhận từ ảnh</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'essential':
        return { label: 'Yếu tố cốt lõi', color: 'text-amber-800 bg-amber-50 border-amber-200/80' };
      case 'strongly_characteristic':
        return { label: 'Đặc trưng nổi bật', color: 'text-amber-900 bg-amber-100/70 border-amber-300/80' };
      case 'supporting':
        return { label: 'Đặc trưng bổ trợ', color: 'text-[var(--text-secondary)] bg-[var(--surface-2)] border-[var(--surface-border)]' };
      case 'variable':
      default:
        return { label: 'Biến thể linh hoạt', color: 'text-[var(--text-secondary)] bg-[var(--surface-2)] border-[var(--surface-border)]' };
    }
  };

  const actionableDeltas = correctionPlan?.actionableDeltas || [
    ...(correctionPlan?.culturalDeltas || []).map(c => ({
      type: 'cultural' as const,
      id: c.traitId,
      name: c.traitNameVi,
      guidance: c.canonicalGuidance,
      deviation: c.observedDeviation
    })),
    ...(correctionPlan?.fidelityDeltas || []).map(f => {
      const elementLabelMap: Record<string, string> = {
        palette: 'Bảng màu',
        fabric: 'Chất liệu vải',
        lowerGarment: 'Hạ phục',
        footwear: 'Giày dép',
        accessories: 'Phụ kiện'
      };
      return {
        type: 'fidelity' as const,
        id: f.element,
        name: elementLabelMap[f.element] || f.element,
        guidance: f.expectedValue,
        deviation: f.description
      };
    })
  ];
  const actionableCount = actionableDeltas.length;
  const hasCorrectionTargets = actionableCount > 0;

  const traitsList =
    qaState.status === 'success' && qaState.result
      ? qaState.result.culturalIdentity.traits || []
      : [];
  const passedCount = traitsList.filter(t => t.verdict === 'PASS').length;
  const unconfirmedCount = traitsList.filter(t => t.verdict === 'NOT_ASSESSABLE').length;
  const culturalActionableIds = new Set((correctionPlan?.culturalDeltas || []).map(d => d.traitId));
  const attentionCount = traitsList.filter(
    t => (t.verdict === 'FAIL' || t.verdict === 'PARTIAL') && !culturalActionableIds.has(t.traitId)
  ).length;

  const isRevisionLimitReached = false;

  const isStructuralDriftOrFailure =
    qaState.status === 'error' ||
    (qaState.status === 'success' &&
      Boolean(qaState.result) &&
      (qaState.result!.culturalIdentity.overallStatus === 'CHANGES_CORE_IDENTIFICATION' ||
        qaState.result!.culturalIdentity.overallStatus === 'WEAKENS_RECOGNIZABILITY' ||
        qaState.result!.culturalIdentity.traits.some(
          t => t.category === 'essential' && t.verdict === 'FAIL'
        ) ||
        qaState.result!.culturalIdentity.traits.some(t => t.verdict === 'FAIL')));

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-[var(--surface)]/95 border border-[var(--surface-border)] shadow-sm space-y-4 transition-all duration-300">
      {/* ------------------------------------------------------------------- */}
      {/* 1. LOADING / IDLE AUTO-INITIALIZING STATE ("Ảnh Hiện Trước, QA Theo Sau") */}
      {/* ------------------------------------------------------------------- */}
      {(qaState.status === 'loading' || qaState.status === 'idle') && (
        <div className="flex items-center gap-4 py-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <div className="w-5 h-5 rounded-full border-2 border-[#C26715] border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text)]">
                Đang đánh giá bản phối...
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 animate-pulse">
                Gemini Vision
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-normal truncate">
              Đang đối chiếu tỉ lệ ống tay, nẹp cổ lập lĩnh, vạt áo và độ hòa sắc của bản phối.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. ERROR STATE */}
      {/* ------------------------------------------------------------------- */}
      {qaState.status === 'error' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text)]">
                AC chưa thể đánh giá bản phối lúc này
              </span>
              <p className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed">
                {qaState.message || 'Ảnh của bạn đã được tạo an toàn. Bạn có thể thử đánh giá lại.'}
              </p>
            </div>
          </div>

          {qaState.retryable && (
            <button
              type="button"
              onClick={onVerify}
              className="rounded-full px-4 py-1.5 text-xs font-medium bg-[var(--surface-2)] hover:bg-stone-200 border border-[var(--surface-border)] text-[var(--text)] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Thử đánh giá lại</span>
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. SUCCESS STATE: Verified Results Card — AC STYLIST PRIMARY EXPERIENCE */}
      {/* ------------------------------------------------------------------- */}
      {qaState.status === 'success' && qaState.result && (
        <div className="space-y-5">
          {/* Top Banner: AC Stylist Header */}
          {(() => {
            const statusStyle = getStatusBadge(qaState.result.culturalIdentity.overallStatus);
            const assessable = qaState.result.culturalIdentity.assessableTraitsCount;
            const total = qaState.result.culturalIdentity.totalTraitsCount;

            let statusSnippet = '';
            if (actionableCount > 0) {
              statusSnippet = ` · AC gợi ý tinh chỉnh ${actionableCount} điểm`;
            } else if (attentionCount > 0) {
              statusSnippet = ` · ${attentionCount} điểm cần lưu ý`;
            }

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--surface-border)]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs text-[#C26715]">
                      <Sparkles className="w-5 h-5 text-[#C26715]" />
                    </div>
                    <div className="space-y-1">
                      {/* KẾT QUẢ ĐÁNH GIÁ BẢN PHỐI */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text)] tracking-tight">
                          AC đánh giá bản phối · Đối chiếu đặc trưng Việt phục
                        </span>
                        <span className="text-[var(--text-muted)]">•</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--surface-border)]">
                          {revisionIndex === 0
                            ? 'Bản gốc'
                            : revisionIndex === 1
                            ? 'Bản tinh chỉnh 1'
                            : `Bản tinh chỉnh ${revisionIndex}`}
                        </span>
                        <span className="text-[var(--text-muted)]">•</span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{qaState.result.culturalIdentity.statusLabelVi}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed">
                        {statusStyle.desc}
                      </p>
                      {/* Compact metrics row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Đặc trưng thể hiện rõ ({passedCount})</span>
                        </span>
                        {unconfirmedCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--surface-border)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            <span>Chưa xác nhận được từ ảnh ({unconfirmedCount})</span>
                          </span>
                        )}
                        {actionableCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Cần tinh chỉnh ({actionableCount})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand Toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsDetailsExpanded(prev => !prev)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--surface-2)] hover:bg-stone-200/80 border border-[var(--surface-border)] transition-colors cursor-pointer"
                    >
                      <span>{isDetailsExpanded ? 'Thu gọn căn cứ' : 'Xem căn cứ đánh giá'}</span>
                      {isDetailsExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Hard QA Failure / Structural Drift Recovery Banner */}
                {revisionIndex > 0 && isStructuralDriftOrFailure && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-[var(--fail-bg)] border border-[var(--fail-border)] text-[var(--fail-text)] space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <RotateCw className="w-4 h-4 text-[var(--fail-text)] shrink-0" />
                        <span>Phát hiện sai lệch phom dáng ở Lần {revisionIndex}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--fail-bg)] text-[var(--fail-text)] border border-[var(--fail-border)]">
                        Thử lại Lần {revisionIndex}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--fail-text)] leading-relaxed font-normal opacity-90">
                      Hình ảnh Lần {revisionIndex} ghi nhận sai lệch phom dáng trang phục. Bạn có thể thử lại Lần {revisionIndex} để hệ thống dựng lại ảnh mà giữ nguyên số lượt tinh chỉnh đã dùng.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onRetryRevision) {
                            onRetryRevision(revisionIndex, userRefinementInput.trim() || undefined);
                          }
                        }}
                        disabled={isGeneratingLookbook}
                        className="rounded-full px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                      >
                        {isGeneratingLookbook ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Đang thử lại Lần {revisionIndex}...</span>
                          </>
                        ) : (
                          <>
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Thử lại Lần {revisionIndex} (Khắc phục lỗi cấu trúc)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* AC STYLIST NARRATIVE REVIEW (PRIMARY VIEW) */}
          {(() => {
            const passedTraits = traitsList.filter(t => t.verdict === 'PASS');
            const unconfirmedTraits = traitsList.filter(t => t.verdict === 'NOT_ASSESSABLE');
            const attentionTraits = traitsList.filter(
              t => (t.verdict === 'FAIL' || t.verdict === 'PARTIAL') && !culturalActionableIds.has(t.traitId)
            );

            // Natural summary sentence
            let overallSummary = 'Bản phối này nhìn tổng thể khá gọn gàng và hài hòa với bối cảnh đã chọn.';
            if (qaState.result.culturalIdentity.overallStatus === 'PRESERVES_IDENTITY') {
              overallSummary = 'Bản phối giữ rõ các đặc trưng chính mà AC đang đối chiếu.';
            } else if (qaState.result.culturalIdentity.overallStatus === 'CONTEXT_SENSITIVE') {
              overallSummary = 'Bản phối dung hòa hài hòa giữa vẻ trang nhã cổ phong và nét phóng khoáng của thời trang đương đại. Các phụ kiện hoặc biến tấu phối thuộc lớp thẩm mỹ hiện đại, không phải căn cứ lịch sử bắt buộc.';
            } else if (qaState.result.culturalIdentity.overallStatus === 'WEAKENS_RECOGNIZABILITY') {
              overallSummary = 'Bản phối giữ được bố cục chung, tuy nhiên một vài chi tiết cần được lưu ý để nhận diện đặc trưng không bị mờ nhạt.';
            } else if (qaState.result.culturalIdentity.overallStatus === 'CHANGES_CORE_IDENTIFICATION') {
              overallSummary = 'Bản phối có dấu hiệu xê dịch khỏi cấu trúc nhận diện cốt lõi; AC khuyên bạn nên điều chỉnh lại các điểm giải phẫu quan trọng.';
            } else if (qaState.result.culturalIdentity.overallStatus === 'INSUFFICIENT_EVIDENCE') {
              overallSummary = 'Góc chụp hoặc bố cục ảnh hiện chưa để lộ đủ góc nhìn để khẳng định toàn diện các đặc trưng then chốt.';
            }

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FCFAF6] border border-amber-900/10 space-y-3.5 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[var(--text)]">
                      Góc nhìn từ AC
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
                      {overallSummary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--surface-border)] text-xs">
                  {/* Điểm đang ổn */}
                  {passedTraits.length > 0 && (
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đặc trưng thể hiện rõ ({passedTraits.length})</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {passedTraits.slice(0, 3).map(t => t.traitNameVi).join('; ')}
                        {passedTraits.length > 3 ? ` và ${passedTraits.length - 3} đặc trưng khác.` : '.'}
                      </p>
                    </div>
                  )}

                  {/* AC muốn lưu ý */}
                  {attentionTraits.length > 0 && (
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-amber-200/70 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>AC muốn lưu ý ({attentionTraits.length})</span>
                      </div>
                      <ul className="text-[11px] text-amber-900 list-disc list-inside space-y-0.5">
                        {attentionTraits.slice(0, 2).map(t => (
                          <li key={t.traitId}>
                            <strong>{t.traitNameVi}</strong>: {t.observedDeviation || 'Cần chú ý góc nhìn và tỉ lệ.'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Chưa thể xác nhận từ ảnh này */}
                  {unconfirmedTraits.length > 0 && (
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-semibold text-[11px]">
                        <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Chưa xác nhận được từ ảnh ({unconfirmedTraits.length})</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {unconfirmedTraits.slice(0, 2).map(t => t.traitNameVi).join('; ')}
                        {unconfirmedTraits.length > 2 ? ` và ${unconfirmedTraits.length - 2} đặc trưng khác chưa đủ góc máy.` : ' do góc chụp hoặc nếp gấp vải.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* DUAL-SOURCE GROUNDED REVISION PLAN & USER CTA / COMPACT SUCCESS STATE */}
          {hasCorrectionTargets ? (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Wand2 className="w-4 h-4 text-amber-600" />
                    <span>AC gợi ý tinh chỉnh {actionableCount} điểm</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-normal">
                    {correctionPlan?.revisionTargetSummary}
                  </p>
                </div>

                {onTriggerRevision ? (
                  <button
                    type="button"
                    onClick={onTriggerRevision}
                    disabled={isGeneratingLookbook}
                    className="rounded-full px-5 py-2 text-xs font-semibold bg-[#C26715] hover:bg-[#A85507] text-white shadow-sm shadow-[#C26715]/25 hover:shadow-md flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-center transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Tinh chỉnh theo đánh giá</span>
                    <span className="text-[10px] text-white/80 font-normal">
                      (Lần {revisionIndex + 1})
                    </span>
                  </button>
                ) : null}
              </div>

              {/* Deltas breakdown */}
              <div className="space-y-2 pt-1 border-t border-amber-200/60 text-xs">
                {correctionPlan?.culturalDeltas && correctionPlan.culturalDeltas.length > 0 && (
                  <div className="space-y-1 text-[11px] text-amber-900">
                    <span className="font-semibold">Mục tiêu chuẩn hóa văn hóa:</span>
                    <ul className="list-disc list-inside pl-1 text-amber-800 space-y-0.5">
                      {correctionPlan.culturalDeltas.map(cd => (
                        <li key={cd.traitId}>
                          <strong>{cd.traitNameVi}</strong>: {cd.canonicalGuidance}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {correctionPlan?.fidelityDeltas && correctionPlan.fidelityDeltas.length > 0 && (
                  <div className="space-y-1 text-[11px] text-amber-900">
                    <span className="font-semibold">Mục tiêu khớp bản phối:</span>
                    <ul className="list-disc list-inside pl-1 text-amber-800 space-y-0.5">
                      {correctionPlan.fidelityDeltas.map((fd, idx) => {
                        const elementLabelMap: Record<string, string> = {
                          palette: 'Bảng màu',
                          fabric: 'Chất liệu vải',
                          lowerGarment: 'Hạ phục',
                          footwear: 'Giày dép',
                          accessories: 'Phụ kiện'
                        };
                        const displayElement = elementLabelMap[fd.element] || fd.element;
                        let displayExpected = fd.expectedValue;
                        if (fd.element === 'fabric') displayExpected = getFabricLabel(fd.expectedValue);
                        else if (fd.element === 'lowerGarment') displayExpected = getLowerGarmentLabel(fd.expectedValue);
                        else if (fd.element === 'footwear') displayExpected = getFootwearLabel(fd.expectedValue);
                        else if (fd.element === 'accessories') displayExpected = getAccessoryLabel(fd.expectedValue);

                        return (
                          <li key={idx}>
                            <strong>{displayElement}</strong>: {fd.description} ({displayExpected})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : attentionCount > 0 ? (
            /* Advisory Note when there are non-pass items but 0 actionable correction targets */
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold text-amber-950 block">
                    {attentionCount} điểm lưu ý mang tính tham khảo
                  </span>
                  <p className="text-[11px] text-amber-800/90 font-normal leading-relaxed">
                    Các chi tiết quan sát được không làm sai lệch nhận diện cốt lõi; không có điểm cần can thiệp tinh chỉnh cấu trúc.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Compact Success State when all assessable traits are clean */
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold text-emerald-950 block">
                    Chưa cần chỉnh thêm về đặc trưng văn hóa
                  </span>
                  <p className="text-[11px] text-emerald-800/90 font-normal leading-relaxed">
                    Các đặc trưng nhìn thấy trong ảnh đều phù hợp; những chi tiết bị khuất hoặc chưa thể xác nhận không bị tính là lỗi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* G3C: USER-REFERENCED TWO-STAGE REFINEMENT SECTION — PROGRESSIVE DISCLOSURE */}
          {!isRefinementOpen ? (
            /* Default Compact State */
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[#E8E3DC] shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[var(--text)]">Muốn chỉnh thêm theo ý bạn?</h4>
                  <p className="text-[11px] text-[var(--text-muted)] font-normal">
                    Thay đổi ánh sáng, bố cục, độ rủ hoặc phong thái mà không thay cấu trúc bản phối.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRefinementOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-amber-900 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-300 transition-colors cursor-pointer self-start sm:self-center"
                >
                  <span>Mô tả điều bạn muốn chỉnh ↓</span>
                </button>
              </div>
            </div>
          ) : (
            /* Expanded Refinement Container */
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-amber-200/80 space-y-3.5 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)]">Tinh chỉnh theo ý tôi</h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-normal">
                      Tự mô tả điều bạn muốn thay đổi: ánh sáng, bố cục, độ rủ vải hoặc dáng đứng.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                    Lượt tinh chỉnh {revisionIndex}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRefinementOpen(false)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer px-2 py-0.5"
                  >
                    Thu gọn ↑
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {refinementPreviewState === 'ready' && previewAnalysis ? (
                    /* STAGE 2: PREVIEW & CONFIRMATION / BLOCKING */
                    <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-amber-200/80 space-y-3 text-xs shadow-2xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <span className="font-semibold text-amber-950">Phương án tinh chỉnh đã sẵn sàng</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            previewAnalysis.allowed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : previewAnalysis.category === 'STRUCTURAL_CONTRADICTION'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          }`}
                        >
                          {previewAnalysis.allowed
                            ? `Sẵn sàng tạo bản tinh chỉnh ${revisionIndex + 1}`
                            : `Từ chối - ${
                                previewAnalysis.category === 'STRUCTURAL_CONTRADICTION'
                                  ? 'Xung đột cấu trúc'
                                  : 'Cần đổi Bản phối'
                              }`}
                        </span>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div className="space-y-2.5">
                          <div>
                            <span className="font-semibold text-[var(--text-secondary)] block mb-0.5">Bạn muốn:</span>
                            <p className="text-[var(--text)] bg-[var(--surface-2)] p-2 rounded-lg border border-[var(--surface-border)] italic">
                              "{userRefinementInput}"
                            </p>
                          </div>

                          {/* Multi-clause Breakdown Display */}
                          {previewAnalysis.allowedClauses && previewAnalysis.allowedClauses.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-950 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[11px] flex items-center gap-1 text-emerald-900">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Phần chỉnh ảnh hợp lệ ({previewAnalysis.allowedClauses.length}):</span>
                                </span>
                                {!previewAnalysis.allowed && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const validText = (previewAnalysis.allowedClauses || []).join(', ');
                                      setUserRefinementInput(validText);
                                      setRefinementPreviewState('analyzing');
                                      setTimeout(() => {
                                        const analysis = classifyRefinementInput(validText, garmentId);
                                        setPreviewAnalysis(analysis);
                                        setRefinementPreviewState('ready');
                                      }, 200);
                                    }}
                                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                                  >
                                    Chạy phần chỉnh ảnh hợp lệ ✦
                                  </button>
                                )}
                              </div>
                              <ul className="list-disc list-inside pl-1 space-y-0.5 text-[10px] text-emerald-800">
                                {previewAnalysis.allowedClauses.map((clause, idx) => (
                                  <li key={idx}>"{clause}"</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {previewAnalysis.blockedClauses && previewAnalysis.blockedClauses.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 space-y-2">
                              <span className="font-semibold text-[11px] flex items-center gap-1 text-amber-900">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Phần không thể tinh chỉnh qua xử lý ảnh ({previewAnalysis.blockedClauses.length}):</span>
                              </span>
                              <div className="space-y-2">
                                {previewAnalysis.blockedClauses.map((b, idx) => (
                                  <div key={idx} className="p-2 rounded-lg bg-[var(--surface)]/90 border border-amber-200/60 text-[10px] space-y-1">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                      <span className="font-semibold text-[var(--text)] italic">"{b.text}"</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                        b.category === 'STRUCTURAL_CONTRADICTION'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                                      }`}>
                                        {b.category === 'STRUCTURAL_CONTRADICTION' ? 'Xung đột cấu trúc' : 'Cần đổi Bản phối'}
                                      </span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] leading-relaxed font-normal">
                                      {b.reason || previewAnalysis.reason}
                                    </p>

                                    {/* Actionable recovery buttons */}
                                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                      {b.suggestedAction === 'CHANGE_COLOR' ? (
                                        <div className="w-full space-y-2">
                                          <button
                                            type="button"
                                            onClick={() => setIsColorPickerOpen(prev => !prev)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
                                          >
                                            <Palette className="w-3 h-3" />
                                            <span>{isColorPickerOpen ? 'Đóng bảng màu ↑' : 'Đổi màu chủ đạo trong Bản phối ↓'}</span>
                                          </button>

                                          {isColorPickerOpen && (
                                            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-amber-200/90 shadow-2xs space-y-2 animate-in fade-in duration-150">
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-semibold text-[var(--text)]">
                                                  Chọn màu chủ đạo:
                                                </span>
                                                <span className="text-[var(--text-muted)]">
                                                  10 sắc thái chuẩn mực
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                                {PALETTES.map(p => {
                                                  const isSuggested =
                                                    b.suggestedColorId === p.id ||
                                                    previewAnalysis.suggestedColorId === p.id;
                                                  return (
                                                    <button
                                                      key={p.id}
                                                      type="button"
                                                      onClick={() => {
                                                        if (onColorChange) {
                                                          onColorChange(p.id);
                                                        }
                                                        const section =
                                                          document.getElementById('section-blueprint') ||
                                                          document.getElementById('section-2-blueprint');
                                                        section?.scrollIntoView({ behavior: 'smooth' });
                                                        setIsColorPickerOpen(false);
                                                      }}
                                                      className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                                                        isSuggested
                                                          ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-400'
                                                          : 'border-[var(--surface-border)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]'
                                                      }`}
                                                    >
                                                      <span
                                                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                                                        style={{ backgroundColor: p.hex }}
                                                      />
                                                      <span className="text-[10px] font-medium text-[var(--text)] truncate">
                                                        {p.name}
                                                      </span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : b.suggestedAction === 'CHANGE_GARMENT' ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const section = document.getElementById('section-recommendations') || document.getElementById('section-1-recommendations');
                                            section?.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
                                        >
                                          <ArrowRight className="w-3 h-3" />
                                          <span>Chọn lại dáng áo ở phần Gợi ý →</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const section = document.getElementById('section-blueprint') || document.getElementById('section-2-blueprint');
                                            section?.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-[var(--surface-2)] hover:bg-stone-200 text-[var(--text-secondary)] transition-colors cursor-pointer"
                                        >
                                          <span>Xem cấu hình trong Bản phối →</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {previewAnalysis.allowed ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 space-y-0.5">
                                <span className="font-semibold block">Sẽ thay đổi:</span>
                                <ul className="list-disc list-inside pl-1 space-y-0.5 text-[10px]">
                                  {(previewAnalysis.changes || [userRefinementInput]).map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 space-y-0.5">
                                <span className="font-semibold block">Giữ nguyên:</span>
                                <ul className="list-disc list-inside pl-1 space-y-0.5 text-[10px]">
                                  {(previewAnalysis.preserved || []).map((p, idx) => (
                                    <li key={idx}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`p-3 rounded-xl border space-y-2 ${
                                previewAnalysis.category === 'STRUCTURAL_CONTRADICTION'
                                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                                <AlertTriangle
                                  className={`w-4 h-4 shrink-0 ${
                                    previewAnalysis.category === 'STRUCTURAL_CONTRADICTION'
                                      ? 'text-rose-600'
                                      : 'text-amber-600'
                                  }`}
                                />
                                <span>Lý do không thể thực hiện qua tinh chỉnh ảnh:</span>
                              </div>
                              <p className="text-[11px] leading-relaxed font-normal">
                                {previewAnalysis.reason}
                              </p>
                              <div className="pt-1.5 text-[10px] opacity-90 border-t border-[var(--surface-border)] italic font-normal">
                                💡 {previewAnalysis.guidance}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-amber-100 gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setRefinementPreviewState('idle');
                            }}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] underline cursor-pointer"
                          >
                            Chỉnh sửa lại mô tả
                          </button>

                          {previewAnalysis.allowed ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onTriggerUserGuidedRevision) {
                                  setRefinementError(null);
                                  onTriggerUserGuidedRevision(userRefinementInput.trim());
                                }
                              }}
                              disabled={isGeneratingLookbook}
                              className="rounded-full px-5 py-2 text-xs font-semibold bg-[#C26715] hover:bg-[#A85507] text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                            >
                              {isGeneratingLookbook ? (
                                <>
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                  <span>Đang tạo bản tinh chỉnh...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Xác nhận và tạo bản tinh chỉnh</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const section = document.getElementById('section-blueprint') || document.getElementById('section-2-blueprint');
                                  section?.scrollIntoView({ behavior: 'smooth' });
                                  if (onReturnToSandbox) onReturnToSandbox();
                                }}
                                className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-[#C26715]" />
                                <span>Xem Bản phối (Section 2)</span>
                              </button>
                              <button
                                type="button"
                                disabled
                                className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--surface-border)] cursor-not-allowed opacity-60 flex items-center gap-1.5"
                                title="Yêu cầu bị khóa do vi phạm cấu trúc hoặc thuộc phạm vi Bản phối"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Khóa tạo tinh chỉnh</span>
                              </button>
                            </div>
                          )}
                        </div>

                      {refinementError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{refinementError}</span>
                        </div>
                      )}
                      </div>
                    </div>
                  ) : (
                    /* STAGE 1: INPUT & ANALYSIS TRIGGER */
                    <div className="space-y-3">
                      <textarea
                        value={userRefinementInput}
                        onChange={(e) => {
                          setUserRefinementInput(e.target.value);
                          if (refinementError) setRefinementError(null);
                        }}
                        placeholder="VD: Tôi muốn ảnh sáng hơn, tà áo rủ tự nhiên hơn và dáng đứng thanh lịch hơn, nhưng vẫn giữ nguyên cấu trúc cổ và tay áo."
                        rows={2}
                        className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--surface-border)] text-xs text-[var(--text)] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none shadow-2xs"
                      />

                      {refinementError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{refinementError}</span>
                        </div>
                      )}

                      {/* Policy disclosure button */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsPolicyOpen(prev => !prev)}
                          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isPolicyOpen ? 'Thu gọn nguyên tắc tinh chỉnh ↑' : 'Xem nguyên tắc tinh chỉnh →'}</span>
                        </button>

                        {isPolicyOpen && (
                          <div className="mt-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--surface-border)] text-[11px] space-y-1.5 text-[var(--text-secondary)] animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5 text-amber-950 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#C26715]" />
                              <span>Phạm vi điều chỉnh hình ảnh và giữ nguyên bản phối</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px]">
                              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 space-y-0.5">
                                <span className="font-semibold block">Được phép điều chỉnh (Ảnh):</span>
                                <span>Ánh sáng, bố cục, góc máy, độ rủ vải, dáng đứng, phong thái.</span>
                              </div>
                              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 space-y-0.5">
                                <span className="font-semibold block">Khóa cố định (Bản phối):</span>
                                <span>Dáng áo, cổ lập lĩnh, ống tay, bảng màu, chất liệu, phụ kiện.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          Lượt tinh chỉnh {revisionIndex}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const text = userRefinementInput.trim();
                            if (!text || text.length < 3) {
                              setRefinementError('Vui lòng mô tả điều bạn muốn chỉnh bằng ít nhất 3 ký tự.');
                              return;
                            }
                            setRefinementError(null);
                            setRefinementPreviewState('analyzing');
                            setTimeout(() => {
                              const analysis = classifyRefinementInput(text, garmentId);
                              setPreviewAnalysis(analysis);
                              setRefinementPreviewState('ready');
                            }, 300);
                          }}
                          disabled={!userRefinementInput.trim() || refinementPreviewState === 'analyzing'}
                          className="rounded-full px-5 py-2 text-xs font-semibold bg-[#C26715] hover:bg-[#A85507] text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {refinementPreviewState === 'analyzing' ? (
                            <>
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              <span>Đang phân tích...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Xem trước phương án chỉnh</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Collapsible Technical Evidence Section ("Xem căn cứ đánh giá") */}
          {isDetailsExpanded && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200 border-t border-[var(--surface-border)]">
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Căn cứ đối soát chi tiết từng đặc trưng
                </span>
              </div>
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('IDENTITY')}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeTab === 'IDENTITY'
                      ? 'bg-[#C26715] text-white font-semibold shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] font-medium'
                  }`}
                >
                  Đặc trưng nhận diện cổ phục
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('FIDELITY')}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeTab === 'FIDELITY'
                      ? 'bg-[#C26715] text-white font-semibold shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] font-medium'
                  }`}
                >
                  Độ khớp với bản phối
                </button>
                {revisions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('TRANSITIONS')}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      activeTab === 'TRANSITIONS'
                        ? 'bg-[#C26715] text-white font-semibold shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] font-medium'
                    }`}
                  >
                    Chuyển dịch qua các lần tinh chỉnh ({revisions.length})
                  </button>
                )}
              </div>

              {/* TAB 1: CULTURAL TRAITS BREAKDOWN */}
              {activeTab === 'IDENTITY' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    {qaState.result.culturalIdentity.traits.map(trait => {
                      const cat = getCategoryLabel(trait.category);
                      return (
                        <div
                          key={trait.traitId}
                          className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--surface-border)] space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cat.color} shrink-0`}
                              >
                                {cat.label}
                              </span>
                              <span className="font-semibold text-[var(--text)] truncate">
                                {trait.traitNameVi}
                              </span>
                            </div>
                            {getVerdictBadge(trait.verdict)}
                          </div>

                          <p className="text-[var(--text-secondary)] font-normal leading-relaxed pl-1">
                            {trait.visualEvidence}
                          </p>

                          {trait.observedDeviation && (
                            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>Ghi nhận sai lệch: {trait.observedDeviation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: OUTFIT FIDELITY DETAILS */}
              {activeTab === 'FIDELITY' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Palette Match */}
                    <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--surface-border)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Hòa sắc bảng màu</span>
                        </span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.palette.primaryMatch)}
                      </div>
                      <div className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                        <div className="flex items-center justify-between">
                          <span>Màu chủ đạo:</span>
                          {getVerdictBadge(qaState.result.outfitFidelity.details.palette.primaryMatch)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Màu phối cùng:</span>
                          {getVerdictBadge(qaState.result.outfitFidelity.details.palette.supportingMatch)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Màu điểm nhấn:</span>
                          {getVerdictBadge(qaState.result.outfitFidelity.details.palette.accentMatch)}
                        </div>
                      </div>
                      {qaState.result.outfitFidelity.details.palette.notes && (
                        <p className="text-[11px] text-[var(--text-muted)] italic">
                          {qaState.result.outfitFidelity.details.palette.notes}
                        </p>
                      )}
                    </div>

                    {/* Fabric & Structure */}
                    <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--surface-border)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Chất liệu & Cấu trúc</span>
                        </span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.fabricMatch)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Hạ phục:</span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.lowerGarmentMatch)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Giày dép:</span>
                        {getVerdictBadge(qaState.result.outfitFidelity.details.footwearMatch)}
                      </div>
                    </div>
                  </div>

                  {/* Accessories Match & Unexpected Accessories */}
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--surface-border)] space-y-2">
                    <span className="font-semibold text-[var(--text)]">
                      Phụ kiện đối soát
                    </span>
                    {qaState.result.outfitFidelity.details.expectedAccessories.length > 0 ? (
                      <div className="space-y-1.5">
                        {qaState.result.outfitFidelity.details.expectedAccessories.map((acc, idx) => (
                          <div
                            key={acc.accessoryId || idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]"
                          >
                            <span className="font-medium text-[var(--text)]">
                              {getAccessoryLabel(acc.accessoryId)}
                            </span>
                            {getVerdictBadge(acc.verdict)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Bản phối yêu cầu không dùng phụ kiện.
                      </p>
                    )}

                    {/* Unexpected Accessories Warning */}
                    {qaState.result.outfitFidelity.details.unexpectedAccessories.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Phát hiện chi tiết ngoài bản phối:</span>
                        </div>
                        <ul className="list-disc list-inside pl-1 text-amber-800">
                          {qaState.result.outfitFidelity.details.unexpectedAccessories.map((item, idx) => (
                            <li key={idx}>{getAccessoryLabel(item)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TRAIT TRANSITIONS */}
              {activeTab === 'TRANSITIONS' && revisions.length > 1 && (
                <TraitTransitionsView
                  revisions={revisions}
                  activeRevisionIndex={revisionIndex}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
