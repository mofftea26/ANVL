import type { ComponentType, LazyExoticComponent } from 'react'
import type { Product } from '@/features/products/types/product.types'

/**
 * New landing-page architecture.
 *
 * Landing pages are *static, code-owned cinematic experiences* — one folder
 * per page under `pages/`. The CMS no longer composes landing sections; it only
 * stores which coded page is active (`activeLandingPageKey`). The storefront
 * resolves that key against the {@link landingPageRegistry} and renders the
 * matching component, falling back to the default page when the key is missing
 * or invalid.
 *
 * This replaces the legacy drop-builder "acts" system on the public home route.
 */

/** Props every landing page component receives from the storefront shell. */
export interface LandingPageComponentProps {
  /**
   * Live storefront products (Supabase/Shopify-published when configured, else
   * the seed/mock catalog). Pages decide how many to surface; they must render
   * gracefully when the array is empty by using their own static fallback copy.
   */
  products: Product[]
}

export type LandingPageComponent = ComponentType<LandingPageComponentProps>

/**
 * Registry entry. The `component` is lazy so only the active page's chunk ships
 * to the browser (mirrors the act-preset `lazyPreset()` pattern).
 */
export interface LandingPageDefinition {
  /** Stable slug stored in the CMS (`cms_settings.activeLandingPageKey`). */
  key: string
  /** Human label for the CMS picker. */
  name: string
  /** Short description for the CMS picker. */
  description: string
  /** Preview thumbnail shown in the CMS picker (path under `public/`). */
  previewImage: string
  /** When false, the page is hidden from the picker and never resolved. */
  isAvailable: boolean
  component: LazyExoticComponent<LandingPageComponent>
}

/** Metadata-only projection (no React component) for CMS picker UIs + sync. */
export type LandingPageMeta = Omit<LandingPageDefinition, 'component'>
