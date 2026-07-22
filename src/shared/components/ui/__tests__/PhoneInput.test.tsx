import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PhoneInput, isValidPhone, parsePhoneValue } from '../PhoneInput'
import { matchCountryByDigits } from '@/shared/data/countryDialCodes'

function Harness({ initial = '', onChange }: { initial?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <PhoneInput
      id="phone"
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    />
  )
}

describe('parsePhoneValue', () => {
  it('splits by longest dial prefix', () => {
    expect(parsePhoneValue('+96171123456')).toMatchObject({
      country: { iso2: 'LB' },
      national: '71123456',
    })
    // +1242 (Bahamas) wins over +1 (US) by longest prefix.
    expect(parsePhoneValue('+12425551234')).toMatchObject({
      country: { iso2: 'BS' },
      national: '5551234',
    })
    expect(parsePhoneValue('+12025551234')).toMatchObject({
      country: { iso2: 'US' },
      national: '2025551234',
    })
    expect(parsePhoneValue('+447700900123')).toMatchObject({
      country: { iso2: 'GB' },
      national: '7700900123',
    })
  })

  it('ignores spaces and separators when parsing', () => {
    expect(parsePhoneValue('+961 71 123 456')).toMatchObject({
      country: { iso2: 'LB' },
      national: '71123456',
    })
  })

  it('falls back to Lebanon for empty/unparseable values', () => {
    expect(parsePhoneValue('')).toMatchObject({ country: { iso2: 'LB' }, national: '' })
  })
})

describe('matchCountryByDigits', () => {
  it('prefers the primary country on shared dial codes', () => {
    expect(matchCountryByDigits('15551234567')?.iso2).toBe('US')
    expect(matchCountryByDigits('79991234567')?.iso2).toBe('RU')
    expect(matchCountryByDigits('447700900123')?.iso2).toBe('GB')
  })
})

describe('isValidPhone', () => {
  it('accepts normalized numbers with a known dial code', () => {
    expect(isValidPhone('+96171123456')).toBe(true)
    expect(isValidPhone('+12025551234')).toBe(true)
    expect(isValidPhone('+447700900123')).toBe(true)
  })

  it('rejects malformed or unknown values', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('71123456')).toBe(false)
    expect(isValidPhone('+961 71 123 456')).toBe(false) // spaces not normalized
    expect(isValidPhone('+9611')).toBe(false) // national too short
    expect(isValidPhone('+0001234567')).toBe(false)
  })
})

describe('PhoneInput', () => {
  it('round-trips typing into a normalized value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    const national = screen.getByPlaceholderText('71 123 456')
    await user.type(national, '71123456')
    expect(onChange).toHaveBeenLastCalledWith('+96171123456')
    expect(national).toHaveValue('71123456')
  })

  it('parses an incoming value into country + national digits', () => {
    render(<Harness initial="+447700900123" />)
    expect(screen.getByRole('button', { name: /United Kingdom/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('71 123 456')).toHaveValue('7700900123')
  })

  it('search-filters the country list and re-emits with the picked dial code', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial="+96171123456" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Lebanon/ }))
    const search = screen.getByRole('combobox', { name: /search countries/i })
    await user.type(search, 'united k')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('United Kingdom')

    await user.click(options[0])
    expect(onChange).toHaveBeenLastCalledWith('+4471123456')
    // Listbox closed after picking.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports keyboard selection with aria-activedescendant', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial="+96171123456" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Lebanon/ }))
    const search = screen.getByRole('combobox', { name: /search countries/i })
    await user.type(search, '+1242')
    expect(search).toHaveAttribute('aria-activedescendant', expect.stringContaining('BS'))
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('+124271123456')
  })

  it('searches by dial code digits', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Lebanon/ }))
    await user.type(screen.getByRole('combobox', { name: /search countries/i }), '961')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Lebanon')
  })
})
