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
    description: 'Signed-in overview and links into every CMS surface.',
    cluster: 'Workspace',
    cta: 'Open dashboard',
    badge: 'Overview',
  },
  {
    label: 'Drops',
    href: '/admin/drops',
    description:
      'Campaign landing content, acts, theme, and which SKUs appear in the drop story.',
    cluster: 'Campaigns',
    cta: 'Manage drops',
    badge: 'Campaigns',
  },
  {
    label: 'Products',
    href: '/admin/products',
    description:
      'Catalog in Shopify when Storefront API is configured; otherwise local admin matrix.',
    cluster: 'Catalog',
    cta: 'Open catalog',
    badge: 'Catalog',
  },
  {
    label: 'Website layout',
    href: '/admin/website-layout',
    description: 'Header, footer, navigation, newsletter, and announcement bar.',
    cluster: 'Site',
    cta: 'Edit layout',
    badge: 'Global',
  },
  {
    label: 'Theme & brand',
    href: '/admin/theme',
    description: 'Fallback emblem paths before an active drop hydrates.',
    cluster: 'Site',
    cta: 'Brand settings',
    badge: 'Fallback',
  },
  {
    label: 'SEO',
    href: '/admin/seo',
    description: 'Homepage and drop metadata; deep pages inherit commerce defaults.',
    cluster: 'Site',
    cta: 'SEO overview',
    badge: 'Discovery',
  },
  {
    label: 'Media',
    href: '/admin/media',
    description:
      'Where imagery attaches today: drop visuals, product galleries, layout, and SEO fields.',
    cluster: 'Site',
    cta: 'Media guide',
    badge: 'Assets',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    description: 'Session details and destructive reset of local dev CMS data.',
    cluster: 'Workspace',
    cta: 'Settings',
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
