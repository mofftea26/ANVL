import type { ShareContext } from '../types'

/**
 * A single primitive that changes exactly when a re-render is warranted.
 *
 * `ShareContext` is rebuilt on every parent render, so depending on the object
 * would re-render the canvas continuously; depending on eight of its fields is
 * what forced a suppression comment into the old effect. One derived string
 * depends honestly on everything that matters and on nothing that does not.
 *
 * `photoVersion` stands in for the pixels themselves — the whole reason
 * `useImagePick` keeps the decoded photo in a ref is so no multi-megabyte value
 * ever travels through a dependency array.
 */
export function shareContentKey(content: ShareContext, photoVersion: number): string {
  return [
    photoVersion,
    content.url,
    content.piece?.slug ?? '',
    content.piece?.imageUrl ?? '',
    content.piece?.wearCount ?? '',
    content.feat?.id ?? '',
    content.owner.name,
    content.owner.rankTitle,
    content.owner.rankEmblemSrc,
    content.stats.pieceCount,
    content.stats.featCount,
    content.stats.totalWears,
  ].join('|')
}
