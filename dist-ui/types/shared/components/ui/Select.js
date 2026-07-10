import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';
import { ICON_SIZE } from '@/shared/lib/iconSize';
const selectTriggerClass = cva('group flex w-full min-w-0 items-center justify-between gap-2 text-left text-[var(--color-text)] outline-none transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-[var(--color-text-muted)]', {
    variants: {
        density: {
            comfortable: 'h-11 rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-line))] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] md:text-sm',
            compact: 'focus-ring h-9 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 text-xs transition-colors hover:bg-[var(--color-surface-elevated)]',
        },
    },
    defaultVariants: { density: 'comfortable' },
});
const selectItemClass = cva('relative flex cursor-pointer select-none items-center rounded-lg pl-8 pr-3 leading-snug text-[var(--color-text)] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-[var(--color-chip)]', {
    variants: {
        density: {
            comfortable: 'py-2.5 text-sm data-[state=checked]:font-semibold data-[state=checked]:text-[var(--color-heading)] md:text-[0.85rem]',
            compact: 'flex-col items-start gap-0.5 py-2.5 text-xs data-[highlighted]:text-[var(--color-text)] data-[state=checked]:bg-[var(--color-accent)]/10 data-[state=checked]:text-[var(--color-heading)]',
        },
    },
    defaultVariants: { density: 'comfortable' },
});
/**
 * Modern, fully custom dropdown (Radix UI primitive under the hood — native
 * `<select>` options can't be styled cross-browser). `density="comfortable"`
 * (default) matches {@link Input}'s touch-friendly chrome; `density="compact"`
 * is admin's dense utility chrome. Controlled: pass `value` + `onValueChange`,
 * and `SelectItem`s as children.
 */
export function Select({ value, defaultValue, onValueChange, placeholder, disabled, id, name, density, className, children, valueLabel, 'aria-label': ariaLabel, }) {
    return (_jsxs(SelectPrimitive.Root, { value: value, defaultValue: defaultValue, onValueChange: onValueChange, disabled: disabled, name: name, children: [_jsxs(SelectPrimitive.Trigger, { id: id, "aria-label": ariaLabel, className: cn(selectTriggerClass({ density }), className), children: [_jsx("span", { className: "min-w-0 truncate", children: _jsx(SelectPrimitive.Value, { placeholder: placeholder, children: valueLabel }) }), _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDown, { size: 15, "aria-hidden": "true", className: "shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-data-[state=open]:rotate-180" }) })] }), _jsx(SelectPrimitive.Portal, { children: _jsxs(SelectPrimitive.Content, { position: "popper", sideOffset: 8, collisionPadding: 8, className: "z-[85] max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_-14px_rgba(0,0,0,0.65)] outline-none backdrop-blur-md data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1", children: [_jsx(SelectPrimitive.ScrollUpButton, { className: "flex h-6 items-center justify-center text-[var(--color-text-muted)]", children: _jsx(ChevronUp, { size: ICON_SIZE.sm, "aria-hidden": "true" }) }), _jsx(SelectPrimitive.Viewport, { className: "space-y-0.5", children: children }), _jsx(SelectPrimitive.ScrollDownButton, { className: "flex h-6 items-center justify-center text-[var(--color-text-muted)]", children: _jsx(ChevronDown, { size: ICON_SIZE.sm, "aria-hidden": "true" }) })] }) })] }));
}
export const SelectItem = forwardRef(function SelectItem({ className, density, children, ...props }, ref) {
    return (_jsxs(SelectPrimitive.Item, { ref: ref, className: cn(selectItemClass({ density }), className), ...props, children: [_jsx("span", { className: "absolute left-2.5 flex h-4 w-4 items-center justify-center", children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(Check, { size: 13, "aria-hidden": "true", className: "text-[var(--color-accent)]" }) }) }), _jsx(SelectPrimitive.ItemText, { children: children })] }));
});
