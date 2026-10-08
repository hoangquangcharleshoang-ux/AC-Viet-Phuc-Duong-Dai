/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Trait Transitions View Component
 *
 * Requirements:
 * - Compares trait verdicts between revisions (e.g. v0 -> v1 -> v2)
 * - Trait transitions UX: shows evolution direction (e.g. FAIL -> PASS, PARTIAL -> PASS, PASS -> PASS)
 * - ZERO percentage scores (e.g. NO "95% authentic")
 * - ZERO fake authenticity ratings
 * - Clean neutral styling with Aurora Minimal aesthetic
 */

import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Eye,
  CheckCircle2,
  Minus
} from 'lucide-react';
import {
  LookbookRevisionItem,
  TraitVerdict,
  EvaluatedTraitItem,
  TraitTransition
} from '../types/index';

interface TraitTransitionsViewProps {
  revisions: LookbookRevisionItem[];
  activeRevisionIndex: number;
}

export const TraitTransitionsView: React.FC<TraitTransitionsViewProps> = ({
  revisions,
  activeRevisionIndex
}) => {
  // If we only have v0 or less than 2 audited revisions, no transitions to compare yet
  const auditedRevisions = revisions.filter(r => r.qaResult != null);
  if (auditedRevisions.length < 2) {
    return null;
  }

  const currentRev = revisions.find(r => r.revisionIndex === activeRevisionIndex) || revisions[revisions.length - 1];
  const previousRev = revisions.find(r => r.revisionIndex === activeRevisionIndex - 1) || revisions[0];

  if (!currentRev?.qaResult || !previousRev?.qaResult || currentRev.revisionIndex === 0) {
    return null;
  }

  const prevTraits = previousRev.qaResult.culturalIdentity.traits;
  const currentTraits = currentRev.qaResult.culturalIdentity.traits;

  const transitions: TraitTransition[] = currentTraits.map(curr => {
    const prev = prevTraits.find(p => p.traitId === curr.traitId);
    const prevVerdict = prev?.verdict;
    const currVerdict = curr.verdict;

    let direction: TraitTransition['direction'] = 'NOT_ASSESSABLE';

    if (currVerdict === 'PASS' && (prevVerdict === 'FAIL' || prevVerdict === 'PARTIAL')) {
      direction = 'IMPROVED';
    } else if (currVerdict === 'PASS' && prevVerdict === 'PASS') {
      direction = 'MAINTAINED_PASS';
    } else if (currVerdict === 'PARTIAL' && prevVerdict === 'FAIL') {
      direction = 'IMPROVED';
    } else if ((currVerdict === 'FAIL' && prevVerdict !== 'FAIL') || (currVerdict === 'PARTIAL' && prevVerdict === 'PASS')) {
      direction = 'REGRESSED';
    } else if (currVerdict === 'NOT_ASSESSABLE' && prevVerdict === 'NOT_ASSESSABLE') {
      direction = 'NOT_ASSESSABLE';
    } else {
      direction = 'UNCHANGED_NON_PASS';
    }

    return {
      traitId: curr.traitId,
      traitNameVi: curr.traitNameVi,
      category: curr.category,
      previousVerdict: prevVerdict,
      currentVerdict: currVerdict,
      direction
    };
  });

  const getVerdictMiniBadge = (verdict?: TraitVerdict) => {
    switch (verdict) {
      case 'PASS':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">PASS</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">PARTIAL</span>;
      case 'FAIL':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">FAIL</span>;
      case 'NOT_ASSESSABLE':
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200/80">Khuất</span>;
    }
  };

  const getDirectionBadge = (direction: TraitTransition['direction']) => {
    switch (direction) {
      case 'IMPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Cải thiện chuẩn mực</span>
          </span>
        );
      case 'MAINTAINED_PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            <span>Bảo toàn đạt chuẩn</span>
          </span>
        );
      case 'REGRESSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Cần chú ý thêm</span>
          </span>
        );
      case 'NOT_ASSESSABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200/60">
            <Eye className="w-3 h-3 text-stone-400" />
            <span>Góc khuất</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200/60">
            <Minus className="w-3 h-3 text-stone-400" />
            <span>Giữ nguyên</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200/80 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-stone-900">
            Chuyển dịch nhận diện giữa các phiên bản (v{previousRev.revisionIndex} → v{currentRev.revisionIndex})
          </span>
        </div>
        <span className="text-[11px] text-stone-500 font-normal">
          Tiến trình tinh chỉnh văn hóa
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {transitions.map(t => (
          <div
            key={t.traitId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-stone-200/60"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-stone-800 truncate">
                {t.traitNameVi}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1">
                {getVerdictMiniBadge(t.previousVerdict)}
                <ArrowRight className="w-3 h-3 text-stone-400" />
                {getVerdictMiniBadge(t.currentVerdict)}
              </div>
              {getDirectionBadge(t.direction)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
