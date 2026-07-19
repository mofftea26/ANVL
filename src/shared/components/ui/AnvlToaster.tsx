import { Check, Flame, Info, Loader2, TriangleAlert } from '@/shared/icons'
import { Toaster } from 'sonner'
import { ToastForgeEffect } from './ToastForgeEffect'

/**
 * ANVL's toast system — "the forged plate". One global mount; every existing
 * `toast.*` call site renders through it unchanged (sonner stays the engine).
 *
 * Design language (styles in `styles.css`, `.anvl-toast*`):
 *  - a beveled, edge-lit obsidian slab (clipped forged corners, brushed top
 *    light, deep drop shadow that follows the bevel)
 *  - a type-colored HEAT EDGE on the leading side that glows hot on arrival
 *    then cools — the plate reads as just-forged
 *  - the icon sits in a stamped, clipped maker's-mark cell
 *  - a title in Sora (semibold, legible for arbitrary copy) over Sora body
 *  - bottom-center, rising from the forge (RESP-11: clears the sticky header
 *    on mobile and primary chrome on desktop; `mobileOffset` lifts it above
 *    the home indicator + sticky purchase / tab bars)
 *
 * Ember materialization: {@link ToastForgeEffect} is a sibling canvas layer
 * that watches for each new sonner plate and forges it in with a converging
 * ember swarm — the same particle language as the shared Modal, scaled to the
 * small plate. It renders nothing under reduced motion.
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
