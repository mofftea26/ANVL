/**
 * "Forged in Lebanon" — a stylized inline SVG of Lebanon's silhouette with a
 * pulsing forge point. Pure SVG + CSS animation (no map library, runs
 * everywhere including reduced-motion, where the pulse is disabled globally
 * by the motion-reduce rules in styles.css).
 */
export function PassportOriginMap() {
  return (
    <div className="relative mx-auto flex max-w-xs items-center justify-center">
      <svg
        viewBox="0 0 200 340"
        role="img"
        aria-label="Map of Lebanon, marking where this piece was forged"
        className="h-64 w-auto"
      >
        {/* Simplified Lebanon coastline/border silhouette. */}
        <path
          d="M78 12 L108 8 L122 26 L118 52 L132 74 L128 102 L142 128 L138 158 L152 184 L146 214 L158 240 L148 268 L136 292 L112 318 L92 330 L74 312 L66 284 L54 262 L60 234 L50 208 L58 182 L48 156 L56 130 L50 104 L62 78 L58 50 L70 30 Z"
          fill="color-mix(in oklab, var(--color-surface-elevated) 80%, var(--color-highlight))"
          stroke="var(--color-line)"
          strokeWidth="2"
          opacity="0.9"
        />
        {/* Forge point — near the coast. */}
        <circle cx="88" cy="150" r="5" fill="var(--color-highlight-bright)" />
        <circle
          cx="88"
          cy="150"
          r="5"
          fill="none"
          stroke="var(--color-highlight)"
          strokeWidth="2"
          className="animate-ping [transform-origin:88px_150px] motion-reduce:hidden"
        />
      </svg>
      <span className="anvl-micro pointer-events-none absolute bottom-3 text-[var(--color-text-muted)]">
        Forged in Lebanon
      </span>
    </div>
  )
}
