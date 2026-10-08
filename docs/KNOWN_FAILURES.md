# Known Failures & Regression Guardrails

Purpose: preserve lessons from live failures so future coding agents do not reintroduce them.

A green automated suite does not erase a live failure history. If code touches one of these invariants, retain or strengthen regression coverage.

## KF-001 — API route returned HTML with HTTP 200

**Symptom:** client attempted JSON parsing but received the preview/SPA HTML shell.

**Observed cause:** the outer preview/proxy could respond before the backend finished a long fallback path.

**Fixed invariant:**

- JSON clients validate HTTP status,
- validate `Content-Type`,
- validate the AC canonical response marker,
- never raw-parse an unknown 200 body.

**Do not reintroduce:** direct `response.json()` without transport validation.

---

## KF-002 — Female root exploration generated a male wearer

**Symptom:** root context was `Nữ`, but an exploration image became male.

**Root causes found:**

- exploration visualization omitted `genderPresentation`,
- `/api/generate-lookbook` did not propagate wearer presentation correctly,
- prompt compilation fell back to `nam`,
- branch fingerprint/current lineage state was not fully updated.

**Fixed invariant:** explicit wearer presentation is part of branch result, snapshot, fingerprint, and visual prompt.

**Do not reintroduce:** a generic `|| 'nam'` fallback on a path that already has explicit committed wearer context.

---

## KF-003 — Exploration appeared before root image

**Symptom:** "Khám phá thêm" rendered immediately after Blueprint, before V0.

**Cause:** UI gating was tied to Blueprint availability instead of current root-V0 existence.

**Fixed invariant:** Guided Exploration renders only when a valid root V0 exists for the current committed Blueprint/fingerprint, and it appears below the image/Stylist stage.

**Do not reintroduce:** `blueprintExists` as the sole exploration gate.

---

## KF-004 — QA said "1 cần chỉnh" but had no correction

**Symptom:** summary reported one item needing correction while UI also said there was nothing to correct.

**Cause:** non-PASS/advisory count was conflated with actionable correction count.

**Fixed invariant:**

- `passedCount`
- `attentionCount`
- `actionableCount`

must remain semantically distinct.

`actionableCount === correctionPlan.actionableDeltas.length`

**Do not reintroduce:** a generic `issueCount` used for both advisory UI and correction CTA.

---

## KF-005 — Slim sleeve was over-confidently passed as tay chẽn

**Symptom:** a generic slim/tubular modern-looking sleeve was marked as canonical tay-chẽn PASS.

**Cause:** visual cues were too permissive. A later patch also incorrectly attempted to normalize genuine sleeve FAIL results to PARTIAL.

**Fixed invariant:**

- narrow/slim/tubular appearance alone is not proof of canonical taper geometry,
- insufficient geometric evidence → PARTIAL or NOT_ASSESSABLE,
- clear contradiction may remain FAIL,
- aggregator must not globally force sleeve FAIL → PARTIAL.

**Do not reintroduce:** deterministic "rescue" logic that changes a genuine contradiction to make cultural verdicts less severe.

---

## KF-006 — Idle reset did not fire

**Symptom:** app could remain untouched for more than five minutes without warning/reset.

**Correction:** idle management was connected to app lifecycle and canonical reset flow.

**Fixed invariant:**

- 2m30 true user inactivity → warning,
- 3m00 → canonical reset,
- user pointer/touch/keyboard/scroll resets timer,
- provider responses/renders/logging do not count as user activity,
- destructive reset is deferred safely during meaningful in-flight work.

**Do not reintroduce:** background/system events as "user activity".

---

## KF-007 — Stronger Gemini fallbacks wasted runtime quota for A/B

**Symptom:** structured recommendation/Blueprint tasks could fan out into stronger Flash models, increasing latency and consuming scarce quota.

**Fixed invariant:**

- RECOMMENDATION → `gemini-3.5-flash-lite` only
- BLUEPRINT → `gemini-3.5-flash-lite` only
- EXPLORATION → `gemini-3.5-flash-lite` only

Provider failure stops with typed error and explicit retry.

**Do not reintroduce:** automatic stronger-model fallback for these three tasks.

---

## KF-008 — Branch operations retained root fingerprint/state

**Symptom:** later lineage operations could point to the root fingerprint after visualizing an exploration result.

**Cause:** current outfit fingerprint was not consistently moved to the exploration result's fingerprint.

**Fixed invariant:** every lineage operation uses that lineage's own fingerprint and GenerationSnapshot.

**Do not reintroduce:** deriving branch generation identity from mutable root state.

---

## KF-009 — Runtime quota file was tracked by Git

**Symptom:** `.quota_quarantine.json` appeared in the repository.

**Risk:** runtime/session state could be mistaken for configuration and create noisy commits.

**Fixed invariant:** `.quota_quarantine.json` is in `.gitignore` and is not source-controlled.

---

## KF-010 — Handheld fan incorrectly auto-selected without explicit user request

**Symptom:** Male Áo tấc in traditional/ceremonial context without requesting a fan received "Quạt giấy nan tre hương trầm" in Blueprint and generated image.

**Cause:** `getPolicyCompatibleAccessories` allowed `quat_giay_tram_huong` whenever `traditionalRatio <= 59` or when prompt requested it (logical `||`), allowing the traditionality threshold alone to unlock the fan without an explicit user request. In addition, fallback blueprint logic had hardcoded the fan for traditional Áo tấc.

**Fixed invariant:** Handheld fan is `EXPLICIT_ONLY`. If `fanRequestedExplicitly` is false, handheld fan MUST NOT be present in compatible accessory candidates, model must not receive it, and `sanitizeBlueprintWithPolicy` strips it if returned. Only explicit user prompt requests ("quạt", "fan") in policy-compatible contemporary/editorial contexts (`traditionalRatio <= 59`, branch not `MORE_TRADITIONAL`) may unlock the fan.

**Do not reintroduce:** allowing handheld fan based on traditionality threshold or aesthetic fitness without explicit user request.

---

## Regression discipline

When touching a known-failure area:

1. cite the relevant KF identifier in the implementation report,
2. keep/add deterministic coverage for the invariant,
3. verify neighboring stable behavior,
4. if the original failure was found live, perform a live verification before marking it closed again.

Do not delete a known-failure entry simply because the current implementation passes.
