/**
 * Higgsfield-generated dark card backgrounds for the account bento (downloaded
 * to /public/account). Near-black so foreground text stays legible; each card
 * picks one by key. Falls back to a CSS gradient if the asset is missing.
 */
export const ACCOUNT_CARD_BG = {
  steel: '/account/steel.webp',
  carbon: '/account/carbon.webp',
  ember: '/account/ember.webp',
  stone: '/account/stone.webp',
  smoke: '/account/smoke.webp',
  gold: '/account/gold.webp',
} as const

export type AccountCardBgKey = keyof typeof ACCOUNT_CARD_BG

export function accountCardBg(key: AccountCardBgKey): string {
  return ACCOUNT_CARD_BG[key]
}
