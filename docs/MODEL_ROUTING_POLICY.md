# Model Routing Policy

Status: **Binding runtime routing contract**

## Current task pools

- RECOMMENDATION → `gemini-3.5-flash-lite` only
- BLUEPRINT → `gemini-3.5-flash-lite` only
- EXPLORATION → `gemini-3.5-flash-lite` only
- VISUAL_QA → separate task-specific pool defined in `server/services/modelRegistry.ts`

Do not add stronger automatic fallback for Recommendation, Blueprint, or Exploration.

If Flash-Lite fails for those three tasks, return a typed error and stop. Explicit user retry is allowed when appropriate.

## Visual QA

Visual QA remains separate because perception quality is benchmark-sensitive.

Do not change its pool, timeout strategy, or fallback behavior without explicit benchmark evidence.

Current router implementation limits Visual QA fanout to avoid long sequential attempts colliding with the outer request envelope.

## Router guarantees

Preserve:

- task-specific candidate pools,
- circuit breaker and cooldown,
- HALF_OPEN canary behavior,
- quota quarantine,
- abort/cancellation propagation,
- stale-request protection,
- bounded task deadlines,
- typed error handling.

Client/business cancellation and stale requests must not penalize model health.

## Quota quarantine

`.quota_quarantine.json` is runtime state.

It must stay out of version control and must not be treated as durable configuration.

## Retry discipline

Do not create hidden retry loops or duplicate in-flight requests.

Prefer:

```text
one task request
→ bounded routing
→ typed failure if needed
→ explicit user retry
```

over uncontrolled model fanout.

## Change control

Any routing change must document:

1. affected task,
2. reason,
3. latency/quota impact,
4. regression coverage,
5. remaining live verification.

Do not change unrelated task pools as a side effect.
