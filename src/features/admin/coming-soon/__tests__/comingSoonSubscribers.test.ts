import { describe, expect, it } from 'vitest'
import { subscribersToCsv } from '@/features/admin/coming-soon/comingSoonSubscribers.service'

describe('subscribersToCsv', () => {
  it('serializes header + rows with escaped quotes', () => {
    const csv = subscribersToCsv([
      {
        id: '1',
        email: 'a@example.com',
        source: 'coming-soon',
        createdAt: '2026-07-10T10:00:00Z',
      },
      {
        id: '2',
        email: 'weird"quote@example.com',
        source: '',
        createdAt: '',
      },
    ])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('email,source,subscribed_at')
    expect(lines[1]).toBe('"a@example.com","coming-soon","2026-07-10T10:00:00Z"')
    expect(lines[2]).toBe('"weird""quote@example.com","",""')
  })

  it('emits only the header for an empty list', () => {
    expect(subscribersToCsv([])).toBe('email,source,subscribed_at')
  })
})
