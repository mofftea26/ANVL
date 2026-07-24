import { describe, expect, it } from 'vitest'

import {
  ADMIN_NAV_CATEGORIES,
  ADMIN_NAV_CATEGORY_ICONS,
  adminCategoryHref,
  adminCategorySlug,
  adminNavCategories,
  adminNavItems,
  findAdminCategoryBySlug,
  findAdminCategoryForPathname,
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
  '/admin/legal',
  '/admin/support',
  '/admin/shop',
  '/admin/products',
  '/admin/passports',
  '/admin/gamification',
  '/admin/assets',
  '/admin/analytics',
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

  it('maps every category to a rail icon', () => {
    for (const category of ADMIN_NAV_CATEGORIES) {
      expect(ADMIN_NAV_CATEGORY_ICONS[category]).toBeTruthy()
    }
  })

  it('round-trips category slugs for landing-page URLs', () => {
    expect(adminCategorySlug('Design')).toBe('design')
    expect(adminCategoryHref('Content')).toBe('/admin/category/content')
    for (const category of ADMIN_NAV_CATEGORIES) {
      const slug = adminCategorySlug(category)
      // URL-safe: lowercase kebab, no spaces.
      expect(slug).toMatch(/^[a-z0-9-]+$/)
      expect(findAdminCategoryBySlug(slug)?.category).toBe(category)
    }
    expect(findAdminCategoryBySlug('not-a-category')).toBeUndefined()
  })

  it('resolves the owning category for editor and category-landing pathnames', () => {
    expect(findAdminCategoryForPathname('/admin/theme')?.category).toBe('Design')
    expect(findAdminCategoryForPathname('/admin/category/content')?.category).toBe(
      'Content',
    )
    expect(findAdminCategoryForPathname('/admin/category/nope')).toBeUndefined()
    expect(findAdminCategoryForPathname('/somewhere-else')).toBeUndefined()
  })
})
