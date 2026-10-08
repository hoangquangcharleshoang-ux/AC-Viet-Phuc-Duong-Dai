# AC Roadmap

Last updated: 2026-10-07

This roadmap separates live-verified foundations, research work, and future features.

## Status vocabulary

- **LOCKED** — approved baseline contract; changes require explicit decision
- **IMPLEMENTED** — code exists and deterministic verification passes
- **LIVE VERIFIED** — browser/live path has been tested successfully
- **RESEARCH** — evidence gathering/normalization in progress
- **PLANNED** — not yet implemented

## Foundation already completed

### Phase 2A — Core recommendation/Blueprint flow
Status: **LOCKED baseline**

Includes Draft/Commit, Call A, Call B, caching/stale protection, and structured outfit proposal.

### Phase 2B — Lookbook generation
Status: **LIVE VERIFIED**

Includes realistic 3:4 image generation, immutable GenerationSnapshot, ephemeral image handling, and lineage-aware image state.

### Phase 2C — Visual QA v2
Status: **LIVE VERIFIED baseline**

Includes assessability, Cultural Identity, Outfit Fidelity, actionability, AC Stylist presentation, and V0/V1/V2 correction behavior.

Visual perception accuracy remains benchmark-sensitive; "live verified baseline" does not mean every visual trait is solved permanently.

### Phase 2D — Guided Exploration
Status: **LIVE VERIFIED**

Includes:

- Gần truyền thống hơn
- Biến tấu hơn
- Phối khác cùng tinh thần
- independent branch lineage
- root preservation
- wearer-context propagation

### Track A — Runtime + UX stabilization
Status: **LIVE VERIFIED**

Includes:

- Exploration gating/placement
- QA/actionability consistency
- conservative sleeve handling
- AC Stylist primary UX
- idle-session reset
- Lite-only A/B/Exploration routing
- cross-API non-JSON hardening

## G0 — Repository Governance

Status: **COMPLETE — governance baseline**

### Layer 1
- [x] README.md
- [x] AGENTS.md
- [x] GEMINI.md
- [x] docs/PROJECT_CONSTITUTION.md
- [x] docs/KNOWN_FAILURES.md
- [x] docs/ROADMAP.md

### Layer 2

- [x] docs/ARCHITECTURE.md

- [x] docs/CULTURAL_KNOWLEDGE_POLICY.md
- [x] docs/MODEL_ROUTING_POLICY.md
- [x] docs/STATE_AND_LINEAGE_INVARIANTS.md
- [x] docs/VISUAL_QA_CONTRACT.md
- [x] docs/PRIVACY_AND_USER_IMAGES.md
- [x] .github/copilot-instructions.md
- [x] path-specific instructions under .github/instructions/

G0 governance baseline is complete. Keep these documents synchronized as the product evolves.

## G1 — Cultural Knowledge Supplement v1.1

Status: **APPROVED FOR G2 INTEGRATION**

Goal: close the wearer/gender/styling/accessory knowledge gap without rewriting Master v1.0 from scratch.

Research dimensions:

`garment × wearer × period × region × occasion × styling element × evidence`

Work completed conceptually:

- wearer compatibility research
- historical ensemble research
- accessories/jewelry/hairstyle research
- contemporary remix layer

Next after G0:

- [x] **E — Product Rules v1.1 drafted**
- [x] machine-readable draft: `src/data/culturalProductRulesV11.ts`
- [x] human-readable policy: `docs/CULTURAL_PRODUCT_RULES_V1.1.md`
- [x] deterministic policy invariants test added
- [x] product-policy choices reviewed and approved for G2 integration

Important: no cultural rule becomes production logic merely because it appeared in research discussion. It must be approved and encoded with provenance/evidence status.

## G2 — Integrate Cultural Supplement v1.1

Status: **COMPLETE · LIVE VERIFIED**

Integrate approved v1.1 rules into:

