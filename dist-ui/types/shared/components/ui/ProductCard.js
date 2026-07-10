import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { memo } from 'react';
import { WarBanner } from '@/shared/components/premium/WarBanner';
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags';
import { withShopifyImageWidth } from '@/shared/lib/url';
import { ICON_SIZE } from '@/shared/lib/iconSize';
/** Grid cards render at most ~400 CSS px wide; covers retina at that size. */
const CARD_IMAGE_WIDTH = 800;
function statusChip(product) {
    const s = product.shop?.storefrontStatus;
    if (!s)
        return null;
    switch (s) {
        case 'comingSoon':
            return 'Coming soon';
        case 'outOfStock':
            return 'Out of stock';
        case 'sale':
            return 'Sale';
        case 'limitedEdition':
            return 'Limited';
        case 'available':
        default:
            return null;
    }
}
/**
 * Catalog card — the landing page's war banner married to the shop card's
 * info plate. The gonfalon carries the product media (tilting toward the
 * pointer, status pinned to the crossbar like a heraldic label); below it a
 * fixed-structure plate (role, name, price, colorways, view affordance) keeps
 * every card in a grid exactly the same size.
 */
export const ProductCard = memo(function ProductCard({ product }) {
    const chip = statusChip(product);
    const shop = product.shop;
    const showCompare = typeof shop?.compareAtPrice === 'number' && shop.compareAtPrice > product.price;
    const rawMedia = product.images[0]?.src;
    const media = rawMedia ? withShopifyImageWidth(rawMedia, CARD_IMAGE_WIDTH) : rawMedia;
    const alt = product.images[0]?.alt ?? `${product.name} editorial placeholder`;
    return (_jsx("article", { className: "group relative flex h-full flex-col motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1", children: _jsxs(Link, { to: "/shop/$slug", params: { slug: product.slug }, className: "focus-ring flex h-full flex-col rounded-md no-underline", "aria-label": `${stripAngleBracketTags(product.name)} — view piece`, children: [_jsx("div", { className: "px-2 pt-1.5", children: _jsx(WarBanner, { media: media, alt: alt, label: chip ?? undefined, aspectClassName: "aspect-[3/4]", elevated: true }) }), _jsxs("div", { className: "mt-4 flex flex-1 flex-col px-2 pb-1", children: [_jsx("p", { className: "anvl-micro text-[var(--color-highlight-bright)]", children: stripAngleBracketTags(product.role) }), _jsxs("div", { className: "mt-1.5 flex items-start justify-between gap-3", children: [_jsx("h3", { className: "anvl-heading line-clamp-2 min-h-[2em] min-w-0 break-words text-xl font-normal leading-[1] md:text-2xl", children: stripAngleBracketTags(product.name) }), _jsxs("div", { className: "shrink-0 text-right text-sm", children: [showCompare && shop ? (_jsxs("p", { className: "text-[var(--color-text-muted)] line-through", children: ["$", shop.compareAtPrice] })) : null, _jsxs("p", { className: "anvl-display text-[var(--color-text)]", children: ["$", product.price] })] })] }), _jsxs("div", { className: "mt-auto flex min-h-6 items-end justify-between gap-3 pt-3", children: [product.colorways.length > 0 ? (_jsx("ul", { className: "flex flex-wrap items-center gap-2", "aria-label": "Colorways", children: product.colorways.map((colorway) => (_jsx("li", { title: stripAngleBracketTags(colorway.name), className: "h-4 w-4 rounded-full ring-1 ring-[var(--color-line)]", style: {
                                            backgroundColor: colorway.base,
                                            boxShadow: `inset 0 0 0 2px ${colorway.accent}33`,
                                        }, children: _jsx("span", { className: "sr-only", children: stripAngleBracketTags(colorway.name) }) }, colorway.name))) })) : (_jsx("span", { "aria-hidden": "true" })), _jsxs("span", { className: "anvl-micro inline-flex shrink-0 items-center gap-1 text-[var(--color-text)] transition-colors duration-300 group-hover:text-[var(--color-highlight-bright)]", children: ["View piece", _jsx(ArrowUpRight, { size: ICON_SIZE.xs, "aria-hidden": "true", className: "transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" })] })] })] })] }) }));
});
