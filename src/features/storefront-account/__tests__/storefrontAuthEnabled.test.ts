import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { isStorefrontAuthEnabled } from '@/features/storefront-account/auth/storefrontAuthEnabled'

const SRC = resolve(__dirname, '../../..')

function read(relativePath: string): string {
  return readFileSync(resolve(SRC, relativePath), 'utf8')
}

/**
 * Strip comments before asserting. These files DOCUMENT the very import edges
 * they must not have, so a raw substring search matches the explanation rather
 * than the code.
 */
function code(relativePath: string): string {
  return read(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/**
 * These are source-shape assertions, deliberately. The thing being protected is
 * a BUNDLER property — "the Supabase SDK is not on the eager entry graph" — and
 * that property is invisible to a normal render test: the SDK still works when
 * it is eagerly imported, it just costs every visitor ~98 KB gzip.
 *
 * The regression is a one-line import edit, so pinning the import shape is the
 * cheapest honest guard. See `auth/storefrontAuthEnabled.ts` for the history.
 */
describe('storefront auth: Supabase SDK stays off the eager entry graph', () => {
  it('the env check resolves standalone, without loading the SDK', () => {
    // The VALUE is env-dependent, so asserting a specific one would just pin
    // the test environment. What matters is that this module imports and runs
    // on its own — i.e. it does not need `storefrontSupabaseClient` to answer.
    expect(typeof isStorefrontAuthEnabled()).toBe('boolean')
  })

  it('storefrontAuthEnabled.ts imports nothing that reaches the Supabase client', () => {
    const source = code('features/storefront-account/auth/storefrontAuthEnabled.ts')
    const imports = [...source.matchAll(/^import\s.*?from\s+'([^']+)'/gm)].map((m) => m[1])

    expect(imports).toEqual(['@/features/cms/api/supabasePublicEnv'])
    expect(source).not.toContain('storefrontSupabaseClient')
    expect(source).not.toContain('@supabase/supabase-js')
  })

  it('publicAccount.core.ts — loaded by the site-wide nav — never statically imports the SDK', () => {
    const source = code('features/storefront-account/publicAccount.core.ts')
    const staticImports = [...source.matchAll(/^import\s.*?from\s+'([^']+)'/gm)].map((m) => m[1])

    // The `./auth` barrel re-exports the client factory AND SocialAuthButtons,
    // so a static import of it drags the whole SDK back onto the entry graph.
    expect(staticImports).not.toContain('./auth')
    expect(staticImports).not.toContain('./auth/storefrontAuth')
    expect(staticImports).not.toContain('./auth/storefrontSupabaseClient')
    expect(staticImports).toContain('./auth/storefrontAuthEnabled')

    // The SDK-dependent functions must still be reachable — just lazily.
    expect(source).toContain("import('./auth/storefrontAuth')")
    expect(source).toContain("import('./auth/storefrontSupabaseClient')")
  })

  it('the env check is still exported from storefrontAuth + the barrel (no breakage)', () => {
    expect(read('features/storefront-account/auth/storefrontAuth.ts')).toContain(
      'isStorefrontAuthEnabled',
    )
    expect(read('features/storefront-account/auth/index.ts')).toContain('isStorefrontAuthEnabled')
  })
})
