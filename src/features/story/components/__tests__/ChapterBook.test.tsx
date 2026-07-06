import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { StoryChapter } from '@/features/story/schemas/story.schema'

vi.mock('@/shared/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true, // forces the flat reader — no WebGL/lazy chunk involved
}))

vi.mock('@/features/story/components/book3d/openOrigin', () => ({
  takeOpenOrigin: () => null,
}))

vi.mock('@/features/story/lib/webgl', () => ({
  isWebglAvailable: () => false,
}))

vi.mock('@/features/story/components/ChapterBookFlat', () => ({
  ChapterBookFlat: ({ current }: { current: number }) => <div data-testid="current-spread">{current}</div>,
}))

vi.mock('@/features/story/components/BookControls', () => ({
  BookControls: () => null,
}))

import { ChapterBook } from '@/features/story/components/ChapterBook'

const EMPTY_ASSET = {
  kind: 'none' as const,
  mediaId: null,
  storagePath: null,
  url: null,
  alt: '',
  width: null,
  height: null,
  poster: null,
}

function makeChapter(): StoryChapter {
  return {
    id: 'ch-1',
    slug: 'the-oath',
    chapterNumber: 1,
    title: 'The Oath',
    subtitle: 'Volume I',
    description: '',
    productSlug: '',
    dropLabel: 'Drop 01',
    dropSlug: 'drop-01',
    cover: EMPTY_ASSET,
    coverLogo: EMPTY_ASSET,
    colors: { cover: '#26211d', foil: '#c8a45a', pageEdge: '#efe4c6', heading: '#221b10', text: '#4c4030' },
    isPublished: true,
    acts: [
      { id: 'act-1', actNumber: 1, title: 'The First Strike', story: 'para one.\n\npara two.', asset: EMPTY_ASSET },
      { id: 'act-2', actNumber: 2, title: 'The Second Strike', story: 'para one.', asset: EMPTY_ASSET },
    ],
    cast: [],
  }
}

describe('ChapterBook initialAct deep link', () => {
  it('starts at the cover (spread 0) with no initialAct', () => {
    render(<ChapterBook chapter={makeChapter()} onClose={() => {}} />)
    expect(screen.getByTestId('current-spread').textContent).toBe('0')
  })

  it('jumps straight to the deep-linked act\'s spread', () => {
    render(<ChapterBook chapter={makeChapter()} initialAct="act-2" onClose={() => {}} />)
    // Act 1 alone fits one spread (short story), so act-2's first spread is index 2 (cover=0, act-1=1).
    expect(screen.getByTestId('current-spread').textContent).toBe('2')
  })

  it('falls back to the cover when initialAct does not match any spread', () => {
    render(<ChapterBook chapter={makeChapter()} initialAct="nonexistent" onClose={() => {}} />)
    expect(screen.getByTestId('current-spread').textContent).toBe('0')
  })
})
