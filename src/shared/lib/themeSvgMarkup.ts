/**
 * Sanitize a CMS-supplied SVG for inline rendering, then coerce fills/strokes
 * to `currentColor` for theme tinting.
 *
 * SECURITY: the output of this function is passed to `dangerouslySetInnerHTML`
 * (`ThemeTintedMediaMark`, the landing entry emblem), and the input is an SVG
 * file from the `cms-media` bucket — writable by any `editor`. Everything that
 * can execute script therefore has to come out here. Stripping `<script>` alone
 * is NOT sufficient: `<svg onload=…>`, `<foreignObject>`, SMIL `onbegin`, and
 * `href="javascript:…"` all run without a single `<script>` tag.
 *
 * Removed, in order:
 *   1. `<script>` blocks.
 *   2. `<foreignObject>` blocks — they embed arbitrary HTML.
 *   3. Every `on*` event-handler attribute, quoted or bare.
 *   4. `javascript:` / `data:text/html` in any `href` / `xlink:href`.
 *   5. `<use>` / `<image>` references to another origin.
 *
 * `<style>` is deliberately KEPT: CSS alone cannot execute script in modern
 * browsers, and removing it would visibly change legitimate marks.
 *
 * This runs during SSR on `workerd`, where there is no `DOMParser`, so it is
 * necessarily string-based. It is defence-in-depth, not a substitute for
 * trusting the upload path — the durable fix is to stop inlining CMS SVGs
 * altogether (render `<img src>`) or to sanitize with a real parser.
 */
export function themeSvgMarkupForTint(svg: string): string {
  let safe = svg.replace(/<script[\s\S]*?<\/script>/gi, '')
  // Unclosed/again-nested `<script` fragments that survived the paired strip.
  safe = safe.replace(/<\s*\/?\s*script\b[^>]*>/gi, '')
  safe = safe.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
  safe = safe.replace(/<\s*\/?\s*foreignObject\b[^>]*>/gi, '')
  // Event handlers: on<name>="…" | on<name>='…' | on<name>=bare
  safe = safe.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
  safe = safe.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
  safe = safe.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
  // Script-bearing or cross-origin URL references.
  safe = safe.replace(
    /\s(?:xlink:)?href\s*=\s*("|')\s*(?:javascript|data:text\/html)[^"']*\1/gi,
    '',
  )
  safe = safe.replace(/\s(?:xlink:)?href\s*=\s*("|')\s*https?:\/\/[^"']*\1/gi, '')
  safe = safe.replace(
    /<svg\b/i,
    '<svg focusable="false" aria-hidden="true" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"',
  )
  safe = safe.replace(
    /\bfill="(?!none|transparent|currentColor)[^"]*"/gi,
    'fill="currentColor"',
  )
  safe = safe.replace(
    /\bstroke="(?!none|transparent|currentColor)[^"]*"/gi,
    'stroke="currentColor"',
  )
  safe = safe.replace(/fill:\s*#[0-9a-fA-F]{3,8}/gi, 'fill:currentColor')
  return safe
}

export function isSvgEmblemUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('data:image/svg')) return true
  try {
    const { pathname } = new URL(trimmed, 'https://local.invalid')
    return pathname.toLowerCase().endsWith('.svg')
  } catch {
    return /\.svg(?:$|[?#])/i.test(trimmed)
  }
}
