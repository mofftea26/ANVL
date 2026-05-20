import { describe, expect, it } from 'vitest'
import {
  adminFieldChromeBase,
  adminFieldControlClass,
  adminSelectTriggerClass,
} from '@/shared/lib/cmsFieldStyles'

describe('cmsFieldStyles', () => {
  it('adminFieldControlClass uses surface-soft pill chrome aligned with chip buttons', () => {
    expect(adminFieldControlClass).toContain('surface-soft')
    expect(adminFieldControlClass).toContain('rounded-full')
    expect(adminFieldControlClass).toContain('h-9')
    expect(adminFieldControlClass).toContain('text-xs')
  })

  it('adminSelectTriggerClass extends field control with flex trigger layout', () => {
    expect(adminSelectTriggerClass).toContain(adminFieldChromeBase)
    expect(adminSelectTriggerClass).toContain('data-[placeholder]')
  })
})
