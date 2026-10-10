/**
 * AC — Hero Homepage
 * Cam Vàng Hoàng Thổ Omnibox & Multiline Input Specification
 * 1. Eyebrow: TRỢ LÝ AI PHỐI VIỆT PHỤC + Unboxed Typography
 * 2. Hero Input Omnibox with Multiline Textarea (2-3 lines, ~78px height, resize-none)
 *    - Independent state rule: Selecting Dịp/Phong cách updates filters, NEVER injects text into textarea
 *    - Nút [ Khác ] focuses the textarea cursor directly
 *    - Cam Vàng Hoàng Thổ (Warm Amber) pill styling: border-2 border-amber-400, text-amber-900
 *    - Bottom Row: Compact Slider (~45% width, slider-amber) & CTA Button ("Gợi ý bản phối cho tôi →") on the SAME row
 * 3. 3 Base Garment Cards: True Glassmorphic Frosted Containers + 3:4 Clean Fashion Lookbook Photos
 */

import React, { useRef, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { GarmentId, OccasionId, RemixIntent } from '../types';
import { GarmentImageRotator } from './GarmentImageRotator';

interface HeroHomepageProps {
  promptText: string;
  onPromptChange: (text: string) => void;
  selectedOccasion: OccasionId;
  onSelectOccasion: (id: OccasionId) => void;
  selectedIntent: RemixIntent;
  onSelectIntent: (intent: RemixIntent) => void;
  selectedOccasionKey?: string;
  onSelectOccasionKey?: (key: string) => void;
  selectedStyleKey?: string;
  onSelectStyleKey?: (key: string) => void;
  sliderValue?: number;
  onSliderValueChange?: (val: number) => void;
  genderPresentation?: 'nam' | 'nu' | 'neutral';
  onGenderChange?: (gender: 'nam' | 'nu' | 'neutral') => void;
  onExploreClick?: () => void;
  onSubmitOmnibox?: (payload: {
    promptText: string;
    selectedOccasion: string;
    selectedStyle: string;
    traditionalRatio: number;
    genderPresentation?: 'nam' | 'nu' | 'neutral';
  }) => void;
  isRecommending?: boolean;
  hasResult?: boolean;
  isDirty?: boolean;
}

export const HeroHomepage: React.FC<HeroHomepageProps> = ({
  promptText,
  onPromptChange,
  onSelectOccasion,
  selectedIntent,
  onSelectIntent,
  selectedOccasionKey: controlledOccasionKey,
  onSelectOccasionKey,
  selectedStyleKey: controlledStyleKey,
  onSelectStyleKey,
  sliderValue: controlledSliderValue,
  onSliderValueChange,
  genderPresentation = 'nam',
  onGenderChange,
  onExploreClick,
  onSubmitOmnibox,
  isRecommending,
  hasResult = false,
  isDirty = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local or controlled state for occasion and style filter selection
  const [internalOccasionKey, setInternalOccasionKey] = useState<string>('ky_yeu');
  const [internalStyleKey, setInternalStyleKey] = useState<string>('tre_trung');
  const selectedOccasionKey = controlledOccasionKey ?? internalOccasionKey;
  const selectedStyleKey = controlledStyleKey ?? internalStyleKey;

  // Continuous slider state (0 to 100, default 50)
  const initialSliderValue = selectedIntent === 'traditional' ? 20 : selectedIntent === 'expressive' ? 80 : 50;
  const [internalSliderValue, setInternalSliderValue] = useState<number>(initialSliderValue);
  const sliderValue = controlledSliderValue ?? internalSliderValue;

  // Danh mục DỊP (Occasion)
  const occasionList = [
    { id: 'tet', label: 'Tết', display: 'Tết sum vầy', occasionId: 'tet_temple' as OccasionId },
    { id: 'chup_anh', label: 'Chụp ảnh', display: 'Chụp ảnh kỷ niệm', occasionId: 'street_cafe' as OccasionId },
    { id: 'ky_yeu', label: 'Kỷ yếu / tốt nghiệp', display: 'Kỷ yếu / tốt nghiệp', occasionId: 'ky_yeu' as OccasionId },
    { id: 'le_hoi', label: 'Lễ hội / sự kiện văn hóa', display: 'Lễ hội văn hóa', occasionId: 'cultural_wedding' as OccasionId },
    { id: 'dam_cuoi', label: 'Đám cưới / lễ nghi', display: 'Đám cưới / lễ nghi', occasionId: 'cultural_wedding' as OccasionId },
    { id: 'khac', label: 'Khác', display: 'Tùy chọn khác', occasionId: 'street_cafe' as OccasionId }
  ];

  // Danh mục PHONG CÁCH (Style)
  const styleList = [
    { id: 'nhe_nhang', label: 'Nhẹ nhàng' },
    { id: 'thanh_lich', label: 'Thanh lịch' },
    { id: 'tre_trung', label: 'Trẻ trung' },
    { id: 'trang_trong', label: 'Trang trọng' },
    { id: 'ca_tinh', label: 'Cá tính' }
  ];

  // Handle Occasion Selection (Strictly updates state, NEVER overwrites textarea)
  const handleSelectOccasionPill = (item: typeof occasionList[0]) => {
    if (onSelectOccasionKey) {
      onSelectOccasionKey(item.id);
    } else {
      setInternalOccasionKey(item.id);
    }
    onSelectOccasion(item.occasionId);

    if (item.id === 'khac') {
      // Focus textarea so user can type freely without pre-populating text
      textareaRef.current?.focus();
    }
  };

  // Handle Style Selection (Strictly updates state, NEVER overwrites textarea)
  const handleSelectStylePill = (item: typeof styleList[0]) => {
    if (onSelectStyleKey) {
      onSelectStyleKey(item.id);
    } else {
      setInternalStyleKey(item.id);
    }
  };

  // Calculate dynamic slider label based on continuous value (0 -> 100)
  const getSliderLabel = (val: number): string => {
    if (val <= 30) return 'Gần nguyên bản';
    if (val <= 70) return 'Cân bằng';
    return 'Biến tấu hơn';
  };

  // Current selected labels for header display
  const currentOccasionObj = occasionList.find(o => o.id === selectedOccasionKey) || occasionList[2];
  const currentStyleObj = styleList.find(s => s.id === selectedStyleKey) || styleList[2];

  // Garments lookbook data (Pure local static paths in public/assets/)
  const garmentsData = [
    {
      id: 'ngu_than_chen' as GarmentId,
      name: 'Áo ngũ thân tay chẽn',
      description:
        'Thường phục nam nữ gọn gàng, cổ đứng lập lĩnh, ống tay thu hẹp dần về cổ tay, thuận tiện sinh hoạt và làm việc.',
      images: ['/assets/ao-ngu-than-tay-chen.png', '/assets/ao-ngu-than-tay-chen-nam.png']
    },
    {
      id: 'ao_tac' as GarmentId,
      name: 'Áo tấc (Ngũ thân tay thụng)',
      description:
        'Lễ phục phổ thông cổ đứng năm thân, ống tay thụng hình chữ nhật buông dài quá ngón tay mực thước, trang trọng.',
      images: ['/assets/ao-tac.png', '/assets/ao-tac-nam.png']
    },
    {
      id: 'ao_tu_than' as GarmentId,
      name: 'Áo tứ thân',
      description:
        'Trang phục truyền thống bốn thân với hai tà trước mở, thường mặc cùng áo yếm và dải thắt lưng; các phụ kiện như khăn mỏ quạ tùy bối cảnh.',
      images: ['/assets/ao-tu-than.png', '/assets/ao-tu-than-2.png']
    }
  ];

  return (
    <section id="section-context" className="space-y-10 sm:space-y-12 pt-0 sm:pt-2 scroll-mt-20">
      {/* 1. Hero Typography (Unboxed, airy, optical-centered) */}
      <div className="text-center space-y-4 max-w-[860px] mx-auto px-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider text-[var(--info-pill-text)] bg-[var(--info-pill-bg)] border border-[var(--info-pill-text)]/20 shadow-2xs uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--info-pill-text)] animate-pulse" />
          <span>TRỢ LÝ AI PHỐI VIỆT PHỤC</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-[50px] font-bold text-[var(--text)] tracking-tight leading-[1.14]">
          Hôm nay, bạn muốn mặc Việt phục thế nào?
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-[1.6] max-w-2xl mx-auto font-normal">
          Chọn dịp và phong cách. AC sẽ gợi ý dáng áo phù hợp, cho biết điểm nào nên giữ, phần nào có thể biến tấu và giúp bạn hình dung bản phối.
        </p>
      </div>

      {/* 2. Hero Input Omnibox (Lam Chàm Ái Tím Tone & Multiline Textarea 2-3 lines) */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="glass-panel rounded-3xl p-6 sm:p-7 transition-all duration-300 space-y-5 relative">
          {/* Main Input Row: Textarea 2-3 dòng, cố định ~78px, không kéo giãn resize-none */}
          <div className="flex items-start gap-3.5 px-2 pt-1">
            <Sparkles className="w-5 h-5 text-[var(--accent)] shrink-0 mt-1 animate-pulse" />
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                rows={2}
                value={promptText}
                onChange={e => onPromptChange(e.target.value)}
                placeholder="Ví dụ: Tôi muốn một bộ Việt phục trẻ trung để dự lễ tốt nghiệp đại học."
                className="w-full bg-transparent border-none text-base text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none leading-relaxed font-normal resize-none h-[54px] p-0"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--surface-border)] space-y-4">
            {/* TẦNG A — MỤC DỊP (Occasion) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  DỊP
                </span>
              </div>

              {/* 6 Nút Pill Dịp — Warm Amber Tone */}
              <div className="flex flex-wrap items-center gap-2">
                {occasionList.map(item => {
                  const isSelected = selectedOccasionKey === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectOccasionPill(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'font-medium text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] border-2 border-[var(--chip-selected-border)] shadow-sm flex items-center gap-1.5'
                          : 'font-normal text-[var(--chip-text)] bg-[var(--chip-bg)] border border-[var(--chip-border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] shadow-2xs'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--chip-selected-border)] shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TẦNG B — MỤC PHONG CÁCH (Style) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  PHONG CÁCH
                </span>
              </div>

              {/* 5 Nút Pill Phong Cách — Warm Amber Tone */}
              <div className="flex flex-wrap items-center gap-2">
                {styleList.map(item => {
                  const isSelected = selectedStyleKey === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectStylePill(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'font-medium text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] border-2 border-[var(--chip-selected-border)] shadow-sm flex items-center gap-1.5'
                          : 'font-normal text-[var(--chip-text)] bg-[var(--chip-bg)] border border-[var(--chip-border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] shadow-2xs'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--chip-selected-border)] shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TẦNG C — MỤC NGƯỜI MẶC (Gender Presentation) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  NGƯỜI MẶC
                </span>
              </div>

              {/* 3 Nút Pill Người Mặc — Warm Amber Tone */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'nam', label: 'Nam' },
                  { id: 'nu', label: 'Nữ' },
                  { id: 'neutral', label: 'Không ưu tiên' }
                ].map(item => {
                  const isSelected = (genderPresentation || 'nam') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onGenderChange?.(item.id as 'nam' | 'nu' | 'neutral')}
                      className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'font-medium text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] border-2 border-[var(--chip-selected-border)] shadow-sm flex items-center gap-1.5'
                          : 'font-normal text-[var(--chip-text)] bg-[var(--chip-bg)] border border-[var(--chip-border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] shadow-2xs'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--chip-selected-border)] shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HÀNG ĐÁY — GỘP THANH TRƯỢT GỌN GÀNG (~35%) VÀ NÚT CTA CÙNG MỘT HÀNG */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--surface-border)]">
              {/* Bên trái: Cụm thanh trượt thu gọn chiếm ~35% - 40% bề ngang */}
              <div className="w-full sm:w-80 max-w-[320px] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Mức biến tấu</span>
                </div>

                <div className="relative pt-6 pb-1">
                  {/* Floating Thumb-Tracking Numeric Badge */}
                  <div
                    className="absolute top-0 pointer-events-none transition-all duration-75"
                    style={{
                      left: `clamp(18px, ${sliderValue}%, calc(100% - 18px))`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] border border-[var(--chip-selected-border)] shadow-2xs text-center min-w-[28px]">
                      {sliderValue}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={sliderValue}
                    aria-label="Mức biến tấu"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={sliderValue}
                    aria-valuetext={`${sliderValue} trên 100, giữa gần nguyên bản và đương đại hơn`}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (onSliderValueChange) {
                        onSliderValueChange(val);
                      } else {
                        setInternalSliderValue(val);
                      }
                      if (val <= 30) {
                        onSelectIntent('traditional');
                      } else if (val >= 71) {
                        onSelectIntent('expressive');
                      } else {
                        onSelectIntent('balanced');
                      }
                    }}
                    className="w-full slider-amber cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-medium px-0.5">
                  <span>Gần nguyên bản</span>
                  <span>Đương đại hơn</span>
                </div>
              </div>

              {/* Bên phải: Nút CTA chính (Màu Cam Đất Hoàng Cúc Solid) */}
              <div className="flex sm:justify-end shrink-0">
                <button
                  disabled={isRecommending}
                  onClick={() => {
                    if (onSubmitOmnibox) {
                      onSubmitOmnibox({
                        promptText,
                        selectedOccasion: selectedOccasionKey,
                        selectedStyle: selectedStyleKey,
                        traditionalRatio: sliderValue,
                        genderPresentation: genderPresentation || 'nam'
                      });
                    } else if (onExploreClick) {
                      onExploreClick();
                    } else {
                      document.getElementById('section-garments')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="rounded-full px-6 py-2.5 bg-[#C26715] hover:bg-[#A85507] text-white font-medium text-sm tracking-wide shadow-sm shadow-[#C26715]/25 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isRecommending ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <span>{hasResult && isDirty ? 'Cập nhật gợi ý' : 'Gợi ý bản phối cho tôi'}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bộ 3 Thẻ Dáng Áo Hỗ Trợ (Danh mục Lookbook Tối Giản, True Glassmorphism, Hoàn toàn sạch chữ trên ảnh) */}
      <div id="section-garments" className="space-y-6 pt-4">
        {/* Section Title */}
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--text)] tracking-tight">
            CÁC DÁNG ÁO AC ĐANG HỖ TRỢ
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-normal">
            Ba dáng áo nền tảng được AC dùng làm điểm tựa cho các gợi ý phối đương đại.
          </p>
        </div>

        {/* 3 Garment Cards: True Glassmorphic Frosted Containers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {garmentsData.map(garment => (
            <div
              key={garment.id}
              className="glass-card-interactive rounded-3xl p-4 pb-6 flex flex-col group cursor-default"
            >
              {/* 1. Khung ảnh trơn: Bo góc rounded-2xl, tỷ lệ aspect-[3/4], ảnh phủ tràn mép sắc nét, hoàn toàn sạch chữ */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[var(--surface-2)] shadow-2xs">
                <GarmentImageRotator
                  images={garment.images}
                  alt={garment.name}
                  intervalMs={5000}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-103"
                />
              </div>

              {/* 2. Tên dáng áo */}
              <div className="flex items-center justify-between mt-4 mb-1.5">
                <h3 className="text-lg font-semibold text-[var(--text)] tracking-tight">
                  {garment.name}
                </h3>
              </div>

              {/* 3. Mô tả ngắn */}
              <p className="text-sm text-[var(--text-muted)] leading-relaxed font-normal">
                {garment.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
