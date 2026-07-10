import type { InputHTMLAttributes, ReactNode } from 'react';
export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
    /** When provided, renders the checkbox as a labeled row (folded in from the retired AdminCheckbox). */
    label?: ReactNode;
    /** Extra description under the label (help text) — only used together with `label`. */
    description?: ReactNode;
};
/**
 * Modern checkbox — accent-filled, rounded, subtle focus ring. Pass no
 * `label` for a bare control meant to be composed by the caller's own label
 * markup; pass `label` (+ optional `description`) for a self-contained
 * labeled row.
 */
export declare function Checkbox({ className, label, description, disabled, id, ...props }: CheckboxProps): import("react/jsx-runtime").JSX.Element;
