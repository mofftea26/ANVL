import { isSvgEmblemUrl, themeSvgMarkupForTint } from '@/shared/lib/themeSvgMarkup';
export { themeSvgMarkupForTint, isSvgEmblemUrl };
export type ThemeTintedMediaMarkProps = {
    src: string;
    /** Pre-themed inline SVG — renders colored on first paint (from SSR loader). */
    themedSvgMarkup?: string | null;
    className?: string;
    width?: number;
    height?: number;
    /** Tint for SVG marks via `currentColor`. */
    tint?: string;
    /** Soft glow using theme ember/accent. */
    glow?: string;
};
/** Renders CMS marks tinted to the active theme via inline SVG or raster fallback. */
export declare function ThemeTintedMediaMark({ src, themedSvgMarkup, className, width, height, tint, glow, }: ThemeTintedMediaMarkProps): import("react/jsx-runtime").JSX.Element | null;
