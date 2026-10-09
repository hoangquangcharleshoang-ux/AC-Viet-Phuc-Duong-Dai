/**
 * AC — Section 3: Hình Ảnh Minh Họa Thực Tế (Editorial Lookbook)
 * Phase 2B.1 — Session Persistence & Editorial Lookbook Refinement
 *
 * Requirements:
 * - 2-Column Editorial layout on desktop (Image Stage left, "Bản phối được dùng" right)
 * - Responsive stack on tablet/mobile (Image -> Details -> Actions)
 * - Viewport-bounded image stage (max-height: min(70vh, 720px), object-fit: contain)
 * - Warm neutral stage background (#F8F6F0 / stone-50), no huge white void
 * - Details panel reads strictly from immutable generationSnapshot (not current mutable state)
 * - Stale state detection (dimmed image + notice + "Cập nhật ảnh theo bản phối mới" CTA)
 * - Lightbox ("Xem lớn") with full viewport modal, Esc/backdrop dismissal, locked body scroll
 * - Download with direct server endpoint (`?download=1`)
 * - Preserves old image during regeneration with gentle loading dim/overlay
 * - Expired & Interrupted state handling
 * - Zero technical noise (no model names, no raw hashes, no raw prompts)
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCw,
  AlertCircle,
  Maximize2,
  Download,
  X,
  RefreshCw,
  Clock,
  Layers,
  Palette,
  CheckCircle2,
  Compass
} from 'lucide-react';
import {
  LookbookGenerationState,
  GarmentId,
  GenerationSnapshot,
  VisualQAState,
  LookbookRevisionItem,
  GroundedCorrectionPlan
} from '../types/index';
import { GARMENTS } from '../data/culturalKnowledgePack';
import {
  getFabricLabel,
  getLowerGarmentLabel,
  getFootwearLabel,
  getAccessoryLabel
} from '../data/canonicalCatalog';
import { CulturalQACard } from './CulturalQACard';

interface Section3LookbookProps {
  lookbookState: LookbookGenerationState;
  selectedGarmentId: GarmentId;
  currentOutfitFingerprint: string;
  isGenerating?: boolean;
  qaState?: VisualQAState;
  revisions?: LookbookRevisionItem[];
  activeRevisionIndex?: number;
  correctionPlan?: GroundedCorrectionPlan;
  onRegenerate?: (forceRegenerate: boolean) => void;
  onStaleUpdate?: () => void;
  onImageExpired?: () => void;
  onVerifyLookbook?: () => void;
  onTriggerRevision?: () => void;
  onTriggerUserGuidedRevision?: (refinementText: string) => void;
  onRetryRevision?: (revisionIndex: number, newRefinementText?: string) => void;
  onSelectRevision?: (revisionIndex: number) => void;
  isExploringBranch?: boolean;
  explorationTitle?: string;
  onReturnToRoot?: () => void;
}

export const Section3Lookbook: React.FC<Section3LookbookProps> = ({
  lookbookState,
  selectedGarmentId,
  currentOutfitFingerprint,
  isGenerating = false,
  qaState,
  revisions = [],
  activeRevisionIndex = 0,
  correctionPlan,
  onRegenerate,
  onStaleUpdate,
  onImageExpired,
  onVerifyLookbook,
  onTriggerRevision,
  onTriggerUserGuidedRevision,
  onRetryRevision,
  onSelectRevision,
  isExploringBranch = false,
  explorationTitle,
  onReturnToRoot
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Keyboard navigation for Lightbox (Escape to close) + Body scroll lock
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  // If idle, Section 3 does not render
  if (lookbookState.status === 'idle') {
    return null;
  }

  // Handle image loading error (e.g. 404 expired from ephemeral memory)
  const handleImageError = () => {
    if (onImageExpired) {
      onImageExpired();
    }
  };

  // Check if viewing a specific revision from the thread
  const selectedRevItem = revisions.find(r => r.revisionIndex === activeRevisionIndex);

  // Resolve active image and snapshot data
  let displayImageUrl: string | undefined = selectedRevItem?.imageUrl;
  let displayGenerationId: string | undefined = selectedRevItem?.generationId;
  let displaySnapshot: GenerationSnapshot | undefined = selectedRevItem?.snapshot;
  let displayRevisionIndex: number = selectedRevItem ? selectedRevItem.revisionIndex : 0;
  let isDisplayStale = false;

  if (!displayImageUrl) {
    if (lookbookState.status === 'success') {
      displayImageUrl = lookbookState.imageUrl;
      displayGenerationId = lookbookState.generationId;
      displaySnapshot = lookbookState.snapshot;
      displayRevisionIndex = lookbookState.revisionIndex || 0;
      isDisplayStale = lookbookState.outfitFingerprint !== currentOutfitFingerprint;
    } else if (
      (lookbookState.status === 'generating' || lookbookState.status === 'error') &&
      lookbookState.previousImage
    ) {
      displayImageUrl = lookbookState.previousImage.imageUrl;
      displayGenerationId = lookbookState.previousImage.generationId;
      displaySnapshot = lookbookState.previousImage.snapshot;
      displayRevisionIndex = lookbookState.previousImage.revisionIndex || 0;
      isDisplayStale = true;
    } else if (lookbookState.status === 'expired' && lookbookState.snapshot) {
      displaySnapshot = lookbookState.snapshot;
      displayRevisionIndex = lookbookState.revisionIndex || 0;
    } else if (lookbookState.status === 'interrupted' && lookbookState.snapshot) {
      displaySnapshot = lookbookState.snapshot;
      displayRevisionIndex = lookbookState.revisionIndex || 0;
    }
  } else {
    isDisplayStale = (displaySnapshot?.boundFingerprint || selectedRevItem?.boundFingerprint) !== currentOutfitFingerprint;
  }

  const garment = displaySnapshot?.garmentId
    ? GARMENTS[displaySnapshot.garmentId]
    : GARMENTS[selectedGarmentId];


  return (
    <section id="section-lookbook" className="space-y-6 pt-4 scroll-mt-20">
      {/* Exploration Branch Banner */}
      {isExploringBranch && (
        <div className="rounded-2xl p-4 bg-indigo-50/90 border border-indigo-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold text-indigo-950 block sm:inline mr-1">
                Đang xem nhánh khám phá: {explorationTitle || 'Biến tấu'}
              </span>
              <span className="text-stone-600 font-normal">
                — Bản phối gốc và V0/V1/V2 vẫn được bảo toàn.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onReturnToRoot}
            className="rounded-full px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Quay lại bản phối gốc
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>Bước 3 · Hình Ảnh Minh Họa</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">
          Nhìn Bản Phối Thành Hình
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 font-normal">
          Ảnh minh họa được dựng từ bản phối để bạn hình dung phom dáng, bảng màu và cách phối tổng thể.
        </p>
      </div>

      {/* Main Container */}
      <div
        className="rounded-3xl p-5 sm:p-7 md:p-8 bg-white/90 border border-stone-200/90 shadow-sm transition-all duration-300"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}
      >
        {/* INTERRUPTED STATE */}
        {lookbookState.status === 'interrupted' && !displayImageUrl && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-stone-900">
                Lần tạo ảnh trước đã bị gián đoạn
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                {lookbookState.message || 'Bạn có thể tiếp tục tạo ảnh minh họa khi sẵn sàng.'}
              </p>
            </div>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(false)}
                className="mt-2 rounded-full px-6 py-2.5 text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo ảnh minh họa thực tế</span>
              </button>
            )}
          </div>
        )}

        {/* EXPIRED STATE (No image in store or 404) */}
        {lookbookState.status === 'expired' && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-stone-900">
                Ảnh minh họa trước đã hết thời hạn lưu tạm
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Bản phối và các lựa chọn trang phục của bạn vẫn được giữ nguyên vẹn.
              </p>
            </div>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(false)}
                className="mt-2 rounded-full px-6 py-2.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tạo phương án khác</span>
              </button>
            )}
          </div>
        )}

        {/* ERROR STATE (Without previous image) */}
        {lookbookState.status === 'error' && !displayImageUrl && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-stone-900">
                Chưa thể hoàn tất hình ảnh minh họa
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-normal">
                {lookbookState.message}
              </p>
            </div>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(false)}
                className="mt-2 rounded-full px-5 py-2 text-xs font-medium bg-white text-stone-800 border border-stone-200 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Thử tạo lại</span>
              </button>
            )}
          </div>
        )}

        {/* INITIAL GENERATING SKELETON (When no previous image exists) */}
        {lookbookState.status === 'generating' && !displayImageUrl && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 space-y-6 text-center">
            <div className="relative w-64 sm:w-80 aspect-[2/3] rounded-3xl bg-[#F8F6F0] border border-stone-200/80 overflow-hidden flex flex-col items-center justify-center shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/30 via-stone-100/50 to-amber-50/20 animate-pulse" />
              <div className="relative z-10 flex flex-col items-center space-y-3 p-6">
                <div className="w-10 h-10 rounded-2xl bg-white/95 border border-indigo-100 flex items-center justify-center shadow-xs">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
                <span className="text-xs font-semibold text-stone-700 tracking-tight">
                  Đang dựng bản phối…
                </span>
              </div>
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold text-stone-900">
                AC đang dựng hình ảnh minh họa từ bản phối
              </h3>
              <p className="text-xs text-stone-500 font-normal leading-relaxed">
                Đang đối chiếu bảng màu hòa sắc và cấu trúc hình thái của {garment.canonical_name}.
              </p>
            </div>
          </div>
        )}

        {/* EDITORIAL 2-COLUMN LAYOUT (Active or Stale Image Display) */}
        {displayImageUrl && (
          <div className="space-y-6">
            {/* Stale Warning Banner */}
            {isDisplayStale && (
              <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.
                  </span>
                </div>
                {onStaleUpdate && (
                  <button
                    onClick={onStaleUpdate}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cập nhật ảnh theo bản phối mới ✦</span>
                  </button>
                )}
              </div>
            )}

            {/* Error Banner while retaining previous image */}
            {lookbookState.status === 'error' && (
              <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-3 text-xs text-rose-800 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{lookbookState.message}</span>
                </div>
                {onRegenerate && (
                  <button
                    onClick={() => onRegenerate(true)}
                    className="font-semibold text-rose-800 hover:text-rose-950 underline shrink-0 cursor-pointer"
                  >
                    Thử lại
                  </button>
                )}
              </div>
            )}

            {/* Revision Selector Tabs (When multiple revisions exist in thread) */}
            {revisions && revisions.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-stone-100/90 border border-stone-200/80 w-fit shadow-2xs">
                {revisions.map((rev) => {
                  const label =
                    rev.revisionIndex === 0
                      ? 'v0 · Bản gốc'
                      : `v${rev.revisionIndex} · Tinh chỉnh ${rev.revisionIndex}`;
                  const isSelected = rev.revisionIndex === displayRevisionIndex;
                  return (
                    <button
                      key={rev.generationId}
                      type="button"
                      onClick={() => onSelectRevision && onSelectRevision(rev.revisionIndex)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-medium'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2-Column Grid: Left Image Stage (6 cols) | Right Details Panel (6 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: IMAGE STAGE */}
              <div className="lg:col-span-6 flex flex-col items-center space-y-3">
                {/* Lookbook Canvas Card with Warm Neutral Background */}
                <div
                  className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-3xl overflow-hidden bg-[#F8F6F0] border border-stone-200/85 shadow-sm flex items-center justify-center group"
                >
                  <img
                    src={displayImageUrl}
                    alt={`Ảnh minh họa bản phối ${garment.canonical_name}`}
                    onError={handleImageError}
                    className={`w-full h-full object-cover object-top transition-all duration-300 ${
                      isDisplayStale ? 'opacity-85' : 'opacity-100'
                    } ${isGenerating ? 'opacity-50 blur-[1px]' : ''}`}
                    loading="eager"
                  />

                  {/* Dimension / Orientation Subtle Tag */}
                  <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-stone-900/60 text-white/90 backdrop-blur-md border border-white/10 shadow-xs pointer-events-none">
                    Tỷ lệ 3:4
                  </div>

                  {/* Stale Overlay Badge */}
                  {isDisplayStale && !isGenerating && (
                    <div className="absolute bottom-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-500/90 text-white backdrop-blur-md shadow-xs pointer-events-none">
                      Ảnh phiên bản trước
                    </div>
                  )}

                  {/* Generating Spinner Overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/95 border border-stone-200 flex items-center justify-center shadow-md">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      </div>
                      <span className="text-xs font-semibold text-white px-3 py-1 rounded-full bg-stone-900/70 backdrop-blur-md shadow-xs">
                        Đang dựng bản phối…
                      </span>
                    </div>
                  )}
                </div>

                {/* Image Stage Action Toolbar (Xem lớn · Tải ảnh · Tạo phương án khác) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 w-full px-1">
                  <div className="flex items-center gap-2">
                    {/* [Xem lớn] Lightbox Button */}
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-stone-100/90 hover:bg-stone-200/90 border border-stone-200/80 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Xem lớn</span>
                    </button>

                    {/* [Tải ảnh] Download Button */}
                    {displayGenerationId && (
                      <a
                        href={`/api/generated-images/${displayGenerationId}?download=1`}
                        download
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-stone-100/90 hover:bg-stone-200/90 border border-stone-200/80 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải ảnh</span>
                      </a>
                    )}
                  </div>

                  {/* [Tạo phương án khác] Explicit Regenerate Button (forceRegenerate = true) */}
                  {onRegenerate && (
                    <button
                      onClick={() => onRegenerate(true)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>Tạo phương án khác</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT: DETAILS PANEL — “BẢN PHỐI ĐƯỢC DÙNG” */}
              <div className="lg:col-span-6 rounded-3xl p-5 sm:p-6 bg-white/80 border border-stone-200/80 shadow-2xs space-y-5">
                <div className="space-y-1 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      THÔNG SỐ THỰC TẾ
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-xs font-semibold text-stone-900">
                      Bản phối được dùng
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-normal">
                    Các thông số hình thái và màu sắc cấu thành ảnh minh họa hiện tại.
                  </p>
                </div>

                {displaySnapshot ? (
                  <div className="space-y-4 text-xs">
                    {/* 1. Dáng áo */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                        Dáng áo
                      </span>
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 font-medium text-stone-900 flex items-center justify-between">
                        <span>{garment.canonical_name}</span>
                        <span className="text-[10px] text-stone-500 font-normal">
                          {garment.historical_function ? garment.historical_function.split(';')[0] : 'Trang phục truyền thống'}
                        </span>
                      </div>
                    </div>

                    {/* 2. Bảng màu 3 sắc thái */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                        Bảng màu hòa sắc
                      </span>
                      <div className="space-y-1.5">
                        {displaySnapshot.palette.map((item, idx) => {
                          const roleLabel =
                            item.role === 'PRIMARY'
                              ? 'Chủ đạo'
                              : item.role === 'SUPPORTING'
                              ? 'Phối cùng'
                              : 'Điểm nhấn';
                          return (
                            <div
                              key={item.id || idx}
                              className="flex items-center justify-between p-2 rounded-xl bg-stone-50/80 border border-stone-200/60"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-4 h-4 rounded-full border border-stone-300/80 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: item.hex || '#E5E5E5' }}
                                />
                                <span className="font-medium text-stone-800 truncate">
                                  {item.name || item.id}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-md shrink-0">
                                {roleLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Chất liệu vải */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                        Chất liệu
                      </span>
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-800">
                        {getFabricLabel(displaySnapshot.fabricId)}
                      </div>
                    </div>

                    {/* 4. Hạ phục */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                        Hạ phục
                      </span>
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-800">
                        {getLowerGarmentLabel(displaySnapshot.lowerGarmentId)}
                      </div>
                    </div>

                    {/* 5. Giày dép */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                        Giày dép
                      </span>
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-800">
                        {getFootwearLabel(displaySnapshot.footwearId)}
                      </div>
                    </div>

                    {/* 6. Phụ kiện */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                        Phụ kiện đi kèm
                      </span>
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-800">
                        {displaySnapshot.activeAccessoryIds.length > 0 ? (
                          <div className="space-y-1">
                            {displaySnapshot.activeAccessoryIds.map(accId => (
                              <div key={accId} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span>{getAccessoryLabel(accId)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">
                            Không sử dụng phụ kiện
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400">
                    Chưa có thông số chi tiết của bản phối.
                  </div>
                )}
              </div>
            </div>

            {/* Cultural Visual QA Section (Phase 2C) */}
            <CulturalQACard
              qaState={qaState || { status: 'idle' }}
              generationId={displayGenerationId}
              boundFingerprint={
                displaySnapshot?.boundFingerprint ||
                (lookbookState.status === 'success' ? lookbookState.outfitFingerprint : undefined)
              }
              garmentId={displaySnapshot?.garmentId || selectedGarmentId}
              isGeneratingLookbook={isGenerating}
              lookbookStatus={lookbookState.status}
              lookbookErrorMessage={lookbookState.status === 'error' ? lookbookState.message : undefined}
              revisionIndex={displayRevisionIndex}
              correctionPlan={selectedRevItem?.correctionPlan || correctionPlan}
              revisions={revisions}
              onVerify={onVerifyLookbook || (() => {})}
              onTriggerRevision={onTriggerRevision}
              onTriggerUserGuidedRevision={onTriggerUserGuidedRevision}
              onRetryRevision={onRetryRevision}
            />
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL ("XEM LỚN") */}
      {isLightboxOpen && displayImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 cursor-zoom-out"
        >
          {/* Lightbox Content Container */}
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-[92vw] max-h-[92vh] flex flex-col items-center justify-center cursor-default"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Đóng xem lớn"
              className="absolute -top-12 right-0 sm:right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Contain Image */}
            <img
              src={displayImageUrl}
              alt={`Xem lớn ảnh minh họa ${garment.canonical_name}`}
              className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </section>
  );
};
