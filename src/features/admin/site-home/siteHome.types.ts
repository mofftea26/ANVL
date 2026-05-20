import { z } from 'zod'
import {
  storefrontCampaignSchema,
  storefrontLookbookItemSchema,
  type StorefrontCampaign,
  type StorefrontLookbookItem,
} from '@/features/cms/api/publicStorefrontPublication'

export type SiteHomeExtrasContent = {
  campaigns: StorefrontCampaign[]
  lookbook: StorefrontLookbookItem[]
  updatedAt: string
}

export const siteHomeExtrasSchema = z.object({
  campaigns: z.array(storefrontCampaignSchema),
  lookbook: z.array(storefrontLookbookItemSchema),
  updatedAt: z.string(),
})

export const SITE_HOME_EXTRAS_VERSION = 1
