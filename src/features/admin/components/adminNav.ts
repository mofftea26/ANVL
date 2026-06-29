export interface AdminNavItem {
  label: string
  href: string
  description: string
  cluster: string
  cta: string
  badge: string
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    description: 'Active drop and CMS shortcuts.',
    cluster: 'Workspace',
    cta: 'Open',
    badge: 'Overview',
  },
  {
    label: 'Theme & Colors',
    href: '/admin/theme',
    description: 'Site-wide palette and theme mode.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'Theme',
  },
  {
    label: 'Fonts',
    href: '/admin/fonts',
    description: 'Heading, body, and display typefaces.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'Type',
  },
  {
    label: 'Assets',
    href: '/admin/assets',
    description: 'Upload media and assign slots per drop.',
    cluster: 'Site',
    cta: 'Manage',
    badge: 'Media',
  },
  {
    label: 'Shop Experience',
    href: '/admin/shop',
    description: 'Shop layout, product cards, filters, and copy.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'Shop',
  },
  {
    label: 'Products',
    href: '/admin/products',
    description: 'Per-product detail-page content and editorial assets.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'PDP',
  },
  {
    label: 'Landing Content',
    href: '/admin/content',
    description: 'Per-scene landing copy with designed defaults.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'Copy',
  },
  {
    label: 'Story',
    href: '/admin/story',
    description: 'Author the saga — chapters, acts, and cast.',
    cluster: 'Site',
    cta: 'Author',
    badge: 'Saga',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    description: 'Session and local reset.',
    cluster: 'Workspace',
    cta: 'Open',
    badge: 'System',
  },
]

const CLUSTER_ORDER = ['Workspace', 'Site'] as const

export function adminNavItemsByCluster(): {
  cluster: string
  items: AdminNavItem[]
}[] {
  const map = new Map<string, AdminNavItem[]>()
  for (const item of adminNavItems) {
    const list = map.get(item.cluster) ?? []
    list.push(item)
    map.set(item.cluster, list)
  }
  return CLUSTER_ORDER.filter((c) => map.has(c)).map((cluster) => ({
    cluster,
    items: map.get(cluster)!,
  }))
}
