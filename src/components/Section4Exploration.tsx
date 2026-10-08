/**
 * AC — Section 4: Guided Exploration (Phase 2D v2)
 * Allows users to explore meaningfully different styling directions without breaking cultural identity.
 */

import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import {
  GarmentId,
  BlueprintOutput,
  ExplorationIntent,
  ExplorationBlueprintResult
} from '../types';
import { GARMENTS } from '../data/culturalKnowledgePack';
import {
  getFabricLabel,
  getLowerGarmentLabel,
  getFootwearLabel,
  getAccessoryLabel
} from '../data/canonicalCatalog';

interface Section4ExplorationProps {
  blueprint: BlueprintOutput | null;
  selectedGarmentId: GarmentId;
  explorationResults: Record<ExplorationIntent, ExplorationBlueprintResult | null>;
  isExploring: Record<ExplorationIntent, boolean>;
  onTriggerExploration: (intent: ExplorationIntent) => void;
  onVisualizeExploration: (expResult: ExplorationBlueprintResult) => void;
  isGeneratingLookbook?: boolean;
}

export const Section4Exploration: React.FC<Section4ExplorationProps> = ({
  blueprint,
  selectedGarmentId,
  explorationResults,
  isExploring,
  onTriggerExploration,
  onVisualizeExploration,
  isGeneratingLookbook = false
}) => {
  const [activeIntentTab, setActiveIntentTab] = useState<ExplorationIntent | null>(null);

  if (!blueprint) return null;

  const garment = GARMENTS[selectedGarmentId] || Object.values(GARMENTS)[0];

  const cards: Array<{
    intent: ExplorationIntent;
    title: string;
    subtitle: string;
    icon: any;
    accentBg: string;
    accentBorder: string;
    badgeColor: string;
    level: 'Nhẹ' | 'Vừa' | 'Mạnh';
  }> = [
    {
      intent: 'MORE_TRADITIONAL',
      title: 'Gần truyền thống hơn',
      subtitle: 'Tăng cường chuẩn mực canonical và tôn trọng chất liệu nguyên bản.',
      icon: ShieldCheck,
      accentBg: 'bg-amber-50/80 hover:bg-amber-50',
      accentBorder: 'border-amber-200/80',
      badgeColor: 'text-amber-800 bg-amber-100/70 border-amber-300/80',
      level: 'Nhẹ'
    },
    {
      intent: 'MORE_REMIXED',
      title: 'Biến tấu hơn',
      subtitle: 'Biến tấu đương đại mạnh mẽ ở bảng màu, chất liệu và phụ kiện.',
      icon: Sparkles,
      accentBg: 'bg-indigo-50/80 hover:bg-indigo-50',
      accentBorder: 'border-indigo-200/80',
      badgeColor: 'text-indigo-800 bg-indigo-100/70 border-indigo-300/80',
      level: 'Mạnh'
    },
    {
      intent: 'ALTERNATIVE',
      title: 'Phối khác cùng tinh thần',
      subtitle: 'Gợi ý phối đồ mới mẻ, bất ngờ nhưng vẫn tương thích văn hóa.',
      icon: Compass,
      accentBg: 'bg-violet-50/80 hover:bg-violet-50',
      accentBorder: 'border-violet-200/80',
      badgeColor: 'text-violet-800 bg-violet-100/70 border-violet-300/80',
      level: 'Vừa'
    }
  ];

  const activeCard = cards.find(c => c.intent === activeIntentTab);
  const activeExploration = activeIntentTab ? explorationResults[activeIntentTab] : null;
  const isLoadingActive = activeIntentTab ? isExploring[activeIntentTab] : false;

  return (
    <section className="rounded-3xl p-6 sm:p-8 bg-white/90 border border-stone-200/90 shadow-sm space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            Khám phá thêm
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 font-normal">
          Thử một hướng phối khác từ cùng nhu cầu của bạn mà không làm thay đổi bản phối gốc.
        </p>
      </div>

      {/* 3 Exploration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(card => {
          const IconComp = card.icon;
          const isSelected = activeIntentTab === card.intent;
          const loading = isExploring[card.intent];
          const hasResult = Boolean(explorationResults[card.intent]);

          return (
            <div
              key={card.intent}
              onClick={() => {
                setActiveIntentTab(card.intent);
                if (!explorationResults[card.intent] && !loading) {
                  onTriggerExploration(card.intent);
                }
              }}
              className={`rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-white border-2 border-indigo-400 shadow-md shadow-indigo-100/60 ring-2 ring-indigo-400/20'
                  : `${card.accentBg} ${card.accentBorder} shadow-2xs hover:shadow-md`
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${card.badgeColor}`}>
                    {card.title}
                  </span>
                  {hasResult && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã có gợi ý</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-700 font-normal leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-indigo-950">
                <span className="flex items-center gap-1.5">
                  <IconComp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{hasResult ? 'Xem kết quả' : 'Khám phá hướng này'}</span>
                </span>
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                ) : (
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-0.5 text-indigo-600' : 'text-stone-400'}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Exploration Structured Diff View */}
      {activeIntentTab && activeCard && (
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-indigo-50/60 via-stone-50 to-stone-50 border border-indigo-200/80 space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full border border-indigo-200">
                PHƯƠNG ÁN KHÁM PHÁ: {activeCard.title}
              </span>
              <h4 className="text-sm font-semibold text-stone-900">
                So sánh cấu trúc & Hồ sơ định hình
              </h4>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isLoadingActive) {
                  onTriggerExploration(activeIntentTab);
                }
              }}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingActive ? 'animate-spin' : ''}`} />
              <span>Tạo phương án khác cùng hướng</span>
            </button>
          </div>

          {isLoadingActive ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-sm">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              </div>
              <span className="text-xs font-medium text-stone-600">
                Đang tổng hợp phương án khám phá văn hóa...
              </span>
            </div>
          ) : activeExploration ? (
            <div className="space-y-4">
              {/* Structured Diff Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* GIỮ NGUYÊN */}
                <div className="rounded-xl p-4 bg-white/90 border border-emerald-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>GIỮ NGUYÊN</span>
                  </div>
                  <ul className="space-y-1 text-stone-700 font-normal list-disc list-inside">
                    <li>Dáng áo chuẩn nguyên bản: {garment.canonical_name}</li>
                    <li>Cổ đứng lập lĩnh & cấu trúc thân áo tĩnh tại</li>
                    <li>Bảo toàn nguyên vẹn giới tính & bối cảnh không gian</li>
                  </ul>
                </div>

                {/* THAY ĐỔI */}
                <div className="rounded-xl p-4 bg-white/90 border border-indigo-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>THAY ĐỔI</span>
                  </div>
                  <div className="space-y-1.5 text-stone-700">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-1">
                      <span className="text-stone-500 font-medium">Chất liệu vải:</span>
                      <span className="font-semibold text-stone-900">{getFabricLabel(activeExploration.blueprint.remixProposal.fabricId)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-100 pb-1">
                      <span className="text-stone-500 font-medium">Hạ phục:</span>
                      <span className="font-semibold text-stone-900">{getLowerGarmentLabel(activeExploration.blueprint.remixProposal.lowerGarmentId)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-100 pb-1">
                      <span className="text-stone-500 font-medium">Giày dép:</span>
                      <span className="font-semibold text-stone-900">{getFootwearLabel(activeExploration.blueprint.remixProposal.footwearId)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-stone-500 font-medium">Phụ kiện:</span>
                      <span className="font-semibold text-stone-900">
                        {activeExploration.blueprint.remixProposal.accessoryIds.length > 0
                          ? activeExploration.blueprint.remixProposal.accessoryIds.map(id => getAccessoryLabel(id)).join(', ')
                          : 'Tối giản'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VÌ SAO & MỨC THAY ĐỔI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2 rounded-xl p-4 bg-white/90 border border-indigo-100 shadow-2xs space-y-1.5">
                  <span className="font-bold text-stone-900 block">VÌ SAO (Lý giải phong cách):</span>
                  <p className="text-stone-600 leading-relaxed font-normal">
                    {activeExploration.stylingRationale}
                  </p>
                  <p className="text-stone-500 text-[11px] italic pt-1">
                    {activeExploration.changesRelativeToOriginal}
                  </p>
                </div>

                <div className="rounded-xl p-4 bg-white/90 border border-indigo-100 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="font-bold text-stone-900 block">MỨC THAY ĐỔI:</span>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {activeCard.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-normal">
                    Đảm bảo giữ vững cốt lõi di sản.
                  </p>
                </div>
              </div>

              {/* Action: Xem thành ảnh */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onVisualizeExploration(activeExploration)}
                  disabled={isGeneratingLookbook}
                  className="rounded-full px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold shadow-md shadow-indigo-200/50 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isGeneratingLookbook ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang dựng ảnh khám phá...</span>
                    </>
                  ) : (
                    <>
                      <span>Xem thành ảnh ✦</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500">
              Nhấn “Tạo phương án khác cùng hướng” hoặc chọn thẻ để tải gợi ý khám phá.
            </div>
          )}
        </div>
      )}
    </section>
  );
};
