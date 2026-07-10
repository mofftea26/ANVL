import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState, } from 'react';
import { ThemeTintedMediaMark } from '@/shared/components/ui/ThemeTintedMediaMark';
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { isSvgEmblemUrl } from '@/shared/lib/themeSvgMarkup';
import { cn } from '@/shared/lib/cn';
/** Gonfalon silhouette — rectangle tapering to a single downward point. */
const BANNER_CLIP = 'polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)';
/**
 * Forged-metal gradient for the crossbar + finials — derived from the theme's
 * graphite/surface tokens so it tracks the assigned CMS palette instead of a
 * fixed steel grey.
 */
const FORGE_METAL = 'linear-gradient(180deg, color-mix(in srgb, var(--color-graphite) 62%, var(--anvl-bone)) 0%, var(--color-graphite) 38%, color-mix(in srgb, var(--color-graphite) 52%, var(--color-bg)) 70%, var(--color-surface-elevated) 100%)';
/** Default fabric tone follows the theme's elevated surface. */
const DEFAULT_BANNER_TONE = 'var(--color-surface-elevated)';
function duotone(tone = DEFAULT_BANNER_TONE) {
    return `linear-gradient(158deg, ${tone} 0%, var(--color-bg) 82%)`;
}
const TILT_RX = 13;
const TILT_RY = 16;
const EMBLEM_SIZE = {
    default: { className: 'h-[58%] aspect-square opacity-65', px: 144 },
    elevated: { className: 'h-[68%] aspect-square opacity-70', px: 176 },
};
/**
 * A 3D medieval war banner: a forged crossbar with two hang-straps and a fabric
 * gonfalon that tapers to a point, framed in ember and grained. Wraps a media
 * plane (image) or falls back to a duotone + emblem placeholder, so it renders
 * premium before real product art exists. Used on the landing's horizontal
 * product reveal and across the warrior pages.
 */
