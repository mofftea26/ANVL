import type { AdminNavCategory, AdminNavItem } from '@/features/admin/components/adminNav'
import { adminCategoryHref } from '@/features/admin/components/adminNav'

/** Whether `pathname` is the given nav href or a route nested under it. */
export function pathIsActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

/** Whether the pathname belongs to a category (any of its editors or its landing page). */
export function categoryIsActive(
  pathname: string,
  category: AdminNavCategory,
  items: AdminNavItem[],
) {
  if (pathIsActive(pathname, adminCategoryHref(category))) return true
  return items.some((item) => pathIsActive(pathname, item.href))
}
