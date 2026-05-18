import { previewLoadingSrc } from '@/app/providers/ActiveDropThemeBridge'
import { resolveStorefrontActiveDrop } from '@/features/cms/runtime/storefrontCmsSync'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { cn } from '@/shared/lib/cn'

interface DropLoadingIndicatorProps {
  label?: string
  className?: string
}

export function DropLoadingIndicator({
  label = 'Loading',
  className,
}: DropLoadingIndicatorProps) {
  const drop = resolveStorefrontActiveDrop()
  const src = previewLoadingSrc(drop ?? undefined)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 text-[var(--color-text-muted)]',
        className,
      )}
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--color-accent)]/15 blur-xl" />
        <DropEmblemDecor
          src={src}
          alt=""
          presentationOnly
          className="relative mx-auto h-16 w-16 animate-[pulse_2.4s_ease-in-out_infinite] opacity-90"
        />
      </div>
      <p className="anvl-micro text-[10px] tracking-[0.35em]">{label}</p>
    </div>
  )
}
