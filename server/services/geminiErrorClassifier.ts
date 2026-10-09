/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2A.5: Structured Gemini Error Classifier & Taxonomy
 */

export type ErrorSeverity = 'FAIL_FAST' | 'FALLBACK_CANDIDATE' | 'RETRY_SAME_MODEL';

export type ErrorCategory =
  | 'MODEL_SCOPED_QUOTA'
  | 'PROJECT_SCOPED_QUOTA'
  | 'UNKNOWN_QUOTA'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT_OR_NETWORK'
  | 'MALFORMED_OUTPUT'
  | 'INVALID_REQUEST'
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED_PROJECT'
  | 'PERMISSION_DENIED_MODEL'
  | 'MODEL_NOT_FOUND'
  | 'SAFETY_REJECTION'
  | 'GENERIC_INFERENCE_ERROR';

export type QuotaScope = 'MODEL_SCOPED' | 'PROJECT_SCOPED' | 'UNKNOWN';

export interface StructuredQuotaDiagnostics {
  scope: QuotaScope;
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: string;
  dimensions?: Record<string, string>;
  subject?: string;
  retryDelayStr?: string;
  providerRetryAfterSeconds?: number;
  isDailyQuota: boolean;
  project?: string;
}

export interface ClassifiedGeminiError {
  status: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  modelId?: string;
  retryable: boolean;
  providerRetryAfterSeconds?: number;
  suggestedCooldownMs: number;
  quotaDiagnostics?: StructuredQuotaDiagnostics;
  rawError: any;
}

export const ROUTER_CONFIG = {
  shortRateLimitFallbackMs: 60 * 1000, // 60s for RPM/short limits
  dailyQuotaFallbackMs: 24 * 60 * 60 * 1000, // 24h fallback if provider doesn't specify delay
  serviceUnavailableCooldownMs: 30 * 1000, // 30s base for 503
  baseLocalBackoffMs: 30 * 1000, // 30s base backoff (30s -> 60s -> 120s -> 240s -> 300s max)
  maxLocalBackoffMs: 300 * 1000, // 300s max local backoff
  callADeadlineMs: 10 * 1000, // 10s overall route deadline for Call A
  callBDeadlineMs: 16 * 1000, // 16s overall route deadline for Call B (safely below external transport ceiling)
  callCDeadlineMs: 16 * 1000, // 16s overall route deadline for Call C (VISUAL_QA - safely below external proxy ceiling)
  callACandidateTimeoutCapMs: 8 * 1000, // 8s candidate timeout cap for Call A
  callBCandidateTimeoutCapMs: 14 * 1000, // 14s candidate timeout cap for Call B (increased from 8s)
  callCCandidateTimeoutCapMs: 9500, // 9.5s candidate timeout cap for Call C (VISUAL_QA - gives vision model sufficient time)
  minCandidateTimeoutMs: 1500, // 1.5s minimum budget required to start a candidate
  routeDeadlineSafetyMarginMs: 250, // 250ms internal safety margin between candidate timeout and global route deadline
  schemaRepairAttempts: 1 // max 1 repair attempt on schema/malformed JSON
};

