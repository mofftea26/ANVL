import { useEffect, useState } from 'react'
import type { AdminNavCategory } from '@/features/admin/components/adminNav'
import { ADMIN_NAV_CATEGORIES, adminNavCategories } from '@/features/admin/components/adminNav'
import { categoryIsActive } from '@/features/admin/components/adminSidebarActive'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'

const SIDEBAR_CATS_KEY = ADMIN_STORAGE_KEYS.sidebarCats

export type ExpandedCats = Record<string, boolean>

/** All categories expanded — the server/first-paint default. */
function allExpanded(): ExpandedCats {
  return Object.fromEntries(ADMIN_NAV_CATEGORIES.map((c) => [c, true]))
}

/** Stored expanded set (JSON array of category names) — null when unset/invalid. */
function readExpandedCats(): ExpandedCats | null {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_CATS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const expanded: ExpandedCats = Object.fromEntries(
      ADMIN_NAV_CATEGORIES.map((c) => [c, false]),
    )
    for (const entry of parsed) {
      if (typeof entry === 'string' && entry in expanded) expanded[entry] = true
    }
    return expanded
  } catch {
    return null
  }
}

function persistExpandedCats(expanded: ExpandedCats) {
  try {
    window.localStorage.setItem(
      SIDEBAR_CATS_KEY,
      JSON.stringify(ADMIN_NAV_CATEGORIES.filter((c) => expanded[c])),
    )
  } catch {
    // Preference only — safe to drop when storage is unavailable.
  }
}

/**
 * Collapsible sidebar category sections (expanded + drawer densities). Default
 * all expanded on server + first paint; the stored preference applies
 * post-mount with the active item's category force-expanded so it is never
 * hidden.
 */
export function useAdminSidebarExpandedCats() {
  const [expandedCats, setExpandedCats] = useState<ExpandedCats>(allExpanded)

  useEffect(() => {
    const stored = readExpandedCats()
    if (!stored) return
    const activeGroup = adminNavCategories().find(({ category, items }) =>
      categoryIsActive(window.location.pathname, category, items),
    )
    if (activeGroup) stored[activeGroup.category] = true
    setExpandedCats(stored)
    // Mount-only (reads window.location directly): later navigation must not
    // re-open sections the user deliberately closed.
  }, [])

  const toggleCategory = (category: AdminNavCategory) => {
    setExpandedCats((prev) => {
      const next = { ...prev, [category]: !prev[category] }
      persistExpandedCats(next)
      return next
    })
  }

  return { expandedCats, toggleCategory }
}
