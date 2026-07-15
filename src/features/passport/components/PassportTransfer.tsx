import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftRight, Check, Copy, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Product } from '@/features/products/types/product.types'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { BRAND } from '@/shared/constants/brand'
import {
  useAcceptTransferMutation,
  useCancelTransferMutation,
  useInitiateTransferMutation,
} from '../hooks/usePassport'
import type { AcceptTransferError, PassportView } from '../schemas/passport.schema'
import { AuthenticityPlate } from './AuthenticityPlate'
import { PassportAtmosphere } from './PassportAtmosphere'

/* ------------------------------------------------------------------------ *
 * Owner side — "Transfer ownership" action + modal (mint/copy/cancel link).
 * ------------------------------------------------------------------------ */

export function PassportTransferAction({
  token,
  view,
}: {
  token: string
  view: PassportView
}) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const initiate = useInitiateTransferMutation()
  const cancel = useCancelTransferMutation()

  const mint = async () => {
    const result = await initiate.mutateAsync(token)
    if (!result.ok) {
      toast.error('Could not start the transfer. Are you still the owner?')
      return
    }
    setLink(`${BRAND.canonicalBaseUrl}/p/${token}?transfer=${result.code}`)
    setCopied(false)
  }

  const copy = () => {
    if (!link) return
    void navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true)
        toast.success('Transfer link copied — send it to the new owner.')
      })
      .catch(() => toast.error('Could not copy the link.'))
  }

  const void_ = async () => {
    const ok = await cancel.mutateAsync(token)
    if (ok) {
      setLink(null)
      toast.success('Transfer cancelled — the link no longer works.')
    } else {
      toast.error('Could not cancel the transfer.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring anvl-micro mt-2 inline-flex items-center gap-1.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
        {view.isTransferPending ? 'Transfer pending…' : 'Transfer ownership'}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Transfer ownership">
        <div className="space-y-4 text-sm text-[var(--color-text-muted)]">
          <p>
            Passing the piece on? Mint a one-time transfer link and send it to the new
            owner. When they sign in and accept, the plate is re-forged to their name —
            permanently. The link dies after 7 days or the moment you cancel it.
          </p>

          {link ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input readOnly value={link} aria-label="Transfer link" className="flex-1" />
                <Button type="button" variant="secondary" size="sm" onClick={copy}>
                  {copied ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                loading={cancel.isPending}
                onClick={() => void void_()}
              >
                <XCircle size={14} aria-hidden="true" />
                Cancel transfer
              </Button>
            </div>
          ) : view.isTransferPending ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={initiate.isPending}
                onClick={() => void mint()}
              >
                Mint a new link
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                loading={cancel.isPending}
                onClick={() => void void_()}
              >
                <XCircle size={14} aria-hidden="true" />
                Cancel pending transfer
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={initiate.isPending}
              onClick={() => void mint()}
            >
              <ArrowLeftRight size={14} aria-hidden="true" />
              Mint transfer link
            </Button>
          )}
        </div>
      </Modal>
    </>
  )
}

/* ------------------------------------------------------------------------ *
 * Recipient side — the accept screen (signed in, live code in the URL).
 * ------------------------------------------------------------------------ */

const acceptSchema = z.object({
  displayName: z.string().min(1, 'Enter the name to engrave').max(120),
})

const ACCEPT_ERROR_COPY: Record<AcceptTransferError, string> = {
  not_authenticated: 'Your session expired — sign in again to accept.',
  invalid_input: 'Something went wrong. Try again.',
  transfer_invalid:
    'This transfer link is no longer valid — it may have expired or been cancelled.',
}

export function PassportTransferAccept({
  token,
  code,
  view,
  product,
  onAccepted,
}: {
  token: string
  code: string
  view: PassportView
  product: Product | null
  onAccepted: (claimed: PassportView) => void
}) {
  const profileQuery = useCustomerProfileQuery()
  const accept = useAcceptTransferMutation()
  const form = useForm({
    resolver: zodResolver(acceptSchema),
    defaultValues: { displayName: '' },
  })

  const customer = profileQuery.data
  useEffect(() => {
    if (!customer) return
    if (form.getValues('displayName')) return
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
    if (name) form.setValue('displayName', name)
  }, [customer, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await accept.mutateAsync({ token, code, displayName: values.displayName })
    if (result.ok) {
      onAccepted(result.passport)
      return
    }
    toast.error(ACCEPT_ERROR_COPY[result.error])
  })

  return (
    <div className="relative flex min-h-[calc(100svh-var(--anvl-header-h))] items-center justify-center overflow-hidden bg-[var(--color-bg)] px-6 py-16">
      <PassportAtmosphere imageSrc={product?.images[0]?.src} />
      <form onSubmit={onSubmit} className="relative mx-auto max-w-lg text-center">
        <ArrowLeftRight
          aria-hidden="true"
          className="mx-auto mb-6 h-9 w-9 text-[var(--color-highlight-bright)]"
        />
        <p className="anvl-micro mb-4 text-[var(--color-text-muted)]">
          Ownership transfer ·{' '}
          {view.claimedDisplayName ? `from ${view.claimedDisplayName}` : 'offered to you'}
        </p>
        <h1 className="anvl-heading text-4xl text-[var(--color-heading)] sm:text-5xl">
          {view.productName}
        </h1>
        <div className="mt-8 flex justify-center">
          <AuthenticityPlate editionTotal={view.editionTotal} />
        </div>
        <p className="mt-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Accepting re-forges this passport to your name — it leaves{' '}
          {view.claimedDisplayName ?? 'the current owner'}&apos;s armory and becomes
          permanently yours.
        </p>
        <div className="mx-auto mt-8 max-w-sm text-left">
          <label
            htmlFor="transfer-display-name"
            className="anvl-micro mb-3 block text-[var(--color-text-muted)]"
          >
            Name on the plate
          </label>
          <Input
            id="transfer-display-name"
            placeholder="The name engraved on your passport"
            {...form.register('displayName')}
          />
          {form.formState.errors.displayName?.message ? (
            <p className="mt-2 text-xs text-[var(--color-danger)]">
              {form.formState.errors.displayName.message}
            </p>
          ) : null}
        </div>
        <div className="mt-8 flex justify-center">
          <Button type="submit" variant="primary" size="lg" loading={accept.isPending}>
            {accept.isPending ? 'Re-forging…' : 'Accept & re-forge to my name'}
          </Button>
        </div>
      </form>
    </div>
  )
}
