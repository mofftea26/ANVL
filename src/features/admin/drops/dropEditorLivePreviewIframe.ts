/**
 * Minimal scaffold for CMS drop iframe preview (`<iframe srcDoc>`).
 * Keeps `data-anvl-drop-editor-live-preview` on `<html>` so regressions/tests can detect the stub string.
 *
 * Bootstrap code clears `<head>` and repopulates it; the marker survives on `document.documentElement`.
 */
export const DROP_EDITOR_PREVIEW_IFRAME_SRCDOC =
  '<!doctype html><html lang="en" data-anvl-drop-editor-live-preview><head></head><body></body></html>'

/**
 * SrcDoc iframes are often usable at `interactive` (DOM & head/body parsed) before `complete`.
 * Waiting only for `complete` + attaching `load` after that point can strand the bootstrap if the
 * load event fired before listeners were attached.
 */
export function isDropEditorPreviewIframeDocumentReady(
  doc: Document | null | undefined,
): doc is Document {
  if (!doc?.body || !doc.head) return false
  const rs = doc.readyState
  if (rs === 'complete' || rs === 'interactive') return true
  /**
   * Srcdoc documents occasionally report `loading` even after `<html>` is parsed.
   * Our stub marks `<html data-anvl-drop-editor-live-preview>`; once that exists,
   * cloning head + portaling into `body` is safe — waiting only for `interactive`
   * stranded the CMS preview (blank iframe) in some engines.
   */
  if (rs === 'loading') {
    return doc.documentElement?.hasAttribute(
      'data-anvl-drop-editor-live-preview',
    )
  }
  return false
}
