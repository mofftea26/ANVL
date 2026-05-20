import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminForgedLink } from '../AdminForgedLink'

describe('AdminForgedLink', () => {
  it('renders outline variant with focus-ring', () => {
    render(
      <AdminForgedLink href="/shop/foo" variant="outline">
        Preview
      </AdminForgedLink>,
    )
    const el = screen.getByRole('link', { name: /preview/i })
    expect(el.getAttribute('href')).toBe('/shop/foo')
    expect(el.className.includes('focus-ring')).toBe(true)
  })
})
