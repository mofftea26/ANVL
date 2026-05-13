export interface AdminNavItem {
  label: string
  href: string
  description?: string
}

export interface AdminNavGroup {
  label: string
  items: AdminNavItem[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        description: 'High-level controls for drops, catalog, and layout',
      },
    ],
  },
  {
    label: 'Drops',
    items: [
      {
        label: 'All drops',
        href: '/admin/drops',
        description: 'Create, edit, preview, and activate drops',
      },
      {
        label: 'New drop',
        href: '/admin/drops/new',
        description: 'Guided flow for a new landing configuration',
      },
    ],
  },
  {
    label: 'Products',
    items: [
      {
        label: 'Catalog',
        href: '/admin/products',
        description: 'Global inventory shared across drops',
      },
      {
        label: 'New product',
        href: '/admin/products/new',
        description: 'Colors, sizes, pricing, availability matrix',
      },
    ],
  },
  {
    label: 'Site',
    items: [
      {
        label: 'Website layout',
        href: '/admin/website-layout',
        description: 'Header, footer, navigation, newsletter',
      },
      {
        label: 'Theme & brand',
        href: '/admin/theme',
        description: 'Fallback emblem and loader preferences',
      },
      {
        label: 'SEO hub',
        href: '/admin/seo',
        description: 'Where homepage and drop SEO are authored',
      },
    ],
  },
]
