import type { ComponentType } from 'react'

import {
  Anvil,
  BookOpen,
  FileText,
  Hourglass,
  Images,
  Info,
  LayoutDashboard,
  Package,
  Palette,
  QrCode,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  Type,
} from '@/shared/icons'

/** Icon component shape shared by the Phosphor seam + the inline Anvil. */
export type AdminNavIcon = ComponentType<{
  size?: number | string
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

/**
 * Top-level admin IA — every surface belongs to exactly one category. The
 * grouping is nav-only: `/admin/*` URLs are flat and unchanged.
 */
export const ADMIN_NAV_CATEGORIES = [
  'Dashboard',
  'Design',
  'Content',
  'Commerce',
  'Passports',
  'Gamification',
  'Media',
  'Settings',
] as const

export type AdminNavCategory = (typeof ADMIN_NAV_CATEGORIES)[number]

/**
 * Category → representative icon for the collapsed icon rail and category
 * landing pages. Kept next to {@link ADMIN_NAV_CATEGORIES} so the rail, the
 * landing tiles, and any future surface share one source.
 */
export const ADMIN_NAV_CATEGORY_ICONS: Record<AdminNavCategory, AdminNavIcon> = {
  Dashboard: LayoutDashboard,
  Design: Palette,
  Content: FileText,
  Commerce: ShoppingBag,
  Passports: QrCode,
  Gamification: Trophy,
  Media: Images,
  Settings: Settings,
}

export interface AdminNavItem {
  label: string
  href: string
  description: string
  category: AdminNavCategory
  icon: AdminNavIcon
  cta: string
  badge: string
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    description: 'Every surface one strike away.',
    category: 'Dashboard',
    icon: LayoutDashboard,
    cta: 'Open',
    badge: 'Overview',
  },
  {
    label: 'Theme & Colors',
    href: '/admin/theme',
    description: 'Site-wide palette and theme mode.',
    category: 'Design',
    icon: Palette,
    cta: 'Edit',
    badge: 'Theme',
  },
  {
    label: 'Fonts',
    href: '/admin/fonts',
    description: 'Heading, body, and display typefaces.',
    category: 'Design',
    icon: Type,
    cta: 'Edit',
    badge: 'Type',
  },
  {
    label: 'Landing Content',
    href: '/admin/content',
    description: 'Per-scene copy overrides with designed defaults.',
    category: 'Content',
    icon: FileText,
    cta: 'Edit',
    badge: 'Copy',
  },
  {
    label: 'About Page',
    href: '/admin/about',
    description:
      'Author the cinematic About page — hero, philosophy, forge process, fun facts, and finale.',
    category: 'Content',
    icon: Anvil,
    cta: 'Edit',
    badge: 'About',
  },
  {
    label: 'Story',
    href: '/admin/story',
    description: 'Author the saga — chapters (drops), acts, and the army cast.',
    category: 'Content',
    icon: BookOpen,
    cta: 'Author',
    badge: 'Saga',
  },
  {
    label: 'Coming Soon',
    href: '/admin/coming-soon',
    description:
      'Pre-launch site mode — toggle the reveal page and author its copy, countdown, early-access capture, assets, and SEO.',
    category: 'Content',
    icon: Hourglass,
    cta: 'Edit',
    badge: 'Launch',
  },
  {
    label: 'Legal',
    href: '/admin/legal',
    description:
      'Privacy, terms, cookies, and accessibility copy — every blank field falls back to the designed default.',
    category: 'Content',
    icon: ShieldCheck,
    cta: 'Edit',
    badge: 'Legal',
  },
  {
    label: 'Support',
    href: '/admin/support',
    description:
      'FAQ, contact, shipping, returns, care, and size guides — every blank field falls back to the designed default.',
    category: 'Content',
    icon: Info,
    cta: 'Edit',
    badge: 'Help',
  },
  {
    label: 'Shop Experience',
    href: '/admin/shop',
    description: 'Shop layout, product cards, filters, and copy.',
    category: 'Commerce',
    icon: ShoppingBag,
    cta: 'Edit',
    badge: 'Shop',
  },
  {
    label: 'Products',
    href: '/admin/products',
    description: 'Per-product detail-page content and editorial assets.',
    category: 'Commerce',
    icon: Package,
    cta: 'Edit',
    badge: 'PDP',
  },
  {
    label: 'Passports',
    href: '/admin/passports',
    description: 'Per-unit QR passports — generate, track claims, print sheets.',
    category: 'Passports',
    icon: QrCode,
    cta: 'Forge',
    badge: 'QR',
  },
  {
    label: 'Gamification',
    href: '/admin/gamification',
    description:
      "Ranks, challenges, Forge XP, and badges — the Armory's progression rules.",
    category: 'Gamification',
    icon: Trophy,
    cta: 'Tune',
    badge: 'Armory',
  },
  {
    label: 'Assets',
    href: '/admin/assets',
    description: 'Media library and slot assignments for general and per-drop use.',
    category: 'Media',
    icon: Images,
    cta: 'Manage',
    badge: 'Media',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    description: 'Session and local reset.',
    category: 'Settings',
    icon: Settings,
    cta: 'Open',
    badge: 'System',
  },
]

export interface AdminNavCategoryGroup {
  category: AdminNavCategory
  items: AdminNavItem[]
}

/** Nav items grouped by category, in the fixed IA order (empty categories dropped). */
export function adminNavCategories(): AdminNavCategoryGroup[] {
  const map = new Map<AdminNavCategory, AdminNavItem[]>()
  for (const item of adminNavItems) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return ADMIN_NAV_CATEGORIES.filter((c) => map.has(c)).map((category) => ({
    category,
    items: map.get(category)!,
  }))
}

/** The nav item owning a pathname (`/admin` exact; others by prefix). */
export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  return adminNavItems.find((item) =>
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
}

/** URL slug for a category landing page (`'Coming Soon'`-style names kebab-case). */
export function adminCategorySlug(category: AdminNavCategory): string {
  return category.toLowerCase().replace(/\s+/g, '-')
}

/** Href of the `/admin/category/$categoryKey` landing page for a category. */
export function adminCategoryHref(category: AdminNavCategory): string {
  return `/admin/category/${adminCategorySlug(category)}`
}

/** Reverse slug lookup — undefined for unknown slugs (caller redirects to `/admin`). */
export function findAdminCategoryBySlug(
  slug: string,
): AdminNavCategoryGroup | undefined {
  const normalized = slug.toLowerCase()
  return adminNavCategories().find(
    (group) => adminCategorySlug(group.category) === normalized,
  )
}

/** The category group owning a pathname — editor pages and category landing pages both resolve. */
export function findAdminCategoryForPathname(
  pathname: string,
): AdminNavCategoryGroup | undefined {
  const categoryMatch = pathname.match(/^\/admin\/category\/([^/]+)/)
  if (categoryMatch) return findAdminCategoryBySlug(categoryMatch[1])
  const item = findAdminNavItem(pathname)
  if (!item) return undefined
  return adminNavCategories().find((group) => group.category === item.category)
}
