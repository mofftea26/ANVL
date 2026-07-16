/**
 * The Collection Crest — a heraldic mark that grows with the armory. It's pure
 * presentation over data the owner already has: rivets count the pieces, a
 * laurel unlocks at three, a crown at the first full drop, a star at a full
 * Hall of Honor, and the whole thing glows brighter with Forge Level. No new
 * state — the crest simply reflects what's been forged.
 */
export function CollectionCrest({
  registrations,
  fullDrops,
  honorPinned,
  level,
}: {
  registrations: number
  fullDrops: number
  honorPinned: number
  level: number
}) {
  const rivets = Math.min(registrations, 8)
  const hasLaurel = registrations >= 3
  const hasCrown = fullDrops >= 1
  const hasStar = honorPinned >= 3
  // Glow ramps with level, capped so it stays tasteful.
  const glow = Math.min(0.25 + level * 0.06, 0.85)

  // Eight rivet anchors around the shield perimeter.
  const rivetPoints = [
    [60, 40],
    [140, 40],
    [162, 96],
    [150, 150],
    [100, 178],
    [50, 150],
    [38, 96],
    [100, 30],
  ] as const

  return (
    <svg
      viewBox="0 0 200 210"
      role="img"
      aria-label={`Collection crest — ${registrations} pieces, Forge Level ${level}`}
      className="h-full w-full"
    >
      <defs>
        <radialGradient id="crest-glow" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="var(--color-highlight-bright)" stopOpacity={glow} />
          <stop offset="100%" stopColor="var(--color-highlight)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crest-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-surface-elevated)" />
          <stop offset="100%" stopColor="var(--color-surface)" />
        </linearGradient>
      </defs>

      {/* Radiance */}
      <circle cx="100" cy="90" r="95" fill="url(#crest-glow)" />

      {/* Crown (unlocks with the first full drop) */}
      {hasCrown ? (
        <path
          d="M64 30 L74 14 L88 26 L100 8 L112 26 L126 14 L136 30 Z"
          fill="var(--color-highlight-bright)"
          opacity="0.9"
        />
      ) : null}

      {/* Star cluster (unlocks with a full Hall of Honor) */}
      {hasStar ? (
        <path
          d="M100 2 l3 6 6 1 -4.5 4.5 1 6.5 -5.5 -3 -5.5 3 1 -6.5 -4.5 -4.5 6 -1 Z"
          fill="var(--color-heading)"
        />
      ) : null}

      {/* Laurel (unlocks at three pieces) */}
      {hasLaurel ? (
        <g stroke="var(--color-highlight)" strokeWidth="2.5" fill="none" opacity="0.75">
          <path d="M40 150 Q18 120 30 78" strokeLinecap="round" />
          <path d="M160 150 Q182 120 170 78" strokeLinecap="round" />
          <path d="M30 92 l-11 -5 M34 110 l-12 -3 M42 128 l-12 -1" strokeLinecap="round" />
          <path d="M170 92 l11 -5 M166 110 l12 -3 M158 128 l12 -1" strokeLinecap="round" />
        </g>
      ) : null}

      {/* Shield */}
      <path
        d="M100 32 L158 52 V104 Q158 150 100 180 Q42 150 42 104 V52 Z"
        fill="url(#crest-face)"
        stroke="var(--color-highlight)"
        strokeWidth="2.5"
      />

      {/* Anvil glyph */}
      <g fill="var(--color-highlight-bright)">
        <path d="M74 92 h52 a10 10 0 0 1 -10 10 h-8 v10 h14 v8 H78 v-8 h14 v-10 h-8 a10 10 0 0 1 -10 -10 Z" />
        <rect x="88" y="122" width="24" height="8" rx="2" />
      </g>

      {/* Rivets — one per registered piece, up to eight */}
      {rivetPoints.slice(0, rivets).map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="4"
          fill="var(--color-highlight-bright)"
          stroke="var(--color-surface)"
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}
