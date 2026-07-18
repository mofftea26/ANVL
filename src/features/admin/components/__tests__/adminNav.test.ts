import { describe, expect, it } from 'vitest'

import {
  ADMIN_NAV_CATEGORIES,
  adminNavCategories,
  adminNavItems,
  findAdminNavItem,
} from '@/features/admin/components/adminNav'

/** Every admin surface must be reachable from the nav — one entry per route. */
const EXPECTED_HREFS = [
  '/admin',
  '/admin/theme',
  '/admin/fonts',
  '/admin/content',
  '/admin/about',
  '/admin/story',
  '/admin/coming-soon',
  '/admin/shop',
  '/admin/products',
  '/admin/passports',
  '/admin/gamification',
  '/admin/assets',
  '/admin/settings',
]

describe('adminNav', () => {
  it('covers every admin surface exactly once, no dead hrefs', () => {
    const hrefs = adminNavItems.map((i) => i.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(hrefs.sort()).toEqual([...EXPECTED_HREFS].sort())
  })

  it('assigns every item to a known category', () => {
    for (const item of adminNavItems) {
      expect(ADMIN_NAV_CATEGORIES).toContain(item.category)
      expect(item.icon).toBeTruthy()
    }
  })

  it('groups categories in the fixed IA order', () => {
    const groups = adminNavCategories()
    const order = groups.map((g) => g.category)
    const expectedOrder = ADMIN_NAV_CATEGORIES.filter((c) => order.includes(c))
    expect(order).toEqual(expectedOrder)
    // Every item survives grouping.
    expect(groups.flatMap((g) => g.items)).toHaveLength(adminNavItems.length)
  })

  it('findAdminNavItem matches exact and nested paths', () => {
    expect(findAdminNavItem('/admin')?.label).toBe('Dashboard')
    expect(findAdminNavItem('/admin/theme')?.label).toBe('Theme & Colors')
    expect(findAdminNavItem('/admin/passports')?.category).toBe('Passports')
    // Nested path resolves to its section, never to the dashboard.
    expect(findAdminNavItem('/admin/story/anything')?.label).toBe('Story')
    expect(findAdminNavItem('/not-admin')).toBeUndefined()
  })
})
