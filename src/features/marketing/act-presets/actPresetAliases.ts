/** Maps legacy preset ids to oath-only presets (migration). */
export const ACT_PRESET_ALIASES: Record<string, string> = {
  oathStampLedger: 'oathTenetLedger',
  monolithReveal: 'oathMonolithReveal',
  countdownTrio: 'oathMonolithReveal',
  emblemFirst: 'oathMonolithReveal',
  threeCardEditorial: 'oathEditorialThree',
  gridSix: 'oathEditorialThree',
  carousel: 'oathProductRail',
  productStory: 'oathHeroProduct',
  fabricRunway: 'oathMaterialFlip',
  specsGrid: 'oathMaterialFlip',
  splitDetail: 'oathMaterialFlip',
  chapterScroll: 'oathNarrativeScroll',
  editorialArticle: 'oathNarrativeScroll',
  imageLed: 'oathNarrativeScroll',
  eventCard: 'oathEventPulse',
  countdownEvent: 'oathEventPulse',
  locationSplit: 'oathEventPulse',
  centered: 'oathForgeClose',
  footerOverlap: 'oathForgeClose',
  productCta: 'oathForgeClose',
  oathFullWidthForm: 'oathForgeClose',
  minimalForm: 'oathForgeClose',
  splitForm: 'oathForgeClose',
  splitProduct: 'productHero',
  minimalEmblem: 'standardHero',
  theOathCinematic: 'editorialHero',
  'cinematic-full-screen': 'cinematicScrollHero',
  splitText: 'oathTenetLedger',
  scrollStacked: 'oathTenetLedger',
}

export function resolvePresetAlias(preset: string | undefined): string | undefined {
  if (!preset?.trim()) return preset
  return ACT_PRESET_ALIASES[preset.trim()] ?? preset.trim()
}
