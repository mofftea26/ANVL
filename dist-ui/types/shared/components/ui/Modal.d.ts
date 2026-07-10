import { type PropsWithChildren, type ReactNode } from 'react';
type ModalProps = PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    /**
     * Optional dialog heading. When provided, renders as `<h2>` inside the
     * panel and is wired to `aria-labelledby` automatically. Pass a string
     * (most common) or any ReactNode for richer markup.
     */
    title?: ReactNode;
    /**
     * Explicit `aria-labelledby` ID — use when the dialog already has a
     * visible heading rendered by the caller. Mutually exclusive with `title`.
     */
    'aria-labelledby'?: string;
    /**
     * Optional ID of the element describing the dialog — forwarded to
     * `role="dialog"` for screen readers (PAIR with visible body copy).
     */
    'aria-describedby'?: string;
    /** Aria label fallback when no `title` / `aria-labelledby` is set. */
    'aria-label'?: string;
    className?: string;
}>;
/**
 * Accessible modal dialog with full focus management (audit RESP-01).
 * - Traps Tab/Shift+Tab inside the panel.
 * - Closes on Escape.
 * - Moves focus into the dialog on open, restores focus on close
 *   (delegated to {@link useDialogFocusTrap}).
 * - Exposes `aria-modal="true"` and a labelled-by relationship via the
 *   `title` prop (recommended) or an explicit `aria-labelledby` ID.
 */
export declare function Modal({ open, onClose, children, title, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-label': ariaLabel, className, }: ModalProps): import("react").ReactPortal | null;
export {};
