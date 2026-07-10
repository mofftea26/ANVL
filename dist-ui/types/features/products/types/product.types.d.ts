export interface ProductColorway {
    name: string;
    base: string;
    accent: string;
}
export type StorefrontProductStatus = 'available' | 'comingSoon' | 'outOfStock' | 'sale' | 'limitedEdition';
export interface ShopDropFilterOption {
    id: string;
    slug: string;
    name: string;
    dropNumber: string;
}
/** Storefront-only metadata mapped from `AdminProduct` for shop filters, PDP, and JSON-LD. */
export interface ProductShopMeta {
    storefrontStatus: StorefrontProductStatus;
    sourceType: 'drop' | 'individual';
    dropId: string | null;
    /** All ANVL drop client ids linked via Shopify `anvl.drop_ids` metafield. */
    dropIds?: string[];
    dropSlug: string | null;
    compareAtPrice: number | null;
    listPrice: number;
    currency: string;
    saleLabel?: string;
    videoUrl?: string;
    model3dUrl?: string;
    category: string;
    availabilityByColorAndSize: Record<string, Record<string, number>>;
    /**
     * Shopify variant GID per colorway → size — used to build hosted-checkout cart
     * lines. Only populated by the Shopify adapter; absent for seed/local catalogs.
     */
    variantIdByColorAndSize?: Record<string, Record<string, string>>;
    imagesByColorName: Record<string, Array<{
        src: string;
        alt: string;
    }>>;
}
export interface Product {
    id: string;
    slug: string;
    name: string;
    dropName: string;
    role: string;
    fit: string;
    fabric: string;
    gsm: string;
    storytelling: string;
    designDetails: string[];
    careInstructions: string[];
    colorways: ProductColorway[];
    sizes: string[];
    price: number;
    images: Array<{
        src: string;
        alt: string;
    }>;
    shop?: ProductShopMeta;
}
