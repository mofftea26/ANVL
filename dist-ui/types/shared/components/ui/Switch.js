import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
/**
 * Modern toggle switch. Controlled. Accessible (role=switch + aria-checked).
 * Use for boolean preferences instead of a bare checkbox.
 */
export function Switch({ checked, onChange, label, description, id, }) {
    return (_jsxs("label", { htmlFor: id, className: "flex cursor-pointer items-start justify-between gap-4", children: [_jsxs("span", { className: "min-w-0", children: [_jsx("span", { className: "block text-sm font-medium text-[var(--color-text)]", children: label }), description ? (_jsx("span", { className: "mt-0.5 block text-xs text-[var(--color-text-muted)]", children: description })) : null] }), _jsx("button", { id: id, type: "button", role: "switch", "aria-checked": checked, "aria-label": label, onClick: () => onChange(!checked), className: cn('focus-ring relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200', checked
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                    : 'border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)]'), children: _jsx("span", { className: cn('inline-block h-4 w-4 transform rounded-full bg-[var(--color-bg)] shadow transition-transform duration-200', checked ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]') }) })] }));
}
