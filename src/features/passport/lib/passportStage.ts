import type { PassportView } from '../schemas/passport.schema'

export type PassportStage =
  | 'not_found'
  | 'owner'
  | 'public'
  | 'teaser'
  | 'onboarding'
  | 'transfer_offer'
  | 'transfer_teaser'

/**
 * Pure resolution of what the /p/$token page shows — kept out of the
 * component so the state machine is unit-testable:
 *  - unknown token → not_found
 *  - mine → owner passport
 *  - claimed by someone else + a LIVE transfer code in the URL →
 *    transfer_offer (signed in: accept) / transfer_teaser (signed out: the
 *    sign-in gate, redirect preserves the code)
 *  - claimed by someone else otherwise → public authenticity view
 *  - unclaimed + signed out → teaser (sign-in gate)
 *  - unclaimed + signed in → onboarding (claim flow)
 */
export function resolvePassportStage(
  view: PassportView | null,
  customerId: string | null,
): PassportStage {
  if (!view) return 'not_found'
  if (view.isOwner) return 'owner'
  if (view.isClaimed) {
    if (view.transferValid) return customerId ? 'transfer_offer' : 'transfer_teaser'
    return 'public'
  }
  return customerId ? 'onboarding' : 'teaser'
}
