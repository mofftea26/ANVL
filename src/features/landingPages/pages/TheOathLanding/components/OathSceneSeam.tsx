/**
 * Soft shadow seams so adjacent scenes **dissolve into the themed void** instead
 * of meeting at a hard edge. Pure decorative overlay (`pointer-events-none`,
 * `aria-hidden`) that feathers the section's top and/or bottom into `--color-bg`.
 * Theme-driven (no token edits) and sits below the scene copy (`z-10`) but above
 * the scene media, so it shadows the seams without dimming the text. Static —
 * no layout animation, transform/opacity-friendly.
 */
export function OathSceneSeam({
  edges = 'both',
}: {
  edges?: 'top' | 'bottom' | 'both'
}) {
  const showTop = edges === 'top' || edges === 'both'
  const showBottom = edges === 'bottom' || edges === 'both'
  return (
    <>
      {showTop ? (
        <div
          aria-hidden="true"
          data-scene-seam="top"
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 md:h-36"
          style={{
            background:
              'linear-gradient(to bottom, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 55%, transparent) 42%, transparent 100%)',
          }}
        />
      ) : null}
      {showBottom ? (
        <div
          aria-hidden="true"
          data-scene-seam="bottom"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 md:h-36"
          style={{
            background:
              'linear-gradient(to top, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 55%, transparent) 42%, transparent 100%)',
          }}
        />
      ) : null}
    </>
  )
}
