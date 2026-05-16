import { z } from 'zod'

export interface NavigationItem {
  id: string
  label: string
  href: string
  sortOrder: number
  isVisible: boolean
  children?: NavigationItem[]
}

export const navigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    href: z.string(),
    sortOrder: z.number(),
    isVisible: z.boolean(),
    children: z.array(navigationItemSchema).optional(),
  }),
)
