# AC — Revised Implementation Plan: Lookbook Persistence & Tay Chẽn Refinement Precision

This revised implementation plan addresses two critical production issues in detail:
1. **Lookbook Image Non-Auto-Expiration**: Removing all server-side and client-side time-based expiration (TTL) for active Lookbook images while ensuring atomic replacement on successful new generations and explicit clearing on canonical reset.
2. **Tay Chẽn Refinement False Positives & Sleeve Geometry**: Fixing refinement text classification so that negative/preservation expressions (e.g. "không được xóa tay chẽn", "nới rộng ống tay một chút") are correctly recognized as safe ease adjustments rather than structural contradictions, while updating visual prompt compilation and QA to allow comfortable sleeve ease without demanding compression-fit geometry.

---

## 1. Root Cause — Image Expiration

- **Server-Side Expiration**: `server/services/ephemeralImageStore.ts` implements a default TTL of 15 minutes (`900,000 ms`) via `expiresAt`. When `get()` is called after 15 minutes or when `purgeExpired()` runs, records are evicted, causing serving routes to return 404 or missing image errors.
- **Client-Side Idle Session Expiration**: `src/services/idleSessionManager.ts` and `src/App.tsx` enforce a 15-minute idle session reset threshold (`resetThresholdMs = 900,000`), which triggers a destructive canonical reset clearing session state and images.
- **Trigger of Expiration Notice**: In `Section3Lookbook.tsx` or image display components, a missing image record or session reset state surfaces the message: *"Ảnh minh họa trước đã hết thời hạn lưu tạm"*.

---

## 2. Current Image Lifecycle

1. **Generate**: User commits blueprint → Call A & Call B execute → `/api/generate-lookbook` runs → Image generated via Gemini image provider → Stored in `EphemeralImageStore` with `expiresAt = Date.now() + 900000` (15 min TTL).
2. **Store**: Held in memory in `MemoryEphemeralImageStore` keyed by `generationId` and indexed by `outfitFingerprint`.
3. **Serve**: `/api/lookbook-image/:generationId` retrieves from `ephemeralImageStore`. If expired (`Date.now() > record.expiresAt`), returns 404.
4. **Active State**: Client holds `activeImage` URL/generationId.
5. **Replace / Revision**: When a new generation or revision succeeds, it replaces `activeImage`. If it fails, previous state behavior depended on error handling.
6. **Reset / Expiry**: 15-minute TTL eviction or idle session timeout clears records and active images.

---

## 3. Proposed Image-Lifetime Change

- **Server-Side Changes**:
  - Remove time-based TTL expiration from `MemoryEphemeralImageStore` (`expiresAt` set to infinity or TTL checks disabled for active records).
  - Retain records in memory indefinitely across the session until explicit deletion (`delete()`), clear (`clear()`), or server process restart.
- **Client-Side Changes**:
  - Disable idle-session destructive reset or decouple idle warnings from purging generated Lookbook images, ensuring the active Lookbook image persists until explicit canonical reset ("Bắt đầu lại") or successful replacement.
- **Atomic Replacement Semantics**:
  - A new generation request starts in loading state while keeping the previous `activeImage` visible on screen.
  - Upon successful generation (`200 OK` with valid image bytes/URL), atomically replace `activeImage`.
  - Upon failure (timeout, network error, 502/503), retain `activeImage` unchanged, present a precise Vietnamese error notification, and enable direct retry without incrementing revision numbers or creating N+1 duplicate states.
- **Server Restart / Redeploy Limitation**:
  - In-memory storage (`MemoryEphemeralImageStore`) naturally resets on server process restart/redeploy. This is standard and expected for ephemeral container environments without proposing permanent database/cloud persistence.

---

## 4. Root Cause — Tay Chẽn False Positive

- **Current Code (`src/shared/refinementClassifier.ts`)**:
  - Uses naive regex checks such as `/(tay\s*thụng|tay\s*rộng|xóa\s*tay\s*chẽn|bỏ\s*tay\s*chẽn|mở\s*rộng\s*ống\s*tay)/i`.
  - When the user inputs: `"nới rộng ống tay nhưng hãy cẩn thận không được xóa tay chẽn của tôi"`, the regex matches `"mở rộng ống tay"` and `"xóa tay chẽn"` (ignoring the preceding negation `"không được"`), incorrectly classifying the request as a `STRUCTURAL_CONTRADICTION`.

---

## 5. Proposed Refinement-Classifier Design

- **Negation & Preservation Analysis**:
  - Before running structural contradiction regexes, the classifier must scan for negation prefixes (e.g., `không được`, `đừng`, `không`, `nhưng giữ nguyên`, `vẫn giữ`) immediately preceding or enclosing protected terms.
  - If the user explicitly asks to preserve or states "không được xóa tay chẽn", treat it as a preservation instruction rather than a contradiction.
