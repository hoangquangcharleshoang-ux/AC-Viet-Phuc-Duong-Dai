/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Persistent Model-Scoped Quota Quarantine Service
 */

import fs from 'fs';
import path from 'path';

const QUARANTINE_FILE = path.resolve(process.cwd(), '.quota_quarantine.json');

export interface QuotaBlockRecord {
  modelId: string;
  blockedUntil: number;
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: string;
  dimensions?: Record<string, string>;
  retryAfterSeconds?: number;
  updatedAt: string;
}

export function loadQuotaBlocks(): Record<string, QuotaBlockRecord> {
  try {
    if (fs.existsSync(QUARANTINE_FILE)) {
      const content = fs.readFileSync(QUARANTINE_FILE, 'utf8');
      const data = JSON.parse(content);
      const now = Date.now();
      const active: Record<string, QuotaBlockRecord> = {};
      for (const [mId, rec] of Object.entries(data as Record<string, QuotaBlockRecord>)) {
        if (rec && typeof rec.blockedUntil === 'number' && rec.blockedUntil > now) {
          active[mId] = rec;
        }
      }
      return active;
    }
  } catch (err) {
    console.warn('[QuotaQuarantine] Failed to load quarantine file:', err);
  }
  return {};
}

export function saveQuotaBlock(record: QuotaBlockRecord): void {
  try {
    const current = loadQuotaBlocks();
    current[record.modelId] = record;
    fs.writeFileSync(QUARANTINE_FILE, JSON.stringify(current, null, 2), 'utf8');
    console.log(`[QuotaQuarantine] Persisted quota block for model ${record.modelId} until ${new Date(record.blockedUntil).toISOString()}`);
  } catch (err) {
    console.warn('[QuotaQuarantine] Failed to save quarantine file:', err);
  }
}

export function isModelQuotaBlocked(modelId: string): boolean {
  const current = loadQuotaBlocks();
  const rec = current[modelId];
  if (rec && rec.blockedUntil > Date.now()) {
    return true;
  }
  return false;
}

export function clearModelQuotaBlock(modelId: string): void {
  try {
    const current = loadQuotaBlocks();
    if (current[modelId]) {
      delete current[modelId];
      fs.writeFileSync(QUARANTINE_FILE, JSON.stringify(current, null, 2), 'utf8');
      console.log(`[QuotaQuarantine] Cleared quota block for model ${modelId}`);
    }
  } catch (err) {
    console.warn('[QuotaQuarantine] Failed to clear quota block for model:', err);
  }
}

export function clearQuotaBlocks(): void {
  try {
    if (fs.existsSync(QUARANTINE_FILE)) {
      fs.writeFileSync(QUARANTINE_FILE, JSON.stringify({}, null, 2), 'utf8');
      console.log('[QuotaQuarantine] Cleared all quota blocks from quarantine file');
    }
  } catch (err) {
    console.warn('[QuotaQuarantine] Failed to clear quarantine file:', err);
  }
}
