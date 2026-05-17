/**
 * Regression guard for SEC-13 / Phase B6.
 *
 * The sign-up route must NOT distinguish "email already registered" from
 * any other sign-up failure — otherwise an attacker can enumerate accounts
 * just by submitting candidate emails. This is a string-level lint
 * because the on-error path is hard to exercise end-to-end without
 * standing up the full TanStack Router + Query rig.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const signUpRoute = readFileSync(
  join(__dirname, '..', 'sign-up.tsx'),
  'utf8',
)

describe('sign-up route (SEC-13 / Phase B6 regression guard)', () => {
  it('does not call form.setError on the email field', () => {
    expect(signUpRoute).not.toMatch(/form\.setError\(\s*['"]email['"]/)
  })

  it('does not reference STOREFRONT_ACCOUNT_EMAIL_TAKEN in route handling', () => {
    // The mock layer still throws this error; the route must not branch on
    // it in a way that produces a different user-facing response.
    expect(signUpRoute).not.toContain('STOREFRONT_ACCOUNT_EMAIL_TAKEN')
  })

  it('surfaces a single neutral toast message on any sign-up failure', () => {
    expect(signUpRoute).toMatch(/Could not create account/)
  })

  it('references SEC-13 in source so the rationale is discoverable', () => {
    expect(signUpRoute).toContain('SEC-13')
  })
})
