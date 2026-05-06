import type { WaitlistInput } from '../types/waitlist.types'

export async function submitWaitlistMock(input: WaitlistInput) {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { ok: true, ...input }
}
