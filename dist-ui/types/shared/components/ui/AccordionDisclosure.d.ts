import type { ReactNode } from 'react';
/**
 * Lightweight accessible accordion using native `<details>`.
 *
 * a11y notes (audit RESP-14):
 * - The chevron is purely decorative and is marked `aria-hidden="true"`
 *   so screen readers don't announce the "▼" glyph as a separate token.
 * - `<summary>` gets the `focus-ring` utility so keyboard users see a
 *   visible focus state matching the rest of the storefront chrome.
 */
export declare function AccordionDisclosure({ title, children, }: {
    title: string;
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
