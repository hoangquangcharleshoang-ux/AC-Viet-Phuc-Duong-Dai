import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '../src/App';
import * as geminiService from '../src/services/geminiService';
import * as lookbookService from '../src/services/lookbookService';
import * as acChatService from '../src/services/acChatService';
import * as visualQAService from '../src/services/visualQAService';
import { loadPersistedSession, savePersistedSession } from '../src/services/sessionPersistence';
import { GarmentRecommendationOutput, BlueprintOutput, LookbookGenerationState, CulturalVisualQAOutput } from '../src/types';

// Deferred promise helper
function createDeferred<T>() {
  let resolve!: (val: T) => void;
  let reject!: (err: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockRecommendation: GarmentRecommendationOutput = {
  primary: {
    garmentId: 'ngu_than_chen',
    rationale: 'Phù hợp với bối cảnh chụp ảnh kỷ yếu, năng động và mực thước.'
  },
  alternative: {
    garmentId: 'ao_tac',
    rationale: 'Trang trọng, phù hợp không gian lễ nghi.'
  }
};

const mockBlueprint: BlueprintOutput = {
  garmentId: 'ngu_than_chen',
  remixProposal: {
    palette: [
      { id: 'indigo_cham', name: 'Chàm', hex: '#1A2B4C', role: 'PRIMARY', origin: 'AC_SUGGESTED' }
    ],
    fabricId: 'gam_hoa_chim',
    lowerGarmentId: 'quan_trang_ong_dung',
    footwearId: 'guoc_moc',
    accessoryIds: ['khan_dong_truyen_thong']
  },
  contextCautions: ['Bảo tồn cấu trúc']
};

const mockLookbookResult = {
  generationId: 'gen_test_1',
  imageUrl: 'https://images.unsplash.com/photo-test-lookbook',
  outfitFingerprint: 'AC-NGU-TEST1',
  createdAt: Date.now(),
  expiresAt: Date.now() + 3600000,
  mimeType: 'image/jpeg'
};

const mockQAResult: CulturalVisualQAOutput = {
  generationId: 'gen_test_1',
  boundFingerprint: 'AC-NGU-TEST1',
  auditedAt: Date.now(),
  versions: {
    qaSchemaVersion: '1.0',
    culturalKnowledgeVersion: '1.0',
    visualAuditPolicyVersion: '1.0'
  },
  culturalIdentity: {
    overallStatus: 'PRESERVES_IDENTITY',
    statusLabelVi: 'Bảo toàn cốt lõi',
    assessableTraitsCount: 3,
    totalTraitsCount: 3,
    traits: [
      {
        traitId: 'lap_linh',
        traitNameVi: 'Cổ đứng lập lĩnh',
        category: 'essential',
        verdict: 'PASS',
        visualEvidence: 'Cổ đứng đoan trang'
      }
    ]
  },
  outfitFidelity: {
    overallFidelity: 'PASS',
    details: {
      palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
      fabric: { textureMatch: 'PASS' },
      lowerGarment: { typeMatch: 'PASS' },
      footwear: { typeMatch: 'PASS' },
      accessories: { presenceMatch: 'PASS' }
    } as any
  }
};

describe('AC App — Suspected Bugs Verification & Regression Scenarios', () => {
  
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Default mock implementations
    vi.spyOn(geminiService, 'recommendGarment').mockResolvedValue(mockRecommendation);
    vi.spyOn(geminiService, 'generateBlueprint').mockResolvedValue(mockBlueprint);
    vi.spyOn(lookbookService, 'requestLookbookGeneration').mockResolvedValue(mockLookbookResult);
    vi.spyOn(visualQAService, 'verifyLookbookImage').mockResolvedValue(mockQAResult);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  // --------------------------------------------------------------------------
  // B2 - NOT A BUG verification: Generating state is sanitized on save/load
  // --------------------------------------------------------------------------
  it('B2 - (NOT A BUG) Session persistence sanitizes generating lookbookState to interrupted', () => {
    savePersistedSession({
      version: 1,
      savedAt: Date.now(),
      draftContext: {
        promptText: 'test',
        selectedOccasionKey: 'ky_yeu',
        selectedStyleKey: 'tre_trung',
        sliderValue: 50,
        selectedOccasion: 'tet_temple',
        selectedIntent: 'balanced',
        genderPresentation: 'nam'
      },
      committedContext: null,
      recommendation: null,
      selectedGarmentId: 'ngu_than_chen',
      blueprintCacheEntries: [],
      activeAccessoryOverrides: [],
      lookbookState: {
        status: 'generating',
        outfitFingerprint: 'FP_GEN'
      } as any
    });

    const loaded = loadPersistedSession();
    expect(loaded?.lookbookState?.status).toBe('interrupted');
  });

  // --------------------------------------------------------------------------
  // B1 - Changing gender updates draftContext only so omnibox re-submit runs
  // --------------------------------------------------------------------------
  it('B1 - handleGenderPresentationChange allows omnibox re-submit for new gender', async () => {
    const { container } = render(<App />);

    // Initial submit
    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(geminiService.recommendGarment).toHaveBeenCalledTimes(1);

    // Change gender to female ('Nữ')
    const femaleBtn = screen.getByRole('button', { name: /Nữ/i });
    await act(async () => {
      fireEvent.click(femaleBtn);
    });

    // Omnibox submit should NOT be blocked by idempotency guard because gender changed
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(geminiService.recommendGarment).toHaveBeenCalledTimes(2);
    expect(geminiService.recommendGarment).toHaveBeenLastCalledWith(
      expect.objectContaining({ genderPresentation: 'nu' })
    );
  });

  // --------------------------------------------------------------------------
  // B3 - Hydration restores blueprint and recKey cache using matching gender parts
  // --------------------------------------------------------------------------
  it('B3 - Hydration restores blueprint from cache key with gender presentation', async () => {
    const committedContext = {
      promptText: 'dạo phố',
      selectedOccasion: 'tet_temple',
      selectedStyle: 'tre_trung',
      traditionalRatio: 50,
      genderPresentation: 'nu' as const
    };

    const cacheKey = [
      'ngu_than_chen',
      'dạo phố',
      'tet_temple',
      'tre_trung',
      50,
      'nu'
    ].join('|');

    savePersistedSession({
      version: 1,
      savedAt: Date.now(),
      draftContext: {
        promptText: 'dạo phố',
        selectedOccasionKey: 'ky_yeu',
        selectedStyleKey: 'tre_trung',
        sliderValue: 50,
        selectedOccasion: 'tet_temple',
        selectedIntent: 'balanced',
        genderPresentation: 'nu'
      },
      committedContext,
      recommendation: mockRecommendation,
      selectedGarmentId: 'ngu_than_chen',
      blueprintCacheEntries: [
        {
          cacheKey,
          garmentId: 'ngu_than_chen',
          committedContextKey: cacheKey.split('|').slice(1).join('|'),
          blueprint: mockBlueprint
        }
      ],
      activeAccessoryOverrides: [],
      lookbookState: { status: 'idle' }
    });

    render(<App />);

    // Blueprint should be restored immediately from cache without calling generateBlueprint
    expect(geminiService.generateBlueprint).toHaveBeenCalledTimes(0);
    // Section 2 Blueprint title should be visible
    expect(await screen.findByText(/BẢN PHỐI THỜI TRANG ĐƯƠNG ĐẠI/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // B8 - handleOmniboxSubmit aborts in-flight Call B and drops old response
  // --------------------------------------------------------------------------
  it('B8 - Omnibox submit aborts previous in-flight Call B and drops late response', async () => {
    const slowCallB = createDeferred<BlueprintOutput>();
    vi.spyOn(geminiService, 'generateBlueprint').mockReturnValueOnce(slowCallB.promise);

    render(<App />);

    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    // First submit starts Call A -> slow Call B
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(geminiService.generateBlueprint).toHaveBeenCalledTimes(1);

    // Fast second submit with new prompt
    const input = screen.getByPlaceholderText(/Tôi muốn một bộ Việt phục/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'phong cách mới' } });
      fireEvent.click(submitBtn);
    });

    // Resolve old slow Call B
    await act(async () => {
      slowCallB.resolve({
        ...mockBlueprint,
        remixProposal: { ...mockBlueprint.remixProposal, fabricId: 'old_fabric' }
      });
    });

    // The old response should not have overwritten the state
  });

  // --------------------------------------------------------------------------
  // B9 - 30s UX timeout sets error, late Call B clears apiError on success
  // --------------------------------------------------------------------------
  it('B9 - Late successful Call B clears apiError after timeout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    const slowCallB = createDeferred<BlueprintOutput>();
    vi.spyOn(geminiService, 'generateBlueprint').mockReturnValueOnce(slowCallB.promise);

    render(<App />);

    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Advance 30s
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    // Should show timeout error
    expect(screen.getAllByText(/Bản phối phản hồi lâu hơn dự kiến/i).length).toBeGreaterThan(0);

    // Now resolve Call B
    await act(async () => {
      slowCallB.resolve(mockBlueprint);
    });

    // The timeout banner should be cleared
    expect(screen.queryAllByText(/Bản phối phản hồi lâu hơn dự kiến/i).length).toBe(0);

    vi.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // B10 - Switching garment resets lookbookState, visualQAState, and revisions
  // --------------------------------------------------------------------------
  it('B10 - Switching garment in recommendation resets lookbookState and QA', async () => {
    render(<App />);

    // Submit and generate lookbook
    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const genBtn = await screen.findByRole('button', { name: /Tạo ảnh minh họa thực tế/i });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    // Switch garment to Áo tấc
    const aoTacBtn = screen.getByText(/Thử phương án này/i);
    await act(async () => {
      fireEvent.click(aoTacBtn);
    });

    // Lookbook should be reset to idle (no old image displayed for new garment)
    expect(screen.queryByText(/AC đánh giá bản phối/i)).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // B12 - handleConfirmReset resets genderPresentation, isExploring, revisions
  // --------------------------------------------------------------------------
  it('B12 - Session reset clears all state including gender and exploration', async () => {
    render(<App />);

    // Initial submit to populate active session
    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Reset button is visible when hasActiveSession is true
    const resetNavBtn = await screen.findByRole('button', { name: /Bắt đầu lại/i });
    await act(async () => {
      fireEvent.click(resetNavBtn);
    });

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /^Bắt đầu lại$/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(screen.queryByText(/BẢN PHỐI THỜI TRANG ĐƯƠNG ĐẠI/i)).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // S1 - Happy path: submit -> recommendation -> blueprint -> lookbook -> auto QA
  // --------------------------------------------------------------------------
  it('S1 - Happy path: full pipeline to lookbook and QA success', async () => {
    render(<App />);

    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(geminiService.recommendGarment).toHaveBeenCalled();
    expect(geminiService.generateBlueprint).toHaveBeenCalled();

    const genBtn = await screen.findByRole('button', { name: /Tạo ảnh minh họa thực tế/i });
    await act(async () => {
      fireEvent.click(genBtn);
    });

    expect(lookbookService.requestLookbookGeneration).toHaveBeenCalled();
    expect(visualQAService.verifyLookbookImage).toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // S3 - F5 after success: image, QA and revisions restore with ZERO API calls
  // --------------------------------------------------------------------------
  it('S3 - F5 after success restores with ZERO API calls on mount', async () => {
    savePersistedSession({
      version: 1,
      savedAt: Date.now(),
      draftContext: {
        promptText: 'tết',
        selectedOccasionKey: 'tet_temple',
        selectedStyleKey: 'thanh_lich',
        sliderValue: 80,
        selectedOccasion: 'tet_temple',
        selectedIntent: 'balanced',
        genderPresentation: 'nam'
      },
      committedContext: {
        promptText: 'tết',
        selectedOccasion: 'tet_temple',
        selectedStyle: 'thanh_lich',
        traditionalRatio: 80,
        genderPresentation: 'nam'
      },
      recommendation: mockRecommendation,
      selectedGarmentId: 'ngu_than_chen',
      blueprintCacheEntries: [
        {
          cacheKey: 'ngu_than_chen|tết|tet_temple|thanh_lich|80|nam',
          garmentId: 'ngu_than_chen',
          committedContextKey: 'tết|tet_temple|thanh_lich|80|nam',
          blueprint: mockBlueprint
        }
      ],
      activeAccessoryOverrides: [],
      lookbookState: {
        status: 'success',
        generationId: 'gen_saved',
        imageUrl: 'https://images.unsplash.com/photo-saved',
        outfitFingerprint: 'AC-FP-SAVED',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        revisionIndex: 0,
        snapshot: {
          garmentId: 'ngu_than_chen',
          genderPresentation: 'nam',
          palette: mockBlueprint.remixProposal.palette,
          fabricId: mockBlueprint.remixProposal.fabricId,
          lowerGarmentId: mockBlueprint.remixProposal.lowerGarmentId,
          footwearId: mockBlueprint.remixProposal.footwearId,
          activeAccessoryIds: mockBlueprint.remixProposal.accessoryIds,
          contextProps: [],
          committedContextSnapshot: {
            promptText: 'tết',
            occasion: 'tet_temple',
            style: 'thanh_lich',
            traditionalRatio: 80,
            genderPresentation: 'nam'
          },
          boundFingerprint: 'AC-FP-SAVED'
        }
      }
    });

    render(<App />);

    expect(geminiService.recommendGarment).toHaveBeenCalledTimes(0);
    expect(geminiService.generateBlueprint).toHaveBeenCalledTimes(0);
    expect(lookbookService.requestLookbookGeneration).toHaveBeenCalledTimes(0);
  });

  // --------------------------------------------------------------------------
  // S9 - Change gender only and press submit: pipeline re-runs
  // --------------------------------------------------------------------------
  it('S9 - Change gender only and press submit: pipeline re-runs', async () => {
    render(<App />);

    const submitBtn = screen.getByRole('button', { name: /Gợi ý bản phối cho tôi/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(geminiService.recommendGarment).toHaveBeenCalledTimes(1);

    // Switch to 'Không ưu tiên'
    const neutralBtn = screen.getByRole('button', { name: /Không ưu tiên/i });
    await act(async () => {
      fireEvent.click(neutralBtn);
    });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(geminiService.recommendGarment).toHaveBeenCalledTimes(2);
    expect(geminiService.recommendGarment).toHaveBeenLastCalledWith(
      expect.objectContaining({ genderPresentation: 'neutral' })
    );
  });
});
