import { jsx as _jsx } from "react/jsx-runtime";
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';
/**
 * Modern textarea — matches {@link Input} chrome per density.
 * `text-base` on mobile / `text-sm` on md+ at comfortable density (RESP-07).
 */
const textareaClass = cva('w-full text-[var(--color-text)] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50', {
    variants: {
        density: {
            comfortable: 'rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 py-2.5 text-base hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-line))] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] md:text-sm',
            compact: 'focus-ring min-h-[5rem] rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-2 text-xs transition-colors hover:bg-[var(--color-surface-elevated)]',
        },
    },
    defaultVariants: { density: 'comfortable' },
});
export function Textarea({ className, density, ...props }) {
    return _jsx("textarea", { className: cn(textareaClass({ density }), className), ...props });
}
