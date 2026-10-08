---
applyTo: "server/services/modelRegistry.ts,server/services/modelRouter.ts,server/services/geminiErrorClassifier.ts,server/services/circuitBreaker.ts,server/services/quotaQuarantine.ts,tests/*router*.ts,tests/*deadline*.ts"
---

# Model Routing Editing Rules

Before changing routing:

1. Read `AGENTS.md`.
2. Read `docs/MODEL_ROUTING_POLICY.md`.
3. Read `docs/KNOWN_FAILURES.md`.

Locked planning routes:

- RECOMMENDATION → gemini-3.5-flash-lite only
- BLUEPRINT → gemini-3.5-flash-lite only
- EXPLORATION → gemini-3.5-flash-lite only

Rules:

- Do not add stronger automatic fallbacks to those three tasks.
- Visual QA routing is separate and benchmark-sensitive.
- Preserve circuit breaker, cooldown, canary, stale-request handling, abort propagation, and quota quarantine.
- Cancellation/stale requests must not penalize model health.
- Do not add hidden retry loops or duplicate in-flight work.
- Any routing change must state latency/quota impact and required live verification.
