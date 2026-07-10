/**
 * Removes simple angle-bracket tag patterns from CMS plain-text fields.
 * React text nodes already escape HTML; this strips markup-like noise so
 * screen readers and link previews don't announce stray "less-than script
 * greater-than" tokens when an editor pastes HTML into a plain-text field.
 *
 * Use at the public render boundary (every component that displays a CMS
 * string in chrome / cards / hero copy). Persistence-level sanitization
 * is tracked separately in Phase C.
 *
 * Audit refs: SEC-19 / Phase B5.
 */
export declare function stripAngleBracketTags(value: string): string;
export declare function stripAngleBracketTags(value: string | null | undefined): string;