- [x] Call A Recommendation — Wearer compatibility matrix & deterministic post-model enforcement (LIVE VERIFIED)
- [x] Call B Blueprint — Context-aware accessory filtering & policy sanitization (LIVE VERIFIED)
- [x] Guided Exploration — Accessory policy & branch wearer presentation (LIVE VERIFIED)
- [x] Visual prompt compiler — Explicit allowlist, hairstyle policy & no-invention guardrails (LIVE VERIFIED)
- [x] Visual QA contextual interpretation & evidence authority gate (LIVE VERIFIED)
- [x] AC Stylist explanations & contemporary styling narration (LIVE VERIFIED)
- [x] Idle Session timeout adjustment (2m30s warning / 3m00s reset & safe in-flight deferral) (LIVE VERIFIED)

No model should invent missing wearer/accessory compatibility. Cultural policy remains deterministic wherever a rule exists.

## G3 — AC Chat Assistant

### G3A — Grounded, Read-Only Cultural & Look Assistant
Status: **IMPLEMENTED · LIVE VERIFICATION PENDING**

Target model: `gemini-3.5-flash-lite` ONLY

Capabilities:
- answer questions about the three supported garments (`ngu_than_chen`, `ao_tac`, `ao_tu_than`),
- explain current Blueprint, Snapshot, and structured Visual QA / AC Stylist findings,
- answer styling questions using approved knowledge and distinguish historical facts from contemporary styling guidance,
- explicitly acknowledge insufficient approved evidence ("AC chưa có đủ căn cứ trong bộ tri thức hiện tại để khẳng định điều này."),
- closed-world grounding (pre-trained model knowledge is not cultural authority; zero image pixel hallucinations),
- structured evidence references validation against canonical sources (`SRC-03`..`SRC-07`, `SRC-V11`),
- session-only chat state (zero persistence to localStorage, sessionStorage, or databases; cleared on session reset),
- strictly read-only: no state mutation, no automatic Blueprint modification.

### G3B — Controlled Chat-Assisted Mutations (Actionable Delta v1)
Status: **IMPLEMENTED · DETERMINISTIC TESTS PASS · LIVE VERIFICATION PENDING**

Capabilities:
- Server-authoritative Action Registry (`EphemeralActionRegistry`) with opaque `actionId`, ephemeral RAM-only `chatSessionId`, and 10-minute TTL,
- Immutable `sourceBlueprint` normalized and server-computed `sourceFingerprint`,
- POST `/api/ac-chat/mutate` endpoint accepting `{ actionId, currentFingerprint, chatSessionId }` with concurrency matching, idempotency guard, and zero extra LLM calls,
- Closed action union: `SET_FOOTWEAR`, `SET_FABRIC`, `ADD_ACCESSORY`, `SET_COLOR`,
- Strict deterministic explicit-only accessory guards on apply,
- Snapshot immutability: applying mutations changes active Blueprint only; previous GenerationSnapshot, images, and QA remain immutable,
- Lineage divergence notice: "Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.",
- Action card UI lifecycle: loading indicator -> applied state ("Đã áp dụng" with Check icon) -> disabled permanently to prevent re-apply loops,
- Canonical session reset clears ephemeral chat actions and refreshes `chatSessionId`.

## G4 — Personal Portrait Try-on

Status: **PLANNED**

Goal: allow the user to provide a portrait/reference image and visualize the same person wearing the selected AC outfit.

Prerequisites:

- privacy contract,
- ephemeral portrait-reference storage,
- no persistent face profile/embedding,
- no portrait bytes in Git/local persistent app state,
- lineage-safe identity preservation,
- portrait mode does not infer cultural styling from personal appearance.

The portrait is an identity reference, not cultural evidence.

## G5 — Demo hardening & submission

Status: **PLANNED**

Focus:

- public deployment reliability
- mobile/responsive verification
- latency budget
- quota/cost guardrails
- demo rehearsal
- README/screenshots
- competition narrative
- known limitations
- final regression matrix

## Decision rule for sequencing

Do not start G3/G4 before:

1. G0 governance contracts exist,
2. G1 cultural supplement is approved,
3. G2 integration is stable enough that new features will not build on known cultural-policy gaps.

This ordering intentionally prioritizes correctness and repeatability over feature count.