export function parseSecondsFromDelayString(delayStr: string): number | null {
  if (!delayStr) return null;
  const lower = delayStr.trim().toLowerCase();
  const match = lower.match(/([0-9.]+)\s*([a-z]+)?/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  if (isNaN(val) || val <= 0) return null;
  const unit = match[2] || 's';
  if (unit.startsWith('h')) {
    return Math.ceil(val * 3600);
  }
  if (unit.startsWith('m') && !unit.startsWith('ms')) {
    return Math.ceil(val * 60);
  }
  return Math.ceil(val);
}

/**
 * Inspect error in strict order:
 * 1. HTTP status
 * 2. Google RPC details
 * 3. QuotaFailure
 * 4. RetryInfo
 * 5. Retry-After header
 * 6. Model/provider-specific details
 * 7. Fallback regex as last resort
 */
export function classifyGeminiError(error: any, currentModelId?: string): ClassifiedGeminiError {
  const errStr = error?.message || (typeof error === 'string' ? error : String(error));
  const errStrLower = errStr.toLowerCase();

  // 1. Determine HTTP status
  let status = 500;
  if (typeof error?.status === 'number') {
    status = error.status;
  } else if (typeof error?.statusCode === 'number') {
    status = error.statusCode;
  } else if (typeof error?.response?.status === 'number') {
    status = error.response.status;
  } else if (errStrLower.includes('429')) {
    status = 429;
  } else if (errStrLower.includes('503')) {
    status = 503;
  } else if (errStrLower.includes('400')) {
    status = 400;
  } else if (errStrLower.includes('401')) {
    status = 401;
  } else if (errStrLower.includes('403')) {
    status = 403;
  } else if (errStrLower.includes('404')) {
    status = 404;
  }

  // 2. Extract structured details list
  const detailsList: any[] = [];
  if (Array.isArray(error?.details)) detailsList.push(...error.details);
  if (Array.isArray(error?.statusDetails)) detailsList.push(...error.statusDetails);
  if (Array.isArray(error?.response?.data?.error?.details)) {
    detailsList.push(...error.response.data.error.details);
  }

  // Try parsing embedded JSON if detailsList is empty
  if (detailsList.length === 0) {
    try {
      const jsonMatch = errStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const inner = parsed.error || parsed;
        if (Array.isArray(inner.details)) {
          detailsList.push(...inner.details);
        }
      }
    } catch (_) {}
  }

  // Check Retry-After header
  const retryAfterHeader =
    error?.response?.headers?.['retry-after'] ||
    error?.headers?.['retry-after'] ||
    (typeof error?.getResponseHeader === 'function' ? error.getResponseHeader('retry-after') : null);

  let providerRetryDelayStr: string | undefined = undefined;
  if (retryAfterHeader) {
    providerRetryDelayStr = typeof retryAfterHeader === 'number' ? `${retryAfterHeader}s` : String(retryAfterHeader);
  }

  // Inspect QuotaFailure violations & RetryInfo
  let quotaMetric: string | undefined;
  let quotaId: string | undefined;
  let quotaValue: string | undefined;
  let quotaSubject: string | undefined;
  let quotaDimensions: Record<string, string> | undefined;

  for (const d of detailsList) {
    if (d['@type']?.includes('QuotaFailure') && Array.isArray(d.violations)) {
      for (const v of d.violations) {
        if (v.subject) quotaSubject = v.subject;
        if (v.description) {
          const metricMatch = v.description.match(/quota metric ['"]([^'"]+)['"]/i);
          if (metricMatch) quotaMetric = metricMatch[1];
          const limitMatch = v.description.match(/limit ['"]([^'"]+)['"]/i);
          if (limitMatch) quotaId = limitMatch[1];
          const valMatch = v.description.match(/value ['"]?([^'",\s]+)['"]?/i);
          if (valMatch) quotaValue = valMatch[1];
        }
        if (v.dimensions && typeof v.dimensions === 'object') {
          quotaDimensions = v.dimensions;
        }
      }
    }
    if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
      providerRetryDelayStr = d.retryDelay;
    }
  }

  // Fallback regex extraction if structured not present
  if (!providerRetryDelayStr) {
    const retryDelayMatch = errStr.match(/retry[_\s-]*delay["':\s]+([0-9.]+s?)/i);
    if (retryDelayMatch) providerRetryDelayStr = retryDelayMatch[1];
  }
  if (!quotaMetric) {
    const metricMatch = errStr.match(/quota metric ['"]([^'"]+)['"]/i);
    if (metricMatch) quotaMetric = metricMatch[1];
  }
  if (!quotaId) {
    const limitMatch = errStr.match(/limit ['"]([^'"]+)['"]/i);
    if (limitMatch) quotaId = limitMatch[1];
  }

  const providerRetryAfterSeconds = providerRetryDelayStr
    ? parseSecondsFromDelayString(providerRetryDelayStr) ?? undefined
    : undefined;

  // ==========================================
  // CLASSIFICATION RULES
  // ==========================================

  // 1. SAFETY REJECTION: Fail-fast, strictly NO fallback to circumvent safety (Requirement 15)
  if (
    errStrLower.includes('safety') ||
    errStrLower.includes('blocked by safety') ||
    errStrLower.includes('finishreason: safety') ||
    error?.finishReason === 'SAFETY' ||
    error?.candidates?.[0]?.finishReason === 'SAFETY'
  ) {
    return {
      status: 400,
      category: 'SAFETY_REJECTION',
      severity: 'FAIL_FAST',
      message: 'Nội dung yêu cầu bị từ chối bởi chính sách an toàn của mô hình.',
      modelId: currentModelId,
      retryable: false,
      suggestedCooldownMs: 0,
      rawError: error
    };
  }

  // 2. HTTP 400 / INVALID APPLICATION REQUEST: Fail-fast, no model fallback (Requirement 12)
  if (
    status === 400 &&
    !errStrLower.includes('safety') &&
    !errStrLower.includes('quota') &&
    !errStrLower.includes('rate limit')
  ) {
    return {
      status: 400,
      category: 'INVALID_REQUEST',
      severity: 'FAIL_FAST',
      message: 'Yêu cầu không hợp lệ hoặc tham số đầu vào sai quy cách.',
      modelId: currentModelId,
      retryable: false,
      suggestedCooldownMs: 0,
      rawError: error
    };
  }

  // 3. HTTP 401 / UNAUTHENTICATED: Fail-fast whole router (Requirement 13)
  if (
    status === 401 ||
    errStrLower.includes('unauthenticated') ||
    errStrLower.includes('api_key_invalid') ||
    errStrLower.includes('invalid api key')
  ) {
    return {
      status: 401,
      category: 'UNAUTHENTICATED',
      severity: 'FAIL_FAST',
      message: 'Khóa API Gemini chưa hợp lệ hoặc thiếu quyền xác thực.',
      modelId: currentModelId,
      retryable: false,
      suggestedCooldownMs: 0,
      rawError: error
    };
  }

  // 4. HTTP 404 / MODEL NOT FOUND / DEPRECATED: Disable candidate runtime, fallback (Requirement 14)
  if (
    status === 404 ||
    errStrLower.includes('not found') ||
    errStrLower.includes('is not found') ||
    errStrLower.includes('unknown model') ||
    errStrLower.includes('does not exist') ||
    errStrLower.includes('deprecated')
  ) {
    return {
      status: 404,
      category: 'MODEL_NOT_FOUND',
      severity: 'FALLBACK_CANDIDATE',
      message: `Mô hình ${currentModelId || ''} không khả dụng hoặc đã ngừng cung cấp.`,
      modelId: currentModelId,
      retryable: false,
      suggestedCooldownMs: Infinity, // disable permanently for runtime
      rawError: error
    };
  }

  // 5. HTTP 403 / PERMISSION DENIED: Distinguish project-wide vs model-specific (Requirement 13)
  if (status === 403 || errStrLower.includes('permission_denied') || errStrLower.includes('forbidden')) {
    const isModelSpecific =
      errStrLower.includes('not supported') ||
      errStrLower.includes('model not entitled') ||
      errStrLower.includes('not enabled for this model') ||
      errStrLower.includes('access to model') ||
      (currentModelId && errStrLower.includes(currentModelId.toLowerCase()));

    if (isModelSpecific) {
      return {
        status: 403,
        category: 'PERMISSION_DENIED_MODEL',
        severity: 'FALLBACK_CANDIDATE',
        message: `Mô hình ${currentModelId || ''} không được cấp quyền trên project này.`,
        modelId: currentModelId,
        retryable: false,
        suggestedCooldownMs: Infinity, // disable for runtime
        rawError: error
      };
    }

    return {
      status: 403,
      category: 'PERMISSION_DENIED_PROJECT',
      severity: 'FAIL_FAST',
      message: 'Project không có quyền truy cập dịch vụ Gemini hoặc tài khoản bị giới hạn.',
      modelId: currentModelId,
      retryable: false,
      suggestedCooldownMs: 0,
      rawError: error
    };
  }

  // 6. HTTP 429 / RESOURCE_EXHAUSTED / QUOTA EXHAUSTED: Distinguish scope (Requirement 6, 7, 8)
  if (
    status === 429 ||
    errStrLower.includes('resource_exhausted') ||
    errStrLower.includes('quota') ||
    errStrLower.includes('rate limit')
  ) {
    // Determine scope
    let scope: QuotaScope = 'UNKNOWN';
    const isDaily =
      (quotaId && /day|daily|rpd/i.test(quotaId)) ||
      (quotaMetric && /day|daily|rpd/i.test(quotaMetric)) ||
      errStrLower.includes('per day') ||
      errStrLower.includes('daily') ||
      errStrLower.includes('20 requests/day') ||
      (providerRetryAfterSeconds && providerRetryAfterSeconds > 3600);

    const hasModelDimension =
      Boolean(quotaDimensions?.model) ||
      (quotaMetric && currentModelId && quotaMetric.toLowerCase().includes(currentModelId.toLowerCase())) ||
      (quotaSubject && currentModelId && quotaSubject.toLowerCase().includes(currentModelId.toLowerCase())) ||
      errStrLower.includes('per_model') ||
      errStrLower.includes('models/');

    const hasProjectIndicator =
      Boolean(quotaSubject && !quotaDimensions?.model && quotaSubject.startsWith('projects/')) ||
      errStrLower.includes('project billing') ||
      errStrLower.includes('project quota') ||
      errStrLower.includes('global project limit');

    if (hasModelDimension) {
      scope = 'MODEL_SCOPED';
    } else if (hasProjectIndicator && !hasModelDimension) {
      scope = 'PROJECT_SCOPED';
    } else {
      // Free-tier per-model limit or default conservative
      scope = 'MODEL_SCOPED';
    }

    const quotaDiagnostics: StructuredQuotaDiagnostics = {
      scope,
      quotaMetric,
      quotaId,
      quotaValue,
      subject: quotaSubject,
      retryDelayStr: providerRetryDelayStr,
      providerRetryAfterSeconds,
      isDailyQuota: Boolean(isDaily),
      project: error?.project || (quotaSubject?.match(/projects\/(\d+)/)?.[1] ?? undefined)
    };

    if (scope === 'PROJECT_SCOPED') {
      return {
        status: 429,
        category: 'PROJECT_SCOPED_QUOTA',
        severity: 'FAIL_FAST',
        message: 'Hạn mức toàn dự án đã đạt giới hạn. Vui lòng thử lại sau.',
        modelId: currentModelId,
        retryable: false,
        providerRetryAfterSeconds,
        suggestedCooldownMs: providerRetryAfterSeconds
          ? providerRetryAfterSeconds * 1000
          : ROUTER_CONFIG.dailyQuotaFallbackMs,
        quotaDiagnostics,
        rawError: error
      };
    }

    const suggestedCooldownMs = providerRetryAfterSeconds
      ? providerRetryAfterSeconds * 1000
      : isDaily
      ? ROUTER_CONFIG.dailyQuotaFallbackMs
      : ROUTER_CONFIG.shortRateLimitFallbackMs;

    return {
      status: 429,
      category: 'MODEL_SCOPED_QUOTA',
      severity: 'FALLBACK_CANDIDATE',
      message: `Hạn mức của mô hình ${currentModelId || ''} đã đạt giới hạn. Đang chuyển sang ứng viên thay thế.`,
      modelId: currentModelId,
      retryable: false,
      providerRetryAfterSeconds,
      suggestedCooldownMs,
      quotaDiagnostics,
      rawError: error
    };
  }

  // 7. HTTP 503 / SERVICE UNAVAILABLE: High demand (Requirement 9)
  if (
    status === 503 ||
    errStrLower.includes('unavailable') ||
    errStrLower.includes('high demand') ||
    errStrLower.includes('overloaded')
  ) {
    return {
      status: 503,
      category: 'SERVICE_UNAVAILABLE',
      severity: 'FALLBACK_CANDIDATE',
      message: 'Mô hình đang chịu tải cao trong khoảnh khắc này.',
      modelId: currentModelId,
      retryable: true,
      suggestedCooldownMs: ROUTER_CONFIG.serviceUnavailableCooldownMs,
      rawError: error
    };
  }

  // 8. TIMEOUT / TRANSIENT NETWORK (Requirement 10)
  if (
    errStrLower.includes('timeout') ||
    errStrLower.includes('econnreset') ||
    errStrLower.includes('etimedout') ||
    errStrLower.includes('socket hang up') ||
    errStrLower.includes('network error')
  ) {
    return {
      status: 504,
      category: 'TIMEOUT_OR_NETWORK',
      severity: 'FALLBACK_CANDIDATE',
      message: 'Kết nối mạng tới nhà cung cấp bị gián đoạn.',
      modelId: currentModelId,
      retryable: true,
      suggestedCooldownMs: ROUTER_CONFIG.serviceUnavailableCooldownMs,
      rawError: error
    };
  }

  // 9. MALFORMED OUTPUT (Requirement 11)
  if (
    error?.category === 'MALFORMED_OUTPUT' ||
    errStrLower.includes('syntaxerror') ||
    errStrLower.includes('invalid json') ||
    errStrLower.includes('schema') ||
    errStrLower.includes('unexpected token') ||
    errStrLower.includes('malformed')
  ) {
    return {
      status: 502,
      category: 'MALFORMED_OUTPUT',
      severity: 'FALLBACK_CANDIDATE',
      message: 'Mô hình trả về định dạng chưa khớp với lược đồ chuẩn.',
      modelId: currentModelId,
      retryable: false,
      suggestedCooldownMs: 15 * 1000,
      rawError: error
    };
  }

  // Default Generic Error
  return {
    status: status || 500,
    category: 'GENERIC_INFERENCE_ERROR',
    severity: 'FALLBACK_CANDIDATE',
    message: 'Không thể khởi tạo suy luận thời trang từ mô hình lúc này.',
    modelId: currentModelId,
    retryable: true,
    suggestedCooldownMs: 30 * 1000,
    rawError: error
  };
}
