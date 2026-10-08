/**
 * AC — Cultural Product Rules v1.1
 * Static deterministic policy consistency tests.
 * ZERO LIVE MODEL CALLS.
 */

import {
  WEARER_COMPATIBILITY_V11,
  STYLING_ELEMENTS_V11,
  PRODUCT_POLICY_V11,
  getWearerCompatibilityRule,
  getStylingProfiles,
} from '../src/data/culturalProductRulesV11';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function run() {
  // 1. Exactly three MVP garments appear in wearer rules.
  const garments = new Set(WEARER_COMPATIBILITY_V11.map((r) => r.garmentId));
  assert(
    garments.size === 3 &&
      garments.has('ngu_than_chen') &&
      garments.has('ao_tac') &&
      garments.has('ao_tu_than'),
    'Wearer rules must cover exactly the three MVP garments.'
  );

  // 2. Ngũ thân and áo tấc are documented for both male and female wearer profiles.
  for (const garmentId of ['ngu_than_chen', 'ao_tac'] as const) {
    for (const wearer of ['nam', 'nu'] as const) {
      const rule = getWearerCompatibilityRule(garmentId, wearer);
      assert(rule, `Missing wearer rule: ${garmentId}/${wearer}`);
      assert(
        rule.historicalStatus === 'DOCUMENTED',
        `${garmentId}/${wearer} must remain documented in v1.1 draft.`
      );
      assert(
        rule.recommendationPolicy === 'AUTO_ELIGIBLE',
        `${garmentId}/${wearer} should remain auto-eligible when context fits.`
      );
    }
  }

  // 3. Northern/Kinh áo tứ thân male profile must not become historical auto-recommendation.
  const maleTuThan = getWearerCompatibilityRule('ao_tu_than', 'nam');
  assert(maleTuThan, 'Missing male áo tứ thân rule.');
  assert(
    maleTuThan.historicalStatus === 'NOT_ESTABLISHED',
    'Male Northern/Kinh áo tứ thân historical status must remain NOT_ESTABLISHED.'
  );
  assert(
    maleTuThan.recommendationPolicy === 'EXPLICIT_REINTERPRETATION_ONLY',
    'Male Northern/Kinh áo tứ thân must require explicit contemporary reinterpretation.'
  );

  // 4. Female Northern/Kinh áo tứ thân remains historically documented.
  const femaleTuThan = getWearerCompatibilityRule('ao_tu_than', 'nu');
  assert(femaleTuThan?.historicalStatus === 'DOCUMENTED', 'Female áo tứ thân must remain documented.');
  assert(femaleTuThan?.recommendationPolicy === 'AUTO_ELIGIBLE', 'Female áo tứ thân should remain auto-eligible.');

  // 5. No duplicate styling element IDs.
  const ids = STYLING_ELEMENTS_V11.map((x) => x.id);
  assert(new Set(ids).size === ids.length, 'Styling element IDs must be unique.');

  // 6. Hairpin must never become an automatic female default.
  const hairpinProfiles = getStylingProfiles('hairpin_simple', 'ao_tac', 'nu');
  assert(hairpinProfiles.length > 0, 'Hairpin policy must exist for review.');
  assert(
    hairpinProfiles.every((p) => p.autoSelection === 'EXPLICIT_ONLY'),
    'Hairpin must remain explicit-only until garment-specific evidence is approved.'
  );

  // 7. Jade pendant must remain context-restricted.
  const jadeProfiles = getStylingProfiles('jade_pendant', 'ao_tac', 'nam');
  assert(jadeProfiles.length > 0, 'Jade pendant context policy must exist.');
  assert(
    jadeProfiles.every((p) => p.autoSelection === 'EXPLICIT_ONLY'),
    'Jade pendant must not become a generic male áo tấc default.'
  );
  assert(
    jadeProfiles.every((p) => p.socialContexts?.includes('COURT_ELITE')),
    'Jade pendant requires court/elite context in the current draft.'
  );

  // 8. Pearl necklace must not be a historical/default auto-selection.
  const pearl = STYLING_ELEMENTS_V11.find((x) => x.id === 'pearl_necklace');
  assert(pearl, 'Pearl necklace policy missing.');
  assert(
    pearl.profiles.every(
      (p) =>
        p.historicalStatus === 'CONTEMPORARY_REINTERPRETATION' &&
        p.autoSelection === 'EXPLICIT_ONLY'
    ),
    'Pearl necklace must remain explicit contemporary styling.'
  );

  // 9. No-evidence fallback must prefer no accessory over invention.
  assert(
    PRODUCT_POLICY_V11.accessorySelection.noEvidenceFallback.includes('prefer no accessory'),
    'No-evidence fallback must prefer no accessory over invention.'
  );

  console.log('CULTURAL_PRODUCT_RULES_V11_TEST: PASS');
}

run();
