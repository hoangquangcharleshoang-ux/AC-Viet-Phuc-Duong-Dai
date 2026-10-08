---
applyTo: "server/services/visualQA*.ts,src/services/visualQA*.ts,src/components/CulturalQACard.tsx,tests/*visual*qa*.ts"
---

# Visual QA Editing Rules

Before changing Visual QA:

1. Read `AGENTS.md`.
2. Read `docs/VISUAL_QA_CONTRACT.md`.
3. Read `docs/KNOWN_FAILURES.md`.

Rules:

- Vision reports visible evidence only.
- Prefer NOT_ASSESSABLE when visibility is insufficient.
- Do not infer hidden structure.
- Do not infer cultural authority from the vision model.
- Cultural Identity and Outfit Fidelity remain separate.
- NOT_ASSESSABLE never creates a correction target.
- actionableCount must match correctionPlan.actionableDeltas.length.
- Do not globally convert FAIL to PARTIAL.
- Slim/tubular sleeve alone is not proof of canonical tay-chẽn geometry.
- QA severity must not depend on remaining V1/V2 correction budget.
- Preserve V0/V1/V2 semantics.
- A change to perception-sensitive logic needs deterministic regression coverage and live verification.
