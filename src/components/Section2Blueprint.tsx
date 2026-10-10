/**
 * AC — Section 2: Bản Phối Thời Trang Đương Đại
 * Phase 2A — Cultural Fashion Co-pilot Refinement
 * - 3-Column Fashion Workspace:
 *   * Cột 1: Giữ nhận diện (Đặc trưng cốt lõi & Nên ưu tiên giữ)
 *   * Cột 2: Gợi ý phối hiện đại (Bảng màu swatches lớn, clean option pills, removable accessories)
 *   * Cột 3: Lưu ý phối đồ (Theo bối cảnh bạn chọn & Căn cứ văn hóa)
 * - Action Bar: Dynamic Outfit Summary & Reused Homepage Soft Aurora CTA
 * - Background outfitFingerprint preserved 100%
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Layers,
  HelpCircle,
  X,
  ArrowRight,
  Palette
} from 'lucide-react';
import { GarmentId, BlueprintOutput, GenerateLookbookRequest, GenderPresentation } from '../types';
import { GARMENTS } from '../data/culturalKnowledgePack';
import {
  getFabricLabel,
  getLowerGarmentLabel,
  getFootwearLabel,
  getAccessoryLabel,
  PALETTES
} from '../data/canonicalCatalog';
import { computeOutfitFingerprint } from '../shared/fingerprint';

interface Section2BlueprintProps {
  blueprint: BlueprintOutput | null;
  selectedGarmentId: GarmentId;
  selectedOccasion: string;
  selectedStyle: string;
  traditionalRatio: number;
  promptText?: string;
  genderPresentation?: GenderPresentation;
  onGenderPresentationChange?: (gender: GenderPresentation) => void;
  isLoading: boolean;
  error?: { code: string; message: string; retryable?: boolean; retryAction?: () => void } | null;
  isRecommending?: boolean;
  isGeneratingLookbook?: boolean;
  activeAccessories?: string[];
  onActiveAccessoriesChange?: (accessories: string[]) => void;
  onFingerprintChange?: (fingerprint: string) => void;
  onGenerateLookbook?: (payload: GenerateLookbookRequest) => void;
  onColorChange?: (paletteId: string) => void;
}

export const Section2Blueprint: React.FC<Section2BlueprintProps> = ({
  blueprint,
  selectedGarmentId,
  selectedOccasion,
  selectedStyle,
  traditionalRatio,
  promptText,
  genderPresentation = 'nam',
  onGenderPresentationChange,
  isLoading,
  error,
  isRecommending = false,
  isGeneratingLookbook = false,
  activeAccessories: controlledActiveAccessories,
  onActiveAccessoriesChange,
  onFingerprintChange,
  onGenerateLookbook,
  onColorChange
}) => {
  // Local state for removable accessories (Requirement 6)
  const [internalActiveAccessories, setInternalActiveAccessories] = useState<string[]>([]);
  // Progressive disclosure state for cultural evidence in Column 3
  const [isEvidenceOpen, setIsEvidenceOpen] = useState<boolean>(false);
  // Color picker dropdown state for changing PRIMARY garment color
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);

  // Effective accessories: controlled prop takes precedence if provided
  const activeAccessories = controlledActiveAccessories !== undefined
    ? controlledActiveAccessories
    : internalActiveAccessories;

  // Sync accessories when blueprint changes if not controlled
  useEffect(() => {
    if (controlledActiveAccessories === undefined && blueprint?.remixProposal?.accessoryIds) {
      setInternalActiveAccessories([...blueprint.remixProposal.accessoryIds]);
    }
  }, [blueprint, controlledActiveAccessories]);

  const garment = GARMENTS[selectedGarmentId];
  // Requirement 3: Strict Garment / Blueprint consistency guard
  const isBlueprintMatching = Boolean(blueprint && blueprint.garmentId === selectedGarmentId);

  // Remove accessory handler (Requirement 6: Remove-only, cannot add new)
  const handleRemoveAccessory = (idToRemove: string) => {
    const next = activeAccessories.filter(id => id !== idToRemove);
    if (controlledActiveAccessories === undefined) {
      setInternalActiveAccessories(next);
    }
    if (onActiveAccessoriesChange) {
      onActiveAccessoriesChange(next);
    }
  };

  // Compute Outfit Fingerprint using shared canonical generator
  const outfitFingerprint = blueprint
    ? computeOutfitFingerprint({
        garmentId: selectedGarmentId,
        palette: blueprint.remixProposal.palette,
        fabricId: blueprint.remixProposal.fabricId,
        lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
        footwearId: blueprint.remixProposal.footwearId,
        accessoryIds: activeAccessories,
        contextProps: blueprint.remixProposal.contextProps || [],
        occasion: selectedOccasion,
        style: selectedStyle,
        traditionalRatio,
        genderPresentation: genderPresentation || 'nam'
      })
    : 'AC-INIT';

  useEffect(() => {
    if (onFingerprintChange) {
      onFingerprintChange(outfitFingerprint);
    }
  }, [outfitFingerprint, onFingerprintChange]);

  // Handle generation click with effective payload (only ACTIVE accessories + contextProps)
  const handleGenerateClick = () => {
    if (!blueprint || isGeneratingLookbook || !onGenerateLookbook) return;
    const effectivePayload: GenerateLookbookRequest = {
      garmentId: selectedGarmentId,
      genderPresentation,
      remixProposal: {
        palette: blueprint.remixProposal.palette,
        fabricId: blueprint.remixProposal.fabricId,
        lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
        footwearId: blueprint.remixProposal.footwearId,
        accessoryIds: activeAccessories, // EFFECTIVE ACCESSORIES ONLY
        contextProps: blueprint.remixProposal.contextProps || []
      },
      context: {
        occasion: selectedOccasion,
        style: selectedStyle,
        traditionalRatio,
        userStyleIntent: undefined,
        genderPresentation
      },
      outfitFingerprint
    };
    onGenerateLookbook(effectivePayload);
  };

  // Evidence uncertainty statement (100% Knowledge Base - Natural language)
  const getEvidenceUncertaintyNote = (garmentId: GarmentId): string => {
    if (garmentId === 'ao_tac') {
      return 'Kích thước ống tay rộng 30–50 cm là số đo khảo sát hiện vật (ước lượng gần đúng); chiều dài buông thừa 1 tấc là ước lượng dân gian quen thuộc. Phán quyết nhận diện cốt lõi chỉ dựa trên cấu trúc tay thụng chữ nhật đối lập với tay chẽn.';
    }
    if (garmentId === 'ao_tu_than') {
      return 'Hạ phục váy đụp đen là dạng thức dân gian Bắc Bộ nguyên bản; quần lụa đen là hình thức tiếp biến quen thuộc từ cuối thế kỷ 19. Lớp yếm đào độc lập che ngực là yếu tố đặc trưng strongly_characteristic cần giữ.';
    }
    return 'Quy cách 5 thân lập lĩnh cài khuy nách phải chữ quảng được quy định chặt chẽ trong các chiếu chỉ cải cách y phục triều Nguyễn (1744, 1827, 1837) với căn cứ tư liệu rõ ràng.';
  };

  // Dynamic Outfit Summary calculation (Requirement 7)
  const getDynamicOutfitSummary = () => {
    if (!blueprint) return '';
    const paletteItems = blueprint.remixProposal.palette;
    const primaryColor = paletteItems.find(p => p.role === 'PRIMARY') || paletteItems[0];
    const supportingColor = paletteItems.find(p => p.role === 'SUPPORTING') || paletteItems[1];
    const accentColor = paletteItems.find(p => p.role === 'ACCENT') || paletteItems[2];

    const paletteSummary = primaryColor && supportingColor && accentColor
      ? `${primaryColor.name} · ${supportingColor.name} · ${accentColor.name}`
      : paletteItems.map(p => p.name).join(' · ');

    const fabricName = getFabricLabel(blueprint.remixProposal.fabricId);
    const lowerName = getLowerGarmentLabel(blueprint.remixProposal.lowerGarmentId);
    const footwearName = getFootwearLabel(blueprint.remixProposal.footwearId);

    const accCount = activeAccessories.length;
    const accText =
      accCount === 0
        ? 'Không phụ kiện'
        : accCount === 1
        ? '1 phụ kiện'
        : `${accCount} phụ kiện`;

    const propText =
      blueprint.remixProposal.contextProps && blueprint.remixProposal.contextProps.length > 0
        ? ` · Đạo cụ: ${blueprint.remixProposal.contextProps.map(p => p.description).join(', ')}`
        : '';

    return `${paletteSummary} · ${fabricName} · ${lowerName} · ${footwearName} · ${accText}${propText}`;
  };

  // User-facing presentation deduplication for Blueprint Column 1 (Giữ cốt lõi)
  const getConciseBlueprintTraits = (garmentId: GarmentId) => {
    if (garmentId === 'ngu_than_chen') {
      return {
        essential: [
          'Lập lĩnh',
          'Cài vạt phải',
          'Tay chẽn / trách tụ'
        ],
        characteristic: [
          'Cấu trúc ngũ thân',
          'Phom suông'
        ]
      };
    }
    if (garmentId === 'ao_tac') {
      return {
        essential: [
          'Lập lĩnh',
          'Cài vạt phải',
          'Tay thụng / khoán tụ'
        ],
        characteristic: [
          'Cấu trúc ngũ thân',
          'Phom rộng dáng lễ phục'
        ]
      };
    }
    if (garmentId === 'ao_tu_than') {
      return {
        essential: [
          'Cấu trúc 4 thân',
          'Hai tà trước mở',
          'Không khuy cài ngực'
        ],
        characteristic: [
          'Mặc cùng áo yếm',
          'Dải thắt lưng ngang eo'
        ]
      };
    }
    return {
      essential: garment.traits.essential,
      characteristic: garment.traits.strongly_characteristic
    };
  };

  const conciseTraits = getConciseBlueprintTraits(selectedGarmentId);

  return (
    <section id="section-blueprint" className="space-y-6 pt-4 scroll-mt-20">
      {/* Section Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wider text-sky-700 bg-sky-50 border border-sky-200/60 uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>Bước 2 · Bản Phối Thời Trang Đương Đại</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
          Bản phối cho {garment.canonical_name}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-normal">
          Xem những gì nên giữ, phần nào có thể biến tấu và điểm nào cần cân nhắc trong bản phối này.
        </p>
      </div>

      {/* Loading Skeleton or Error State */}
      {isLoading ? (
        <div
          className="rounded-3xl p-8 border border-[var(--surface-border)] bg-[var(--surface)]/70 animate-pulse space-y-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Đang điều phối bản phối thời trang đương đại cho {garment.canonical_name}...
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-52 rounded-3xl bg-[var(--surface-2)]" />
            <div className="h-52 rounded-3xl bg-[var(--surface-2)]" />
            <div className="h-52 rounded-3xl bg-[var(--surface-2)]" />
          </div>
        </div>
      ) : error ? (
        <div
          className="rounded-3xl p-8 border border-rose-200 bg-rose-50/80 space-y-4"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-rose-900">Không thể tải bản phối</h3>
              <p className="text-sm text-rose-700">{error.message}</p>
            </div>
            {error.retryable && error.retryAction && (
              <button
                onClick={error.retryAction}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow-sm transition-colors shrink-0 cursor-pointer"
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      ) : !isBlueprintMatching ? (
        <div
          className="rounded-3xl p-8 border border-[var(--surface-border)] bg-[var(--surface)]/70 animate-pulse space-y-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Đang điều phối bản phối thời trang đương đại cho {garment.canonical_name}...
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-52 rounded-3xl bg-[var(--surface-2)]" />
            <div className="h-52 rounded-3xl bg-[var(--surface-2)]" />
            <div className="h-52 rounded-3xl bg-[var(--surface-2)]" />
          </div>
        </div>
      ) : blueprint && isBlueprintMatching ? (
        <div className="space-y-6">
          {/* Main 3 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CỘT 1 — Giữ nhận diện (100% Knowledge Base) */}
            <div
              className="rounded-3xl p-5 sm:p-6 bg-[var(--surface)]/80 border border-emerald-200/70 shadow-xs flex flex-col justify-between space-y-5"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100/70">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
                      Giữ cốt lõi
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Bản sắc
                  </span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                      Đặc trưng cốt lõi
                    </span>
                    <ul className="space-y-1.5 text-[var(--text-secondary)]">
                      {conciseTraits.essential.map((trait, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span className="leading-relaxed font-medium text-[var(--text)]">{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-emerald-100/50">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                      Nên ưu tiên giữ
                    </span>
                    <ul className="space-y-1.5 text-[var(--text-secondary)]">
                      {conciseTraits.characteristic.map((trait, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--text-muted)] font-bold">•</span>
                          <span className="leading-relaxed">{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT 2 — Gợi ý phối hiện đại (Requirement 1 & Requirement 2: Read-only Cohesive Palette) */}
            <div
              className="rounded-3xl p-5 sm:p-6 bg-[var(--surface)]/95 border border-amber-200/80 shadow-sm flex flex-col justify-between space-y-5"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--surface-border)]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
                      Biến tấu an toàn
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] px-2 py-0.5 rounded-full border border-[var(--chip-selected-border)]">
                    Hiện đại
                  </span>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Bảng màu Hòa sắc 3 màu (Requirement 2: Read-Only, no onClick, no active ring, no selectedColor) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">Bảng màu gợi ý</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--text-muted)] font-normal hidden sm:inline">
                          Chủ đạo · Phối cùng · Điểm nhấn
                        </span>
                        {onColorChange && (
                          <button
                            type="button"
                            onClick={() => setIsColorPickerOpen(prev => !prev)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--chip-selected-bg)] text-[var(--chip-selected-text)] border border-[var(--chip-selected-border)] transition-colors cursor-pointer"
                          >
                            <Palette className="w-3 h-3 text-[var(--accent)]" />
                            <span>{isColorPickerOpen ? 'Đóng bảng màu ↑' : 'Đổi màu chủ đạo ↓'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Color Picker Swatches Panel */}
                    {isColorPickerOpen && onColorChange && (
                      <div className="p-3 rounded-2xl bg-[var(--surface)] border border-amber-200/80 shadow-xs space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[var(--text)]">
                            Chọn màu chủ đạo từ Bảng màu chuẩn mực:
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            10 sắc thái truyền thống & đương đại
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {PALETTES.map(p => {
                            const isCurrentPrimary = blueprint.remixProposal.palette.some(
                              c => c.role === 'PRIMARY' && c.id === p.id
                            );
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  onColorChange(p.id);
                                  setIsColorPickerOpen(false);
                                }}
                                className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isCurrentPrimary
                                    ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/50'
                                    : 'bg-[var(--surface-2)] hover:bg-[var(--surface)] border-[var(--surface-border)] hover:border-amber-200'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
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

                    <div className="grid grid-cols-3 gap-2">
                      {blueprint.remixProposal.palette.map((color) => {
                        const roleLabel =
                          color.role === 'PRIMARY'
                            ? 'Chủ đạo'
                            : color.role === 'SUPPORTING'
                            ? 'Phối cùng'
                            : 'Điểm nhấn';
                        const isUserReq = color.origin === 'USER_REQUESTED';

                        return (
                          <div
                            key={color.id}
                            className="flex flex-col items-center p-2 rounded-2xl bg-[var(--surface)]/90 border border-[var(--surface-border)] text-center relative shadow-2xs"
                          >
                            <span
                              className="w-8 h-8 rounded-full shadow-inner border border-black/10 shrink-0 mb-1.5"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-[11px] font-semibold text-[var(--text)] line-clamp-1 leading-tight">
                              {color.name}
                            </span>
                            <span className={`text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-full border ${
                              color.role === 'PRIMARY'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : color.role === 'SUPPORTING'
                                ? 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--surface-border)]'
                                : 'bg-amber-50/70 text-amber-800 border-amber-200/60'
                            }`}>
                              {roleLabel}
                            </span>
                            {isUserReq && (
                              <span className="text-[9px] text-amber-700 font-medium mt-0.5">
                                Bạn yêu cầu
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean Option Rows (Pills bo tròn) */}
                  <div className="space-y-2 pt-2 border-t border-[var(--surface-border)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-muted)] shrink-0">Chất liệu:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-[var(--text)] bg-[var(--surface)]/90 border border-[var(--surface-border)] shadow-2xs text-right">
                        {getFabricLabel(blueprint.remixProposal.fabricId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-muted)] shrink-0">Hạ phục:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-[var(--text)] bg-[var(--surface)]/90 border border-[var(--surface-border)] shadow-2xs text-right">
                        {getLowerGarmentLabel(blueprint.remixProposal.lowerGarmentId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-muted)] shrink-0">Giày:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-[var(--text)] bg-[var(--surface)]/90 border border-[var(--surface-border)] shadow-2xs text-right">
                        {getFootwearLabel(blueprint.remixProposal.footwearId)}
                      </span>
                    </div>
                  </div>

                  {/* Phụ kiện gợi ý (Requirement 6: Heading "Phụ kiện gợi ý", 0-2 items, remove-only) */}
                  <div className="space-y-2 pt-2 border-t border-[var(--surface-border)]">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                      Phụ kiện gợi ý
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAccessories.length > 0 ? (
                        activeAccessories.map(accId => (
                          <span
                            key={accId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[var(--text)] bg-[var(--surface)]/90 border border-[var(--surface-border)] shadow-2xs group"
                          >
                            <span>{getAccessoryLabel(accId)}</span>
                            <button
                              onClick={() => handleRemoveAccessory(accId)}
                              className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer p-0.5"
                              title="Bỏ phụ kiện này"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-muted)] font-normal text-xs">
                          Không cần thêm phụ kiện.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Đạo cụ bối cảnh (Minimal clean presentation - Requirement 4) */}
                  {blueprint.remixProposal.contextProps && blueprint.remixProposal.contextProps.length > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--surface-border)]">
                      <span className="text-xs text-[var(--text-muted)] shrink-0 font-medium">Đạo cụ:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-[var(--text)] bg-[var(--surface)]/90 border border-[var(--surface-border)] shadow-2xs text-right capitalize">
                        {blueprint.remixProposal.contextProps.map(p => p.description).join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CỘT 3 — Cần cân nhắc (Amber Accent Tint) */}
            <div
              className="rounded-3xl p-5 sm:p-6 bg-[var(--surface)]/90 border border-amber-200/70 shadow-2xs flex flex-col justify-between space-y-5"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--surface-border)]">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
                      Cần cân nhắc
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] px-2 py-0.5 rounded-full border border-[var(--chip-selected-border)]">
                    Bối cảnh
                  </span>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Theo bối cảnh bạn chọn */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                      Theo bối cảnh bạn chọn
                    </span>
                    <ul className="space-y-1.5 text-[var(--text-secondary)]">
                      {blueprint.contextCautions.map((caution, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--accent)] font-bold">•</span>
                          <span className="leading-relaxed">{caution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Căn cứ văn hóa — Progressive Disclosure */}
                  <div className="pt-2 border-t border-[var(--surface-border)] space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsEvidenceOpen(prev => !prev)}
                      className="text-xs font-semibold text-[var(--accent)] hover:opacity-90 flex items-center justify-between w-full cursor-pointer py-0.5 transition-colors"
                    >
                      <span>Căn cứ cho gợi ý trên</span>
                      <span className="text-[11px] font-normal text-[var(--text-muted)]">
                        {isEvidenceOpen ? 'Thu gọn ↑' : 'Chi tiết →'}
                      </span>
                    </button>
                    {isEvidenceOpen && (
                      <p className="text-[var(--text-secondary)] leading-relaxed font-normal bg-[var(--surface-2)] p-3 rounded-2xl border border-[var(--surface-border)] text-xs animate-in fade-in duration-150">
                        {getEvidenceUncertaintyNote(selectedGarmentId)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar: Dynamic Outfit Summary & Reused Homepage Soft Aurora CTA */}
          <div
            className="rounded-3xl p-5 sm:p-6 bg-[var(--surface)]/85 border border-[var(--surface-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ backdropFilter: 'blur(24px)' }}
          >
            {/* Left: Dynamic Outfit Summary (Requirement 7: No ellipsis on desktop, all 3 colors, no hash) */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-semibold text-[var(--text)] tracking-tight">
                  Bản phối đã sẵn sàng
                </h4>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-normal leading-relaxed">
                {getDynamicOutfitSummary()}
              </p>
            </div>

            {/* Right: Action CTA & Subject Gender Badge */}
            <div className="relative flex flex-wrap items-center gap-3 shrink-0">
              {/* Gender/Subject Presentation Badge (Single Source of Truth from Section 1) */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-selected-bg)] border border-[var(--chip-selected-border)] shadow-2xs text-xs font-medium text-[var(--chip-selected-text)]">
                <span className="opacity-80 font-normal">Người mặc:</span>
                <span className="font-semibold">
                  {genderPresentation === 'nu' ? 'Nữ' : genderPresentation === 'neutral' ? 'Không ưu tiên' : 'Nam'}
                </span>
              </div>

              <button
                onClick={handleGenerateClick}
                disabled={isGeneratingLookbook || isLoading || isRecommending || !blueprint}
                className={`rounded-full px-6 py-2.5 font-medium text-sm tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  isGeneratingLookbook || isLoading || isRecommending || !blueprint
                    ? 'bg-stone-200 text-[var(--text-muted)] border border-[var(--surface-border)] cursor-not-allowed opacity-70'
                    : 'bg-[#C26715] hover:bg-[#A85507] text-white shadow-sm shadow-[#C26715]/25 hover:shadow-md active:scale-[0.98] cursor-pointer'
                }`}
              >
                {isGeneratingLookbook ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-stone-500 border-t-transparent animate-spin" />
                    <span>Đang dựng bản phối…</span>
                  </>
                ) : (
                  <>
                    <span>Tạo ảnh minh họa thực tế ✨</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
