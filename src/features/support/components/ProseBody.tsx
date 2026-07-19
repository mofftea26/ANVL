import { cn } from '@/shared/lib/cn'

/**
 * Renders a plain-text CMS body as accessible paragraphs. A blank line in the
 * source (`\n\n`) starts a new `<p>`; single newlines inside a paragraph are
 * preserved via `whitespace-pre-line`. Pure/deterministic — SSR-safe.
 */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
}

export function ProseBody({ body, className }: { body: string; className?: string }) {
  const paragraphs = splitParagraphs(body)
  if (paragraphs.length === 0) return null
  return (
    <div className={cn('space-y-4', className)}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base"
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}
