/**
 * AC — Section 1: Đề Xuất Dáng Áo & Tri Thức Văn Hóa
 * Phase 2A — Cultural Fashion Co-pilot Refinement
 * - Fashion-first Recommendation Cards (28-32% aspect 3:4 lookbook image, conversational rationale)
 * - Clean user-facing badges: 'Khuyên dùng' vs 'Cân nhắc thêm'
 * - Distinct, elegant CTA button: 'Thử phương án này →'
 * - Knowledge-on-demand Accordion: Default collapsed, resets on garment switch
 * - No alert box syndrome (No red/yellow/gray boxes, elegant typography & inline tags)
 * - Dynamic sources counter derived directly from currentGarment.sources
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { GarmentId, GarmentRecommendationOutput, GenderPresentation } from '../types';
import { GARMENTS, SOURCES_CATALOG } from '../data/culturalKnowledgePack';

interface Section1RecommendationProps {
  recommendation: GarmentRecommendationOutput;
  selectedGarmentId: GarmentId;
  onSelectGarment: (garmentId: GarmentId) => void;
  isLoadingBlueprint?: boolean;
  genderPresentation?: GenderPresentation;
}

export const Section1Recommendation: React.FC<Section1RecommendationProps> = ({
  recommendation,
  selectedGarmentId,
  onSelectGarment,
  isLoadingBlueprint,
  genderPresentation = 'nam'
}) => {
  // Accordion lifecycle: Default collapsed, resets to collapsed when selectedGarmentId changes
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [showSourcesDetail, setShowSourcesDetail] = useState<boolean>(false);

  useEffect(() => {
    setIsAccordionOpen(false);
    setShowSourcesDetail(false);
  }, [selectedGarmentId]);

  const primaryGarment = GARMENTS[recommendation.primary.garmentId];
  const altGarment = recommendation.alternative
    ? GARMENTS[recommendation.alternative.garmentId]
    : null;

  // Active knowledge is strictly tied to selectedGarmentId
  const currentGarment = GARMENTS[selectedGarmentId] || primaryGarment;

  // Wearer-matched recommendation image asset resolution
  const getRecommendationAsset = (garmentId: GarmentId): string => {
    if (genderPresentation === 'nam') {
      if (garmentId === 'ngu_than_chen') return '/assets/ao-ngu-than-tay-chen-nam.png';
      if (garmentId === 'ao_tac') return '/assets/ao-tac-nam.png';
      return '/assets/ao-tu-than.png'; // Tứ thân remains female-only under grounded policy
    }
    if (genderPresentation === 'nu') {
      if (garmentId === 'ngu_than_chen') return '/assets/ao-ngu-than-tay-chen.png';
      if (garmentId === 'ao_tac') return '/assets/ao-tac.png';
      return '/assets/ao-tu-than.png';
    }
    // Neutral / khong_uu_tien
    if (garmentId === 'ngu_than_chen') return '/assets/ao-ngu-than-tay-chen-nam.png';
    if (garmentId === 'ao_tac') return '/assets/ao-tac.png';
    return '/assets/ao-tu-than.png';
  };

  // Curated short preview for collapsed bar (Requirement 8)
  const CURATED_PREVIEWS: Record<GarmentId, string> = {
    ngu_than_chen: 'Cổ đứng · Cài lệch phải · Tay chẽn · Phom suông',
    ao_tac: 'Cổ đứng · Cài lệch phải · Tay thụng · Phom dài suông',
    ao_tu_than: 'Bốn thân · Mở phía trước · Hai vạt trước · Lớp yếm bên trong'
  };
  const traitPreview = CURATED_PREVIEWS[selectedGarmentId] || CURATED_PREVIEWS[currentGarment.id] || 'Cổ đứng · Cài lệch phải · Phom suông';

  // Dynamic source count and IDs
  const sourceCount = currentGarment.sources.length;
  const sourceIdsStr = currentGarment.sources.join(', ');

  return (
    <section id="section-recommendations" className="space-y-6 pt-4 scroll-mt-20">
      {/* Section Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wider text-amber-900 bg-amber-100/80 border border-amber-300/80 uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C26715] animate-pulse" />
          <span>Bước 1 · Dáng Áo Nền Tảng</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">
          Gợi Ý Dáng Áo Phù Hợp
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 font-normal">
          Lựa chọn dựa trên công năng và không gian bối cảnh xuất hiện của bạn.
        </p>
      </div>

      {/* Cards: Primary & Alternative (or single primary if alternative is null) */}
      <div className={`grid grid-cols-1 ${recommendation.alternative ? 'md:grid-cols-2' : 'max-w-2xl'} gap-5`}>
        {/* Card 1: Primary Option */}
        <div
          onClick={() => onSelectGarment(recommendation.primary.garmentId)}
          className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer ${
            selectedGarmentId === recommendation.primary.garmentId
              ? 'bg-white/95 border border-amber-300 shadow-md shadow-amber-100/50 -translate-y-0.5'
              : 'bg-white/70 border border-stone-200/80 hover:bg-white/90 hover:border-amber-200 shadow-xs'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div className="space-y-4">
            {/* Header: User-facing badge 'Khuyên dùng' */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                Khuyên dùng
              </span>
              {selectedGarmentId === recommendation.primary.garmentId && (
                <span className="text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/80">
                  Đang chọn
                </span>
              )}
            </div>

            <div className="flex gap-4 sm:gap-5 items-start">
              {/* Fashion-first Image (28-32% desktop width target, aspect 3:4) */}
              <div className="w-[30%] sm:w-[32%] shrink-0 max-w-[140px] min-w-[95px] aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 shadow-inner">
                <img
                  src={getRecommendationAsset(recommendation.primary.garmentId)}
                  alt={primaryGarment.canonical_name}
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                />
              </div>

              {/* Title & Conversational Rationale */}
              <div className="space-y-2 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-stone-900 tracking-tight">
                  {primaryGarment.canonical_name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                  {recommendation.primary.rationale}
                </p>
              </div>
            </div>
          </div>

          {/* Action indicator at bottom (Requirement 5: Only show button on unselected card) */}
          {selectedGarmentId !== recommendation.primary.garmentId && (
            <div className="pt-3.5 mt-3.5 border-t border-stone-100 flex items-center justify-end">
              <span className="px-3.5 py-1 rounded-full text-xs font-medium text-stone-700 bg-white border border-stone-200 group-hover:border-amber-400 group-hover:text-amber-900 transition-all shadow-2xs flex items-center gap-1">
                <span>Chọn {primaryGarment.canonical_name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Alternative Option (If present) */}
        {recommendation.alternative && altGarment && (
          <div
            onClick={() => onSelectGarment(recommendation.alternative!.garmentId)}
            className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer ${
              selectedGarmentId === recommendation.alternative.garmentId
                ? 'bg-white/95 border border-amber-300 shadow-md shadow-amber-100/50 -translate-y-0.5'
                : 'bg-white/70 border border-stone-200/80 hover:bg-white/90 hover:border-amber-200 shadow-xs'
            }`}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-4">
              {/* Header: User-facing badge 'Cân nhắc thêm' */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                  Cân nhắc thêm
                </span>
                {selectedGarmentId === recommendation.alternative.garmentId && (
                  <span className="text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/80">
                    Đang chọn
                  </span>
                )}
              </div>

              <div className="flex gap-4 sm:gap-5 items-start">
                {/* Fashion-first Image (28-32% desktop width target, aspect 3:4) */}
                <div className="w-[30%] sm:w-[32%] shrink-0 max-w-[140px] min-w-[95px] aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 shadow-inner">
                  <img
                    src={getRecommendationAsset(recommendation.alternative.garmentId)}
                    alt={altGarment.canonical_name}
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                {/* Title & Conversational Rationale */}
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-stone-900 tracking-tight">
                    {altGarment.canonical_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                    {recommendation.alternative.rationale}
                  </p>
                </div>
              </div>
            </div>

            {/* Action indicator at bottom (Requirement 5: Only show button on unselected card) */}
            {selectedGarmentId !== recommendation.alternative.garmentId && (
              <div className="pt-3.5 mt-3.5 border-t border-stone-100 flex items-center justify-end">
                <span className="px-3.5 py-1 rounded-full text-xs font-medium text-stone-700 bg-white border border-stone-200 group-hover:border-amber-400 group-hover:text-amber-900 transition-all shadow-2xs flex items-center gap-1">
                  <span>Thử phương án này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Knowledge-on-demand Accordion (Default Collapsed, No alert box syndrome) */}
      <div
        id="section-cultural-understanding"
        className="rounded-3xl border border-stone-200/80 bg-white/75 overflow-hidden transition-all shadow-sm scroll-mt-20"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left hover:bg-stone-50/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-4 h-4 text-[#C26715] shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 min-w-0">
              <span className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                Hiểu về {currentGarment.canonical_name}
              </span>
              {!isAccordionOpen && (
                <span className="text-xs text-stone-500 font-normal truncate sm:overflow-visible sm:whitespace-normal">
                  {traitPreview}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#C26715] shrink-0 self-end sm:self-auto">
            <span>{isAccordionOpen ? 'Thu gọn' : 'Xem đặc trưng & căn cứ lịch sử'}</span>
            {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

                {isAccordionOpen && (
          <div className="px-5 sm:px-6 pb-6 pt-3 space-y-6 border-t border-stone-100 text-xs sm:text-sm">
            {/* 1. Top Definition / Overview */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 space-y-1.5">
              <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                Tổng quan định danh
              </span>
              <p className="text-stone-800 leading-relaxed font-medium">
                {currentGarment.cultural_narrative?.short_definition || currentGarment.definition}
              </p>
            </div>

            {/* 2. Grid: Origin & Cultural Meaning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Nguồn gốc & Bối cảnh lịch sử
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentGarment.cultural_narrative?.origin_context || currentGarment.definition}
                </p>
              </div>
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Vai trò & Ý nghĩa văn hóa
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentGarment.cultural_narrative?.cultural_meaning || currentGarment.historical_function}
                </p>
              </div>
            </div>

            {/* 3. Form & Function & Wearing Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Vì sao áo có hình dáng này? (Hình thái & Công năng)
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentGarment.cultural_narrative?.form_function || 'Cấu trúc thiết kế tối ưu hóa cho công năng và bối cảnh sử dụng.'}
                </p>
              </div>
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Trải nghiệm khi mặc & Tính thực dụng
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentGarment.cultural_narrative?.wearing_experience || 'Đảm bảo sự thoải mái, linh hoạt và phù hợp với vóc dáng người mặc đương đại.'}
                </p>
              </div>
            </div>

            {/* 4. Quick Recognition & Contemporary Use */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                  Nhận diện nhanh đặc trưng cốt lõi
                </span>
                <ul className="space-y-1 pl-2 text-xs text-stone-700">
                  {(currentGarment.cultural_narrative?.quick_recognition || currentGarment.traits.essential).map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#C26715] font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                  Ứng dụng trong đời sống ngày nay
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentGarment.cultural_narrative?.contemporary_use || 'Được ứng dụng linh hoạt trong các dịp lễ hội, kỷ yếu, sự kiện văn hóa và đời sống.'}
                </p>
              </div>
            </div>

            {/* 5. Uncertainties / Academic Humility Note */}
            {currentGarment.cultural_narrative?.uncertainties && (
              <div className="bg-stone-100/80 p-3.5 rounded-xl border border-stone-200 text-stone-600 text-[11px] space-y-1">
                <span className="font-semibold text-stone-700 uppercase tracking-wider block">
                  Điểm lưu ý học thuật & Giới hạn tư liệu
                </span>
                <p>{currentGarment.cultural_narrative.uncertainties}</p>
              </div>
            )}

            {/* 6. Căn cứ tư liệu — Human-readable citations */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-stone-500 font-normal">
                  Căn cứ tư liệu · {sourceCount} nguồn đã đối chiếu chính thức
                </span>
                <button
                  onClick={() => setShowSourcesDetail(!showSourcesDetail)}
                  className="text-xs font-medium text-amber-800 hover:text-amber-950 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{showSourcesDetail ? 'Thu gọn nguồn ▴' : 'Xem nguồn chi tiết ▾'}</span>
                </button>
              </div>

              {showSourcesDetail && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                  {currentGarment.sources.map(srcId => {
                    const src = SOURCES_CATALOG[srcId];
                    if (!src) return null;
                    return (
                      <div key={srcId} className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {src.type}
                          </span>
                          {src.url ? (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-amber-800 hover:text-amber-950 underline font-medium inline-flex items-center gap-0.5"
                            >
                              <span>Xem nguồn ↗</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-normal">
                              Thư tịch / Hiện vật
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-800 leading-snug">{src.title}</p>
                        <p className="text-[11px] text-stone-500">
                          {src.author}
                          {src.institution && ` · ${src.institution}`}
                          {src.year && ` (${src.year})`}
                        </p>
                        {src.locator && (
                          <p className="text-[10px] text-stone-400 italic">
                            {src.locator}
                          </p>
                        )}
                        {src.supportedClaims && (
                          <p className="text-[11px] text-stone-600 leading-relaxed pt-1 border-t border-stone-100">
                            <span className="font-medium text-stone-700">Nội dung đối chiếu: </span>
                            {src.supportedClaims}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
