import { lazy } from 'react'
import type {
  LandingPageComponent,
  LandingPageDefinition,
  LandingPageMeta,
} from './types'

function lazyPage(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
): LandingPageDefinition['component'] {
  return lazy(async () => {
    const mod = await loader()
    const Component = mod[exportName] as LandingPageComponent | undefined
    if (!Component) {
      throw new Error(`Landing page export "${exportName}" not found`)
    }
    return { default: Component }
  })
}

/**
 * The single source of truth for code-owned landing pages.
 *
 * To add a new landing page:
 *   1. Create `pages/<PascalName>/index.tsx` exporting a component that takes
 *      {@link LandingPageComponentProps}.
 *   2. Add an entry here keyed by a stable slug.
 *   3. (Optional) Activate it from the CMS landing-page picker.
 *
 * See `docs/landing-pages.md`.
 */
export const landingPageRegistry: Record<string, LandingPageDefinition> = {
  'the-oath': {
    key: 'the-oath',
    name: 'Drop 01 — The Oath',
    description:
      'Static cinematic launch experience for ANVL Drop 01 — forge atmosphere, manifesto, tenets, and the first three pieces.',
    previewImage: '/brand/the-oath-shape.svg',
    isAvailable: true,
    component: lazyPage(
      () => import('./pages/TheOathLanding'),
      'TheOathLanding',
    ),
  },
}

/** Fallback key used whenever the CMS key is missing/invalid/unavailable. */
export const DEFAULT_LANDING_PAGE_KEY = 'the-oath'

export function isLandingPageKey(key: string | null | undefined): key is string {
  return typeof key === 'string' && key in landingPageRegistry
}

/**
 * Resolve a CMS key to a concrete, renderable page. Never throws — an unknown
 * or disabled key degrades to the default page so the storefront is never blank.
 */
export function resolveLandingPage(
  key: string | null | undefined,
): LandingPageDefinition {
  if (isLandingPageKey(key) && landingPageRegistry[key].isAvailable) {
    return landingPageRegistry[key]
  }
  return landingPageRegistry[DEFAULT_LANDING_PAGE_KEY]
}

/** Normalize an arbitrary CMS value to a guaranteed-valid registry key. */
export function resolveActiveLandingPageKey(
  rawKey: string | null | undefined,
): string {
  return resolveLandingPage(rawKey).key
}

/** Picker-facing metadata for available pages (no React components). */
export function listLandingPages(): LandingPageMeta[] {
  return Object.values(landingPageRegistry)
    .filter((def) => def.isAvailable)
    .map(({ component: _component, ...meta }) => meta)
}
