/** Strip scripts and coerce fills/strokes to `currentColor` for theme tinting. */
export function themeSvgMarkupForTint(svg) {
    let safe = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
    safe = safe.replace(/<svg\b/i, '<svg focusable="false" aria-hidden="true" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
    safe = safe.replace(/\bfill="(?!none|transparent|currentColor)[^"]*"/gi, 'fill="currentColor"');
    safe = safe.replace(/\bstroke="(?!none|transparent|currentColor)[^"]*"/gi, 'stroke="currentColor"');
    safe = safe.replace(/fill:\s*#[0-9a-fA-F]{3,8}/gi, 'fill:currentColor');
    return safe;
}
export function isSvgEmblemUrl(url) {
    const trimmed = url.trim();
    if (!trimmed)
        return false;
    if (trimmed.startsWith('data:image/svg'))
        return true;
    try {
        const { pathname } = new URL(trimmed, 'https://local.invalid');
        return pathname.toLowerCase().endsWith('.svg');
    }
    catch {
        return /\.svg(?:$|[?#])/i.test(trimmed);
    }
}
