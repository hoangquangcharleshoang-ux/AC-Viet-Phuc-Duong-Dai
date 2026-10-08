# Privacy & User Images

Status: **Pre-implementation binding guardrail for future portrait try-on**

Personal Portrait Try-on is planned but not yet implemented.

## Purpose limitation

A user-provided portrait/reference image may be used to render the same recognizable person wearing a selected AC outfit.

It is an identity/appearance reference for image generation.

It is not:

- cultural evidence,
- a basis for garment-history claims,
- a basis for accessory compatibility,
- a source for wearer/gender selection,
- a source for sensitive-attribute inference.

## Explicit wearer context

Do not infer committed wearer presentation from portrait appearance.

Wearer presentation remains an explicit user/product context field.

The portrait does not decide historical suitability or cultural styling.

## Ephemeral handling

Portrait/reference bytes must be ephemeral.

Minimum behavior:

- temporary runtime storage only,
- explicit TTL,
- session reset removes the reference,
- expired reference becomes unavailable,
- no durable face-profile database.

## Prohibited persistence

Do not store portrait bytes/base64 in:

- Git,
- `localStorage`,
- current session persistence,
- Visual QA persistence,
- analytics payloads,
- logs.

Tests should use synthetic/dedicated fixtures rather than real user uploads.

## Logging

Logs may contain bounded technical identifiers such as an ephemeral reference ID.

Do not log raw image bytes, base64, data URLs, biometric templates, or face embeddings.

## GenerationSnapshot

Future portrait support may store only metadata necessary to bind generation identity, for example:

```ts
hasPortraitReference: boolean
portraitReferenceId?: string
```

Do not place portrait bytes inside GenerationSnapshot.

Portrait reference IDs must expire with their underlying ephemeral data.

## Lineage

If portrait mode is active:

- root V0 uses the reference,
- V1/V2 preserve the same person,
- branch inheritance rules must be explicit,
- switching lineage must not leak another portrait reference.

## Prompt behavior

Portrait mode should instruct the renderer to preserve the recognizable person rather than invent a replacement model.

Identity preservation does not authorize the renderer to invent cultural facts or accessories.

## QA boundaries

Visual QA may evaluate garment/outfit behavior under existing QA contracts.

It must not produce cultural judgments from facial appearance or inferred personal/sensitive attributes.

## User control

Before shipping, UI should make clear:

- the upload is a temporary generation reference,
- reset/expiry removes it,
- how to replace/remove the reference during the session.

## Release checklist

Before marking portrait try-on complete:

- [ ] privacy/threat review completed
- [ ] ephemeral portrait TTL implemented
- [ ] no portrait bytes enter browser persistence
- [ ] reset clears portrait reference
- [ ] V0/V1/V2 identity continuity tested
- [ ] branch isolation tested
- [ ] logs audited for image leakage
- [ ] UI disclosure added
- [ ] README/privacy docs updated
- [ ] live test completed
