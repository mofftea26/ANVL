/**
 * Shared cinematic backdrop for the passport surfaces (teaser, onboarding,
 * page): a blurred product wash, an ember radial glow, and a vignette that
 * settles everything onto the themed void. Pure CSS — WebGL layers mount on
 * top of this, never instead of it.
 */
export function PassportAtmosphere({ imageSrc }: { imageSrc?: string | null }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          width={900}
          height={1200}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.16] blur-[6px]"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_18%,color-mix(in_oklab,var(--color-highlight)_16%,transparent)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg)_82%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
    </div>
  )
}
