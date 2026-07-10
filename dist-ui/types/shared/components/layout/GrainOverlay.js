import { jsx as _jsx } from "react/jsx-runtime";
const INTENSITY = {
    subtle: { wrapperOpacity: 0.18, dotAlpha: 0.05 },
    default: { wrapperOpacity: 0.25, dotAlpha: 0.06 },
};
/** Shared film-grain texture — used behind full experiences (ForgeAtmosphere) and on individual banners (WarBanner). */
export function GrainOverlay({ intensity = 'default' }) {
    const { wrapperOpacity, dotAlpha } = INTENSITY[intensity];
    return (_jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute inset-0", style: {
            opacity: wrapperOpacity,
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,${dotAlpha}) 1px, transparent 0)`,
            backgroundSize: '3px 3px',
        } }));
}
