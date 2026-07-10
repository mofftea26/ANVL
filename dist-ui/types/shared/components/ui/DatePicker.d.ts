/**
 * Modern, dependency-free date picker: an Input-styled trigger opens a small
 * calendar (Radix Popover) with quick Month/Year jumps — built for fast entry
 * of dates far in the past (e.g. date of birth) without dozens of arrow clicks.
 * Value/onChange use plain "YYYY-MM-DD" strings, matching the native
 * `<input type="date">` contract it replaces.
 */
export declare function DatePicker({ value, onChange, id, placeholder, minYear, maxDate, disabled, }: {
    value?: string;
    onChange: (value: string) => void;
    id?: string;
    placeholder?: string;
    /** Oldest selectable year. Defaults to 100 years before today. */
    minYear?: number;
    /** Latest selectable date. Defaults to today (no future dates). */
    maxDate?: Date;
    disabled?: boolean;
}): import("react/jsx-runtime").JSX.Element;
