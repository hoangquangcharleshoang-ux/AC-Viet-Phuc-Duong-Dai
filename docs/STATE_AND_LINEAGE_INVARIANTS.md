# State & Lineage Invariants

Status: **Binding state-management contract**

Relevant implementation includes:

- `src/App.tsx`
- `src/services/sessionPersistence.ts`
- `src/services/visualQAPersistence.ts`
- GenerationSnapshot / lineage types under `src/types/`

## Draft vs committed context

Draft edits make zero API calls.

```text
DraftContext
→ explicit CTA
→ CommittedContext
→ Recommendation
→ Blueprint
```

Same-input commit remains idempotent when a valid result already exists.

## Wearer presentation

Explicit Nam/Nữ is upstream committed state and must persist through:

- recommendation,
- Blueprint,
- root V0/V1/V2,
- Guided Exploration descendants.

Do not infer or reconstruct wearer presentation from the image.

## Fingerprint ownership

A lineage uses its own fingerprint.

Never reuse the root fingerprint for a branch generation or revision.

## Root and branches

Root and exploration branches are independent lineages.

Each lineage owns its own:

- Blueprint,
- outfit fingerprint,
- GenerationSnapshot,
- V0/V1/V2 history,
- Visual QA state.

Branch operations must not overwrite root or sibling state.

## GenerationSnapshot

The GenerationSnapshot is captured at request time and is immutable generation truth.

It should contain the outfit facts required by fidelity QA, including:

- garment,
- wearer presentation,
- palette,
- fabric,
- lower garment,
- footwear,
- active accessories,
- committed context snapshot,
- bound fingerprint.

Do not reconstruct these facts later from mutable UI state.

## Revision semantics

- V0 = original
- V1 = correction 1
- V2 = correction 2
- no automatic V3

V0 does not consume a correction slot.

## QA ownership

QA belongs to a concrete generation/revision and must not leak across:

- garment changes,
- committed-context changes,
- lineage switches,
- stale generations.

## Persistence

Current browser persistence uses:

- `ac_session_v1`
- `ac_visual_qa_v1`

Persisted data may contain structured metadata and snapshots.

It must not contain:

- API keys,
- raw image buffers,
- base64 image bytes.

## Hydration barrier

Initial hydration must complete before persistence effects can overwrite stored session state with defaults.

Do not remove this barrier as a refactor simplification.

## Stale-response protection

Drop results when their request/context is no longer active.

A stale response must not mutate current UI state.

## Exploration gate

Guided Exploration requires:

```text
valid root V0 for the current committed Blueprint/fingerprint
```

A stale root image does not unlock exploration.

## Session reset

Manual and idle reset must reuse the canonical reset barrier.

Do not build a parallel reset path.

## Idle behavior

Current contract:

- 2m30 true user inactivity → warning,
- 3m00 → reset,
- pointer/mouse/touch/keyboard/scroll/click count as activity,
- provider completion, React rerender, logs, and timers do not count as user activity,
- destructive reset is deferred while meaningful work is in flight.

## Future portrait lineage

When portrait try-on is implemented:

- portrait identity must be bound to the lineage,
- V1/V2 preserve the same identity,
- branch inheritance rules must be explicit,
- portrait bytes must not enter persistent lineage storage.
