---
applyTo: "src/data/**,src/types/**"
---

# Cultural Knowledge Editing Rules

Before changing cultural data or related types:

1. Read `AGENTS.md`.
2. Read `docs/CULTURAL_KNOWLEDGE_POLICY.md`.
3. Read `docs/PROJECT_CONSTITUTION.md`.
4. Read the exact existing data structure before editing.

Rules:

- Do not introduce cultural claims from model pretraining.
- Do not add new evidence values beyond VERIFIED, PROBABLE, APPROXIMATE, DISPUTED, UNKNOWN.
- Keep historical facts separate from contemporary styling recommendations.
- Do not convert missing evidence into a prohibition.
- Do not hard-code wearer/accessory rules unless approved evidence/policy supports them.
- Preserve exact garment IDs: ngu_than_chen, ao_tac, ao_tu_than.
- If a research claim is not yet approved for production, keep it out of runtime cultural data.
- Cultural changes should include provenance/evidence references and regression coverage where behavior changes.
