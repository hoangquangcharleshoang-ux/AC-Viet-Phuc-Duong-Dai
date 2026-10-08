# GEMINI.md — AC Gemini Coding Context

This repository contains **AC — Context-Aware Cultural Remix Co-pilot**.

Treat this file as a navigation layer, not a replacement for project contracts.

## Mandatory reading order

Before making changes:

1. `AGENTS.md`
2. `docs/PROJECT_CONSTITUTION.md`
3. `docs/KNOWN_FAILURES.md`
4. `docs/ROADMAP.md`
5. the actual source files for the subsystem being modified

If task-specific policy files are present, read them before implementation.

## Policy map

When relevant, also read:

- `docs/CULTURAL_KNOWLEDGE_POLICY.md`
- `docs/MODEL_ROUTING_POLICY.md`
- `docs/STATE_AND_LINEAGE_INVARIANTS.md`
- `docs/VISUAL_QA_CONTRACT.md`
- `docs/PRIVACY_AND_USER_IMAGES.md`
- `docs/ARCHITECTURE.md`

## Working behavior

- Inspect first; do not patch from assumptions.
- Preserve already live-verified behavior outside the requested scope.
- Explain the exact invariant being changed.
- Prefer deterministic server/state rules over prompt-only fixes when correctness belongs in code.
- Do not introduce cultural facts from Gemini's pretrained knowledge.
- Do not use image-model output as historical evidence.
- Do not rewrite stable architecture because a local fix looks easier.
- Do not claim "fixed" for a prior live defect until the browser/live path is verified.

## Current model-routing contract

- RECOMMENDATION → `gemini-3.5-flash-lite` only
- BLUEPRINT → `gemini-3.5-flash-lite` only
- EXPLORATION → `gemini-3.5-flash-lite` only
- VISUAL_QA → separate benchmarked task pool

Do not broaden A/B/Exploration fallback pools.

## Cultural knowledge contract

Use only approved project knowledge.

The current machine-readable projection is:

`src/data/culturalKnowledgePack.ts`

Evidence enum:

`VERIFIED | PROBABLE | APPROXIMATE | DISPUTED | UNKNOWN`

Do not invent new evidence levels.

Historical facts and `CONTEMPORARY_STYLING_RECOMMENDATION` must remain distinguishable.

## State contract summary

- Draft edits → zero API calls.
- Explicit commit → Call A → Call B.
- Root and branch lineages are independent.
- GenerationSnapshot is immutable generation truth.
- Explicit wearer presentation is preserved through a lineage.
- V0 is original; V1/V2 are the only automatic corrections.
- QA result is independent of correction budget.
- Exploration requires current root V0.

## Visual QA contract summary

- Vision reports only visible evidence.
- When visibility is insufficient, prefer `NOT_ASSESSABLE`.
- Cultural meaning comes from project knowledge, not Vision.
- Fidelity comes from GenerationSnapshot.
- `NOT_ASSESSABLE` never creates a correction.
- Do not force FAIL → PARTIAL merely to avoid a severe cultural verdict.
- Slim/tubular sleeve alone is not proof of canonical tay-chẽn geometry.

## Reporting format after implementation

Return:

1. root cause,
2. invariant changed,
3. exact files changed,
4. tests added/updated,
5. build/typecheck status,
6. remaining live verification.

Keep reports factual. Do not declare the entire project complete unless the roadmap says so.


## Completion rule

Documentation is part of completion. Update the relevant README, roadmap, architecture, known-failure, or policy files whenever implementation changes make those documents stale.
