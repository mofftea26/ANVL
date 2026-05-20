import type { LookbookGalleryItem } from '@/features/cms/landing/landingActPreviewOverlay'

export function LookbookMedia({
  item,
  className,
}: {
  item: LookbookGalleryItem
  className?: string
}) {
  const isVideo =
    item.mediaType === 'video' ||
    /\.(mp4|webm|mov)(\?|$)/i.test(item.src) ||
    item.src.startsWith('data:video/')

  if (isVideo) {
    return (
      <video
        className={className}
        src={item.src}
        muted
        playsInline
        loop
        autoPlay
        aria-label={item.caption ?? 'Lookbook video'}
      />
    )
  }

  return (
    <img
      className={className}
      src={item.src}
      alt={item.caption ?? 'Lookbook image'}
      loading="lazy"
      decoding="async"
    />
  )
}
