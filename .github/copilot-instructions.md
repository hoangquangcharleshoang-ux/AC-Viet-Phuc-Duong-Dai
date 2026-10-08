# AC GitHub Copilot Instructions

Before suggesting or editing code:

1. Read `AGENTS.md`.
2. Read `docs/PROJECT_CONSTITUTION.md`.
3. Read `docs/KNOWN_FAILURES.md`.
4. Read the policy document relevant to the files being changed.
5. Inspect the current implementation before proposing a patch.

## Policy map

- Cultural data → `docs/CULTURAL_KNOWLEDGE_POLICY.md`
- Model routing → `docs/MODEL_ROUTING_POLICY.md`
- State/lineage → `docs/STATE_AND_LINEAGE_INVARIANTS.md`
- Visual QA → `docs/VISUAL_QA_CONTRACT.md`
- User images/privacy → `docs/PRIVACY_AND_USER_IMAGES.md`

## Core constraints

- Supported MVP garments are only `ngu_than_chen`, `ao_tac`, and `ao_tu_than`.
- Do not invent cultural/historical rules from model knowledge.
- Recommendation, Blueprint, and Exploration use `gemini-3.5-flash-lite` only.
- Do not modify Visual QA routing without explicit benchmark justification.
- Preserve Draft → Commit semantics.
- Preserve root/branch lineage isolation.
- Preserve explicit wearer presentation through a lineage.
- V0 is original; only V1 and V2 are automatic corrections.
- Prefer `NOT_ASSESSABLE` to unsupported visual certainty.
- Do not convert advisory QA items into correction targets.
- Do not expose raw proxy/HTML/API diagnostics in normal UI.
- Do not persist image bytes or secrets in browser storage or Git.

## Known regression discipline

Before touching a subsystem, search `docs/KNOWN_FAILURES.md` for a related prior failure and preserve its invariant.

Automated green tests are necessary but do not replace live verification for a bug originally found live.

## Definition of done

A feature/change is not complete until:

1. code is implemented,
2. deterministic tests/build/typecheck are green,
3. required live verification is complete,
4. relevant documentation is updated,
5. roadmap/status reflects reality.

Do not leave README, roadmap, architecture, or policies describing behavior that no longer matches implementation.
