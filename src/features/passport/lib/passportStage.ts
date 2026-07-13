import type { PassportView } from '../schemas/passport.schema'

export type PassportStage =
  | 'not_found'
  | 'owner'
  | 'public'
  | 'teaser'
  | 'onboarding'

/**
 * Pure resolution of what the /p/$token page shows — kept out of the
 * component so the state machine is unit-testable:
 *  - unknown token → not_found
 *  - mine → owner passport
 *  - claimed by someone else (or viewing anonymously) → public authenticity view
 *  - unclaimed + signed out → teaser (sign-in gate)
 *  - unclaimed + signed in → onboarding (claim flow)
 */
export function resolvePassportStage(
  view: PassportView | null,
  customerId: string | null,
): PassportStage {
  if (!view) return 'not_found'
  if (view.isOwner) return 'owner'
  if (view.isClaimed) return 'public'
  return customerId ? 'onboarding' : 'teaser'
}
