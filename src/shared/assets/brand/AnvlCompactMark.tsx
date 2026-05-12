import { AnvlCrest } from './AnvlCrest'

/**
 * Compact crest mark used for favicons, tight nav slots, and decorative chips.
 * Aliases the full crest so a single artwork drives every mark surface.
 */
export function AnvlCompactMark({ className }: { className?: string }) {
  return <AnvlCrest className={className} />
}