- **Classification Categories**:
  1. **Explicit Destructive Mutation**: Requests to actively remove or replace core structured traits (e.g., "bỏ tay chẽn", "đổi thành tay thụng", "xóa cổ áo").
  2. **Negated / Preservation Intent**: Statements safeguarding traits (e.g., "không được xóa tay chẽn", "giữ nguyên tay chẽn"), which must be allowed as `IMAGE_ONLY_ALLOWED`.
  3. **Safe Fit / Ease Adjustment**: Requests for comfort and natural ease inside canonical geometry (e.g., "nới rộng ống tay một chút", "cho phần bắp tay thoải mái hơn", "đừng làm tay áo bó sát"), which must be allowed as `IMAGE_ONLY_ALLOWED`.
  4. **Genuine Structural Contradiction**: True violations like converting Áo tấc into Áo chẽn or removing the standing collar.

---

## 6. Visual Prompt / QA Alignment

- **Sleeve Geometry Definition**:
  - Update prompt templates in `server/services/visualPromptCompiler.ts` and canonical specs to replace overly restrictive terms like `"tight sleeves"` or `"compression fit"` with the shared semantic target:
    *"Natural ease through the shoulder, upper arm and elbow, then progressively tapering toward a neat wrist."*
- **Visual QA Rules (`server/services/visualQAAggregator.ts`)**:
  - Visual QA must assess canonical taper and neat wrist without requiring the entire sleeve to be skin-tight. Moderate sleeve ease is valid `PASS`.

---

## 7. Deterministic Test Plan

Explicit test suite expansion (Tests 50–70+):
- Lookbook image survives beyond 15-minute simulated elapsed time.
- Server memory store does not expire active image by time.
- Idle timeout does not destructively purge active lookbook image without explicit reset.
- Explicit Reset ("Bắt đầu lại") clears lookbook images.
- Successful replacement atomically replaces old image.
- Failed replacement (timeout / 502 / network error) preserves old image.
- Failed revision preserves parent image and allows direct retry without N+1.
- `"nới rộng ống tay một chút"` => `IMAGE_ONLY_ALLOWED` (ALLOWED)
- `"tay áo đang bó quá, làm rộng hơn một chút"` => `IMAGE_ONLY_ALLOWED` (ALLOWED)
- `"nới phần tay nhưng vẫn giữ tay chẽn"` => `IMAGE_ONLY_ALLOWED` (ALLOWED)
- `"không được xóa tay chẽn của tôi"` => `IMAGE_ONLY_ALLOWED` (ALLOWED)
- Exact user sentence `"nới rộng ống tay một chút nhưng hãy cẩn thận không được xóa tay chẽn của tôi"` => `IMAGE_ONLY_ALLOWED` (ALLOWED)
- `"đổi tay chẽn thành tay thụng"` => `STRUCTURAL_CONTRADICTION`
- `"bỏ tay chẽn"` => `STRUCTURAL_CONTRADICTION`
- Straight untapered sleeve request => `STRUCTURAL_CONTRADICTION`
- Visual prompt compiler uses natural ease + progressive taper.
- Visual QA accepts moderate sleeve ease.

---

## 8. Risks / Side Effects

- **Memory Usage**: Storing image buffers in `MemoryEphemeralImageStore` without time-based eviction increases memory consumption over a long session. However, since the MVP runs single-user sessions per browser instance, this is acceptable and required to prevent auto-expiration.

---

## 9. Exact Files Expected To Change

1. `server/services/ephemeralImageStore.ts` (Remove time-based TTL eviction / expiration checks for active records)
2. `src/services/idleSessionManager.ts` & `src/App.tsx` (Ensure idle timeout / session reset preserves lookbook image unless explicit reset is triggered)
3. `src/shared/refinementClassifier.ts` (Implement negation and preservation intent parsing for refinement inputs)
4. `server/services/visualPromptCompiler.ts` (Update sleeve ease & progressive taper phrasing)
5. `server/services/visualQAAggregator.ts` (Align visual QA tolerance for sleeve ease)
6. Test suite files (Add tests verifying lookbook persistence and refinement classification for negative intents).

---

## 10. Recommended Implementation Order

1. **Step 1**: Update `ephemeralImageStore.ts` to remove TTL eviction for active records.
2. **Step 2**: Update `refinementClassifier.ts` with negation-aware pattern matching for `tay chẽn` and ease adjustments.
3. **Step 3**: Update `visualPromptCompiler.ts` and `visualQAAggregator.ts` for natural sleeve ease and progressive taper.
4. **Step 4**: Run test suites (`npx tsx tests/...`) and verify build/typecheck.

---

## 11. Open Questions

None. All constraints and invariants are fully resolved by project constitution and user specifications.

---

## 12. Git Operations

**NONE.** No git operations will be executed.
