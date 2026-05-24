import { describe, expect, it } from 'vitest'

import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'

import { sortDropListRows } from '@/features/admin/drops/dropsListSort'

const ROWS: AdminDropListItem[] = [
  {
    id: 'a',
    slug: 'z-slug',
    title: 'Zulu',
    name: 'Z',
    dropNumber: 'D02',
    status: 'draft',
    isActive: false,
    productCount: 1,
    updatedAt: '2026-01-01T12:00:00.000Z',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'b',
    slug: 'a-slug',
    title: 'Alpha',
    name: 'A',
    dropNumber: 'D01',
    status: 'draft',
    isActive: false,
    productCount: 3,
    updatedAt: '2026-03-01T12:00:00.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
]

describe('sortDropListRows', () => {
  it('sorts by updatedAt descending (newest first)', () => {
    const sorted = sortDropListRows(ROWS, 'updatedAt:desc')
    expect(sorted.map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('sorts by title ascending', () => {
    const sorted = sortDropListRows(ROWS, 'title:asc')
    expect(sorted.map((r) => r.title)).toEqual(['Alpha', 'Zulu'])
  })

  it('sorts by productCount descending', () => {
    const sorted = sortDropListRows(ROWS, 'productCount:desc')
    expect(sorted.map((r) => r.productCount)).toEqual([3, 1])
  })
})
