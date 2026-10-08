# Visual QA Contract

Status: **Binding Visual QA contract**

Primary implementation:

- `server/services/visualQAAggregator.ts`
- Visual QA route/system instructions in `server.ts`
- `src/services/visualQAService.ts`
- `src/services/visualQAPersistence.ts`
- `src/components/CulturalQACard.tsx`

## Purpose

Visual QA evaluates a generated image without turning the vision model into a cultural authority.

```text
Generated image
→ Assessability
→ Local visual finding
→ Cultural Identity + Outfit Fidelity
→ Actionability
→ Grounded correction
→ AC Stylist presentation
```

## Authority separation

### Vision model
Reports only what is visually observable.

### Visual evaluation policy
Defines whether and how a trait can be assessed.

### Cultural Knowledge Pack
Defines cultural meaning, trait category, and provenance.

### GenerationSnapshot
Defines what the image was requested to contain.

### Deterministic server logic
Resolves cultural verdict and actionability.

The vision model must not invent cultural categories, provenance, historical meaning, or correction authority.

## Local verdicts

Canonical local verdicts:

- `PASS`
- `PARTIAL`
- `FAIL`
- `NOT_ASSESSABLE`

When evidence is ambiguous or visibility is inadequate, prefer `NOT_ASSESSABLE` over speculative PASS or FAIL.

## Assessability examples

Do not infer hidden structure.

Examples:

- hidden five-body construction → not assessable,
- footwear out of frame → not assessable,
- accessory anchor hidden/occluded → absence cannot automatically fail,
- fabric sheen alone → insufficient for exact textile provenance,
- bent arm, folds, or foreshortening may prevent sleeve-geometry assessment.

## Sleeve regression guardrail

For tay chẽn:

- narrow/slim/tubular appearance alone is not proof of canonical taper geometry,
- clearly visible canonical geometry → PASS,
- some evidence but insufficient certainty → PARTIAL,
- geometry cannot be reliably evaluated → NOT_ASSESSABLE,
- clear assessable contradiction → FAIL.

Do not globally normalize sleeve FAIL to PARTIAL.

## Cultural Identity

Current cultural verdict vocabulary:

- `PRESERVES_IDENTITY`
- `CONTEXT_SENSITIVE`
- `WEAKENS_RECOGNIZABILITY`
- `CHANGES_CORE_IDENTIFICATION`
- `INSUFFICIENT_EVIDENCE`

Technical `EVALUATION_UNAVAILABLE` is separate.

A VERIFIED essential FAIL may support `CHANGES_CORE_IDENTIFICATION`.

Weak, approximate, disputed, or unknown evidence must not independently create a rigid core-identity failure.

Low coverage blocks overconfident positive conclusions; it does not erase a clearly observed authoritative negative.

## Outfit Fidelity

Fidelity is independent from Cultural Identity.

Snapshot-controlled dimensions include:

- wearer presentation,
- palette,
- fabric,
- lower garment,
- footwear,
- expected accessories,
- unexpected accessories.

A culturally valid accessory may still be a Fidelity failure if it was not requested.

A missing expected item can fail only when visibility and evidence support that conclusion.

## Blueprint cultural conflict

If the Blueprint itself requests a culturally conflicting feature and the image faithfully follows it:

- do not treat the image as root cause,
- do not use V1/V2 image correction to fix planning truth,
- route it back to planning as a Blueprint cultural conflict.

## Actionability

A correction requires grounded, assessable evidence.

Never generate correction from:

- `NOT_ASSESSABLE`,
- hidden structure,
- unsupported provenance,
- disputed/unknown hard cultural claims,
- speculative visual interpretation.

Supporting/variable traits are actionable only when explicit policy permits it.

## QA independence from revision budget

QA must not use remaining correction budget when deciding:

- local verdict,
- Cultural Identity,
- Outfit Fidelity.

The same evidence should produce the same QA at V0, V1, and V2.

Only action/UI layers know whether another correction can be rendered.

## Actionable count

Required invariant:

```text
actionableCount === correctionPlan.actionableDeltas.length
```

Keep separate:

- passed items,
- advisory attention,
- actionable corrections.

If attention exists but no actionable delta exists, say "điểm cần lưu ý", not "cần chỉnh".

## Correction budget

- V0 → may produce V1
- V1 → may produce V2
- V2 → no further automatic correction

If V2 still fails, report the issue honestly and state that the automatic correction budget is exhausted.

## Revision prompt

A grounded revision may contain:

- original visual brief,
- preservation anchor,
- actionable cultural deltas,
- actionable fidelity deltas.

It must not invent a new hairstyle, accessory, motif, historical rule, or wearer identity.

## AC Stylist

AC Stylist narrates structured QA facts in natural Vietnamese.

It does not re-evaluate the image.

Technical evidence remains secondary behind "Xem căn cứ đánh giá".

## Runtime failure UX

If QA cannot complete:

- keep the generated image,
- show product-safe failure text,
- allow QA retry,
- do not regenerate the image automatically.

Raw transport diagnostics belong in logs, not normal UI.

## Testing

Visual QA changes should preserve or extend deterministic coverage for:

- assessability,
- evidence authority,
- cultural verdict ordering,
- fidelity,
- actionability,
- correction-budget independence,
- lineage,
- transport hardening,
- known regressions such as sleeve geometry.

Live image benchmarks remain necessary for perception-sensitive changes.
