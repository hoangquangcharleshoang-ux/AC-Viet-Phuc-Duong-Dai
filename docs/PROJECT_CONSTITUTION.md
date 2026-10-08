# AC Project Constitution

Status: **Binding engineering/product contract**

Project: **AC — Context-Aware Cultural Remix Co-pilot**

This document defines the boundaries that implementation must preserve unless an explicit product decision updates them.

## 1. Product thesis

AC helps users explore contemporary ways to wear Vietnamese traditional dress while understanding:

- what identifies a garment,
- what is being preserved,
- what is being remixed,
- what is uncertain,
- what is historically grounded versus contemporary styling.

AC should enable creativity without pretending that every creative choice is historical practice.

## 2. Current MVP scope

Supported garments:

1. Áo ngũ thân tay chẽn — `ngu_than_chen`
2. Áo tấc / Ngũ thân tay thụng — `ao_tac`
3. Áo tứ thân — `ao_tu_than`

No other garment belongs to the current MVP.

## 3. Sources of truth

### Cultural truth

Current machine-readable authority:

`src/data/culturalKnowledgePack.ts`

Its upstream source is the approved **AC — Research & Cultural Knowledge Master v1.0 FINAL**.

Future cultural supplements are not authoritative until explicitly approved and integrated.

### Generation truth

For a generated image, the immutable `GenerationSnapshot` is the authority for what outfit was requested.

### Visual truth

The image itself is the authority for what is visible, but only within assessability limits.

### Product/state truth

Current committed context, fingerprint, lineage, and deterministic server state define active product state.

No model output may silently override those sources of truth.

## 4. Epistemic rules

Allowed evidence values:

- VERIFIED
- PROBABLE
- APPROXIMATE
- DISPUTED
- UNKNOWN

Principles:

- absence of evidence is not evidence of absence,
- weak evidence must not become a rigid rule,
- disputed/unknown claims must not produce hard cultural correction,
- generated images cannot validate a historical fact,
- commercial practice cannot be promoted to historical canon without approved evidence,
- contemporary styling advice must be labelled as contemporary styling rather than historical fact.

## 5. Cultural trait taxonomy

The project uses:

- essential
- strongly_characteristic
- supporting
- variable

Trait category describes cultural importance, not optical visibility.

Visual assessability requires separate policy.

## 6. Core interaction contract

```text
Draft context
→ explicit commit
→ garment recommendation
→ structured Blueprint
→ image generation
→ Visual QA
→ AC Stylist
→ optional correction or Guided Exploration
```

Draft edits must not create API work.

## 7. Recommendation and Blueprint contract

Call A and Call B are structured reasoning tasks.

Current routing:

- Recommendation → `gemini-3.5-flash-lite` only
- Blueprint → `gemini-3.5-flash-lite` only
- Exploration Blueprint → `gemini-3.5-flash-lite` only

A provider failure returns a typed failure and stops; stronger automatic fallback is not part of current product policy.

## 8. Image-generation contract

Image generation is rendering, not cultural reasoning.

The renderer receives an explicit structured outfit brief and must not:

- invent cultural rules,
- invent historical accessories,
- change committed wearer presentation,
- substitute a different garment identity,
- treat its own output as evidence.

Current target output is a realistic 3:4 lookbook image.

Image bytes are session/runtime artifacts and should not become durable app state.

## 9. Lineage contract

Each lineage owns:

- Blueprint,
- GenerationSnapshot,
- outfit fingerprint,
- V0/V1/V2 image history,
- QA state.

Root and exploration branches do not overwrite one another.

Switching lineages must restore that lineage's own state.

## 10. Wearer-context contract

Explicit `Nam` / `Nữ` is upstream committed context and must remain stable across:

- root V0/V1/V2,
- MORE_TRADITIONAL branch,
- MORE_REMIXED branch,
- ALTERNATIVE branch,
- sibling variants of a branch.

`Không ưu tiên` may allow V0 to establish presentation; later revisions in that lineage preserve it.

