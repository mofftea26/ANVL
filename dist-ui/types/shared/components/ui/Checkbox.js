import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
const checkboxInputClass = 'h-[1.15rem] w-[1.15rem] cursor-pointer rounded-md border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] accent-[var(--color-accent)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]';
/**
 * Modern checkbox — accent-filled, rounded, subtle focus ring. Pass no
 * `label` for a bare control meant to be composed by the caller's own label
 * markup; pass `label` (+ optional `description`) for a self-contained
 * labeled row.
 */
export function Checkbox({ className, label, description, disabled, id, ...props }) {
    if (label === undefined) {
        return (_jsx("input", { type: "checkbox", disabled: disabled, id: id, className: cn(checkboxInputClass, className), ...props }));
    }
    return (_jsxs("label", { className: cn('flex cursor-pointer gap-3 rounded-xl border border-transparent px-2 py-1.5 text-xs text-[var(--color-text)] transition-colors', 'hover:border-[var(--color-line)] hover:bg-[var(--color-surface-soft)]', disabled && 'cursor-not-allowed opacity-60', className), children: [_jsx("input", { id: id, type: "checkbox", disabled: disabled, className: cn(checkboxInputClass, 'mt-0.5 shrink-0'), ...props }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "font-medium text-[var(--color-text)]", children: label }), description ? (_jsx("span", { className: "mt-0.5 block text-xs leading-relaxed text-[var(--color-text-muted)]", children: description })) : null] })] }));
}
