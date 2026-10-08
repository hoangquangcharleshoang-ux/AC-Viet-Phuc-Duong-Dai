# Cultural Product Rules v1.1 — Draft Product Policy

Status: **APPROVED FOR G2 INTEGRATION — not yet wired to runtime**

Machine-readable policy:

- `src/data/culturalProductRulesV11.ts`

This document converts completed research tracks A+B+C+D into explicit product rules before G2 integration.

## 1. Scope

This supplement does **not** replace Cultural Knowledge Pack v1.0.

It adds product-policy dimensions that v1.0 does not model deeply enough:

- wearer compatibility,
- ensemble context,
- accessory compatibility,
- historical vs contemporary styling status,
- remix risk,
- auto-selection behavior.

The core rule remains:

> research discussion is not production truth until it is explicitly approved and integrated.

## 2. Evidence and product-policy separation

Every rule has two different questions:

1. **What does evidence support?**
2. **What should AC do with that evidence?**

Example:

```text
Evidence:
Male historical canonical use of Northern/Kinh áo tứ thân
→ NOT_ESTABLISHED in current corpus

Product rule:
→ do not auto-recommend it as historical male dress
→ allow explicit contemporary reinterpretation
→ label that reinterpretation clearly
```

This is intentionally not equivalent to:

```text
"Men never wore áo tứ thân."
```

AC must not make that absolute historical claim.

## 3. Wearer compatibility matrix

| Garment | Nam | Nữ | Product behavior |
|---|---|---|---|
| Ngũ thân tay chẽn | Documented | Documented | Auto-eligible for both when occasion/function fit |
| Áo tấc | Documented | Documented | Auto-eligible for both when ceremonial/context fit |
| Áo tứ thân — Northern/Kinh AC scope | Historical canonical use not established in current corpus | Documented | Female may be auto-recommended; male requires explicit contemporary reinterpretation |

### Neutral / Không ưu tiên

`neutral` is a **user preference state**, not a historical-gender claim.

AC must not interpret `neutral` as:

- historically gender-neutral garment use,
- permission to invent wearer history,
- permission to ignore evidence.

For traditional-leaning Northern/Kinh áo tứ thân, the documented female profile remains the historically grounded default unless the user explicitly requests a contemporary male reinterpretation.

## 4. Accessory selection principle

Old behavior to avoid:

```text
garment
→ generic accessory pool
→ random accessory
```

Required product logic:

```text
garment
+ wearer
+ occasion
+ social context
+ traditionality/remix level
→ compatible styling elements
```

If no approved compatible styling profile exists:

```text
prefer no accessory
over invented accessory
```

## 5. Historical-status vocabulary

The approved policy uses:

- `HISTORICAL_CANONICAL`
- `DOCUMENTED_CONTEXTUAL`
- `HERITAGE_REVIVAL`
- `CONTEMPORARY_REINTERPRETATION`
- `STAGE_PERFORMANCE`
- `COMMERCIAL_PRACTICE`
- `NOT_ESTABLISHED`

These statuses answer **what kind of evidence/context a styling combination belongs to**.

They do not replace:

`VERIFIED | PROBABLE | APPROXIMATE | DISPUTED | UNKNOWN`

which still answer **how strong the evidence is**.

## 6. Remix compatibility vocabulary

Approved product categories:

- `SAFE_CONTEMPORARY`
- `CONTEXTUAL_REMIX`
- `HIGH_REMIX`
- `CROSS_CULTURAL_RISK`
- `CORE_CONFLICT`
- `NOT_ESTABLISHED`

Interpretation:

### SAFE_CONTEMPORARY
Peripheral modern styling with low risk of damaging garment identity.

Examples:
- minimal contemporary bag,
- simple eyewear,
- minimal jewelry,
- casual contemporary footwear in suitable contexts.

### CONTEXTUAL_REMIX
May be appropriate depending on garment, wearer, occasion, and traditionality.

### HIGH_REMIX
Intentional contemporary editorial styling. It may remain valid as remix but must not be presented as historical dress.

### CROSS_CULTURAL_RISK
May visually pull the look toward generic/East-Asian/fantasy costume language. Requires explicit, careful handling.

### CORE_CONFLICT
Changes the garment's defining cultural identity. Must not be auto-selected as styling variation.

### NOT_ESTABLISHED
Current AC corpus does not establish the combination strongly enough for historical framing.

## 7. Accessory rules currently safe to adopt after approval

### 7.1 Khăn đóng / khăn vấn

- Áo tấc + nam + ceremonial/traditional context:
  - contextual historical support,
  - may be preferred in traditional-leaning looks,
  - not mandatory in every modern styling.

- Ngũ thân tay chẽn + nam:
  - supported as heritage-revival practice,
  - should not be phrased as universal historical default.

### 7.2 Khăn vấn nữ

- Áo tấc + nữ:
  - documented contextual use,
  - allowed in traditional/ceremonial styling.

- Ngũ thân + nữ:
  - context-specific evidence exists for early-20th-century Hanoi,
  - do not universalize to all regions/periods.

### 7.3 Khăn mỏ quạ / nón thúng quai thao

For Northern female áo tứ thân:

- contextually appropriate,
- supporting ensemble cues,
- not essential garment identity traits,
- not mandatory in every generated look.

### 7.4 Dải thắt lưng / ruột tượng

