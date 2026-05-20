import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  AdminStatusBadge,
  dropStatusBadgeTone,
} from '../AdminStatusBadge'

describe('AdminStatusBadge', () => {
  it('renders children with live tone classes', () => {
    render(<AdminStatusBadge tone="live">Live</AdminStatusBadge>)
    const el = screen.getByText('Live')
    expect(el.className.includes('text-emerald-100')).toBe(true)
  })

  it('maps drop status to badge tone', () => {
    expect(dropStatusBadgeTone('scheduled', false)).toBe('scheduled')
    expect(dropStatusBadgeTone('draft', true)).toBe('live')
  })
})
