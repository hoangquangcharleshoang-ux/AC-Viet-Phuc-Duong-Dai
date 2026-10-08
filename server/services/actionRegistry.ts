/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 3B: Ephemeral Server Action Registry & Safe Mutations
 *
 * Invariants:
 * - Ephemeral in-memory registry for G3B server-authoritative actions.
 * - Stores actionId, chatSessionId, immutable normalized sourceBlueprint,
 *   sourceFingerprint, action, expiresAt, and consumed status.
 * - Concurrency guard: client must match sourceFingerprint.
 * - TTL: 10 minutes default (600,000 ms).
 * - Single-use consumption (consumedAt / isConsumed).
 * - Deterministic apply: zero LLM calls.
 * - Re-validates against canonical catalog and cultural policy rules.
 */

import crypto from 'crypto';
import {
  BlueprintOutput,
  ACChatAction,
  ACChatActionType,
  GarmentId,
  GenderPresentation
} from '../../src/types/index';
import { computeOutfitFingerprint } from '../../src/shared/fingerprint';
import { FOOTWEAR, FABRICS, ACCESSORIES, PALETTES } from '../../src/data/canonicalCatalog';
import {
  isFanRequestedExplicitly,
  isPearlRequestedExplicitly
} from './culturalPolicyService';

export interface ActionRegistryRecord {
  actionId: string;
  chatSessionId: string;
  sourceBlueprint: BlueprintOutput;
  sourceFingerprint: string;
  action: ACChatAction;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
  consumedAt?: number;
  context?: {
    occasion?: string;
    style?: string;
    traditionalRatio?: number;
    genderPresentation?: GenderPresentation;
    promptText?: string;
  };
}

export interface MutateActionRequest {
  actionId: string;
  currentFingerprint: string;
  chatSessionId: string;
}

export interface MutateActionResponse {
  nextBlueprint: BlueprintOutput;
  nextFingerprint: string;
  actionId: string;
  action: ACChatAction;
  notice: string;
}

export class EphemeralActionRegistry {
  private records = new Map<string, ActionRegistryRecord>();
  private defaultTtlMs: number;

  constructor(ttlMs = 10 * 60 * 1000) {
    this.defaultTtlMs = ttlMs;
  }

