# Cultural Knowledge Policy

Status: **Binding cultural-knowledge contract**

This document defines how cultural claims enter, move through, and leave the AC system.

## Authority

Approved project knowledge is the only cultural authority used by runtime product logic.

Current machine-readable source:

- `src/data/culturalKnowledgePack.ts`

Its approved upstream source is **AC — Research & Cultural Knowledge Master v1.0 FINAL**.

Research notes, chat discussions, commercial product pages, generated images, stage costumes, and model pretraining are not automatically production truth.

A future supplement becomes authoritative only after explicit approval and integration.

## Garment scope

The active MVP scope is exactly:

- `ngu_than_chen`
- `ao_tac`
- `ao_tu_than`

Do not infer rules for other garments from these profiles.

## Claim types

Keep these conceptual categories distinct:

- **SOURCE_SUPPORTED_FACT** — directly supported by suitable historical, museum, archival, or scholarly evidence.
- **REASONABLE_INTERPRETATION** — evidence-based interpretation that requires cautious wording.
- **CONTEMPORARY_STYLING_RECOMMENDATION** — a modern styling suggestion; never present it as historical practice.
- **UNKNOWN_OR_DISPUTED** — insufficient, conflicting, or unresolved evidence.

Do not silently convert one category into another.

## Evidence enum

The project evidence vocabulary is exactly:

`VERIFIED | PROBABLE | APPROXIMATE | DISPUTED | UNKNOWN`

Do not introduce alternate evidence values without an explicit migration decision.

## Claim–source fit

A source must be suitable for the exact claim being made.

Examples:

- a museum object can verify that a specific construction existed,
- one object does not automatically prove universal social practice,
- a contemporary practitioner can document current practice but cannot establish ancient historical canon alone,
- a commercial listing can prove present commercial labeling/practice, not historical use by itself.

## Absence of evidence

`No evidence found` does not mean `historically impossible`.

When a combination is not established, use language such as:

- "chưa có đủ tư liệu đã kiểm chứng",
- "chưa xác lập trong corpus hiện tại",
- "không đủ cơ sở để coi là cấu hình lịch sử mặc định".

Do not invent prohibitions from missing evidence.

## Trait taxonomy

The cultural trait categories are:

- `essential`
- `strongly_characteristic`
- `supporting`
- `variable`

These describe cultural importance, not visual assessability.

Never infer:

`essential → automatically visible`

or:

`supporting → automatically irrelevant`

Visual QA uses separate assessability policy.

## Historical vs contemporary styling

Historical evidence and modern remix guidance must remain separate.

A safe modern suggestion may be culturally acceptable without being historical.

The product may say:

> "Đây là cách phối đương đại."

It must not say:

> "Người xưa mặc như vậy."

unless approved evidence supports that historical claim.

## Wearer and styling research

Do not create new male/female garment eligibility from model intuition.

Do not infer accessory compatibility from wearer alone.

Do not hard-code a historical prohibition solely from lack of documentation.

Preserve committed wearer presentation as product state independently of cultural suitability.

The planned Cultural Knowledge Supplement v1.1 is intended to add:

`garment × wearer × period × region × occasion × styling element × evidence`

Until that supplement is approved and integrated, research discussion is not production policy.

## Accessories

Do not use a single undifferentiated accessory pool as historical truth.

A styling element may eventually carry:

- garment compatibility,
- wearer compatibility,
- period,
- region,
- occasion,
- social context,
- historical status,
- evidence status,
- source references.

Research hypotheses must not become hard runtime rules merely because they were discussed.

## Commercial and stage practice

Use explicit labels for non-historical contexts when needed:

- heritage revival,
- contemporary reinterpretation,
- stage/performance costume,
- commercial practice.

These may be useful product inputs, but they must not be silently promoted to historical canon.

## Generated images

A generated image can show whether a requested trait appears visually.

It cannot prove a historical fact, historical accessory use, wearer canon, textile provenance, or symbolism.

Generated images are visual outputs, not cultural evidence.

## LLM behavior

LLM pretrained knowledge is not silent project knowledge.

If approved project knowledge is insufficient, the correct product behavior is to acknowledge uncertainty.

For the planned AC Chat Assistant:

- retrieve approved AC knowledge,
- answer from that knowledge,
- say when the corpus is insufficient,
- do not fill gaps with unmarked general model knowledge.

## Change procedure

Before changing cultural production logic:

1. identify the claim,
2. identify its evidence status,
3. identify source fit,
4. classify the claim as historical fact, interpretation, contemporary recommendation, or unresolved,
5. update the approved machine-readable layer,
6. add regression coverage if behavior changes,
7. update relevant documentation.

Do not patch cultural behavior only inside a prompt string if the rule belongs in structured knowledge.


## Approved Supplement v1.1

The approved wearer/accessory/remix product policy is documented in:

- `docs/CULTURAL_PRODUCT_RULES_V1.1.md`
- `src/data/culturalProductRulesV11.ts`

Status: **approved for G2 integration**.

These files are approved product policy, but they do not change runtime behavior until G2 wiring is implemented. Until then, Call A, Call B, image prompting, and Visual QA continue using the current runtime paths.
