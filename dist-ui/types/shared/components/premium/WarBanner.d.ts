import { type ReactNode } from 'react';
interface WarBannerProps {
    /** Duotone base behind the media / placeholder. */
    tone?: string;
    /** Image URL. When absent, a duotone plane + emblem placeholder renders. */
    media?: string;
    /** How the media fills the fabric body. `cover` crops to fill (default); `contain` fits the whole image with no cropping. */
    mediaFit?: 'cover' | 'contain';
    alt?: string;
    /** Small heraldic label pinned to the crossbar (e.g. a piece role / numeral). */
    label?: ReactNode;
    /** Content overlaid on the fabric body (name, price, CTA). */
    children?: ReactNode;
    /** Idle hanging sway (motion-safe; auto-disabled under reduced motion). */
    sway?: boolean;
    /** Emblem shown when there is no media. Defaults to the Drop 01 shape. */
    placeholderSrc?: string;
    /** Pre-themed inline SVG for the placeholder — renders tinted on first paint. */
    placeholderThemedMarkup?: string | null;
    /** Override placeholder emblem layout (e.g. taller stacked lockup). */
    placeholderEmblemClassName?: string;
    placeholderWidth?: number;
    placeholderHeight?: number;
    /** Custom inline mark (e.g. themed React SVG) instead of a placeholder URL. */
    placeholderMark?: ReactNode;
    /** Aspect ratio of the fabric body. Defaults to a tall gonfalon. */
    aspectClassName?: string;
    /** Stronger drop shadow + ground glow (product showcase). */
    elevated?: boolean;
    /** Tilt fabric toward the pointer on hover (anchored at the crossbar). */
    interactive3d?: boolean;
    /** Stagger idle sway phase (seconds). */
    swayDelay?: number;
    className?: string;
}
/**
 * A 3D medieval war banner: a forged crossbar with two hang-straps and a fabric
 * gonfalon that tapers to a point, framed in ember and grained. Wraps a media
 * plane (image) or falls back to a duotone + emblem placeholder, so it renders
 * premium before real product art exists. Used on the landing's horizontal
 * product reveal and across the warrior pages.
 */
export declare function WarBanner({ tone, media, mediaFit, alt, label, children, sway, placeholderSrc, placeholderThemedMarkup, placeholderEmblemClassName, placeholderWidth, placeholderHeight, placeholderMark, aspectClassName, elevated, interactive3d, swayDelay, className, }: WarBannerProps): import("react/jsx-runtime").JSX.Element;
export {};
