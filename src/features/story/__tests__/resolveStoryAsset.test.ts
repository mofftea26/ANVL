import { describe, expect, it } from 'vitest'
import {
  EMPTY_STORY_ASSET,
  type StoryAsset,
} from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'

function asset(overrides: Partial<StoryAsset>): StoryAsset {
  return { ...EMPTY_STORY_ASSET, ...overrides }
}

describe('resolveStoryAsset', () => {
  it('returns none for empty/undefined assets', () => {
    expect(resolveStoryAsset(undefined).type).toBe('none')
    expect(resolveStoryAsset(EMPTY_STORY_ASSET).type).toBe('none')
  })

  it('resolves an https image url', () => {
    const media = resolveStoryAsset(
      asset({ kind: 'image', url: 'https://cdn.example.com/a.jpg', alt: 'a' }),
    )
    expect(media).toMatchObject({ type: 'image', src: 'https://cdn.example.com/a.jpg', alt: 'a' })
  })

  it('resolves an https video url', () => {
    const media = resolveStoryAsset(
      asset({ kind: 'video', url: 'https://cdn.example.com/a.mp4' }),
    )
    expect(media.type).toBe('video')
  })

  it('resolves an https embed url', () => {
    const media = resolveStoryAsset(
      asset({ kind: 'embed', url: 'https://player.vimeo.com/video/1' }),
    )
    expect(media).toMatchObject({ type: 'embed', src: 'https://player.vimeo.com/video/1' })
  })

  it('rejects a javascript: embed url via sanitizeHref', () => {
    // eslint-disable-next-line no-script-url
    const media = resolveStoryAsset(asset({ kind: 'embed', url: 'javascript:alert(1)' }))
    expect(media.type).toBe('none')
  })

  it('rejects an unsafe image src', () => {
    // eslint-disable-next-line no-script-url
    const media = resolveStoryAsset(asset({ kind: 'image', url: 'javascript:alert(1)' }))
    expect(media.type).toBe('none')
  })

  it('rejects a non-https embed url', () => {
    const media = resolveStoryAsset(
      asset({ kind: 'embed', url: 'http://insecure.example.com/v' }),
    )
    expect(media.type).toBe('none')
  })
})
