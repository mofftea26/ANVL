import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from '@tanstack/react-router';
import { isExternalHref, sanitizeHref, } from '@/shared/lib/url';
export function SafeLink({ href, children, className, onClick, sanitizeOptions, forceExternal, ...rest }) {
    const safe = sanitizeHref(href, sanitizeOptions);
    if (safe === null) {
        return _jsx("span", { className: className, children: children });
    }
    const external = forceExternal === true || isExternalHref(safe);
    if (external) {
        return (_jsx("a", { ...rest, href: safe, target: rest.target ?? '_blank', rel: rest.rel ?? 'noreferrer noopener', className: className, onClick: onClick, children: children }));
    }
    return (_jsx(Link
    // Anchor pass-throughs (data-*, aria-*, etc.) flow through TanStack
    // Link onto the underlying <a>. `target`/`rel` deliberately omitted
    // for internal links — use forceExternal if you want them.
    , { ...rest, to: safe, className: className, onClick: onClick, children: children }));
}
