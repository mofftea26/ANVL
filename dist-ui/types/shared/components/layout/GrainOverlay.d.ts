declare const INTENSITY: {
    readonly subtle: {
        readonly wrapperOpacity: 0.18;
        readonly dotAlpha: 0.05;
    };
    readonly default: {
        readonly wrapperOpacity: 0.25;
        readonly dotAlpha: 0.06;
    };
};
/** Shared film-grain texture — used behind full experiences (ForgeAtmosphere) and on individual banners (WarBanner). */
export declare function GrainOverlay({ intensity }: {
    intensity?: keyof typeof INTENSITY;
}): import("react/jsx-runtime").JSX.Element;
export {};
