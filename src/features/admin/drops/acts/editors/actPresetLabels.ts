/** Human labels for hero presets in the acts builder. */
export const HERO_PRESET_LABELS: Record<string, string> = {
  theOathCinematic: 'The Oath cinematic',
  splitProduct: 'Split product hero',
  minimalEmblem: 'Minimal emblem hero',
}

export function heroPresetLabel(preset: string): string {
  return HERO_PRESET_LABELS[preset] ?? preset
}

export function isCinematicHeroPreset(preset: string): boolean {
  return preset === 'theOathCinematic'
}
