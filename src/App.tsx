/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * AI Arena Vietnam 2026
 * Phase 2B.1: Session Persistence & Editorial Lookbook Refinement
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  OccasionId,
  RemixIntent,
  GarmentId,
  GarmentRecommendationOutput,
  BlueprintOutput,
  LookbookGenerationState,
  GenerateLookbookRequest,
  GenerationSnapshot,
  VisualQAState,
  LookbookRevisionItem,
  GroundedCorrectionPlan,
  GenderPresentation,
  ACChatMessage,
  ACChatAction
} from './types';
import { isWearerGarmentEligible } from './shared/wearerGarmentPolicy';
import { PALETTES } from './data/canonicalCatalog';
import { Navbar } from './components/Navbar';
import { HeroHomepage } from './components/HeroHomepage';
import { Section1Recommendation } from './components/Section1Recommendation';
import { Section2Blueprint } from './components/Section2Blueprint';
import { Section3Lookbook } from './components/Section3Lookbook';
import { Section4Exploration } from './components/Section4Exploration';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { IdleTimeoutWarningModal } from './components/IdleTimeoutWarningModal';
import { ACChatDrawer } from './components/ACChatDrawer';
import { IdleSessionManager } from './services/idleSessionManager';
import {
  recommendGarment,
  generateBlueprint,
  generateExplorationBlueprint,
  primeSessionBlueprintCache,
  getAllSessionBlueprintEntries,
  primeSessionRecommendationCache,
  clearSessionCaches
} from './services/geminiService';
import {
  ExplorationIntent,
  ExplorationBlueprintResult
} from './types';
import { requestLookbookGeneration } from './services/lookbookService';
import { applyACChatMutation } from './services/acChatService';
import { computeOutfitFingerprint } from './shared/fingerprint';
import {
  loadPersistedSession,
  savePersistedSession,
  clearPersistedSession,
  PersistedDraftContext
} from './services/sessionPersistence';
import { verifyLookbookImage, clearVisualQASessionCache } from './services/visualQAService';
import {
  loadPersistedVisualQA,
  clearVisualQAPersistence,
  clearPersistedVisualQA,
  getThreadForFingerprint,
  recordLookbookRevision,
  recordQAResult
} from './services/visualQAPersistence';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';

