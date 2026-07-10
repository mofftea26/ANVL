import { type PropsWithChildren, type ReactNode } from 'react';
export type FormFieldLabelStyle = 'display' | 'stacked' | 'filter' | 'micro';
interface FormFieldProps {
    label: ReactNode;
    htmlFor?: string;
    error?: string;
    hint?: ReactNode;
    labelStyle?: FormFieldLabelStyle;
    className?: string;
}
/**
 * Field wrapper: a label (4 style presets), the control, hint + error.
 * Uses an explicit `<label htmlFor>` (never an implicit label-wraps-control),
 * so composite children with their own interactive elements (e.g. a "Choose
 * media" button) never get the outer label's unrelated text folded into
 * their accessible name. When `children` is a single element,
 * `aria-invalid`/`aria-describedby` are wired onto it automatically so the
 * hint/error are announced on focus.
 */
export declare function FormField({ label, htmlFor, error, hint, labelStyle, className, children, }: PropsWithChildren<FormFieldProps>): import("react/jsx-runtime").JSX.Element;
export {};
