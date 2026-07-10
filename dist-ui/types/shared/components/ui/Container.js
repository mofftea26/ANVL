import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
export function Container({ children, className, }) {
    return (_jsx("div", { className: cn('mx-auto w-full max-w-[var(--anvl-content-max)] px-4 md:px-8 2xl:max-w-[var(--anvl-content-max-wide)]', className), children: children }));
}
