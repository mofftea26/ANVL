export interface AdminNavItem {
  label: string
  href: string
  description: string
  cluster: string
  cta: string
  badge: string
}

/** Primary destinations; sidebar groups by `cluster`. */
export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    description: 'Shortcuts to every CMS surface.',
    cluster: 'Workspace',
    cta: 'Open',
    badge: 'Overview',
  },
  {
    label: 'Drops',
    href: '/admin/drops',
    description: 'Campaign landing, acts, theme, products.',
    cluster: 'Campaigns',
    cta: 'Manage',
    badge: 'Campaigns',
  },
  {
    label: 'Products',
    href: '/admin/products',
    description: 'Catalog SKUs and drop links.',
    cluster: 'Catalog',
    cta: 'Open',
    badge: 'Catalog',
  },
  {
    label: 'Website layout',
    href: '/admin/website-layout',
    description: 'Header, footer, nav, announcement.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'Global',
  },
  {
    label: 'Media',
    href: '/admin/media',
    description: 'Shared asset library for uploads.',
    cluster: 'Site',
    cta: 'Browse',
    badge: 'Assets',
  },
  {
    label: 'SEO',
    href: '/admin/seo',
    description: 'Site and page metadata.',
    cluster: 'Site',
    cta: 'Edit',
    badge: 'Discovery',
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

const CLUSTER_ORDER = ['Workspace', 'Campaigns', 'Catalog', 'Site'] as const

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
