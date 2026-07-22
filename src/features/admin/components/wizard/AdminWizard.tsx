import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Check, X } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import { AdminChoiceDialog } from '@/features/admin/components/AdminChoiceDialog'
import {
  openAdminPreview,
  requestPreviewFocus,
  requestPreviewRoute,
} from '@/features/admin/preview/adminPreviewStore'
import type { PreviewTarget } from '@/features/cms/preview'

/** Live-preview binding for one wizard step (docked desktop mode only). */
export interface AdminWizardStepPreview {
  /** Storefront route the preview panel should show for this step. */
  route?: string
  /** Highlight target pushed on step entry (also opens the panel). */
  target?: PreviewTarget
}

export interface AdminWizardStep<TDraft> {
  key: string
  title: string
  /** One-line explanation shown under the step rail. */
  blurb?: string
  /** Optional live-preview binding — drives the docked preview panel per step. */
  preview?: AdminWizardStepPreview
  render: (draft: TDraft, setDraft: Dispatch<SetStateAction<TDraft>>) => ReactNode
}

/**
 * Unsaved-changes guard: when `isDirty()` at close/step-change time, the
 * wizard opens a Save / Discard / Continue-editing choice instead of
 * proceeding. `save` resolves `false` on failure (errors are toasted by the
 * saver) — the wizard then stays put.
 */
export interface AdminWizardGuard {
  isDirty: () => boolean
  save: () => Promise<boolean>
  discard: () => void
}

interface AdminWizardProps<TDraft> {
  open: boolean
  onClose: () => void
  title: string
  steps: Array<AdminWizardStep<TDraft>>
  /** Seed draft — re-applied every time the wizard opens. */
  initial: TDraft
  saving?: boolean
  saveLabel?: string
  onSave: (draft: TDraft) => void
  /** Footer primary requests a (guarded) close instead of calling `onSave`. */
  closeOnSave?: boolean
  /** Intercepts close + step changes while dirty (D6). */
  guard?: AdminWizardGuard
  /**
   * ≥1280px: render as a left-docked sheet beside the live preview panel
   * (which is auto-opened and driven per step). Below xl this is ignored and
   * the wizard stays a centered modal without preview signals.
   */
  dockWithPreview?: boolean
  className?: string
}

const DESKTOP_DOCK_MQ = '(min-width: 1280px)'

/** SSR-safe ≥1280px flag — false on the server and first paint. */
function useDesktopDock(enabled: boolean): boolean {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    if (!enabled) return
    const mq = window.matchMedia(DESKTOP_DOCK_MQ)
    const update = () => setWide(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [enabled])
  return enabled && wide
}

type PendingIntent = { kind: 'close' } | { kind: 'step'; index: number }

/**
 * Generic multi-step CMS wizard — jumpable step rail, back/next/save footer,
 * and a local draft that re-seeds on every open and persists only through
 * `onSave`. Two shells share the same body:
 *  - centered modal (default, and always below `xl`);
 *  - a left-docked full-height sheet on desktop when `dockWithPreview` is set,
 *    leaving the shell's live-preview panel visible and interactive beside it
 *    (focus-trapped + Escape like the modal, but no full-screen backdrop).
 * An optional {@link AdminWizardGuard} intercepts close and step changes while
 * the active step has unsaved edits.
 */
