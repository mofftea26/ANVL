export type DropScheduleTiming = 'none' | 'future' | 'imminent' | 'past_due'

export function resolveDropScheduleTiming(
  scheduledActivationAt: string | undefined,
  status: string,
): DropScheduleTiming {
  if (status !== 'scheduled') return 'none'
  const raw = scheduledActivationAt?.trim()
  if (!raw) return 'none'

  const targetMs = new Date(raw).getTime()
  if (!Number.isFinite(targetMs)) return 'none'

  const diffMs = targetMs - Date.now()
  if (diffMs > 2 * 60_000) return 'future'
  if (diffMs > 0) return 'imminent'
  return 'past_due'
}

export function formatDropScheduleLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export function defaultScheduleActivationIso(minutesFromNow = 15): string {
  const d = new Date(Date.now() + minutesFromNow * 60_000)
  d.setSeconds(0, 0)
  return d.toISOString()
}

export function scheduleActivationHint(
  scheduledActivationAt: string | undefined,
  status: string,
): string {
  const timing = resolveDropScheduleTiming(scheduledActivationAt, status)
  if (timing === 'none') {
    return 'Leave empty to keep inactive, or pick a date/time to auto-activate on the storefront. Promotion runs every ~2 minutes via the database scheduler (not the Edge Function logs).'
  }

  const when = formatDropScheduleLocal(scheduledActivationAt!)

  switch (timing) {
    case 'future':
      return `Scheduled for ${when}. The drop will auto-activate shortly after that time (database cron, ~2 min).`
    case 'imminent':
      return `Activates at ${when} — promotion should run within the next couple of minutes.`
    case 'past_due':
      return `Activation time (${when}) has passed. If still scheduled, wait for the next cron tick (~2 min) or use “Run due schedules” on the drops list.`
    default:
      return ''
  }
}
