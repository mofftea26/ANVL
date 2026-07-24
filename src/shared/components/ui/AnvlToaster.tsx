import { Check, Flame, Info, Loader2, TriangleAlert } from '@/shared/icons'
import { Toaster } from 'sonner'
import { ToastForgeEffect } from './ToastForgeEffect'

/**
 * ANVL's toast system — "the mill-stamped billet". One global mount; every
 * existing `toast.*` call site renders through it unchanged (sonner stays the
 * engine and owns entrance/exit + stacking motion).
 *
 * Design language (styles in `styles.css`, `.anvl-toast*`):
 *  - a slab of dark billet steel with ONE aggressive corner shear (the
 *    passport-plate cut) and a type-colored MOLTEN SEAM running the full top
 *    edge — it ignites on arrival and cools to a resting hairline, its heat
 *    bleeding a short way down the face
 *  - the toast TYPE is stamped as an Anton condensed uppercase eyebrow above
 *    the Sora message (ANVL / FORGED / NOTICE / WARNING / FAILED / WORKING)
 *  - the maker's mark (icon) is struck directly into the metal — no boxed
 *    cell — behind a milled vertical joint seam
 *  - a faint type-colored ember underlight sits beneath the plate
 *  - bottom-center, rising from the forge (RESP-11: clears the sticky header
 *    on mobile and primary chrome on desktop; `mobileOffset` lifts it above
 *    the home indicator + sticky purchase / tab bars)
 *
 * Ember materialization: {@link ToastForgeEffect} is a sibling canvas layer
 * that watches for each new sonner plate and forges it in with a converging
 * ember swarm — the same particle language as the shared Modal, scaled to the
 * small plate. The seam is painted from frame one, so the embers land on live
 * heat. The forge layer renders nothing under reduced motion, and the seam's
 * ignition flare is stripped there too (static plate).
 *
 * All colors come from theme tokens, so CMS palettes propagate and both
 * `oath-dark` and `bone-light` stay legible.
 */
export function AnvlToaster() {
  return (
    <>
      <Toaster
        position="bottom-center"
        offset={20}
        mobileOffset={{ bottom: 96 }}
        gap={10}
        visibleToasts={3}
        closeButton
        icons={{
          success: <Check strokeWidth={2.5} aria-hidden="true" />,
          info: <Info strokeWidth={2.25} aria-hidden="true" />,
          warning: <Flame strokeWidth={2.25} aria-hidden="true" />,
          error: <TriangleAlert strokeWidth={2.25} aria-hidden="true" />,
          loading: <Loader2 strokeWidth={2.25} aria-hidden="true" className="animate-spin" />,
        }}
        toastOptions={{
          classNames: {
            toast: 'anvl-toast',
            content: 'anvl-toast-content',
            title: 'anvl-toast-title',
            description: 'anvl-toast-description',
            icon: 'anvl-toast-icon',
            closeButton: 'anvl-toast-close',
            actionButton: 'anvl-toast-action',
            cancelButton: 'anvl-toast-cancel',
          },
        }}
      />
      <ToastForgeEffect />
    </>
  )
}
