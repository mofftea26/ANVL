import type { Product } from '@/features/products/types/product.types';
/**
 * Catalog card — the landing page's war banner married to the shop card's
 * info plate. The gonfalon carries the product media (tilting toward the
 * pointer, status pinned to the crossbar like a heraldic label); below it a
 * fixed-structure plate (role, name, price, colorways, view affordance) keeps
 * every card in a grid exactly the same size.
 */
export declare const ProductCard: import("react").MemoExoticComponent<({ product }: {
    product: Product;
}) => import("react/jsx-runtime").JSX.Element>;