  public getTtlMs(): number {
    return this.defaultTtlMs;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [id, rec] of this.records.entries()) {
      if (now > rec.expiresAt) {
        this.records.delete(id);
      }
    }
  }

  /**
   * Registers a server-authoritative action candidate.
   * Ensures sourceBlueprint is normalized and sourceFingerprint is computed on server.
   */
  public registerAction(params: {
    chatSessionId: string;
    sourceBlueprint: BlueprintOutput;
    action: ACChatAction;
    context?: {
      occasion?: string;
      style?: string;
      traditionalRatio?: number;
      genderPresentation?: GenderPresentation;
      promptText?: string;
    };
    ttlMs?: number;
  }): ActionRegistryRecord {
    this.purgeExpired();

    const actionId = `act_${crypto.randomBytes(8).toString('hex')}`;
    const now = Date.now();
    const expiresAt = now + (params.ttlMs || this.defaultTtlMs);

    // Deep clone sourceBlueprint to guarantee immutability
    const sourceBlueprint: BlueprintOutput = JSON.parse(JSON.stringify(params.sourceBlueprint));

    // Server independently computes canonical sourceFingerprint
    const sourceFingerprint = computeOutfitFingerprint({
      garmentId: sourceBlueprint.garmentId,
      palette: sourceBlueprint.remixProposal.palette,
      fabricId: sourceBlueprint.remixProposal.fabricId,
      lowerGarmentId: sourceBlueprint.remixProposal.lowerGarmentId,
      footwearId: sourceBlueprint.remixProposal.footwearId,
      accessoryIds: sourceBlueprint.remixProposal.accessoryIds,
      contextProps: sourceBlueprint.remixProposal.contextProps || [],
      occasion: params.context?.occasion,
      style: params.context?.style,
      traditionalRatio: params.context?.traditionalRatio,
      genderPresentation: params.context?.genderPresentation || 'nam'
    });

    const record: ActionRegistryRecord = {
      actionId,
      chatSessionId: params.chatSessionId,
      sourceBlueprint,
      sourceFingerprint,
      action: { ...params.action, actionId },
      createdAt: now,
      expiresAt,
      consumed: false,
      context: params.context ? { ...params.context } : undefined
    };

    this.records.set(actionId, record);
    return record;
  }

  public get(actionId: string): ActionRegistryRecord | null {
    this.purgeExpired();
    return this.records.get(actionId) || null;
  }

  /**
   * Applies the registered action deterministically on server.
   * Enforces session matching, unexpired TTL, unconsumed status, and fingerprint match.
   */
  public applyAction(params: MutateActionRequest): {
    status: number;
    code: string;
    message: string;
    data?: MutateActionResponse;
  } {
    const record = this.records.get(params.actionId);
    if (!record) {
      return {
        status: 404,
        code: 'ACTION_NOT_FOUND',
        message: 'Gợi ý này không tồn tại trong phiên làm việc hiện tại.'
      };
    }

    // 1. Session Isolation Guard
    if (record.chatSessionId !== params.chatSessionId) {
      return {
        status: 403,
        code: 'SESSION_MISMATCH',
        message: 'Phiên làm việc không khớp với gợi ý ban đầu.'
      };
    }

    // 2. TTL Expiration Guard
    if (Date.now() > record.expiresAt) {
      this.records.delete(params.actionId);
      return {
        status: 410,
        code: 'ACTION_EXPIRED',
        message: 'Gợi ý đã hết hạn lưu tạm. Vui lòng hỏi lại AC để nhận gợi ý mới.'
      };
    }

    this.purgeExpired();

    // 3. Consumed / Idempotency Guard
    if (record.consumed) {
      return {
        status: 409,
        code: 'ACTION_ALREADY_APPLIED',
        message: 'Gợi ý này đã được áp dụng trước đó.'
      };
    }

    // 4. Concurrency Guard: Client currentFingerprint must match sourceFingerprint exactly
    if (params.currentFingerprint !== record.sourceFingerprint) {
      return {
        status: 409,
        code: 'FINGERPRINT_CONFLICT',
        message: 'Bản phối đã thay đổi kể từ khi AC đưa ra gợi ý này. Gợi ý không còn tương thích.'
      };
    }

    // 5. Deterministic Apply: Produce nextBlueprint by cloning sourceBlueprint
    const nextBlueprint: BlueprintOutput = JSON.parse(JSON.stringify(record.sourceBlueprint));
    const act = record.action;

    if (act.type === 'SET_FOOTWEAR') {
      const validFootwear = FOOTWEAR.find(f => f.id === act.targetValue);
      if (!validFootwear) {
        return {
          status: 422,
          code: 'INVALID_ACTION_TARGET',
          message: `Giày dép "${act.targetValue}" không hợp lệ trong danh mục chuẩn.`
        };
      }
      nextBlueprint.remixProposal.footwearId = validFootwear.id;
    } else if (act.type === 'SET_FABRIC') {
      const validFabric = FABRICS.find(f => f.id === act.targetValue);
      if (!validFabric) {
        return {
          status: 422,
          code: 'INVALID_ACTION_TARGET',
          message: `Chất liệu "${act.targetValue}" không hợp lệ trong danh mục chuẩn.`
        };
      }
      nextBlueprint.remixProposal.fabricId = validFabric.id;
    } else if (act.type === 'ADD_ACCESSORY') {
      const validAcc = ACCESSORIES.find(a => a.id === act.targetValue);
      if (!validAcc) {
        return {
          status: 422,
          code: 'INVALID_ACTION_TARGET',
          message: `Phụ kiện "${act.targetValue}" không hợp lệ trong danh mục chuẩn.`
        };
      }

      // Check explicit-only rules for special accessories
      if (validAcc.id === 'quat_giay_tram_huong' && !isFanRequestedExplicitly(record.context?.promptText)) {
        return {
          status: 422,
          code: 'EXPLICIT_ONLY_VIOLATION',
          message: 'Quạt cầm tay là phụ kiện thuộc diện cần người dùng yêu cầu rõ ràng.'
        };
      }
      if (validAcc.id === 'chuoi_ngoc_trai_co' && !isPearlRequestedExplicitly(record.context?.promptText)) {
        return {
          status: 422,
          code: 'EXPLICIT_ONLY_VIOLATION',
          message: 'Vòng ngọc trai là phụ kiện đương đại thuộc diện cần người dùng yêu cầu rõ ràng.'
        };
      }

      const currentAccs = nextBlueprint.remixProposal.accessoryIds || [];
      if (!currentAccs.includes(validAcc.id)) {
        // Enforce maximum 2 accessories (consistent with Call B rules)
        const updatedAccs = [...currentAccs, validAcc.id].slice(-2);
        nextBlueprint.remixProposal.accessoryIds = updatedAccs;
      }
    } else if (act.type === 'SET_COLOR') {
      const validColor = PALETTES.find(p => p.id === act.targetValue);
      if (!validColor) {
        return {
          status: 422,
          code: 'INVALID_ACTION_TARGET',
          message: `Màu sắc "${act.targetValue}" không hợp lệ trong danh mục chuẩn.`
        };
      }

      const palette = nextBlueprint.remixProposal.palette || [];
      const primaryIdx = palette.findIndex(c => c.role === 'PRIMARY');
      if (primaryIdx !== -1) {
        palette[primaryIdx] = {
          id: validColor.id,
          hex: validColor.hex,
          name: validColor.name,
          role: 'PRIMARY',
          origin: 'AC_SUGGESTED'
        };
      } else if (palette.length > 0) {
        palette[0] = {
          id: validColor.id,
          hex: validColor.hex,
          name: validColor.name,
          role: 'PRIMARY',
          origin: 'AC_SUGGESTED'
        };
      }
      nextBlueprint.remixProposal.palette = palette;
    } else {
      return {
        status: 422,
        code: 'UNSUPPORTED_ACTION_TYPE',
        message: 'Loại thao tác không được hỗ trợ.'
      };
    }

    // 6. Compute new Fingerprint on Server
    const nextFingerprint = computeOutfitFingerprint({
      garmentId: nextBlueprint.garmentId,
      palette: nextBlueprint.remixProposal.palette,
      fabricId: nextBlueprint.remixProposal.fabricId,
      lowerGarmentId: nextBlueprint.remixProposal.lowerGarmentId,
      footwearId: nextBlueprint.remixProposal.footwearId,
      accessoryIds: nextBlueprint.remixProposal.accessoryIds,
      contextProps: nextBlueprint.remixProposal.contextProps || [],
      occasion: record.context?.occasion,
      style: record.context?.style,
      traditionalRatio: record.context?.traditionalRatio,
      genderPresentation: record.context?.genderPresentation || 'nam'
    });

    // Mark record consumed
    record.consumed = true;
    record.consumedAt = Date.now();

    return {
      status: 200,
      code: 'ACTION_APPLIED_SUCCESS',
      message: 'Áp dụng gợi ý thành công.',
      data: {
        nextBlueprint,
        nextFingerprint,
        actionId: record.actionId,
        action: record.action,
        notice: 'Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.'
      }
    };
  }

  /**
   * Clears all actions registered for a chatSessionId (e.g. during session reset or clear chat)
   */
  public clearSession(chatSessionId: string): void {
    for (const [id, rec] of this.records.entries()) {
      if (rec.chatSessionId === chatSessionId) {
        this.records.delete(id);
      }
    }
  }

  /**
   * Clears everything (for testing or full reset)
   */
  public clearAll(): void {
    this.records.clear();
  }

  public size(): number {
    this.purgeExpired();
    return this.records.size;
  }
}

export const globalActionRegistry = new EphemeralActionRegistry();
