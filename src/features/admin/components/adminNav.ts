import type { ComponentType } from 'react'

import {
  Anvil,
  Bell,
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
    description: 'Active drop and CMS shortcuts.',
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
    description: 'Per-scene landing copy with designed defaults.',
    category: 'Content',
    icon: FileText,
    cta: 'Edit',
    badge: 'Copy',
  },
  {
    label: 'About Page',
    href: '/admin/about',
    description: 'Hero, philosophy, forge process, and fun facts copy.',
    category: 'Content',
    icon: Anvil,
    cta: 'Edit',
    badge: 'About',
  },
  {
    label: 'Story',
    href: '/admin/story',
    description: 'Author the saga — chapters, acts, and cast.',
    category: 'Content',
    icon: BookOpen,
    cta: 'Author',
    badge: 'Saga',
  },
  {
    label: 'Banner',
    href: '/admin/banner',
    description: 'Storefront announcement strip above the topbar.',
    category: 'Content',
    icon: Bell,
    cta: 'Edit',
    badge: 'Banner',
  },
  {
    label: 'Coming Soon',
    href: '/admin/coming-soon',
    description: 'Pre-launch site mode and reveal-page content.',
    category: 'Content',
    icon: Hourglass,
    cta: 'Edit',
    badge: 'Launch',
  },
  {
    label: 'Legal',
    href: '/admin/legal',
    description: 'Privacy, terms, cookies, and accessibility copy.',
    category: 'Content',
    icon: ShieldCheck,
    cta: 'Edit',
    badge: 'Legal',
  },
  {
    label: 'Support',
    href: '/admin/support',
    description: 'FAQ, contact, shipping, returns, care, and size guides.',
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
    description: 'Ranks, challenges, Forge XP, and badges — the Armory rules.',
    category: 'Gamification',
    icon: Trophy,
    cta: 'Tune',
    badge: 'Armory',
  },
  {
    label: 'Assets',
    href: '/admin/assets',
    description: 'Upload media and assign slots per drop and page.',
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
