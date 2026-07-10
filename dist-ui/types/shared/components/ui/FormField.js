import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement, useId, } from 'react';
import { cn } from '@/shared/lib/cn';
const labelStyles = {
    // Storefront default — the field wrapper's original look, unchanged.
    display: 'anvl-display block text-[11px] font-medium tracking-[0.12em] text-[var(--color-text-muted)]',
    // The 3 presets folded in from the retired AdminFieldLabel.
    stacked: 'block text-xs text-[var(--color-text-muted)]',
    filter: 'block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]',
    micro: 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]',
};
/**
 * Field wrapper: a label (4 style presets), the control, hint + error.
 * Uses an explicit `<label htmlFor>` (never an implicit label-wraps-control),
 * so composite children with their own interactive elements (e.g. a "Choose
 * media" button) never get the outer label's unrelated text folded into
 * their accessible name. When `children` is a single element,
 * `aria-invalid`/`aria-describedby` are wired onto it automatically so the
 * hint/error are announced on focus.
 */
export function FormField({ label, htmlFor, error, hint, labelStyle = 'display', className, children, }) {
    const hintId = useId();
    const errorId = useId();
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
    const control = isValidElement(children) && Children.count(children) === 1
        ? cloneElement(
        // Generic a11y prop injection — the wrapped control's own prop type
        // isn't known statically here, so this is deliberately widened.
        children, { 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
        : children;
    return (_jsxs("div", { className: cn('block space-y-1.5', className), children: [_jsx("label", { className: labelStyles[labelStyle], htmlFor: htmlFor, children: label }), control, hint ? (_jsx("span", { id: hintId, className: "block text-xs text-[var(--color-text-muted)]", children: hint })) : null, error ? (_jsx("span", { id: errorId, className: "block text-xs text-[color:var(--color-danger)]", role: "alert", children: error })) : null] }));
}
