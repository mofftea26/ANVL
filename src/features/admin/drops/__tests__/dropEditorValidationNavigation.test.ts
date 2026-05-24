import { describe, expect, it } from 'vitest'
import {
  resolveFirstValidationTarget,
} from '../dropEditorValidationNavigation'
import type { DropFieldErrors } from '../drops.editor.validation'

describe('resolveFirstValidationTarget', () => {
  it('returns the first tab-ordered field with an error', () => {
    const errors: DropFieldErrors = {
      summary: ['x'],
      fields: {
        'seo.description': 'Required',
        'basics.slug': 'Slug is required.',
        'theme.accent': 'Required.',
      },
    }
    expect(resolveFirstValidationTarget(errors)).toEqual({
      tab: 'basics',
      fieldKey: 'basics.slug',
    })
  })

  it('returns null when there are no field errors', () => {
    expect(
      resolveFirstValidationTarget({ summary: [], fields: {} }),
    ).toBeNull()
  })
})
