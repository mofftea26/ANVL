import type { LandingAct } from '@/features/cms/landing/landingActs.types'

/** Drop-level campaign marks used when an act has no dedicated emblem asset. */
export function resolveActCampaignMarkSrc(input: {
  row?: LandingAct
  dropEmblemSrc?: string
  dropWordmarkSrc?: string
  globalFallbackSrc?: string
}): string | undefined {
  const emblem = input.dropEmblemSrc?.trim()
  const wordmark = input.dropWordmarkSrc?.trim()
  const preferWordmark = input.row?.campaignMarkFallback === 'wordmark'
  if (preferWordmark && wordmark) return wordmark
  if (emblem) return emblem
  if (wordmark) return wordmark
  return input.globalFallbackSrc?.trim() || undefined
}
