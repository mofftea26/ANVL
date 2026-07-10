import { type RefObject } from 'react';
/**
 * Focus trap for `role="dialog"` panels: moves focus to the first control on
 * open, cycles Tab / Shift+Tab inside the panel, closes on Escape, restores
 * focus on cleanup. Safe for SSR (effect runs only when `open` is true).
 */
export declare function useDialogFocusTrap(opts: {
    open: boolean;
    panelRef: RefObject<HTMLElement | null>;
    onClose: () => void;
}): void;
