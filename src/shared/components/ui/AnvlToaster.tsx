import { Check, Flame, Info, Loader2, TriangleAlert } from 'lucide-react'
import { Toaster } from 'sonner'

/**
 * ANVL's toast system — "the forged plate". One global mount; every existing
 * `toast.*` call site renders through it unchanged.
 *
 * Design language (styles in `styles.css`, `.anvl-toast*`):
 *  - a beveled obsidian plate (clipped corners, brushed-metal top light,
 *    deep drop shadow that follows the bevel)
 *  - a type-colored HEAT BAR on the leading edge that flares on arrival
 *  - a one-time light sweep across the plate as it lands (metal catching
 *    the forge light)
 *  - the icon sits in a stamped square cell, like a maker's mark
 *  - bottom-center, rising from the forge (RESP-11: clears the sticky
 *    header on mobile and primary chrome on desktop; `mobileOffset` lifts
 *    it above the home indicator + sticky purchase / tab bars)
 *
 * All colors come from theme tokens, so CMS palettes propagate and both
 * `oath-dark` and `bone-light` stay legible. Reduced motion drops the
 * flare + sweep (sonner's own entrance respects it already).
 */
export function AnvlToaster() {
  return (
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
  )
}