export function AdminWizard<TDraft>({
  open,
  onClose,
  title,
  steps,
  initial,
  saving = false,
  saveLabel = 'Save',
  onSave,
  closeOnSave = false,
  guard,
  dockWithPreview = false,
  className,
}: AdminWizardProps<TDraft>) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<TDraft>(initial)
  const [pending, setPending] = useState<PendingIntent | null>(null)
  const [guardSaving, setGuardSaving] = useState(false)
  const docked = useDesktopDock(dockWithPreview)

  // Re-seed when the wizard opens for a (possibly different) subject.
  useEffect(() => {
    if (open) {
      setDraft(initial)
      setStep(0)
      setPending(null)
    }
  }, [open, initial])

  const active = steps[step]

  // Docked mode drives the shell's live preview: opening the wizard (and each
  // step change) opens the panel, points it at the step's route, and pushes
  // the step's highlight target. Route changes only remount the iframe when
  // the route actually differs (panel-side no-op otherwise).
  // Primitive deps — step defs are usually rebuilt per render, so keying the
  // effect on the preview OBJECT would re-signal every render.
  const previewRoute = active?.preview?.route
  const previewTargetKind = active?.preview?.target?.kind
  const previewTargetId = active?.preview?.target?.id
  const hasPreview = Boolean(active?.preview)
  useEffect(() => {
    if (!open || !docked || !hasPreview) return
    openAdminPreview()
    if (previewRoute) requestPreviewRoute(previewRoute)
    if (previewTargetKind && previewTargetId) {
      requestPreviewFocus({ kind: previewTargetKind, id: previewTargetId })
    }
  }, [open, docked, hasPreview, previewRoute, previewTargetKind, previewTargetId])

  const proceed = useCallback(
    (intent: PendingIntent) => {
      if (intent.kind === 'close') onClose()
      else setStep(intent.index)
    },
    [onClose],
  )

  const request = useCallback(
    (intent: PendingIntent) => {
      if (guard?.isDirty()) {
        setPending(intent)
        return
      }
      proceed(intent)
    },
    [guard, proceed],
  )

  const requestClose = useCallback(() => request({ kind: 'close' }), [request])
  const requestStep = useCallback(
    (index: number) => request({ kind: 'step', index }),
    [request],
  )

  const guardSave = useCallback(() => {
    if (!guard || !pending) return
    setGuardSaving(true)
    void (async () => {
      try {
        const ok = await guard.save()
        if (ok) {
          setPending(null)
          proceed(pending)
        }
        // Failure: stay put — the saver already toasted the error.
      } finally {
        setGuardSaving(false)
      }
    })()
  }, [guard, pending, proceed])

  const guardDiscard = useCallback(() => {
    if (!guard || !pending) return
    guard.discard()
    setPending(null)
    proceed(pending)
  }, [guard, pending, proceed])

  if (!active) return null
  const isLast = step === steps.length - 1

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <ol className="flex flex-wrap items-center gap-1.5" aria-label="Wizard steps">
        {steps.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => requestStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'focus-ring rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
                i === step
                  ? 'border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_16%,transparent)] text-[var(--color-heading)]'
                  : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {i + 1}. {s.title}
            </button>
          </li>
        ))}
      </ol>

      {active.blurb ? (
        <p className="text-xs text-[var(--color-text-muted)]">{active.blurb}</p>
      ) : null}

      <div
        className={cn(
          'space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]',
          docked ? 'min-h-0 flex-1' : 'max-h-[52vh]',
        )}
      >
        {active.render(draft, setDraft)}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-line)] pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          density="compact"
          disabled={step === 0}
          onClick={() => requestStep(Math.max(0, step - 1))}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            density="compact"
            loading={saving}
            onClick={() => (closeOnSave ? requestClose() : onSave(draft))}
          >
            <Check size={15} aria-hidden="true" />
            {saveLabel}
          </Button>
          {!isLast ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              density="compact"
              onClick={() => requestStep(Math.min(steps.length - 1, step + 1))}
            >
              Next
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )

  const choiceDialog = guard ? (
    <AdminChoiceDialog
      open={pending !== null}
      onClose={() => setPending(null)}
      title="Unsaved changes"
      primaryLabel="Save"
      onPrimary={guardSave}
      primaryLoading={guardSaving}
      secondaryLabel="Discard"
      onSecondary={guardDiscard}
      cancelLabel="Continue editing"
    >
      This step has unsaved edits. Save them (saving publishes), discard them, or keep
      editing.
    </AdminChoiceDialog>
  ) : null

  if (docked) {
    return (
      <>
        <DockedWizardSheet open={open} onClose={requestClose} title={title}>
          {open ? body : null}
        </DockedWizardSheet>
        {choiceDialog}
      </>
    )
  }

  return (
    <>
      <Modal
        open={open}
        onClose={requestClose}
        title={title}
        className={cn('max-w-3xl', className)}
      >
        {body}
      </Modal>
      {choiceDialog}
    </>
  )
}

/**
 * Desktop docked shell: a fixed, full-height sheet on the left edge so the
 * live-preview panel on the right stays visible and interactive. Keeps the
 * Modal's a11y contract — `role="dialog"`, `aria-modal`, focus trap, Escape —
 * without a viewport-wide backdrop (depth comes from the border + shadow).
 */
function DockedWizardSheet({
  open,
  onClose,
  title,
  children,
}: PropsWithSheet) {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocusTrap({ open, panelRef, onClose })

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        'fixed inset-y-0 left-0 z-[80] flex w-full max-w-[44rem] flex-col',
        'border-r border-[var(--color-line)] bg-[var(--color-surface)]',
        'shadow-[24px_0_80px_-24px_rgba(0,0,0,0.75)] outline-none',
      )}
      data-testid="admin-wizard-docked"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)]/70 px-6 py-4">
        <h2 className="anvl-heading text-2xl">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close wizard"
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <X size={ICON_SIZE.md} aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-6">{children}</div>
    </div>,
    document.body,
  )
}

interface PropsWithSheet {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}
