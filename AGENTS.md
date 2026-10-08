# AGENTS.md — AC Repository Governance

This file is a binding instruction contract for AI coding agents working in this repository.

## 1. Read-before-change rule

Before modifying code:

1. Read this file.
2. Read `docs/PROJECT_CONSTITUTION.md`.
3. Read `docs/KNOWN_FAILURES.md`.
4. Read `docs/ROADMAP.md`.
5. Inspect the current implementation of the subsystem you are changing.
6. Read task-specific policy documents when they exist.

Do not treat a chat prompt, model memory, or general web knowledge as stronger than repository contracts.

## 2. Product identity

AC is a **Context-Aware Cultural Remix Co-pilot**.

AC is not:

- a free-form fashion chatbot,
- a generic image generator,
- a static cultural encyclopedia,
- a cultural police system,
- a historical reconstruction engine that claims certainty beyond evidence.

The product should show what is preserved, what is remixed, what is uncertain, and why.

## 3. Garment scope

The current MVP contains exactly:

- `ngu_than_chen`
- `ao_tac`
- `ao_tu_than`

Do not add garments without an explicit product decision.

## 4. Cultural authority

Approved cultural data is authoritative. Models are not.

Current in-repo source:

- `src/data/culturalKnowledgePack.ts`

Rules:

- Do not invent historical facts, symbolism, etiquette, gender rules, accessories, garment provenance, or social-class rules.
- Do not convert model-pretraining knowledge into a project fact without approved evidence.
- Do not treat generated images as cultural ground truth.
- Do not treat commercial listings or stage costume as historical proof unless an approved cultural policy explicitly classifies them that way.
- Preserve the distinction between historical facts and contemporary styling recommendations.

Evidence status is exactly:

`VERIFIED | PROBABLE | APPROXIMATE | DISPUTED | UNKNOWN`

Never introduce alternative evidence enums.

## 5. Cultural taxonomy

Trait levels remain:

- `essential`
- `strongly_characteristic`
- `supporting`
- `variable`

Do not infer visual actionability directly from trait level.

An essential trait is not automatically visually assessable.
A supporting/variable trait is not automatically irrelevant.
Use explicit visual policy and evidence rules.

## 6. Runtime model routing

Current locked runtime policy:

- Recommendation / Call A → `gemini-3.5-flash-lite` only
- Blueprint / Call B → `gemini-3.5-flash-lite` only
- Guided Exploration Blueprint → `gemini-3.5-flash-lite` only

Do not add stronger automatic fallbacks for these tasks.

Visual QA uses a separate task-specific pool and must not be changed without explicit benchmark evidence.

Image generation is a rendering service and is not a cultural reasoning authority.

## 7. Draft / Commit invariant

Draft context edits must make zero API calls.

Expected flow:

```text
DraftContext
→ explicit commit CTA
→ CommittedContext
→ Call A
→ Call B
```

Same-input commit must remain idempotent when a valid result already exists.

## 8. State and lineage invariants

- Root and exploration branches are independent lineages.
- A branch must not overwrite the root lineage.
- Branch operations must use the branch fingerprint/snapshot, not the root fingerprint.
- Explicit `Nam` / `Nữ` wearer presentation must remain fixed through descendants and revisions unless the user explicitly changes it.
- `Không ưu tiên` may allow V0 to establish presentation; revisions within that lineage preserve the established presentation.
- A stale result from an older fingerprint must not unlock UI or overwrite current state.

## 9. GenerationSnapshot invariant

Image generation must bind to an immutable snapshot captured at request time.

The snapshot owns the outfit facts used by image rendering and fidelity QA.

Do not reconstruct generation truth later from mutable UI state.

## 10. Revision contract

- V0 = original generated image
- V1 = correction 1
- V2 = correction 2
- no V3 automatic correction

V0 does not consume a correction slot.

If V2 still contains issues, report them. Never soften QA because the correction budget is exhausted.

## 11. Visual QA authority separation

Pipeline:

