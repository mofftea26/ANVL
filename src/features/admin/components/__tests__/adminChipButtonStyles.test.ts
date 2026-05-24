import { describe, expect, it } from 'vitest'
import { adminChipButtonVariants } from '../adminChipButtonStyles'

describe('adminChipButtonVariants', () => {
  it('default variant uses surface-soft pill', () => {
    const cls = adminChipButtonVariants({ variant: 'default', size: 'default' })
    expect(cls.includes('surface-soft')).toBe(true)
    expect(cls.includes('rounded-full')).toBe(true)
  })

  it('primary variant uses accent border mix', () => {
    const cls = adminChipButtonVariants({ variant: 'primary' })
    expect(cls.includes('color-accent')).toBe(true)
  })
})
