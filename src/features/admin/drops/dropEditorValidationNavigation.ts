import type { DropFieldErrors } from '@/features/admin/drops/drops.editor.validation'
import type { TabId } from '@/features/admin/drops/dropEditorRoute.shared'

const TAB_ORDER: TabId[] = ['basics', 'theme', 'landing', 'products', 'seo']

const FIELD_TAB: Array<{ prefix: string; tab: TabId }> = [
  { prefix: 'basics.', tab: 'basics' },
  { prefix: 'theme.', tab: 'theme' },
  { prefix: 'visuals.', tab: 'basics' },
  { prefix: 'landing.', tab: 'landing' },
  { prefix: 'products.', tab: 'products' },
  { prefix: 'seo.', tab: 'seo' },
]

export function resolveFirstValidationTarget(
  errors: DropFieldErrors,
): { tab: TabId; fieldKey: string } | null {
  const keys = Object.keys(errors.fields)
  if (keys.length === 0) return null

  for (const { prefix, tab } of FIELD_TAB) {
    const fieldKey = keys.find((k) => k.startsWith(prefix))
    if (fieldKey) return { tab, fieldKey }
  }

  const fallbackKey = keys[0]
  const tab =
    TAB_ORDER.find((t) =>
      FIELD_TAB.some((m) => m.tab === t && fallbackKey.startsWith(m.prefix)),
    ) ?? 'basics'
  return { tab, fieldKey: fallbackKey }
}

export function scrollToDropEditorField(fieldKey: string): void {
  if (typeof document === 'undefined') return
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-drop-field="${fieldKey}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}