export default function App() {
  // Hydration Barrier (Requirement 9 & 11)
  const hasHydratedRef = useRef<boolean>(false);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  // Draft Context State (Form user is editing, decoupled from committedContext)
  const [draftContext, setDraftContext] = useState<PersistedDraftContext>({
    promptText: '',
    selectedOccasionKey: 'ky_yeu',
    selectedStyleKey: 'tre_trung',
    sliderValue: 50,
    selectedOccasion: 'tet_temple' as OccasionId,
    selectedIntent: 'balanced' as RemixIntent,
    genderPresentation: 'nam'
  });

  // Committed Context Parameters (Context that was actually submitted to Call A / Call B)
  const [activeParams, setActiveParams] = useState<{
    promptText: string;
    selectedOccasion: string;
    selectedStyle: string;
    traditionalRatio: number;
    genderPresentation?: GenderPresentation;
  }>({
    promptText: '',
    selectedOccasion: 'ky_yeu',
    selectedStyle: 'tre_trung',
    traditionalRatio: 50,
    genderPresentation: 'nam'
  });

  // Phase 2A Pipeline State
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<GarmentRecommendationOutput | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintOutput | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<GarmentId>('ngu_than_chen');

  // Latest state tracking refs (prevents closure race conditions)
  const blueprintRef = useRef<BlueprintOutput | null>(null);
  blueprintRef.current = blueprint;
  const selectedGarmentIdRef = useRef<GarmentId>(selectedGarmentId);
  selectedGarmentIdRef.current = selectedGarmentId;
  const activeParamsRef = useRef(activeParams);
  activeParamsRef.current = activeParams;
  const draftContextRef = useRef(draftContext);
  draftContextRef.current = draftContext;

  // Active Accessory Overrides Map (cacheKey -> accessoryIds[])
  const activeAccessoryOverridesRef = useRef<Map<string, string[]>>(new Map());
  const [accessoryStateVersion, setAccessoryStateVersion] = useState<number>(0);

  // Phase 2B / 2B.1 Lookbook Generation State
  const [lookbookState, setLookbookState] = useState<LookbookGenerationState>({ status: 'idle' });
  const [currentOutfitFingerprint, setCurrentOutfitFingerprint] = useState<string>('AC-INIT');
  const activeLookbookFingerprintRef = useRef<string>('');

  // Phase 2C: Cultural Visual QA State, Threads & Refs
  const [visualQAState, setVisualQAState] = useState<VisualQAState>({ status: 'idle' });
  const [activeRevisionIndex, setActiveRevisionIndex] = useState<number>(0);
  const [activeRevisions, setActiveRevisions] = useState<LookbookRevisionItem[]>([]);
  const activeVisualQAAbortControllerRef = useRef<AbortController | null>(null);
  const activeVisualQAGenerationIdRef = useRef<string>('');
  const attemptedVisualQARef = useRef<Set<string>>(new Set());
  const hydratedQARecoveredRef = useRef<Set<string>>(new Set());
  const hydratedFromPersistenceGenIdRef = useRef<string | null>(null);

  // Phase 2D: Guided Exploration State & Root Anchor Preservation
  interface RootAnchorSnapshot {
    blueprint: BlueprintOutput;
    outfitFingerprint: string;
    lookbookState: LookbookGenerationState;
    activeRevisionIndex: number;
    visualQAState: VisualQAState;
    activeRevisions: LookbookRevisionItem[];
    explorationTitle: string;
    explorationIntent: ExplorationIntent;
  }

  const [rootAnchor, setRootAnchor] = useState<RootAnchorSnapshot | null>(null);
  const [explorationResults, setExplorationResults] = useState<Record<ExplorationIntent, ExplorationBlueprintResult | null>>({
    MORE_TRADITIONAL: null,
    MORE_REMIXED: null,
    ALTERNATIVE: null
  });
  const [isExploring, setIsExploring] = useState<Record<ExplorationIntent, boolean>>({
    MORE_TRADITIONAL: false,
    MORE_REMIXED: false,
    ALTERNATIVE: false
  });

  // Phase 3A/3B: AC Chat Assistant State & Actionable Delta Mutations
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ACChatMessage[]>([]);
  // RAM-only ephemeral chatSessionId (never persisted across browser reloads)
  const chatSessionIdRef = useRef<string>(`cs_${Math.random().toString(36).slice(2, 10)}`);

  const handleApplyAction = async (action: ACChatAction) => {
    if (!blueprint) return;

    // Concurrency guard: calculate current fingerprint using canonical shared builder with effective accessories
    const currentFingerprint = computeOutfitFingerprint({
      garmentId: selectedGarmentId,
      palette: blueprint.remixProposal.palette,
      fabricId: blueprint.remixProposal.fabricId,
      lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
      footwearId: blueprint.remixProposal.footwearId,
      accessoryIds: effectiveActiveAccessories,
      contextProps: blueprint.remixProposal.contextProps || [],
      occasion: activeParams.selectedOccasion,
      style: activeParams.selectedStyle,
      traditionalRatio: activeParams.traditionalRatio,
      genderPresentation: activeParams.genderPresentation || draftContext.genderPresentation || 'nam'
    });

    try {
      if (action.actionId) {
        const initialSessionId = chatSessionIdRef.current;
        // Server-Authoritative Apply (POST /api/ac-chat/mutate)
        const mutateResult = await applyACChatMutation({
          actionId: action.actionId,
          currentFingerprint,
          chatSessionId: initialSessionId
        });

        // Client Commit Race Guard: Recheck latest actual Blueprint fingerprint and chatSessionId via refs
        const latestBp = blueprintRef.current;
        const blueprint = latestBp;
        const latestGarmentId = selectedGarmentIdRef.current;
        const latestParams = activeParamsRef.current;
        const latestAccs = latestBp
          ? (activeAccessoryOverridesRef.current.has(currentBlueprintCacheKey)
              ? activeAccessoryOverridesRef.current.get(currentBlueprintCacheKey)!
              : latestBp.remixProposal.accessoryIds)
          : [];

        const latestFingerprint = blueprint ? computeOutfitFingerprint({
          garmentId: latestGarmentId,
          palette: latestBp.remixProposal.palette,
          fabricId: latestBp.remixProposal.fabricId,
          lowerGarmentId: latestBp.remixProposal.lowerGarmentId,
          footwearId: latestBp.remixProposal.footwearId,
          accessoryIds: latestAccs,
          contextProps: latestBp.remixProposal.contextProps || [],
          occasion: latestParams.selectedOccasion,
          style: latestParams.selectedStyle,
          traditionalRatio: latestParams.traditionalRatio,
          genderPresentation: latestParams.genderPresentation || draftContextRef.current.genderPresentation || 'nam'
        }) : '';

        if (latestFingerprint !== currentFingerprint || chatSessionIdRef.current !== initialSessionId) {
          console.warn('[AC Chat] Discarded stale mutation response because active state changed while request was pending.');
          return;
        }

        // Commit nextBlueprint returned directly by server
        setBlueprint(mutateResult.nextBlueprint);
        setCurrentOutfitFingerprint(mutateResult.nextFingerprint);

        // B5(a) & (b): Prime session blueprint cache and sync accessory overrides so F5 preserves mutation
        primeSessionBlueprintCache([{
          cacheKey: currentBlueprintCacheKey,
          blueprint: mutateResult.nextBlueprint
        }]);
        if (mutateResult.nextBlueprint.remixProposal.accessoryIds) {
          activeAccessoryOverridesRef.current.set(
            currentBlueprintCacheKey,
            [...mutateResult.nextBlueprint.remixProposal.accessoryIds]
          );
          setAccessoryStateVersion(v => v + 1);
        }

        // Lineage Isolation Contract: Generation Snapshot remains immutable!
        // Updating blueprint does NOT mutate prior snapshot, does NOT auto-generate image, does NOT auto-run QA.
        // Post-apply divergence notification in chat:
        const confirmMsg: ACChatMessage = {
          id: `msg_act_${Date.now()}`,
          role: 'assistant',
          content: `Đã áp dụng gợi ý "${action.label}" vào bản phối hiện tại. Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.`,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, confirmMsg]);
      } else {
        // Fallback for actions generated without server ID (e.g., offline mode)
        const updated: BlueprintOutput = JSON.parse(JSON.stringify(blueprint));
        if (action.type === 'SET_FOOTWEAR') {
          updated.remixProposal.footwearId = action.targetValue;
        } else if (action.type === 'SET_FABRIC') {
          updated.remixProposal.fabricId = action.targetValue;
        } else if (action.type === 'ADD_ACCESSORY') {
          const currentAccs = updated.remixProposal.accessoryIds || [];
          const headwearIds = ['khan_dong_truyen_thong', 'khan_mo_qua', 'non_thung_quai_thao'];
          if (action.targetValue === 'tram_cai_toc_toi_gian') {
            const hasHeadwear = currentAccs.some(id => headwearIds.includes(id));
            if (!hasHeadwear && !currentAccs.includes(action.targetValue)) {
              updated.remixProposal.accessoryIds = [...currentAccs, action.targetValue].slice(-2);
            }
          } else if (headwearIds.includes(action.targetValue)) {
            const hasHairpin = currentAccs.includes('tram_cai_toc_toi_gian');
            if (!hasHairpin && !currentAccs.includes(action.targetValue)) {
              updated.remixProposal.accessoryIds = [...currentAccs, action.targetValue].slice(-2);
            }
          } else {
            if (!currentAccs.includes(action.targetValue)) {
              updated.remixProposal.accessoryIds = [...currentAccs, action.targetValue].slice(-2);
            }
          }
        } else if (action.type === 'SET_COLOR') {
          const primaryIdx = updated.remixProposal.palette.findIndex(c => c.role === 'PRIMARY');
          const pal = PALETTES.find(p => p.id === action.targetValue);
          if (pal) {
            if (primaryIdx !== -1) {
              updated.remixProposal.palette[primaryIdx] = {
                id: pal.id,
                hex: pal.hex,
                name: pal.name,
                role: 'PRIMARY',
                origin: 'AC_SUGGESTED'
              };
            } else if (updated.remixProposal.palette.length > 0) {
              updated.remixProposal.palette[0] = {
                id: pal.id,
                hex: pal.hex,
                name: pal.name,
                role: 'PRIMARY',
                origin: 'AC_SUGGESTED'
              };
            }
          }
        }

        const nextFp = computeOutfitFingerprint({
          garmentId: selectedGarmentId,
          palette: updated.remixProposal.palette,
          fabricId: updated.remixProposal.fabricId,
          lowerGarmentId: updated.remixProposal.lowerGarmentId,
          footwearId: updated.remixProposal.footwearId,
          accessoryIds: updated.remixProposal.accessoryIds,
          contextProps: updated.remixProposal.contextProps || [],
          occasion: activeParams.selectedOccasion,
          style: activeParams.selectedStyle,
          traditionalRatio: activeParams.traditionalRatio,
          genderPresentation: activeParams.genderPresentation || draftContext.genderPresentation || 'nam'
        });

        setBlueprint(updated);
        setCurrentOutfitFingerprint(nextFp);

        const confirmMsg: ACChatMessage = {
          id: `msg_act_${Date.now()}`,
          role: 'assistant',
          content: `Đã áp dụng gợi ý "${action.label}" vào bản phối hiện tại. Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.`,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, confirmMsg]);
      }
    } catch (err: any) {
      console.error('[G3B Apply Error]:', err);
      const errMsg: ACChatMessage = {
        id: `msg_act_err_${Date.now()}`,
        role: 'assistant',
        content: err.message || 'Không thể áp dụng gợi ý này do bản phối đã thay đổi.',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errMsg]);
    }
  };

  const handleColorChange = (paletteId: string) => {
    if (!blueprint) return;
    const pal = PALETTES.find(p => p.id === paletteId);
    if (!pal) return;
    handleApplyAction({
      type: 'SET_COLOR',
      targetValue: paletteId,
      label: `Đổi màu sang ${pal.name}`,
      description: `Cập nhật màu chủ đạo của bản phối sang ${pal.name}`
    });
  };

  const handleTriggerExploration = async (intent: ExplorationIntent) => {
    if (!blueprint) return;
    setIsExploring(prev => ({ ...prev, [intent]: true }));
    try {
      const parentFp = currentOutfitFingerprint;
      const expResult = await generateExplorationBlueprint({
        selectedGarmentId,
        parentBlueprint: blueprint,
        parentOutfitFingerprint: parentFp,
        explorationIntent: intent,
        context: {
          promptText: activeParams.promptText,
          selectedOccasion: activeParams.selectedOccasion,
          selectedStyle: activeParams.selectedStyle,
          traditionalRatio: activeParams.traditionalRatio,
          genderPresentation: activeParams.genderPresentation
        }
      });
      setExplorationResults(prev => ({ ...prev, [intent]: expResult }));
    } catch (err: any) {
      console.error(`[Exploration] Failed for intent ${intent}:`, err);
      if (err?.code === 'EXPLORATION_NO_DIVERGENCE' || err?.status === 422) {
        setApiError({
          code: 'EXPLORATION_NO_DIVERGENCE',
          message: 'Bản phối khám phá chưa tạo ra khác biệt với bản phối gốc.',
          retryable: false,
          failedStep: 'CALL_B'
        });
      } else {
        setApiError({
          code: err?.code || 'EXPLORATION_FAILED',
          message: err?.message || 'Không thể tạo bản phối khám phá lúc này.',
          retryable: err?.retryable ?? true,
          failedStep: 'CALL_B',
          retryAction: () => handleTriggerExploration(intent)
        });
      }
    } finally {
      setIsExploring(prev => ({ ...prev, [intent]: false }));
    }
  };

  const handleVisualizeExploration = async (expResult: ExplorationBlueprintResult) => {
    const titles: Record<ExplorationIntent, string> = {
      MORE_TRADITIONAL: 'Gần truyền thống hơn',
      MORE_REMIXED: 'Biến tấu hơn',
      ALTERNATIVE: 'Phối khác cùng tinh thần'
    };
    const explorationTitle = titles[expResult.explorationIntent] || 'Khám phá';

    // 1. Client-side divergence guard against root BEFORE setting rootAnchor (B6a)
    const rootFp = rootAnchor?.outfitFingerprint || currentOutfitFingerprint;
    if (expResult.resultingOutfitFingerprint === rootFp) {
      setApiError({
        code: 'EXPLORATION_NO_DIVERGENCE',
        message: 'Bản phối khám phá chưa tạo ra khác biệt với bản phối gốc.',
        retryable: false,
        failedStep: 'CALL_B'
      });
      return;
    }

    // 2. Capture Root Anchor if not already exploring; update explorationTitle on sibling switch (B6b)
    if (!rootAnchor && blueprint) {
      setRootAnchor({
        blueprint: JSON.parse(JSON.stringify(blueprint)),
        outfitFingerprint: currentOutfitFingerprint,
        lookbookState: { ...lookbookState },
        activeRevisionIndex,
        visualQAState: { ...visualQAState },
        activeRevisions: [...activeRevisions],
        explorationTitle,
        explorationIntent: expResult.explorationIntent
      });
    } else if (rootAnchor) {
      setRootAnchor(prev => prev ? { ...prev, explorationTitle, explorationIntent: expResult.explorationIntent } : null);
    }

    setBlueprint(expResult.blueprint);
    setCurrentOutfitFingerprint(expResult.resultingOutfitFingerprint);
    const branchGender = expResult.wearerGender || activeParams.genderPresentation || 'nam';

    await handleGenerateLookbook({
      garmentId: selectedGarmentId,
      remixProposal: expResult.blueprint.remixProposal,
      context: {
        occasion: activeParams.selectedOccasion,
        style: activeParams.selectedStyle,
        traditionalRatio: activeParams.traditionalRatio,
        userStyleIntent: undefined,
        genderPresentation: branchGender
      },
      outfitFingerprint: expResult.resultingOutfitFingerprint,
      genderPresentation: branchGender,
      revisionIndex: 0,
      parentGenerationId: undefined
    }, true);

    setTimeout(() => {
      document.getElementById('section-lookbook')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleReturnToRoot = () => {
    if (!rootAnchor) return;

    // Abort any pending Visual QA for the exploration branch
    if (activeVisualQAAbortControllerRef.current) {
      activeVisualQAAbortControllerRef.current.abort();
      activeVisualQAAbortControllerRef.current = null;
    }

    // Reset active refs to Root fingerprint and active generation ID
    activeLookbookFingerprintRef.current = rootAnchor.outfitFingerprint;
    const rootActiveGenId =
      rootAnchor.lookbookState.status === 'success'
        ? rootAnchor.lookbookState.generationId
        : (rootAnchor.activeRevisions.find(r => r.revisionIndex === rootAnchor.activeRevisionIndex)?.generationId || '');
    activeVisualQAGenerationIdRef.current = rootActiveGenId;

    // B7: Reset visualQAState to idle if it was loading to prevent infinite spinner
    const restoredQA: VisualQAState =
      rootAnchor.visualQAState.status === 'loading'
        ? { status: 'idle' }
        : rootAnchor.visualQAState;

    setBlueprint(rootAnchor.blueprint);
    setCurrentOutfitFingerprint(rootAnchor.outfitFingerprint);
    setLookbookState(rootAnchor.lookbookState);
    setActiveRevisionIndex(rootAnchor.activeRevisionIndex);
    setVisualQAState(restoredQA);
    setActiveRevisions(rootAnchor.activeRevisions);
    setRootAnchor(null);

    setTimeout(() => {
      document.getElementById('section-lookbook')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Stale-response protection refs
  const activeBlueprintRequestIdRef = useRef<number>(0);
  const activeRecommendationRequestIdRef = useRef<number>(0);
  const activeGarmentIdRef = useRef<GarmentId>('ngu_than_chen');
  const activeBlueprintAbortControllerRef = useRef<AbortController | null>(null);

  // Session Reset Modal State & Guard
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState<boolean>(false);
  const isResettingRef = useRef<boolean>(false);
  const idleManagerRef = useRef<IdleSessionManager | null>(null);

  // API Error State
  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
    retryable: boolean;
    failedStep: 'CALL_A' | 'CALL_B';
    retryAction?: () => void;
  } | null>(null);

  // =========================================================================
  // 1. HYDRATION BARRIER ON MOUNT (Requirement 8, 9, 10, 11, 12)
  // Strictly runs once, reads localStorage, primes caches, ZERO API calls
  // =========================================================================
  useEffect(() => {
    try {
      const session = loadPersistedSession();
      if (session) {
        if (session.draftContext) {
          setDraftContext(session.draftContext);
        }
        if (session.committedContext) {
          setActiveParams(session.committedContext);
        }
        if (session.recommendation) {
          setRecommendation(session.recommendation);
        }
        if (session.selectedGarmentId) {
          setSelectedGarmentId(session.selectedGarmentId);
          activeGarmentIdRef.current = session.selectedGarmentId;
        }

        // Restore Accessory Overrides
        if (session.activeAccessoryOverrides && session.activeAccessoryOverrides.length > 0) {
          for (const item of session.activeAccessoryOverrides) {
            activeAccessoryOverridesRef.current.set(item.cacheKey, item.accessoryIds);
          }
        }

        // Prime Blueprint Cache
        if (session.blueprintCacheEntries && session.blueprintCacheEntries.length > 0) {
          primeSessionBlueprintCache(session.blueprintCacheEntries);

          // Restore currently active blueprint matching selectedGarmentId and committedContext
          if (session.committedContext) {
            const expectedKey = [
              session.selectedGarmentId || 'ngu_than_chen',
              session.committedContext.promptText.trim().toLowerCase(),
              session.committedContext.selectedOccasion,
              session.committedContext.selectedStyle,
              session.committedContext.traditionalRatio,
              session.committedContext.genderPresentation || 'nam'
            ].join('|');
            const matched = session.blueprintCacheEntries.find(e => e.cacheKey === expectedKey);
            if (matched) {
              setBlueprint(matched.blueprint);
            }
          }
        }

        // Prime Recommendation Cache
        if (session.recommendation && session.committedContext) {
          const recKey = [
            session.committedContext.promptText.trim().toLowerCase(),
            session.committedContext.selectedOccasion,
            session.committedContext.selectedStyle,
            session.committedContext.traditionalRatio,
            session.committedContext.genderPresentation || 'nam'
          ].join('|');
          primeSessionRecommendationCache([{ cacheKey: recKey, recommendation: session.recommendation }]);
        }

        // Restore Lookbook State (with snapshot preservation)
        if (session.lookbookState) {
          if (session.lookbookState.status === 'success' && session.lookbookState.generationId) {
            hydratedFromPersistenceGenIdRef.current = session.lookbookState.generationId;
          }
          setLookbookState(session.lookbookState);
        }
      }
    } catch (err) {
      console.warn('[App] Error during session hydration:', err);
    } finally {
      hasHydratedRef.current = true;
      setHasHydrated(true);
    }
  }, []);

  // =========================================================================
  // 2. PERSISTENCE EFFECT (Requirement 32: Hydration Barrier Guarded)
  // Only saves AFTER hydration completes to prevent overwriting with default state
  // =========================================================================
  useEffect(() => {
    if (!hasHydrated || !hasHydratedRef.current) return;
    if (isResettingRef.current) return;

    // If session is completely cleared, remove storage key
    if (!recommendation && !draftContext.promptText.trim()) {
      clearPersistedSession();
      return;
    }

    try {
      const blueprintCacheEntries = getAllSessionBlueprintEntries().map(e => ({
        cacheKey: e.cacheKey,
        garmentId: e.blueprint.garmentId,
        committedContextKey: e.cacheKey.split('|').slice(1).join('|'),
        blueprint: e.blueprint
      }));

      const accessoryOverrides: Array<{
        cacheKey: string;
        garmentId: GarmentId;
        accessoryIds: string[];
      }> = [];

      for (const [cacheKey, accessoryIds] of activeAccessoryOverridesRef.current.entries()) {
        const garmentId = cacheKey.split('|')[0] as GarmentId;
        accessoryOverrides.push({ cacheKey, garmentId, accessoryIds });
      }

      savePersistedSession({
        version: 1,
        savedAt: Date.now(),
        draftContext,
        committedContext: recommendation ? activeParams : null,
        recommendation,
        selectedGarmentId,
        blueprintCacheEntries,
        activeAccessoryOverrides: accessoryOverrides,
        lookbookState
      });
    } catch (err) {
      console.warn('[App] Error saving session to storage:', err);
    }
  }, [
    hasHydrated,
    draftContext,
    activeParams,
    recommendation,
    selectedGarmentId,
    blueprint,
    lookbookState,
    accessoryStateVersion
  ]);

  // Helper to determine if draftContext differs from committed activeParams
  const isDraftDirty = (
    draft: PersistedDraftContext,
    committed: {
      promptText: string;
      selectedOccasion: string;
      selectedStyle: string;
      traditionalRatio: number;
      genderPresentation?: GenderPresentation;
    }
  ): boolean => {
    const draftPrompt = (draft.promptText || '').trim();
    const committedPrompt = (committed.promptText || '').trim();
    const draftOccasion = draft.selectedOccasionKey || 'ky_yeu';
    const committedOccasion = committed.selectedOccasion || 'ky_yeu';
    const draftStyle = draft.selectedStyleKey || 'tre_trung';
    const committedStyle = committed.selectedStyle || 'tre_trung';
    const draftRatio = draft.sliderValue ?? 50;
    const committedRatio = committed.traditionalRatio ?? 50;
    const draftGender = draft.genderPresentation || 'nam';
    const committedGender = committed.genderPresentation || 'nam';

    return (
      draftPrompt !== committedPrompt ||
      draftOccasion !== committedOccasion ||
      draftStyle !== committedStyle ||
      draftRatio !== committedRatio ||
      draftGender !== committedGender
    );
  };

  const hasResult = Boolean(recommendation && blueprint);
  const isDirty = isDraftDirty(draftContext, activeParams);

  const handleExploreClick = () => {
    document.getElementById('section-garments')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGenderPresentationChange = (gender: GenderPresentation) => {
    setDraftContext(p => ({ ...p, genderPresentation: gender }));
    if (!isWearerGarmentEligible(selectedGarmentId, gender)) {
      setSelectedGarmentId('ngu_than_chen');
      setBlueprint(null);
      setLookbookState({ status: 'idle' });
      setVisualQAState({ status: 'idle' });
      setExplorationResults({
        MORE_TRADITIONAL: null,
        MORE_REMIXED: null,
        ALTERNATIVE: null
      });
      setRecommendation(null);
    }
  };

  // Compute effective accessories for the current garment & committed context
  const currentBlueprintCacheKey = [
    selectedGarmentId,
    activeParams.promptText.trim().toLowerCase(),
    activeParams.selectedOccasion,
    activeParams.selectedStyle,
    activeParams.traditionalRatio,
    activeParams.genderPresentation || 'nam'
  ].join('|');

  const effectiveActiveAccessories = blueprint
    ? (activeAccessoryOverridesRef.current.has(currentBlueprintCacheKey)
        ? activeAccessoryOverridesRef.current.get(currentBlueprintCacheKey)!
        : blueprint.remixProposal.accessoryIds)
    : [];

  const handleActiveAccessoriesChange = (newAccessories: string[]) => {
    activeAccessoryOverridesRef.current.set(currentBlueprintCacheKey, newAccessories);
    setAccessoryStateVersion(v => v + 1);
  };

  // Trigger Call B for a specific garmentId with Stale Protection & In-Flight Dedup
  const executeCallB = async (
    garmentId: GarmentId,
    params: {
      promptText: string;
      selectedOccasion: string;
      selectedStyle: string;
      traditionalRatio: number;
      genderPresentation?: GenderPresentation;
    }
  ) => {
    // Cancel / Abort previous in-flight Call B if exists (Requirement 5)
    if (activeBlueprintAbortControllerRef.current) {
      activeBlueprintAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeBlueprintAbortControllerRef.current = abortController;

    const requestId = ++activeBlueprintRequestIdRef.current;
    activeGarmentIdRef.current = garmentId;
    setIsLoadingBlueprint(true);
    setApiError(null);

    // 30s Client UX Safety Guard (Section 7)
    const uxSafetyTimer = setTimeout(() => {
      if (requestId === activeBlueprintRequestIdRef.current && !abortController.signal.aborted) {
        console.warn('[BlueprintUI] 30s Client UX Guard Triggered', { requestId, garmentId });
        setIsLoadingBlueprint(false);
        setApiError({
          code: 'BLUEPRINT_TIMEOUT',
          message: 'Bản phối phản hồi lâu hơn dự kiến. Bạn có thể thử lại.',
          retryable: true,
          failedStep: 'CALL_B',
          retryAction: () => executeCallB(garmentId, params)
        });
      }
    }, 30000);

    try {
      const blueprintData = await generateBlueprint({
        selectedGarmentId: garmentId,
        promptText: params.promptText,
        selectedOccasion: params.selectedOccasion,
        selectedStyle: params.selectedStyle,
        traditionalRatio: params.traditionalRatio,
        genderPresentation: params.genderPresentation,
        signal: abortController.signal
      });

      console.log('[BlueprintUI] RESPONSE_RECEIVED', { requestId, garmentId });

      // Stale Response Protection Check with detailed diagnostics (Requirement 25)
      if (requestId !== activeBlueprintRequestIdRef.current || activeGarmentIdRef.current !== garmentId) {
        const reason =
          requestId !== activeBlueprintRequestIdRef.current
            ? 'REQUEST_SUPERSEDED'
            : activeGarmentIdRef.current !== garmentId
            ? 'GARMENT_CHANGED'
            : 'CONTEXT_CHANGED';
        console.log('[BlueprintUI] RESPONSE_DROPPED', {
          requestId,
          activeRequestId: activeBlueprintRequestIdRef.current,
          reason,
          responseGarmentId: garmentId,
          activeGarmentId: activeGarmentIdRef.current
        });
        return;
      }

      console.log('[BlueprintUI] RESPONSE_APPLIED', { requestId, garmentId });
      setBlueprint(blueprintData);
      setRootAnchor(null);
      setApiError(null);
    } catch (err: any) {
      if (
        err?.name === 'AbortError' ||
        abortController.signal.aborted ||
        requestId !== activeBlueprintRequestIdRef.current
      ) {
        console.log(`[StaleProtection] Ignored aborted/superseded Call B error for "${garmentId}"`);
        return;
      }
      console.error('Call B failed:', err);
      setApiError({
        code: err.code || 'API_ERROR',
        message: err.message || 'Không thể tải bản phối lúc này.',
        retryable: err.retryable ?? false,
        failedStep: 'CALL_B',
        retryAction: () => executeCallB(garmentId, params)
      });
    } finally {
      clearTimeout(uxSafetyTimer);
      if (requestId === activeBlueprintRequestIdRef.current) {
        setIsLoadingBlueprint(false);
        console.log('[BlueprintUI] LOADING_CLEARED', { requestId });
      }
      if (activeBlueprintAbortControllerRef.current === abortController) {
        activeBlueprintAbortControllerRef.current = null;
      }
    }
  };

  // Submit Omnibox: Call A -> then immediate Call B (Step 2 Lifecycle 1)
  const handleOmniboxSubmit = async (payload: {
    promptText: string;
    selectedOccasion: string;
    selectedStyle: string;
    traditionalRatio: number;
    genderPresentation?: 'nam' | 'nu' | 'neutral';
  }) => {
    if (isRecommending) {
      console.log('[App] Omnibox submit ignored: recommendation request already in flight');
      return;
    }

    // Requirement C: Same-input CTA idempotency
    const currentIsDirty = isDraftDirty(draftContext, activeParams);
    const currentHasResult = Boolean(recommendation && blueprint);
    if (!currentIsDirty && currentHasResult && !apiError) {
      console.log('[App] Omnibox submit ignored: same input as committed context and result exists');
      document.getElementById('section-recommendations')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const recRequestId = ++activeRecommendationRequestIdRef.current;
    // B8: Invalidate and abort previous Call B so late responses cannot apply during Call A
    activeBlueprintRequestIdRef.current++;
    if (activeBlueprintAbortControllerRef.current) {
      activeBlueprintAbortControllerRef.current.abort();
      activeBlueprintAbortControllerRef.current = null;
    }
    const effectiveGender = payload.genderPresentation || draftContext.genderPresentation || 'nam';
    const paramsWithGender = {
      ...payload,
      genderPresentation: effectiveGender
    };

    // Atomically commit context
    setActiveParams(paramsWithGender);
    setApiError(null);

    // Reset downstream visualization/QA state on committed context change
    setLookbookState({ status: 'idle' });
    setVisualQAState({ status: 'idle' });
    setExplorationResults({
      MORE_TRADITIONAL: null,
      MORE_REMIXED: null,
      ALTERNATIVE: null
    });
    setIsRecommending(true);

    try {
      // 1. Call A: Garment Recommendation
      const recData = await recommendGarment(paramsWithGender);
      if (recRequestId !== activeRecommendationRequestIdRef.current) {
        console.log('[App] Dropped obsolete Call A response', { recRequestId, active: activeRecommendationRequestIdRef.current });
        return;
      }
      setRecommendation(recData);
      const primaryId = recData.primary.garmentId;
      setSelectedGarmentId(primaryId);
      activeGarmentIdRef.current = primaryId;

      // Smooth scroll to Section 1
      setTimeout(() => {
        document.getElementById('section-recommendations')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // 2. Immediate Call B: Blueprint Generation for Primary Garment
      setBlueprint(null);
      await executeCallB(primaryId, paramsWithGender);
    } catch (err: any) {
      if (recRequestId === activeRecommendationRequestIdRef.current) {
        console.error('Pipeline Call A error:', err);
        setRecommendation(null);
        setBlueprint(null);
        setApiError({
          code: err.code || 'API_ERROR',
          message: err.message || 'Không thể hoàn tất gợi ý trang phục lúc này.',
          retryable: err.retryable ?? false,
          failedStep: 'CALL_A',
          retryAction: () => handleOmniboxSubmit(payload)
        });
      }
    } finally {
      if (recRequestId === activeRecommendationRequestIdRef.current) {
        setIsRecommending(false);
      }
    }
  };

  // Switch Garment in Section 1 (Alternative Click - Step 2 Lifecycle 2)
  const handleSelectGarmentFromRecommendation = (garmentId: GarmentId) => {
    if (garmentId === selectedGarmentId) return;

    setSelectedGarmentId(garmentId);
    setBlueprint(null);
    setRootAnchor(null);
    setApiError(null);
    setLookbookState({ status: 'idle' });
    setVisualQAState({ status: 'idle' });
    setActiveRevisions([]);
    setActiveRevisionIndex(0);
    setExplorationResults({
      MORE_TRADITIONAL: null,
      MORE_REMIXED: null,
      ALTERNATIVE: null
    });

    // Call B is triggered with the new garmentId (Session cache avoids redundant API calls)
    executeCallB(garmentId, activeParams);
  };

  // Phase 2B & 2B.1: Generate Lookbook Image Action
  // Immutable generationSnapshot captured AT REQUEST TIME (Requirement 14 & 15)
  const handleGenerateLookbook = async (
    payload: GenerateLookbookRequest,
    forceRegenerate = false
  ) => {
    // Client Double-Click / In-Flight Guard
    if (lookbookState.status === 'generating') {
      return;
    }

    const targetFingerprint = payload.outfitFingerprint;
    activeLookbookFingerprintRef.current = targetFingerprint;
    setCurrentOutfitFingerprint(targetFingerprint);

    const currentGender = payload.genderPresentation || draftContext.genderPresentation || activeParams.genderPresentation || 'nam';

    // Capture Immutable Generation Snapshot
    const snapshot: GenerationSnapshot = {
      garmentId: payload.garmentId,
      genderPresentation: currentGender,
      palette: payload.remixProposal.palette.map(p => ({
        id: p.id,
        role: p.role,
        hex: p.hex,
        name: p.name,
        origin: p.origin
      })),
      fabricId: payload.remixProposal.fabricId,
      lowerGarmentId: payload.remixProposal.lowerGarmentId,
      footwearId: payload.remixProposal.footwearId,
      activeAccessoryIds: [...payload.remixProposal.accessoryIds],
      contextProps: payload.remixProposal.contextProps || [],
      committedContextSnapshot: {
        promptText: payload.context.userStyleIntent || '',
        occasion: payload.context.occasion,
        style: payload.context.style,
        traditionalRatio: payload.context.traditionalRatio,
        genderPresentation: currentGender
      },
      boundFingerprint: targetFingerprint
    };

    // Retain previous image for graceful dimming during regenerate
    const previousImage =
      lookbookState.status === 'success'
        ? {
            generationId: lookbookState.generationId,
            imageUrl: lookbookState.imageUrl,
            snapshot: lookbookState.snapshot
          }
        : undefined;

    setLookbookState({
      status: 'generating',
      outfitFingerprint: targetFingerprint,
      snapshot,
      previousImage
    });

    // Smooth scroll to Section 3 after generation starts
    setTimeout(() => {
      document.getElementById('section-lookbook')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const res = await requestLookbookGeneration({
        ...payload,
        forceRegenerate
      });

      // Section 25 Stale Generation Protection:
      if (activeLookbookFingerprintRef.current !== targetFingerprint) {
        console.warn(`[Stale Lookbook Protection] Dropped response for ${targetFingerprint}, current is ${activeLookbookFingerprintRef.current}`);
        return;
      }

      setLookbookState({
        status: 'success',
        generationId: res.generationId,
        imageUrl: res.imageUrl,
        outfitFingerprint: res.outfitFingerprint,
        createdAt: res.createdAt,
        expiresAt: res.expiresAt,
        revisionIndex: payload.revisionIndex || 0,
        snapshot // Binds immutable request snapshot!
      });

      // Update Phase 2C Thread Store
      const thread = recordLookbookRevision({
        boundFingerprint: res.outfitFingerprint,
        garmentId: payload.garmentId,
        generationId: res.generationId,
        revisionIndex: payload.revisionIndex || 0,
        imageUrl: res.imageUrl,
        createdAt: res.createdAt,
        expiresAt: res.expiresAt,
        snapshot,
        correctionPlan: payload.groundedCorrectionPlan
      });
      setActiveRevisions(thread.revisions);
      setActiveRevisionIndex(thread.activeRevisionIndex);

      // Requirement 1: Automatic non-blocking QA trigger for new successful generations (v0, v1, v2)
      hydratedQARecoveredRef.current.add(`${res.generationId}_${res.outfitFingerprint}`);
      handleVerifyLookbook(res.generationId, res.outfitFingerprint);
    } catch (err: any) {
      if (activeLookbookFingerprintRef.current !== targetFingerprint) return;
      setLookbookState({
        status: 'error',
        code: err.code || 'IMAGE_GENERATION_FAILED',
        message: err.message || 'Không thể tạo hình ảnh lúc này. Vui lòng thử lại sau.',
        outfitFingerprint: targetFingerprint,
        snapshot,
        previousImage
      });
    }
  };

  // Phase 2C: Cultural Visual QA Action (Step 5 - Single Orchestration Owner)
  const handleVerifyLookbook = useCallback(async (
    targetGenIdParam?: string,
    targetBoundFpParam?: string,
    isManualRetry = false
  ) => {
    let targetGenId: string | undefined = targetGenIdParam;
    let targetBoundFp: string | undefined = targetBoundFpParam;

    if (!targetGenId || !targetBoundFp) {
      if (lookbookState.status === 'success') {
        targetGenId = lookbookState.generationId;
        targetBoundFp = lookbookState.outfitFingerprint;
      } else if (
        (lookbookState.status === 'generating' || lookbookState.status === 'error') &&
        lookbookState.previousImage
      ) {
        targetGenId = lookbookState.previousImage.generationId;
        targetBoundFp = lookbookState.previousImage.snapshot?.boundFingerprint;
      }
    }

    if (!targetGenId || !targetBoundFp) {
      return;
    }

    const qaIdentityKey = `${targetGenId}_${targetBoundFp}`;

    if (isManualRetry) {
      attemptedVisualQARef.current.delete(qaIdentityKey);
    } else {
      if (attemptedVisualQARef.current.has(qaIdentityKey)) {
        console.log('[VisualQA] Skipped duplicate automatic QA attempt for identity:', qaIdentityKey);
        return;
      }
      if (
        visualQAState.status === 'loading' &&
        visualQAState.generationId === targetGenId
      ) {
        console.log('[VisualQA] In-flight QA already loading for generationId:', targetGenId);
        return;
      }
    }

    attemptedVisualQARef.current.add(qaIdentityKey);

    // Abort previous in-flight QA if generation changed or manual retry requested
    if (activeVisualQAAbortControllerRef.current) {
      if (activeVisualQAGenerationIdRef.current !== targetGenId || isManualRetry) {
        console.log('[VisualQA] Aborting previous in-flight QA request for targetGenId:', targetGenId);
        activeVisualQAAbortControllerRef.current.abort();
      } else {
        return; // Already in-flight for same generationId and not a manual retry
      }
    }

    const abortController = new AbortController();
    activeVisualQAAbortControllerRef.current = abortController;
    activeVisualQAGenerationIdRef.current = targetGenId;

    setVisualQAState({ status: 'loading', generationId: targetGenId });

    try {
      const qaResult = await verifyLookbookImage(
        {
          generationId: targetGenId,
          boundFingerprint: targetBoundFp
        },
        abortController.signal
      );

      // Stale protection: check if current visual QA generationId is still active
      if (
        abortController.signal.aborted ||
        activeVisualQAGenerationIdRef.current !== targetGenId
      ) {
        console.log('[VisualQA] Dropped superseded visual QA result for', targetGenId);
        return;
      }

      setVisualQAState({
        status: 'success',
        generationId: targetGenId,
        result: qaResult
      });

      // Update persisted thread with QA result
      const thread = recordQAResult(
        targetGenId,
        targetBoundFp,
        qaResult,
        qaResult.groundedCorrectionPlan
      );
      if (thread) {
        setActiveRevisions(thread.revisions);
      }
    } catch (err: any) {
      if (
        abortController.signal.aborted ||
        activeVisualQAGenerationIdRef.current !== targetGenId
      ) {
        return;
      }
      console.error('Visual QA error:', err);
      setVisualQAState({
        status: 'error',
        generationId: targetGenId,
        code: err.code || 'VISUAL_QA_FAILED',
        message: err.message || 'Không thể hoàn tất đánh giá bản phối lúc này. Vui lòng thử lại sau.',
        retryable: err.retryable ?? true
      });
    } finally {
      if (activeVisualQAAbortControllerRef.current === abortController) {
        activeVisualQAAbortControllerRef.current = null;
      }
    }
  }, [lookbookState, visualQAState]);

  // Phase 2C & G3C: Trigger Grounded Correction or User-Guided Refinement (Max 2 Revisions: V0 -> V1 -> V2)
  const handleTriggerRevision = (customCorrectionPlan?: GroundedCorrectionPlan, userRefinementText?: string) => {
    if (!blueprint) return;
    const currentThread = getThreadForFingerprint(currentOutfitFingerprint);
    const currentRevIndex =
      currentThread?.activeRevisionIndex ??
      (lookbookState.status === 'success' ? (lookbookState.revisionIndex ?? 0) : 0);
    const nextRevIndex = currentRevIndex + 1;

    const currentPlan = customCorrectionPlan || (visualQAState.status === 'success' ? visualQAState.result?.groundedCorrectionPlan : undefined);
    const currentGender = currentThread?.revisions[0]?.snapshot.genderPresentation || draftContext.genderPresentation || activeParams.genderPresentation || 'nam';

    const effectiveIntent = userRefinementText
      ? `[Tinh chỉnh theo ý tôi: ${userRefinementText}]`
      : undefined;

    handleGenerateLookbook(
      {
        garmentId: selectedGarmentId,
        genderPresentation: currentGender,
        remixProposal: {
          palette: blueprint.remixProposal.palette,
          fabricId: blueprint.remixProposal.fabricId,
          lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
          footwearId: blueprint.remixProposal.footwearId,
          accessoryIds: effectiveActiveAccessories,
          contextProps: blueprint.remixProposal.contextProps || []
        },
        context: {
          occasion: activeParams.selectedOccasion,
          style: activeParams.selectedStyle,
          traditionalRatio: activeParams.traditionalRatio,
          userStyleIntent: effectiveIntent,
          genderPresentation: currentGender
        },
        outfitFingerprint: currentOutfitFingerprint,
        revisionIndex: nextRevIndex,
        parentGenerationId: lookbookState.status === 'success' ? lookbookState.generationId : undefined,
        groundedCorrectionPlan: currentPlan
      },
      true
    );
  };

  const handleTriggerUserGuidedRevision = (refinementText: string) => {
    handleTriggerRevision(undefined, refinementText);
  };

  const handleRetryRevision = (targetRevisionIndex?: number, newRefinementText?: string) => {
    if (!blueprint) return;
    const currentThread = getThreadForFingerprint(currentOutfitFingerprint);
    const revToRetry =
      targetRevisionIndex ??
      activeRevisionIndex ??
      currentThread?.activeRevisionIndex ??
      (lookbookState.status === 'success' ? (lookbookState.revisionIndex ?? 0) : 0);

    if (revToRetry < 1) return;

    const currentPlan = visualQAState.status === 'success' ? visualQAState.result?.groundedCorrectionPlan : undefined;
    const currentGender = currentThread?.revisions[0]?.snapshot.genderPresentation || draftContext.genderPresentation || activeParams.genderPresentation || 'nam';

    const existingRevItem = currentThread?.revisions.find(r => r.revisionIndex === revToRetry);
    const parentRevItem = currentThread?.revisions.find(r => r.revisionIndex === revToRetry - 1);
    const parentGenerationId = parentRevItem?.generationId || (revToRetry === 1 ? currentThread?.revisions[0]?.generationId : undefined);
    const parentPrompt = parentRevItem?.snapshot?.committedContextSnapshot?.promptText || activeParams.promptText;

    const effectiveIntent = newRefinementText
      ? `[Tinh chỉnh theo ý tôi: ${newRefinementText}]`
      : (existingRevItem?.snapshot?.committedContextSnapshot?.promptText || undefined);

    handleGenerateLookbook(
      {
        garmentId: selectedGarmentId,
        genderPresentation: currentGender,
        remixProposal: {
          palette: blueprint.remixProposal.palette,
          fabricId: blueprint.remixProposal.fabricId,
          lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
          footwearId: blueprint.remixProposal.footwearId,
          accessoryIds: effectiveActiveAccessories,
          contextProps: blueprint.remixProposal.contextProps || []
        },
        context: {
          occasion: activeParams.selectedOccasion,
          style: activeParams.selectedStyle,
          traditionalRatio: activeParams.traditionalRatio,
          userStyleIntent: effectiveIntent,
          genderPresentation: currentGender
        },
        outfitFingerprint: currentOutfitFingerprint,
        revisionIndex: revToRetry,
        parentGenerationId,
        groundedCorrectionPlan: currentPlan
      },
      true
    );
  };

  // Phase 2C: Select Revision Tab (v0, v1, v2)
  const handleSelectRevision = (revIndex: number) => {
    setActiveRevisionIndex(revIndex);
    const thread = getThreadForFingerprint(currentOutfitFingerprint);
    const rev = thread?.revisions.find(r => r.revisionIndex === revIndex);
    if (rev) {
      if (rev.qaResult) {
        setVisualQAState({
          status: 'success',
          generationId: rev.generationId,
          result: rev.qaResult
        });
      } else {
        setVisualQAState({ status: 'idle' });
      }
    }
  };

  // Sync Visual QA State whenever lookbookState changes
  useEffect(() => {
    if (lookbookState.status === 'success') {
      const thread = getThreadForFingerprint(lookbookState.outfitFingerprint);
      if (thread) {
        setActiveRevisions(thread.revisions);
        setActiveRevisionIndex(thread.activeRevisionIndex);
      }
      const persisted = loadPersistedVisualQA(lookbookState.generationId);
      if (persisted && persisted.boundFingerprint === lookbookState.outfitFingerprint) {
        setVisualQAState({
          status: 'success',
          generationId: lookbookState.generationId,
          result: persisted
        });
      } else if (
        visualQAState.status !== 'loading' ||
        visualQAState.generationId !== lookbookState.generationId
      ) {
        setVisualQAState({ status: 'idle' });
      }
    } else if (lookbookState.status === 'idle') {
      setVisualQAState({ status: 'idle' });
      setActiveRevisions([]);
      setActiveRevisionIndex(0);
    }
  }, [lookbookState]);

  // Hydration Recovery Pathway for Visual QA (Requirement: Auto-recovery for missing completed QA after F5)
  useEffect(() => {
    if (!hasHydrated || !hasHydratedRef.current || isResettingRef.current) return;
    if (lookbookState.status !== 'success') return;

    const genId = lookbookState.generationId;
    const boundFp = lookbookState.outfitFingerprint;
    if (!genId || !boundFp) return;

    // Requirement A: Hydration recovery must ONLY recover a generation restored from persistence after actual hydration/F5
    if (genId !== hydratedFromPersistenceGenIdRef.current) return;

    const recoveryKey = `${genId}_${boundFp}`;

    // If QA is already success in state, skip
    if (visualQAState.status === 'success' && visualQAState.generationId === genId) return;

    // Check if persistence has completed QA
    const persisted = loadPersistedVisualQA(genId);
    if (persisted && persisted.boundFingerprint === boundFp) {
      setVisualQAState({
        status: 'success',
        generationId: genId,
        result: persisted
      });
      return;
    }

    // Check 1-shot recovery guard per recoveryKey in current mount/session
    if (hydratedQARecoveredRef.current.has(recoveryKey)) return;

    hydratedQARecoveredRef.current.add(recoveryKey);
    console.log('[Hydration Recovery] Triggering 1-shot recovery for missing QA restored from persistence:', { genId, boundFp });
    handleVerifyLookbook(genId, boundFp);
  }, [hasHydrated, lookbookState, visualQAState.status, handleVerifyLookbook]);

  // Reset Session Flow (Requirement 31 & Micro-Patch: Bắt đầu lại)
  const handleResetRequest = () => {
    console.log('[SessionReset] RESET_REQUEST_RECEIVED');
    setIsResetModalOpen(true);
    console.log('[SessionReset] CONFIRM_MODAL_OPENED');
  };

  const handleCancelReset = () => {
    console.log('[SessionReset] CANCELLED');
    setIsResetModalOpen(false);
  };

  const handleConfirmReset = () => {
    console.log('[SessionReset] CONFIRMED');
    console.log('[SessionReset] RESET_STARTED');

    isResettingRef.current = true;

    // A. Invalidate current async work first
    activeRecommendationRequestIdRef.current++;
    activeBlueprintRequestIdRef.current++;
    if (activeBlueprintAbortControllerRef.current) {
      activeBlueprintAbortControllerRef.current.abort();
      activeBlueprintAbortControllerRef.current = null;
    }
    if (activeVisualQAAbortControllerRef.current) {
      activeVisualQAAbortControllerRef.current.abort();
      activeVisualQAAbortControllerRef.current = null;
    }
    activeLookbookFingerprintRef.current = '';
    activeVisualQAGenerationIdRef.current = '';
    hydratedQARecoveredRef.current.clear();
    attemptedVisualQARef.current.clear();
    console.log('[SessionReset] INFLIGHT_INVALIDATED');

    // B. Clear client persistence
    clearPersistedSession();
    clearPersistedVisualQA();
    console.log('[SessionReset] STORAGE_CLEARED');

    // C. Clear product-session caches
    clearSessionCaches();
    clearVisualQASessionCache();
    activeAccessoryOverridesRef.current.clear();
    console.log('[SessionReset] PRODUCT_CACHES_CLEARED');

    // D. Reset React product state
    setRecommendation(null);
    setBlueprint(null);
    setRootAnchor(null);
    setLookbookState({ status: 'idle' });
    setVisualQAState({ status: 'idle' });
    setExplorationResults({
      MORE_TRADITIONAL: null,
      MORE_REMIXED: null,
      ALTERNATIVE: null
    });
    setSelectedGarmentId('ngu_than_chen');
    activeGarmentIdRef.current = 'ngu_than_chen';
    setApiError(null);
    setIsRecommending(false);
    setIsLoadingBlueprint(false);
    setAccessoryStateVersion(0);
    setCurrentOutfitFingerprint('AC-INIT');

    setDraftContext({
      promptText: '',
      selectedOccasionKey: 'ky_yeu',
      selectedStyleKey: 'tre_trung',
      sliderValue: 50,
      selectedOccasion: 'tet_temple' as OccasionId,
      selectedIntent: 'balanced' as RemixIntent
    });

    setActiveParams({
      promptText: '',
      selectedOccasion: 'ky_yeu',
      selectedStyle: 'tre_trung',
      traditionalRatio: 50
    });

    // Phase 3A/3B: Clear AC Chat and refresh ephemeral chatSessionId on canonical session reset
    setChatMessages([]);
    setIsChatOpen(false);
    chatSessionIdRef.current = `cs_${Math.random().toString(36).slice(2, 10)}`;

    console.log('[SessionReset] STATE_CLEARED');

    // E. Close modal
    setIsResetModalOpen(false);

    // F. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // G. Completed
    console.log('[SessionReset] RESET_COMPLETED');

    setTimeout(() => {
      isResettingRef.current = false;
    }, 100);
  };
  const handleResetSession = handleConfirmReset;

  // Handle Image Expiration (Requirement 19)
  const handleImageExpired = () => {
    setLookbookState(prev => {
      const snap =
        prev.status === 'success'
          ? prev.snapshot
          : prev.status === 'generating' || prev.status === 'error'
          ? prev.snapshot
          : undefined;

      return {
        status: 'expired',
        outfitFingerprint: currentOutfitFingerprint,
        snapshot: snap,
        message: 'Ảnh minh họa trước đã hết thời hạn lưu tạm.'
      };
    });
  };

  // Idle Session Manager Lifecycle (4m30s warning, 5m reset, in-flight safe deferral)
  useEffect(() => {
    const isWorkInFlight = () => {
      const exploring = Object.values(isExploring).some(Boolean);
      return (
        isRecommending ||
        isLoadingBlueprint ||
        lookbookState.status === 'generating' ||
        visualQAState.status === 'loading' ||
        exploring
      );
    };

    const manager = new IdleSessionManager({
      warningThresholdMs: 870000,
      resetThresholdMs: 900000,
      checkIntervalMs: 1000,
      onShowWarning: () => {
        setIsIdleWarningOpen(true);
      },
      onDismissWarning: () => {
        setIsIdleWarningOpen(false);
      },
      onTriggerReset: () => {
        console.log('[IdleSessionManager] Inactivity threshold reached; preserving lookbook image per non-auto-expiration requirement.');
      },
      isWorkInFlight
    });

    idleManagerRef.current = manager;
    manager.start();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleActivity = () => {
      manager.recordUserActivity();
    };

    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      manager.stop();
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [
    isRecommending,
    isLoadingBlueprint,
    lookbookState.status,
    visualQAState.status,
    isExploring
  ]);

  return (
    <div className="relative min-h-screen bg-[var(--page-bg)] text-[var(--text)] transition-colors duration-200 selection:bg-[var(--accent)] selection:text-[var(--accent-contrast)]">
      {/* Background Ambient Aurora Mesh Blobs */}
      <div className="aurora-mesh-container">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
        <div className="aurora-blob-4" />
      </div>

      {/* Top Glass Navbar: AC | VIỆT PHỤC ĐƯƠNG ĐẠI */}
      <Navbar
        isEvaluating={isRecommending || isLoadingBlueprint}
        hasActiveSession={Boolean(recommendation || draftContext.promptText.trim() || lookbookState.status !== 'idle')}
        onResetSession={handleResetRequest}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Center-Focused Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-28 space-y-12 md:space-y-16">
        {/* Seamless Hero Homepage */}
        <HeroHomepage
          promptText={draftContext.promptText}
          onPromptChange={text => setDraftContext(p => ({ ...p, promptText: text }))}
          selectedOccasion={draftContext.selectedOccasion}
          onSelectOccasion={occ => setDraftContext(p => ({ ...p, selectedOccasion: occ }))}
          selectedIntent={draftContext.selectedIntent}
          onSelectIntent={intent => setDraftContext(p => ({ ...p, selectedIntent: intent }))}
          selectedOccasionKey={draftContext.selectedOccasionKey}
          onSelectOccasionKey={key => setDraftContext(p => ({ ...p, selectedOccasionKey: key }))}
          selectedStyleKey={draftContext.selectedStyleKey}
          onSelectStyleKey={key => setDraftContext(p => ({ ...p, selectedStyleKey: key }))}
          sliderValue={draftContext.sliderValue}
          onSliderValueChange={val => setDraftContext(p => ({ ...p, sliderValue: val }))}
          genderPresentation={draftContext.genderPresentation || 'nam'}
          onGenderChange={handleGenderPresentationChange}
          onExploreClick={handleExploreClick}
          onSubmitOmnibox={handleOmniboxSubmit}
          isRecommending={isRecommending}
          hasResult={hasResult}
          isDirty={isDirty}
        />

        {/* Truthful Runtime Status Banner */}
        {apiError && (
          <div
            className="rounded-3xl p-5 sm:p-6 bg-[var(--surface)]/85 border border-[var(--surface-border)] shadow-sm transition-all duration-300"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--chip-selected-bg)] text-[var(--chip-selected-text)] border border-[var(--chip-selected-border)]"
                >
                  {apiError.code === 'GEMINI_QUOTA_EXHAUSTED' ? (
                    <Clock className="w-5 h-5 text-[var(--accent)]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[var(--accent)]" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--chip-selected-bg)] text-[var(--chip-selected-text)] border-[var(--chip-selected-border)]">
                      {apiError.code === 'GEMINI_QUOTA_EXHAUSTED'
                        ? 'Hạn mức AI tạm khóa'
                        : apiError.code === 'GEMINI_TEMPORARILY_UNAVAILABLE'
                        ? 'Dịch vụ AI đang bận'
                        : 'Thông báo kết nối AI'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text)] leading-snug">
                    {apiError.message}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-normal">
                    {apiError.code === 'GEMINI_QUOTA_EXHAUSTED'
                      ? 'Dữ liệu tri thức lịch sử và các quy chế văn hóa vẫn được bảo toàn nguyên vẹn trong hệ thống.'
                      : 'Vui lòng bấm nút "Thử lại ngay" khi hệ thống sẵn sàng.'}
                  </p>
                </div>
              </div>

              {/* Action Button: Retry only when retryable */}
              {apiError.retryable && apiError.retryAction && (
                <button
                  onClick={apiError.retryAction}
                  className="rounded-full px-5 py-2 text-xs font-medium text-[var(--chip-selected-text)] bg-[var(--chip-selected-bg)] hover:bg-[var(--surface-2)] border border-[var(--chip-selected-border)] shadow-2xs transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-center"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Thử lại ngay</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phase 2A: Section 1 — AC Đề Xuất & Đặc Trưng Văn Hóa */}
        {recommendation && (
          <Section1Recommendation
            recommendation={recommendation}
            selectedGarmentId={selectedGarmentId}
            onSelectGarment={handleSelectGarmentFromRecommendation}
            isLoadingBlueprint={isLoadingBlueprint}
            genderPresentation={draftContext.genderPresentation || activeParams.genderPresentation || 'nam'}
          />
        )}

        {/* Phase 2A: Section 2 — Bản Phối Thời Trang Đương Đại */}
        {recommendation && (
          <Section2Blueprint
            blueprint={blueprint}
            selectedGarmentId={selectedGarmentId}
            selectedOccasion={activeParams.selectedOccasion}
            selectedStyle={activeParams.selectedStyle}
            traditionalRatio={activeParams.traditionalRatio}
            promptText={activeParams.promptText}
            genderPresentation={draftContext.genderPresentation || activeParams.genderPresentation || 'nam'}
            onGenderPresentationChange={handleGenderPresentationChange}
            isLoading={isLoadingBlueprint}
            error={apiError?.failedStep === 'CALL_B' ? apiError : null}
            isRecommending={isRecommending}
            isGeneratingLookbook={lookbookState.status === 'generating'}
            activeAccessories={effectiveActiveAccessories}
            onActiveAccessoriesChange={handleActiveAccessoriesChange}
            onFingerprintChange={setCurrentOutfitFingerprint}
            onGenerateLookbook={payload => handleGenerateLookbook(payload, false)}
            onColorChange={handleColorChange}
          />
        )}

        {/* Phase 2B & 2B.1: Section 3 — Editorial Lookbook */}
        {recommendation && (
          <Section3Lookbook
            lookbookState={lookbookState}
            selectedGarmentId={selectedGarmentId}
            currentOutfitFingerprint={currentOutfitFingerprint}
            isGenerating={lookbookState.status === 'generating'}
            onRegenerate={force => {
              if (blueprint) {
                const currentThread = getThreadForFingerprint(currentOutfitFingerprint);
                const currentGender = currentThread?.revisions[0]?.snapshot.genderPresentation || activeParams.genderPresentation || 'nam';
                handleGenerateLookbook(
                  {
                    garmentId: selectedGarmentId,
                    genderPresentation: currentGender,
                    remixProposal: {
                      palette: blueprint.remixProposal.palette,
                      fabricId: blueprint.remixProposal.fabricId,
                      lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
                      footwearId: blueprint.remixProposal.footwearId,
                      accessoryIds: effectiveActiveAccessories,
                      contextProps: blueprint.remixProposal.contextProps || []
                    },
                    context: {
                      occasion: activeParams.selectedOccasion,
                      style: activeParams.selectedStyle,
                      traditionalRatio: activeParams.traditionalRatio,
                      userStyleIntent: undefined,
                      genderPresentation: currentGender
                    },
                    outfitFingerprint: currentOutfitFingerprint
                  },
                  force
                );
              }
            }}
            onStaleUpdate={() => {
              if (blueprint) {
                const currentThread = getThreadForFingerprint(currentOutfitFingerprint);
                const currentGender = currentThread?.revisions[0]?.snapshot.genderPresentation || activeParams.genderPresentation || 'nam';
                handleGenerateLookbook(
                  {
                    garmentId: selectedGarmentId,
                    genderPresentation: currentGender,
                    remixProposal: {
                      palette: blueprint.remixProposal.palette,
                      fabricId: blueprint.remixProposal.fabricId,
                      lowerGarmentId: blueprint.remixProposal.lowerGarmentId,
                      footwearId: blueprint.remixProposal.footwearId,
                      accessoryIds: effectiveActiveAccessories,
                      contextProps: blueprint.remixProposal.contextProps || []
                    },
                    context: {
                      occasion: activeParams.selectedOccasion,
                      style: activeParams.selectedStyle,
                      traditionalRatio: activeParams.traditionalRatio,
                      userStyleIntent: undefined,
                      genderPresentation: currentGender
                    },
                    outfitFingerprint: currentOutfitFingerprint
                  },
                  false
                );
              }
            }}
            onImageExpired={handleImageExpired}
            qaState={visualQAState}
            revisions={activeRevisions}
            activeRevisionIndex={activeRevisionIndex}
            correctionPlan={visualQAState.status === 'success' ? visualQAState.result?.groundedCorrectionPlan : undefined}
            onVerifyLookbook={() => handleVerifyLookbook(undefined, undefined, true)}
            onTriggerRevision={handleTriggerRevision}
            onTriggerUserGuidedRevision={handleTriggerUserGuidedRevision}
            onRetryRevision={handleRetryRevision}
            onSelectRevision={handleSelectRevision}
            isExploringBranch={Boolean(rootAnchor)}
            explorationTitle={rootAnchor?.explorationTitle}
            onReturnToRoot={handleReturnToRoot}
            onColorChange={handleColorChange}
          />
        )}

        {/* Phase 2D: Section 4 — Guided Exploration (Gated on root V0 existence for current committed Blueprint) */}
        {(() => {
          const isExploringBranch = Boolean(rootAnchor);
          const activeFp = rootAnchor ? rootAnchor.outfitFingerprint : currentOutfitFingerprint;
          const currentThreadForFingerprint = getThreadForFingerprint(activeFp);
          const rootV0ExistsForCurrentBlueprint = Boolean(
            isExploringBranch ||
            (lookbookState.status === 'success' &&
              lookbookState.outfitFingerprint === currentOutfitFingerprint &&
              Boolean(lookbookState.imageUrl)) ||
            (currentThreadForFingerprint &&
              currentThreadForFingerprint.boundFingerprint === activeFp &&
              currentThreadForFingerprint.revisions.some(r => r.revisionIndex === 0 && Boolean(r.imageUrl)) &&
              lookbookState.status !== 'idle')
          );

          return (
            recommendation &&
            blueprint &&
            rootV0ExistsForCurrentBlueprint && (
              <Section4Exploration
                blueprint={blueprint}
                selectedGarmentId={selectedGarmentId}
                explorationResults={explorationResults}
                isExploring={isExploring}
                onTriggerExploration={handleTriggerExploration}
                onVisualizeExploration={handleVisualizeExploration}
                isGeneratingLookbook={lookbookState.status === 'generating'}
                isExploringBranch={isExploringBranch}
                explorationTitle={rootAnchor?.explorationTitle}
                onReturnToRoot={handleReturnToRoot}
              />
            )
          );
        })()}
      </main>

      {/* Confirmation Modal for Session Reset (Requirement 31 & Micro-Patch) */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onCancel={handleCancelReset}
        onConfirm={handleConfirmReset}
      />

      {/* Idle Timeout Warning Modal (4m30s Inactivity Warning) */}
      <IdleTimeoutWarningModal
        isOpen={isIdleWarningOpen}
        onContinue={() => {
          setIsIdleWarningOpen(false);
          idleManagerRef.current?.recordUserActivity();
        }}
      />

      {/* Phase 3A/3B: Grounded AC Chat Drawer & Actionable Delta Mutations */}
      <ACChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatSessionId={chatSessionIdRef.current}
        currentFingerprint={currentOutfitFingerprint}
        currentGarmentId={blueprint ? selectedGarmentId : undefined}
        genderPresentation={blueprint ? (activeParams.genderPresentation || draftContext.genderPresentation) : undefined}
        activeOccasion={blueprint ? activeParams.selectedOccasion : undefined}
        activeStyle={blueprint ? activeParams.selectedStyle : undefined}
        traditionalRatio={blueprint ? activeParams.traditionalRatio : undefined}
        promptText={blueprint ? activeParams.promptText : undefined}
        blueprint={blueprint}
        snapshot={lookbookState.status === 'success' ? lookbookState.snapshot : undefined}
        visualQAState={visualQAState}
        messages={chatMessages}
        setMessages={setChatMessages}
        onApplyAction={handleApplyAction}
        onClearChat={() => {
          chatSessionIdRef.current = `cs_${Math.random().toString(36).slice(2, 10)}`;
        }}
      />
    </div>
  );
}
