/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2B: Ephemeral Image Store
 *
 * Requirements:
 * - Stores actual image Buffer in memory with TTL
 * - Essential preparation for Phase 2C: keeps real bytes accessible via generationId
 * - Default TTL: 15 minutes (900,000 ms)
 * - Automatic eviction of expired records
 * - Lookup by generationId (serving endpoint) and by outfitFingerprint (ephemeral cache reuse)
 */

import crypto from 'crypto';

export interface EphemeralImageRecord {
  generationId: string;
  outfitFingerprint: string;
  garmentId: string;
  bytes: Buffer;
  mimeType: string;
  createdAt: number;
  expiresAt: number;
  effectiveBlueprintSnapshot?: any;
  revisionIndex?: number;
  parentGenerationId?: string;
}

export interface EphemeralImageStore {
  put(record: EphemeralImageRecord): Promise<void>;
  get(generationId: string): Promise<EphemeralImageRecord | null>;
  getByFingerprint(outfitFingerprint: string): Promise<EphemeralImageRecord | null>;
  delete(generationId: string): Promise<void>;
}

export class MemoryEphemeralImageStore implements EphemeralImageStore {
  private records = new Map<string, EphemeralImageRecord>();
  private fingerprintIndex = new Map<string, string>(); // fingerprint -> generationId
  private defaultTtlMs: number;

  constructor(ttlMs?: number) {
    this.defaultTtlMs =
      ttlMs ||
      parseInt(process.env.IMAGE_EPHEMERAL_TTL_MS || '900000', 10); // 15 mins default
  }

  public getTtlMs(): number {
    return this.defaultTtlMs;
  }

  public async put(record: EphemeralImageRecord): Promise<void> {
    this.purgeExpired();
    this.records.set(record.generationId, record);
    this.fingerprintIndex.set(record.outfitFingerprint, record.generationId);
  }

  public async get(generationId: string): Promise<EphemeralImageRecord | null> {
    const record = this.records.get(generationId);
    if (!record) return null;
    return record;
  }

  public async getByFingerprint(outfitFingerprint: string): Promise<EphemeralImageRecord | null> {
    const generationId = this.fingerprintIndex.get(outfitFingerprint);
    if (!generationId) return null;

    return await this.get(generationId);
  }

  public async delete(generationId: string): Promise<void> {
    const record = this.records.get(generationId);
    if (record) {
      this.fingerprintIndex.delete(record.outfitFingerprint);
      this.records.delete(generationId);
    }
  }

  public purgeExpired(): void {
    // Non-auto-expiration requirement: active lookbook records do not expire by time.
  }

  public createRecord(
    outfitFingerprint: string,
    garmentId: string,
    bytes: Buffer,
    mimeType: string,
    snapshot?: any,
    revisionIndex?: number,
    parentGenerationId?: string
  ): EphemeralImageRecord {
    const now = Date.now();
    return {
      generationId: crypto.randomUUID(),
      outfitFingerprint,
      garmentId,
      bytes,
      mimeType,
      createdAt: now,
      expiresAt: Number.MAX_SAFE_INTEGER,
      effectiveBlueprintSnapshot: snapshot,
      revisionIndex: typeof revisionIndex === 'number' ? revisionIndex : 0,
      parentGenerationId
    };
  }

  public clear(): void {
    this.records.clear();
    this.fingerprintIndex.clear();
  }
}

// Export singleton instance for server runtime
export const ephemeralImageStore = new MemoryEphemeralImageStore();