For female Northern áo tứ thân:

- strong traditional ensemble cue,
- may be preferred in traditional-leaning styling,
- exact visual treatment may vary.

### 7.5 Guốc mộc

- strong contextual option for traditional female áo tứ thân,
- context-specific evidence also exists with female ngũ thân in early-20th-century Hanoi,
- do not turn that into a universal ngũ thân default.

### 7.6 Formal shoes / hài for áo tấc

For ceremonial áo tấc:

- prefer formal footwear family,
- do not hard-code one exact historical shoe type without stronger context-specific evidence.

## 8. Accessories that must NOT become automatic defaults

### Trâm cài tóc

Do not infer:

```text
female → hairpin
```

General historical existence of hair ornaments is not sufficient to establish a garment-specific default.

Current product rule:

- explicit/contextual only,
- no automatic historical claim.

### Ngọc bội / kim bội

Do not infer:

```text
male + áo tấc → jade pendant
```

Current evidence is associated with court/elite/rank context.

Product rule:

- court/elite context required,
- explicit/contextual only,
- never generic male accessory.

### Pearl necklace

Do not use as historical default for any of the three garments.

May be allowed only as clearly contemporary/editorial styling.

### Handheld fan

Current corpus does not support it as a universal garment-specific historical default.

Treat as explicit editorial/performance/contemporary styling unless stronger evidence is approved.

## 9. Contemporary styling rules

### Modern bag

Low-risk peripheral contemporary styling.

Can be allowed when it does not visually dominate or obscure garment identity.

Must be described as modern styling, not historical use.

### Eyewear

Low-risk contemporary styling.

Do not use ornate fantasy frames that shift the visual language away from the garment.

### Minimal jewelry

Allowed as contemporary styling.

Keep subordinate to garment identity.

Never back-project contemporary jewelry into historical explanation.

### Minimal sneakers

#### Ngũ thân tay chẽn
Can be allowed in casual/urban contemporary contexts.

#### Áo tấc
Do not auto-select in traditional/ceremonial styling.

Only explicit/high-remix editorial contexts should use it.

#### Áo tứ thân
Possible as contemporary reinterpretation when traditional ensemble cues remain legible.

### Minimal boots

High-remix editorial styling only.

Never a historical default.

### Blazer layering

High-remix option for selected editorial/urban concepts.

Must preserve visible garment identity.

Must be labeled as contemporary remix.

## 10. Hairstyle policy

Do not automatically convert:

```text
female → elaborate historical bun + hairpin
male → historical topknot/headwrap
```

Safe contemporary defaults may include:

- natural short hair,
- natural long hair,
- simple low bun,
- simple tied-back hair.

Historical head styling requires an approved profile.

## 11. Prompt guardrails

Image prompts should avoid vague culture-blending phrases such as:

- "ancient Asian costume",
- "oriental royal accessories",
- "fantasy imperial jewelry",
- generic "historical Asian" styling.

Prompt compiler should eventually use an allowlist from approved Blueprint styling elements.

Do not invent:

- crowns,
- imperial ornaments,
- jade pendants,
- pearl necklaces,
- ornate hairpins,
- tassel fans,
- ceremonial props

unless the approved Blueprint explicitly contains them.

## 12. Recommendation rules

### Áo tấc

Do not prefer áo tấc for ordinary casual/street use when a more functionally appropriate garment exists.

It may still be used when:

- user explicitly asks for it,
- context is editorial/remix,
- ceremonial context fits.

### Male áo tứ thân

For the current Northern/Kinh AC scope:

- do not auto-recommend as historical/traditional male dress,
- explicit contemporary reinterpretation is allowed,
- product copy must label the result as reinterpretation/remix,
- do not claim historical impossibility.

## 13. Traditionality thresholds

The approved product-control thresholds are:

```text
70–100 → traditional-leaning
40–69  → balanced
0–39   → contemporary-leaning
```

These thresholds are a **product-control policy**, not historical evidence. They are approved for G2 integration and may be revised later only through an explicit product decision.

## 14. G2 integration targets

After this E policy is approved, runtime integration should occur in this order:

1. Call A — wearer-aware recommendation eligibility.
2. Call B — context-aware ensemble/accessory selection.
3. Guided Exploration — preserve eligibility while changing remix degree.
4. Visual prompt compiler — explicit allowlist, no invented accessories.
5. GenerationSnapshot — continue recording exact selected styling IDs.
6. Visual QA — use product policy only where visually assessable.
7. AC Stylist — explain historical vs contemporary status naturally.

## 15. Non-goals for E

This phase does **not**:

- alter production runtime,
- change current Recommendation behavior,
- change Blueprint generation,
- change image prompts,
- change Visual QA,
- add Chat Assistant,
- add portrait try-on.

Those belong to G2/G3/G4.

## 16. Approval checklist

Approved for G2 integration:

- [x] wearer compatibility matrix reviewed
- [x] male áo tứ thân policy approved
- [x] accessory auto-selection rules approved
- [x] historical-status vocabulary approved
- [x] remix-compatibility vocabulary approved
- [x] traditionality thresholds approved
- [x] no evidence claim overstates its source
- [x] machine-readable file matches this document
- [x] no runtime import exists yet

Approval means G2 may wire these rules into runtime. It does **not** mean every rule is historical fact; evidence status and historical/contemporary labels remain binding.
