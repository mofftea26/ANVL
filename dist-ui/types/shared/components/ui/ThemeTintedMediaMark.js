import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
import { isSvgEmblemUrl, themeSvgMarkupForTint } from '@/shared/lib/themeSvgMarkup';
export { themeSvgMarkupForTint, isSvgEmblemUrl };
function MediaMarkImage({ src, className, width, height, glow, }) {
    return (_jsx("img", { src: src, alt: "", width: width, height: height, decoding: "async", className: cn('block h-full w-full object-contain opacity-95', className), style: {
            filter: `drop-shadow(0 0 22px color-mix(in srgb, ${glow} 38%, transparent))`,
        } }));
}
function InlineThemedSvgMark({ markup, className, width, height, tint, glow, }) {
    return (_jsx("span", { "aria-hidden": "true", className: cn('inline-flex shrink-0 items-center justify-center', className), style: {
            width,
            height,
            color: tint,
            filter: `drop-shadow(0 0 22px color-mix(in srgb, ${glow} 38%, transparent))`,
        }, children: _jsx("span", { className: "h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full", dangerouslySetInnerHTML: { __html: markup } }) }));
}
/** Renders CMS marks tinted to the active theme via inline SVG or raster fallback. */
export function ThemeTintedMediaMark({ src, themedSvgMarkup, className, width = 96, height = 96, tint = 'var(--color-heading)', glow = 'var(--color-highlight)', }) {
    const trimmed = src.trim();
    if (!trimmed)
        return null;
    if (themedSvgMarkup && isSvgEmblemUrl(trimmed)) {
        return (_jsx(InlineThemedSvgMark, { markup: themedSvgMarkup, className: className, width: width, height: height, tint: tint, glow: glow }));
    }
    if (!isSvgEmblemUrl(trimmed)) {
        return (_jsx("span", { className: cn('inline-flex shrink-0', className), style: { width, height }, children: _jsx(MediaMarkImage, { src: trimmed, width: width, height: height, glow: glow }) }));
    }
    return (_jsx("span", { "aria-hidden": "true", className: cn('inline-flex shrink-0', className), style: { width, height }, children: _jsx(MediaMarkImage, { src: trimmed, width: width, height: height, glow: glow }) }));
}
