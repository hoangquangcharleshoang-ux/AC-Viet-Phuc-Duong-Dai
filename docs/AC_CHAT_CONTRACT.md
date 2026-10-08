# AC Chat Contract

Status: **Binding runtime contract for G3A & future G3B**

## 1. Product Role & Boundary

AC Chat is an in-product contextual dialogue assistant designed to:
- Answer cultural and anatomical questions about the three supported garments (`ngu_than_chen`, `ao_tac`, `ao_tu_than`).
- Explain the current committed Blueprint, styling choices, and cultural reasoning.
- Explain AC Stylist and Cultural Visual QA findings based strictly on structured evaluation facts.
- Provide culturally safer styling suggestions as contemporary recommendations.
- Frankly state when AC's approved knowledge does not support a claim:
  `"AC chưa có đủ căn cứ trong bộ tri thức hiện tại để khẳng định điều này."`

## 2. G3A Read-Only Invariant

In Phase G3A, AC Chat is strictly **READ-ONLY**:
- Must NOT mutate `DraftContext`, `CommittedContext`, `Blueprint`, or `GenerationSnapshot`.
- Must NOT create Exploration branches, regenerate images, trigger revisions, or change accessories.
- Must NOT execute state mutations automatically.
- No "Áp dụng gợi ý" mutation action in G3A (reserved for G3B).

## 3. Closed-World Grounding Authority

AC Chat operates under strict **CLOSED-WORLD GROUNDING**:
- Knowledge source: ONLY approved knowledge in `src/data/culturalKnowledgePack.ts` and `src/data/culturalProductRulesV11.ts`.
- Model pretrained knowledge is NOT cultural authority.
- No web search or unapproved external sources.
- No direct image perception / pixel inspection (vision authority belongs exclusively to Visual QA).
- Evidence references (`evidenceRefs`) returned by the model are deterministically validated by the server against `APPROVED_SOURCE_IDS` (`SRC-03`..`SRC-07`, `SRC-V11`). Hallucinated source IDs are stripped immediately.

## 4. Distinction Between Historical Fact vs Contemporary Guidance

- **Historical/Cultural Claims**: Must be anchored in verified sources (`SRC-03`..`SRC-07`).
- **Product/Styling Guidance**: Must be described as contemporary styling advice (`CONTEMPORARY_STYLING_RECOMMENDATION`), never rewritten as ancient historical decrees.
- **Spontaneous Explicit-Only Assistant Guard**: The assistant must NOT spontaneously suggest `EXPLICIT_ONLY` accessories (pearl necklace, handheld fan) as approved additions unless the user explicitly asks about them.

## 5. Model Routing & Error Handling

- **Task**: `AC_CHAT`
- **Model**: `gemini-3.5-flash-lite` ONLY.
- No automatic stronger-model fallback.
- On candidate failure, returns a typed retryable error, keeping existing conversation intact.

## 6. Privacy & Session Invariants

- Chat history is stored in React memory only (session-only).
- ZERO persistence to `localStorage`, `sessionStorage`, `IndexedDB`, or server databases.
- Canonical Session Reset / "Bắt đầu lại" clears the chat history.
- Operational logs contain ONLY metadata (`requestId`, `task`, character counts, latency); never raw user text, raw answers, or personal identifiers.
