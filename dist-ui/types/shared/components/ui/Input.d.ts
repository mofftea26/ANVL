import { type VariantProps } from 'class-variance-authority';
import type { InputHTMLAttributes } from 'react';
/**
 * Modern text input. `density="comfortable"` (default) is the soft
 * translucent, touch-friendly storefront/account chrome; `density="compact"`
 * is admin's dense pill-shaped utility chrome (many fields per screen).
 * `text-base` on mobile / `text-sm` on md+ at comfortable density so iOS
 * Safari doesn't zoom on focus (RESP-07).
 */
export declare const inputBaseClass: (props?: ({
    density?: "comfortable" | "compact" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type InputProps = InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof inputBaseClass>;
export declare function Input({ className, density, ...props }: InputProps): import("react/jsx-runtime").JSX.Element;
