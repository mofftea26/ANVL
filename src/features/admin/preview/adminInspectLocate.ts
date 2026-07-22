import { toast } from 'sonner'

import {
  resolvePreviewTargetToEditor,
  type PreviewEditorRoute,
} from '@/features/cms/preview'

import { flashEditorAnchor, waitForEditorAnchor } from './adminEditorHighlight'

export type InspectLocateResult = 'located' | 'navigated' | 'unmapped'

/**
 * `/admin/shop` owns `/admin/shop` and `/admin/shop/…`, not `/admin/shopfoo`.
 * The dashboard (`/admin`) is exact-match only — every editor lives under it,
 * so a prefix match would claim the whole admin.
 */
function isOnEditorRoute(adminPath: string, editorRoute: PreviewEditorRoute): boolean {
  if (editorRoute === '/admin') {
    return adminPath === '/admin' || adminPath === '/admin/'
  }
  return adminPath === editorRoute || adminPath.startsWith(`${editorRoute}/`)
}

/**
 * Locate-in-editor for an inspect-click: resolve the clicked storefront
 * target to its owning admin editor. Same page → scroll + flash + focus the
 * anchoring control. Different page → navigate, wait for the (lazy) editor
 * to mount the anchor, then flash. Unmapped ids degrade to an info toast.
 * Inspect mode itself stays on — the user turns it off explicitly.
 */
export function locatePreviewTargetInEditor(options: {
  targetId: string
  currentAdminPath: string
  navigate: (to: PreviewEditorRoute) => void
}): InspectLocateResult {
  const match = resolvePreviewTargetToEditor(options.targetId)
  if (!match) {
    toast.info('No editor field maps to that element.')
    return 'unmapped'
  }

  if (isOnEditorRoute(options.currentAdminPath, match.adminRoute)) {
    flashEditorAnchor(match.anchorId)
    return 'located'
  }

  options.navigate(match.adminRoute)
  void waitForEditorAnchor(match.anchorId).then((el) => {
    // Timeout → stay silent: the right editor page is open, which is the
    // useful part; the anchor may simply not exist for this exact field.
    if (el) flashEditorAnchor(match.anchorId)
  })
  return 'navigated'
}