```text
Generated image
→ assessability
→ local visual findings
→ cultural identity + outfit fidelity
→ actionability
→ grounded revision
```

Authority:

- Vision model: what is visible
- visual policy: whether/how it is assessable
- cultural knowledge: what it means culturally
- GenerationSnapshot: what the user requested
- deterministic server logic: verdict/actionability

The vision model must not invent cultural categories, provenance, or historical meaning.

## 12. Visual uncertainty rule

When uncertain, prefer:

`NOT_ASSESSABLE`

over speculative PASS or FAIL.

Examples:

- slim/tubular sleeve alone is not proof of canonical tay-chẽn geometry,
- hidden internal structure cannot be inferred,
- exact fabric provenance cannot be inferred from sheen alone,
- footwear outside frame is not a failure,
- expected accessory absence cannot fail when its anchor region is not visible.

Do not add deterministic rules that "rescue" a real FAIL merely to make results look better.

## 13. QA/actionability consistency

Cultural Identity and Outfit Fidelity remain separate.

`actionableCount` must come from the same source of truth as the correction plan.

Required invariant:

```text
actionableCount === correctionPlan.actionableDeltas.length
```

`NOT_ASSESSABLE` never becomes a correction target.

If an observation is advisory but non-actionable, call it a "điểm cần lưu ý", not "cần chỉnh".

## 14. AC Stylist

The primary QA UX is natural-language AC Stylist guidance.

The Stylist layer may narrate structured QA facts only.

It must not independently:

- re-evaluate the image,
- invent a cultural fact,
- invent an accessory,
- invent a historical rule,
- invent a defect,
- invent a correction target.

Technical evidence belongs behind the secondary evidence disclosure.

## 15. Exploration gating

Guided Exploration must not render before a valid root V0 exists for the current committed Blueprint/fingerprint.

A stale V0 from an earlier context must not unlock Exploration.

## 16. API transport rules

Before parsing JSON, client code must validate:

- HTTP status,
- content type,
- canonical AC API response marker where applicable.

Never expose raw HTML proxy/SPA responses to normal users.

Do not introduce automatic retry loops that duplicate in-flight work.

## 17. Session/runtime state

- Runtime quota quarantine state must not be committed.
- Secrets and local environment files must not be committed.
- Session reset must use the canonical reset barrier.
- Background provider activity is not user activity for idle-session timing.

## 18. Change discipline

Before patching:

- identify the exact failing invariant,
- inspect the existing implementation,
- patch the narrowest correct layer,
- avoid rewriting stable systems,
- add/adjust deterministic regression coverage,
- state what still requires live verification.

Do not claim a live defect is fixed solely because unit tests pass.

## 19. Future features

### AC Chat Assistant
Must be grounded in approved AC knowledge. Model pretraining is not silent cultural authority. Initial behavior should be read-only; outfit mutations require explicit user action.

### Personal Portrait Try-on
Portrait/reference images are identity references, not cultural evidence. Do not infer cultural styling rules from a person's appearance. Portrait data must be handled ephemerally under an approved privacy contract.

## 20. Conflict rule

If a requested change conflicts with a locked invariant:

1. stop the conflicting implementation,
2. identify the exact conflict,
3. report it,
4. request or wait for an explicit product decision.

Do not silently override governance.


## 21. Definition of done

A feature/change is not complete until all relevant items are true:

1. implementation is complete,
2. deterministic tests/typecheck/build pass,
3. required live verification is complete,
4. relevant repository documentation is synchronized,
5. roadmap/status reflects reality.

Documentation synchronization means updating only the files affected by the change, for example:

- `README.md` when user-visible capabilities or setup change,
- `docs/ROADMAP.md` when phase/status changes,
- `docs/ARCHITECTURE.md` when system boundaries/flows change,
- policy/contract files when a locked rule changes,
- `docs/KNOWN_FAILURES.md` when a meaningful new regression is discovered.

Do not mark a feature complete while repository documentation still describes obsolete behavior.
