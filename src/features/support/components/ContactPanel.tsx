import { Container, Section } from '@/shared/components/ui'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { Hourglass, Instagram, Mail, MapPin, Phone, type LucideIcon } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { ResolvedSupportContent } from '@/features/cms/support/resolveSupportContent'

type ContactInfo = ResolvedSupportContent['contact']

type Row = {
  key: string
  label: string
  value: string
  href: string | null
  Icon: LucideIcon
}

/** Normalizes an Instagram handle/URL to a canonical https profile link. */
function instagramHref(handle: string): string {
  const trimmed = handle.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

function buildRows(contact: ContactInfo): Row[] {
  const rows: Row[] = []
  if (contact.email.trim()) {
    rows.push({
      key: 'email',
      label: 'Email',
      value: contact.email,
      href: `mailto:${contact.email.trim()}`,
      Icon: Mail,
    })
  }
  if (contact.phone.trim()) {
    rows.push({
      key: 'phone',
      label: 'Phone',
      value: contact.phone,
      href: `tel:${contact.phone.replace(/[^\d+]/g, '')}`,
      Icon: Phone,
    })
  }
  if (contact.instagram.trim()) {
    rows.push({
      key: 'instagram',
      label: 'Instagram',
      value: contact.instagram,
      href: instagramHref(contact.instagram),
      Icon: Instagram,
    })
  }
  if (contact.address.trim()) {
    rows.push({ key: 'address', label: 'Location', value: contact.address, href: null, Icon: MapPin })
  }
  if (contact.hours.trim()) {
    rows.push({ key: 'hours', label: 'Hours', value: contact.hours, href: null, Icon: Hourglass })
  }
  return rows
}

/**
 * Contact details as clean, actionable rows (email → mailto, phone → tel,
 * Instagram → profile link; address + hours are plain). No form is posted
 * anywhere — these are direct, honest contact channels.
 */
export function ContactPanel({ contact }: { contact: ContactInfo }) {
  const rows = buildRows(contact)
  if (rows.length === 0) return null
  return (
    <Section>
      <Container className="max-w-2xl">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ key, label, value, href, Icon }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <span className="mt-0.5 text-[var(--color-highlight-bright)]">
                <Icon size={ICON_SIZE.md} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="anvl-micro text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm text-[var(--color-text)]">
                  {href ? (
                    <SafeLink
                      href={href}
                      className="focus-ring rounded underline-offset-4 transition-colors hover:text-[var(--color-highlight-bright)] hover:underline"
                    >
                      {value}
                    </SafeLink>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}
