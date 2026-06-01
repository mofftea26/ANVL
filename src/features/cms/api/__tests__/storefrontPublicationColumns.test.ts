import { describe, expect, it } from 'vitest'
import { isPostgrestMissingColumnError } from '@/features/cms/api/storefrontPublicationColumns'

describe('isPostgrestMissingColumnError', () => {
  it('returns false for null/undefined', () => {
    expect(isPostgrestMissingColumnError(null, 'site_homepage')).toBe(false)
    expect(isPostgrestMissingColumnError(undefined, 'site_homepage')).toBe(false)
  })

  it('detects Postgres undefined_column code', () => {
    expect(
      isPostgrestMissingColumnError(
        { code: '42703', message: 'column does not exist' },
        'site_homepage',
      ),
    ).toBe(true)
  })

  it('detects PostgREST schema-cache messages', () => {
    expect(
      isPostgrestMissingColumnError(
        {
          message:
            "Could not find the 'site_homepage' column of 'storefront_publication' in the schema cache",
        },
        'site_homepage',
      ),
    ).toBe(true)
  })

  it('returns false when message mentions a different column', () => {
    expect(
      isPostgrestMissingColumnError(
        { message: "column 'global_brand' does not exist" },
        'site_homepage',
      ),
    ).toBe(false)
  })
})
