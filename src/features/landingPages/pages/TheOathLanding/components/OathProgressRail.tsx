/** Scene labels for the fixed progress rail (code-owned, not CMS copy). */
const RAIL_SCENES = [
  { id: 'hero', label: 'Genesis' },
  { id: 'manifesto', label: 'Creed' },
  { id: 'tenets', label: 'Tenets' },
  { id: 'products', label: 'Arsenal' },
  { id: 'finale', label: 'Oath' },
] as const

/**
 * Fixed right-edge progress rail: a bone fill scaled by overall page scroll
 * plus a dot per scene that ignites while its section is active. Desktop-only
 * (hidden below lg); driven entirely by the cinematic motion branch via
 * `data-rail-fill` / `data-rail-dot` (transform/opacity only).
 */
export function OathProgressRail() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-5 top-1/2 z-[60] hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    >
      <div className="relative h-40 w-[2px] overflow-hidden rounded bg-[var(--color-line)]">
        <div
          data-rail-fill
          className="absolute inset-0 origin-top scale-y-0 will-change-transform"
          style={{
            background:
              'linear-gradient(180deg, var(--anvl-bone,#E7E4DF), var(--color-graphite,#5B5E61))',
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-2.5">
        {RAIL_SCENES.map((scene) => (
          <span
            key={scene.id}
            data-rail-dot={scene.id}
            className="block h-1.5 w-1.5 rounded-full bg-[var(--color-graphite,#5B5E61)] opacity-50 will-change-transform"
          />
        ))}
      </div>
    </div>
  )
}