export function WarBanner({ tone = DEFAULT_BANNER_TONE, media, mediaFit = 'cover', alt = '', label, children, sway = false, placeholderSrc = '/brand/the-oath-shape.svg', placeholderThemedMarkup = null, placeholderEmblemClassName, placeholderWidth, placeholderHeight, placeholderMark, aspectClassName = 'aspect-[3/5]', elevated = false, interactive3d = true, swayDelay = 0, className, }) {
    const rootRef = useRef(null);
    const reducedMotion = useReducedMotion();
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });
    const useThemedPlaceholder = !media &&
        (Boolean(placeholderThemedMarkup) || isSvgEmblemUrl(placeholderSrc));
    const canTilt = interactive3d && !reducedMotion;
    const handlePointerMove = useCallback((event) => {
        if (!canTilt || !rootRef.current)
            return;
        const rect = rootRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0)
            return;
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        setTilt({
            rx: -ny * TILT_RX * 2,
            ry: nx * TILT_RY * 2,
            active: true,
        });
    }, [canTilt]);
    const resetTilt = useCallback(() => {
        setTilt({ rx: 0, ry: 0, active: false });
    }, []);
    const emblemPreset = elevated ? EMBLEM_SIZE.elevated : EMBLEM_SIZE.default;
    const emblem = {
        className: placeholderEmblemClassName ?? emblemPreset.className,
        px: placeholderWidth ?? emblemPreset.px,
        py: placeholderHeight ?? emblemPreset.px,
    };
    const fabricTransform = canTilt && tilt.active
        ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(6px)`
        : undefined;
    const strapTilt = tilt.ry * 0.35;
    return (_jsxs("figure", { ref: rootRef, className: cn('anvl-banner-root group relative m-0 [perspective:1400px]', elevated && 'anvl-banner-root--elevated', tilt.active && 'anvl-banner-root--tilting', className), onPointerMove: canTilt ? handlePointerMove : undefined, onPointerEnter: canTilt ? handlePointerMove : undefined, onPointerLeave: canTilt ? resetTilt : undefined, style: sway ? { ['--sway-delay']: `${swayDelay}s` } : undefined, children: [elevated ? (_jsx("div", { "aria-hidden": "true", className: "anvl-banner-ground-glow pointer-events-none absolute -bottom-2 left-1/2 z-0 h-12 w-[88%] -translate-x-1/2 rounded-[100%] opacity-90", style: {
                    background: 'radial-gradient(ellipse, color-mix(in srgb, var(--color-highlight) 26%, transparent) 0%, transparent 72%)',
                    filter: 'blur(10px)',
                } })) : null, _jsxs("div", { "aria-hidden": "true", className: "absolute -top-1 left-1/2 z-20 h-2.5 w-[112%] -translate-x-1/2 rounded-full", style: {
                    background: FORGE_METAL,
                    boxShadow: '0 4px 14px -2px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.12) inset',
                }, children: [_jsx("span", { className: "absolute -left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full", style: { background: FORGE_METAL } }), _jsx("span", { className: "absolute -right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full", style: { background: FORGE_METAL } })] }), _jsx("span", { "aria-hidden": "true", className: "anvl-banner-strap-left absolute left-[22%] top-1 z-10 h-5 w-1.5 origin-top rounded-sm bg-[var(--color-highlight)]/70 transition-transform duration-300 ease-out", style: { transform: tilt.active ? `rotate(${-strapTilt}deg)` : undefined } }), _jsx("span", { "aria-hidden": "true", className: "anvl-banner-strap-right absolute right-[22%] top-1 z-10 h-5 w-1.5 origin-top rounded-sm bg-[var(--color-highlight)]/70 transition-transform duration-300 ease-out", style: { transform: tilt.active ? `rotate(${strapTilt}deg)` : undefined } }), _jsx("div", { className: "anvl-banner-fabric relative mt-4", style: {
                    clipPath: BANNER_CLIP,
                    WebkitClipPath: BANNER_CLIP,
                    transformOrigin: 'top center',
                    transform: fabricTransform,
                }, children: _jsx("div", { className: cn('relative overflow-hidden [transform-style:preserve-3d]', sway && (elevated ? 'anvl-banner-sway-rich' : 'anvl-banner-sway'), tilt.active && 'anvl-banner-sway-paused'), children: _jsxs("div", { className: cn('anvl-banner-body relative w-full', aspectClassName), style: { background: duotone(tone) }, children: [media ? (_jsx("img", { src: media, alt: alt, loading: "lazy", decoding: "async", className: cn('absolute inset-0 h-full w-full', mediaFit === 'contain'
                                    ? 'object-contain px-[14%] pt-[16%] pb-[22%]'
                                    : 'object-cover') })) : placeholderMark ? (_jsx("div", { className: "anvl-banner-emblem absolute inset-0 flex items-center justify-center", children: placeholderMark })) : useThemedPlaceholder ? (_jsx("div", { className: "anvl-banner-emblem absolute inset-0 flex items-center justify-center", children: _jsx(ThemeTintedMediaMark, { src: placeholderSrc, themedSvgMarkup: placeholderThemedMarkup, className: emblem.className, width: emblem.px, height: emblem.py, tint: "var(--color-heading)", glow: "var(--color-highlight)" }) })) : (_jsx("div", { className: "anvl-banner-emblem absolute inset-0 flex items-center justify-center", children: _jsx("img", { src: placeholderSrc, alt: "", "aria-hidden": "true", className: cn(elevated ? 'h-[68%] w-auto opacity-70' : 'h-[58%] w-auto opacity-65'), style: { filter: 'drop-shadow(0 0 22px var(--color-highlight-soft))' } }) })), _jsx(GrainOverlay, {}), _jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute inset-0", style: {
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 32%, transparent 100%)',
                                } }), _jsx("div", { "aria-hidden": "true", className: "anvl-banner-sheen pointer-events-none absolute inset-0 opacity-40" }), _jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute bottom-[14%] left-[6px] top-[8%] w-px bg-gradient-to-b from-[var(--color-highlight)]/50 via-[var(--color-highlight)]/28 to-transparent" }), _jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute bottom-[14%] right-[6px] top-[8%] w-px bg-gradient-to-b from-[var(--color-highlight)]/50 via-[var(--color-highlight)]/28 to-transparent" }), label ? (_jsx("span", { className: "anvl-display absolute left-1/2 top-4 z-10 -translate-x-1/2 text-[11px] tracking-[0.28em] text-[var(--color-highlight-bright)]", children: label })) : null, children ? (_jsx("div", { className: "absolute inset-x-0 bottom-0 z-10 px-5 pb-[18%] pt-10", children: children })) : null] }) }) })] }));
}
