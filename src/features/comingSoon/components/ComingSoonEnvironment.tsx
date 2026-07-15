/**
 * The still environment behind the WebGL forge: theme void → generated forge
 * backdrop (dim) → ambient haze (screen-blended) → center clearing + vignette
 * → film grain. Carries the whole page alone when WebGL/motion are
 * unavailable, and frames the particle anvil when they are.
 */
export function ComingSoonEnvironment({
  backgroundUrl,
  ambientUrl,
}: {
  backgroundUrl: string
  ambientUrl: string
}) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-bg)]" />

      <img
        src={backgroundUrl}
        alt=""
        width={1376}
        height={768}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-55"
        onError={(e) => {
          // Missing asset → the void + glows carry the page.
          e.currentTarget.style.display = 'none'
        }}
      />

      <img
        src={ambientUrl}
        alt=""
        width={1376}
        height={768}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />

      {/* Clear the center stage for the anvil + type, then close the frame.
          Kept airy on purpose — the page read too dark at 62%/88%. */}
      <div className="absolute inset-0 [background:radial-gradient(90%_75%_at_50%_46%,color-mix(in_oklab,var(--color-bg)_40%,transparent)_0%,transparent_55%,color-mix(in_oklab,var(--color-bg)_72%,transparent)_100%)]" />

      {/* Champagne under-glow rising from the forge floor. */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] opacity-25 [background:radial-gradient(60%_100%_at_50%_100%,color-mix(in_oklab,var(--cs-accent)_30%,transparent),transparent_70%)]" />

      {/* Film grain. */}
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:3px_3px]" />
    </div>
  )
}
