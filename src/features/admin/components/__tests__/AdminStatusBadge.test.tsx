import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  AdminStatusBadge,
  dropStatusBadgeLabel,
  dropStatusBadgeTone,
} from '../AdminStatusBadge'

describe('AdminStatusBadge', () => {
  it('renders children with live tone classes', () => {
    render(<AdminStatusBadge tone="live">Live</AdminStatusBadge>)
    const el = screen.getByText('Live')
    expect(el.className.includes('text-emerald-100')).toBe(true)
  })

  it('renders chip size aligned with topbar pill controls', () => {
    render(
      <AdminStatusBadge tone="live" size="chip">
        Live
      </AdminStatusBadge>,
    )
    const el = screen.getByText('Live')
    expect(el.className.includes('h-9')).toBe(true)
    expect(el.className.includes('text-xs')).toBe(true)
  })

  it('maps drop status to badge tone', () => {
    expect(dropStatusBadgeTone('scheduled', false)).toBe('scheduled')
    expect(dropStatusBadgeTone('inactive', true)).toBe('live')
  })

  it('prefers live label over CMS status when storefront-active', () => {
    expect(dropStatusBadgeLabel('active', true)).toBe('Live')
    expect(dropStatusBadgeLabel('inactive', false)).toBe('Inactive')
  })
})
