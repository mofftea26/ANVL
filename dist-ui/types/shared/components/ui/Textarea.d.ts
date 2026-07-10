import { type VariantProps } from 'class-variance-authority';
import type { TextareaHTMLAttributes } from 'react';
/**
 * Modern textarea — matches {@link Input} chrome per density.
 * `text-base` on mobile / `text-sm` on md+ at comfortable density (RESP-07).
 */
declare const textareaClass: (props?: ({
    density?: "comfortable" | "compact" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & VariantProps<typeof textareaClass>;
export declare function Textarea({ className, density, ...props }: TextareaProps): import("react/jsx-runtime").JSX.Element;
export {};
