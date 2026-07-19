import { useSyncExternalStore } from 'react'

import { getStorefrontPageSlots } from '@/features/cms/assets/storefrontPageSlots'
import {
  readAssetConfigFromStorage,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  readLandingContentFromStorage,
  subscribeLandingContentChange,
} from '@/features/cms/landingContent/landingContent.settings'
import {
  readActiveLandingPageFromStorage,
  subscribeActiveLandingPageChange,
} from '@/features/cms/landingPageActiveKey.settings'
import {
  readComingSoonConfigFromStorage,
  subscribeComingSoonConfigChange,
} from '@/features/cms/comingSoon/comingSoon.settings'
import {
  readLegalContentFromStorage,
  subscribeLegalContentChange,
} from '@/features/cms/legal/legalContent.settings'
import type { LegalContentConfig } from '@/features/cms/legal/legalContent.zod'
import {
  readSupportContentFromStorage,
  subscribeSupportContentChange,
} from '@/features/cms/support/supportContent.settings'
import type { SupportContentConfig } from '@/features/cms/support/supportContent.zod'
import {
  readPdpContentFromStorage,
  subscribePdpContentChange,
} from '@/features/cms/pdpContent/pdpContent.settings'
import {
  readPassportContentFromStorage,
  subscribePassportContentChange,
} from '@/features/cms/passportContent/passportContent.settings'
import { getDropAssetSlots } from '@/features/landingPages/assetSlots'

/**
 * Cheap, live completion signals for the setup wizards + dashboard strip —
 * every hook reads the same localStorage working copies the editors write
 * (the `AdminSetupChecklist` pattern), so ticks update the moment an editor
 * saves. All snapshots are primitives to keep `useSyncExternalStore` stable.
 * Supabase-relational surfaces (story, QR ledger, gamification) have no cheap
 * local read — their wizard steps stay informational.
 */

const ABOUT_KEY = 'about'

export function useActiveLandingKey(): string {
  return useSyncExternalStore(
    subscribeActiveLandingPageChange,
    () => readActiveLandingPageFromStorage().key,
    () => readActiveLandingPageFromStorage().key,
  )
}

/** Assigned media count for a drop's code-defined slots (total via {@link dropSlotTotal}). */
export function useDropSlotAssignedCount(dropKey: string): number {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => countAssigned(readAssetConfigFromStorage().drops[dropKey], getDropAssetSlots(dropKey)),
    () => 0,
  )
}

export function dropSlotTotal(dropKey: string): number {
  return getDropAssetSlots(dropKey).length
}

/** Assigned media count for the About page's slots (total via {@link aboutSlotTotal}). */
export function useAboutSlotAssignedCount(): number {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () =>
      countAssigned(readAssetConfigFromStorage().pages[ABOUT_KEY], getStorefrontPageSlots(ABOUT_KEY)),
    () => 0,
  )
}

export function aboutSlotTotal(): number {
  return getStorefrontPageSlots(ABOUT_KEY).length
}

function countAssigned(
  assignments: Record<string, string> | undefined,
  slots: ReadonlyArray<{ key: string }>,
): number {
  if (!assignments) return 0
  return slots.filter((slot) => Boolean(assignments[slot.key])).length
}

/** True when the active landing page has saved copy overrides. */
export function useHasLandingContent(activeKey: string): boolean {
  return useSyncExternalStore(
    subscribeLandingContentChange,
    () => Object.keys(readLandingContentFromStorage()[activeKey] ?? {}).length > 0,
    () => false,
  )
}

type AboutSection = 'hero' | 'marquee'

/** True when the About slice carries a saved override for the given section. */
export function useAboutSectionSaved(section: AboutSection): boolean {
  return useSyncExternalStore(
    subscribeLandingContentChange,
    () => {
      const slice = readLandingContentFromStorage()[ABOUT_KEY]
      return slice != null && slice[section] != null
    },
    () => false,
  )
}

/** Number of CMS-authored About orbs (0 = the seven designed defaults). */
export function useAboutOrbCount(): number {
  return useSyncExternalStore(
    subscribeLandingContentChange,
    () => {
      const orbs = readLandingContentFromStorage()[ABOUT_KEY]?.orbs
      return Array.isArray(orbs) ? orbs.length : 0
    },
    () => 0,
  )
}

/** Products with authored PDP editorial content. */
export function usePdpContentCount(): number {
  return useSyncExternalStore(
    subscribePdpContentChange,
    () => Object.keys(readPdpContentFromStorage()).length,
    () => 0,
  )
}

/** Products with authored passport section content. */
export function usePassportContentCount(): number {
  return useSyncExternalStore(
    subscribePassportContentChange,
    () => Object.keys(readPassportContentFromStorage()).length,
    () => 0,
  )
}

/** Whether the Coming Soon site mode currently hides the storefront. */
export function useComingSoonEnabled(): boolean {
  return useSyncExternalStore(
    subscribeComingSoonConfigChange,
    () => readComingSoonConfigFromStorage().enabled,
    () => false,
  )
}

/** True when any legal page carries a saved CMS override (else running on defaults). */
export function isLegalCustomized(config: LegalContentConfig): boolean {
  return Object.values(config.pages).some(
    (page) =>
      page.title.trim().length > 0 ||
      page.intro.trim().length > 0 ||
      page.updatedAt.trim().length > 0 ||
      page.sections.length > 0,
  )
}

/** Whether the Legal content has any CMS override at all. */
export function useLegalCustomized(): boolean {
  return useSyncExternalStore(
    subscribeLegalContentChange,
    () => isLegalCustomized(readLegalContentFromStorage()),
    () => false,
  )
}

/** True when any support page carries a saved CMS override (else running on defaults). */
export function isSupportCustomized(config: SupportContentConfig): boolean {
  const listHasCopy = (list: { intro: string; sections: { heading: string; body: string }[] }) =>
    list.intro.trim().length > 0 || list.sections.length > 0
  return (
    config.faq.intro.trim().length > 0 ||
    config.faq.items.length > 0 ||
    Object.values(config.contact).some((v) => v.trim().length > 0) ||
    listHasCopy(config.shipping) ||
    listHasCopy(config.returns) ||
    config.careGuide.intro.trim().length > 0 ||
    config.careGuide.sections.length > 0 ||
    Object.keys(config.careGuide.perProduct).length > 0 ||
    config.sizeGuide.intro.trim().length > 0 ||
    config.sizeGuide.note.trim().length > 0 ||
    Object.keys(config.sizeGuide.perProduct).length > 0
  )
}

/** Whether the Support content has any CMS override at all. */
export function useSupportCustomized(): boolean {
  return useSyncExternalStore(
    subscribeSupportContentChange,
    () => isSupportCustomized(readSupportContentFromStorage()),
    () => false,
  )
}