The system must not silently fall back from an explicit female context to a male default.

## 11. Visual QA contract

Visual QA separates:

1. assessability,
2. local visual observation,
3. cultural identity,
4. outfit fidelity,
5. actionability.

The model that sees the image answers "what is visible?", not "what is culturally essential?"

Deterministic logic resolves cultural consequence.

When evidence is insufficient, prefer `NOT_ASSESSABLE`.

## 12. Cultural Identity vs Outfit Fidelity

These are independent axes.

Cultural Identity asks whether observed garment features preserve recognizability.

Outfit Fidelity asks whether the image matches the GenerationSnapshot.

A culturally valid but unrequested accessory may still be a Fidelity issue.

An image may faithfully render a Blueprint that itself contains a cultural conflict; that is a planning/Blueprint conflict, not an image-correction target.

## 13. Actionability contract

A correction requires grounded, assessable evidence.

Do not generate a correction from:

- NOT_ASSESSABLE,
- hidden structure,
- unsupported provenance,
- disputed/unknown cultural claims,
- speculative visual inference.

The UI must distinguish advisory attention from actionable correction.

## 14. Revision contract

- V0: original
- V1: correction 1
- V2: correction 2

No automatic V3.

The QA engine must remain equally strict at every revision index.

## 15. AC Stylist contract

AC Stylist is a presentation layer over structured QA.

It may:

- summarize,
- explain,
- prioritize,
- translate technical status into natural Vietnamese.

It may not:

- create a new defect,
- add cultural knowledge,
- add an accessory,
- change verdicts,
- create new correction targets.

## 16. Exploration contract

Exploration is controlled branching from an existing root outfit.

Modes:

- MORE_TRADITIONAL — "Gần truyền thống hơn"
- MORE_REMIXED — "Biến tấu hơn"
- ALTERNATIVE — "Phối khác cùng tinh thần"

Exploration renders only after a current root V0 exists.

The root result remains preserved.

## 17. API/transport contract

Every JSON API path must defend against outer proxy/SPA HTML responses.

Client behavior:

- check status,
- check content type,
- check canonical response marker when applicable,
- only then parse JSON.

Normal UI must not expose raw HTML or transport diagnostics.

## 18. Session contract

The application is session-oriented.

- no account/database requirement in the current MVP,
- idle timeout uses the canonical reset path,
- runtime quota quarantine is local runtime state,
- session reset clears root/branch/QA/runtime session state,
- background provider events are not user activity.

## 19. Privacy direction for future portrait mode

Before portrait try-on is implemented, an explicit privacy contract is required.

Minimum direction:

- portrait reference is ephemeral,
- no portrait bytes in Git,
- no portrait base64 in persistent browser state,
- no face embedding/profile database,
- reset/TTL removes portrait reference,
- appearance is identity reference only and is not cultural evidence,
- cultural styling must not be inferred from sensitive/personal appearance.

This section is a guardrail, not an implementation spec.

## 20. Future AC Chat Assistant

The planned AC assistant must be grounded in approved project knowledge.

Initial version should be read-only with respect to outfit state.

Any state-changing suggestion should require explicit user action.

The assistant must say when approved evidence is insufficient instead of filling gaps with pretrained model knowledge.

## 21. Change-control rule

A change that conflicts with this Constitution requires an explicit product decision.

Coding convenience is not sufficient reason to break a locked contract.

Update the Constitution when a deliberate architecture/product decision changes; do not silently diverge code from documentation.


## 22. Documentation synchronization

Repository documentation is part of product state.

When live behavior changes, update the smallest relevant set of documents so code and contracts do not diverge.

Typical mapping:

- user-visible feature/setup change → `README.md`
- architecture/data-flow change → `docs/ARCHITECTURE.md`
- phase/status change → `docs/ROADMAP.md`
- new recurring regression → `docs/KNOWN_FAILURES.md`
- locked policy change → the corresponding contract file

Do not rewrite stable contracts for ordinary refactors that do not change behavior.
