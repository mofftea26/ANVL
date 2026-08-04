import { ANVL_CREST_PATHS, ANVL_CREST_VIEWBOX } from './anvlCrestPath'

export function AnvlCrest({
  className,
  'aria-label': ariaLabel = 'ANVL crest',
}: {
  className?: string
  'aria-label'?: string
}) {
  return (
    <svg
      className={className}
      viewBox={ANVL_CREST_VIEWBOX.join(' ')}
      role="img"
      aria-label={ariaLabel}
      fill="currentColor"
    >
      {ANVL_CREST_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  )
}
