import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef, } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
/**
 * Accessible modal dialog with full focus management (audit RESP-01).
 * - Traps Tab/Shift+Tab inside the panel.
 * - Closes on Escape.
 * - Moves focus into the dialog on open, restores focus on close
 *   (delegated to {@link useDialogFocusTrap}).
 * - Exposes `aria-modal="true"` and a labelled-by relationship via the
 *   `title` prop (recommended) or an explicit `aria-labelledby` ID.
 */
export function Modal({ open, onClose, children, title, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-label': ariaLabel, className, }) {
    const panelRef = useRef(null);
    const generatedTitleId = useId();
    const hasTitle = title != null && title !== '';
    const titleHeadingId = hasTitle ? generatedTitleId : undefined;
    useDialogFocusTrap({ open, panelRef, onClose });
    // Dialogs are interaction-driven (never open during SSR), but guard anyway.
    if (!open || typeof document === 'undefined')
        return null;
    const labelledByProp = ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy.trim() : undefined;
    // Portal to <body>: callers render modals inside cards/sections that create
    // stacking contexts (e.g. AdminCard's z-[1]), which trapped the fixed
    // overlay beneath sibling content. z-[90] clears admin chrome (topbar z-30,
    // sync indicator z-50, popovers z-[85]).
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-[90] grid place-items-center p-4", children: [_jsx("button", { className: "absolute inset-0 bg-black/70", onClick: onClose, "aria-label": "Close modal backdrop" }), _jsxs("div", { ref: panelRef, tabIndex: -1, className: cn('relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none', 'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-300 motion-reduce:transition-none', className), role: "dialog", "aria-modal": "true", "aria-label": labelledByProp || hasTitle ? undefined : ariaLabel?.trim() || 'Dialog', "aria-labelledby": labelledByProp ?? titleHeadingId, "aria-describedby": ariaDescribedBy && ariaDescribedBy.trim()
                    ? ariaDescribedBy.trim()
                    : undefined, children: [hasTitle ? (_jsx("h2", { id: titleHeadingId, className: "anvl-heading mb-4 text-2xl", children: title })) : null, children] })] }), document.body);
}
