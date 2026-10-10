/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Shared Blueprint Color Mutation Helper
 *
 * Implements deterministic PRIMARY palette updates grounded in PALETTES from canonical catalog.
 * Used by:
 * - handleApplyAction in App.tsx (SET_COLOR action fallback)
 * - handleSelectPaletteColor in Section2Blueprint.tsx (Direct color picker in Step 2)
 */

import { BlueprintOutput } from '../types/index';
import { PALETTES, PaletteOption } from '../data/canonicalCatalog';

export function mutateBlueprintPrimaryColor(
  currentBlueprint: BlueprintOutput,
  targetPaletteId: string,
  origin: 'USER_REQUESTED' | 'AC_SUGGESTED' = 'USER_REQUESTED'
): BlueprintOutput {
  const updated: BlueprintOutput = JSON.parse(JSON.stringify(currentBlueprint));
  const pal = PALETTES.find(p => p.id === targetPaletteId);
  if (!pal) return updated;

  const primaryIdx = updated.remixProposal.palette.findIndex(c => c.role === 'PRIMARY');
  const newPaletteItem = {
    id: pal.id,
    hex: pal.hex,
    name: pal.name,
    role: 'PRIMARY' as const,
    origin
  };

  if (primaryIdx !== -1) {
    updated.remixProposal.palette[primaryIdx] = newPaletteItem;
  } else if (updated.remixProposal.palette.length > 0) {
    updated.remixProposal.palette[0] = newPaletteItem;
  } else {
    updated.remixProposal.palette.push(newPaletteItem);
  }

  return updated;
}
