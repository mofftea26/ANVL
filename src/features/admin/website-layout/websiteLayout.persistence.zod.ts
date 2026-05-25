import { z } from 'zod'

/**
 * Persistence Zod schema for the global website layout (audit SEC-07 /
 * Phase C2). Used by websiteLayout.service.ts to reject tampered or
 * stale-schema localStorage blobs before merge.
 *
 * Mirrors the WebsiteLayoutContent shape from websiteLayout.types.ts.
 * Tolerant on optional fields and unknown extras (passthrough) so a
 * forward-compatible field doesn't blow up older clients, but strict on
 * shape and types the rest of the admin runtime consumes.
 */

const cmsLinkItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  isVisible: z.boolean(),
})

const websiteAnnouncementBarSchema = z.object({
  enabled: z.boolean(),
  message: z.string(),
  href: z.string().optional(),
})

const websiteHeaderSchema = z.object({
  logoStackedSrc: z.string().optional(),
  loadingEmblemSrc: z.string().optional(),
  logoMediaAssetId: z.string().optional(),
  cartVisible: z.boolean(),
  announcement: websiteAnnouncementBarSchema,
  headerLinks: z.array(cmsLinkItemSchema),
  mobileExtraLinks: z.array(cmsLinkItemSchema),
})

const websiteFooterLinkGroupSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  links: z.array(cmsLinkItemSchema),
})

const websiteSocialLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
})

const websiteFooterSchema = z.object({
  logoStackedSrc: z.string().optional(),
  logoMediaAssetId: z.string().optional(),
  decorativeEmblemFallbackSrc: z.string().optional(),
  tagline: z.string(),
  microCaption: z.string(),
  linkGroups: z.array(websiteFooterLinkGroupSchema),
  newsletterTitle: z.string(),
  newsletterPlaceholder: z.string(),
  newsletterButtonText: z.string(),
  socialLinks: z.array(websiteSocialLinkSchema),
  copyrightText: z.string().optional(),
})

export const persistedWebsiteLayoutSchema = z.object({
  version: z.number(),
  updatedAt: z.string(),
  header: websiteHeaderSchema,
  footer: websiteFooterSchema,
})
