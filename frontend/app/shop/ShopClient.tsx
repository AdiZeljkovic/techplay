"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { ShoppingBag, ShoppingCart, Search, Sparkles, AlertCircle, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import PageHero from "@/components/ui/PageHero";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import AddToCartDialog from "@/components/shop/AddToCartDialog";
import { getStorageUrl } from "@/lib/imageUrl";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url?: string;
    stock: number;
    is_active: boolean;
    description?: string;
}

interface ProductsResponse {
    data: Product[];
    links: any[];
}

export default function ShopClient() {
    const { addToCart } = useCart();
    const { data, isLoading } = useSWR<ProductsResponse>('/shop/products', fetcher);

    const [search, setSearch] = useState("");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleAddToCart = (product: Product) => {
        addToCart(product);
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    // Client-side product filter
    const products = useMemo(() => {
        const all = data?.data || [];
        if (!search.trim()) return all;
        const q = search.trim().toLowerCase();
        return all.filter(p => p.name.toLowerCase().includes(q));
    }, [data, search]);

    return (
        <div className="min-h-screen">
            <PageHero
                title="Tech Shop"
                description="Official merchandise, premium gaming gear, and exclusive hardware accessories."
                icon={ShoppingBag}
            />

            {/* Content */}
            <div className="container-page pb-20">

                {/* Toolbar: search + count */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent)] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[var(--surface-1)] border border-white/[0.07] rounded-full h-[46px] pl-11 pr-10 text-[13px] text-white placeholder:text-white/50 focus:outline-none focus:border-[var(--accent)]/50 transition-all shadow-sm shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-[var(--accent)] transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                        {products.length} {products.length === 1 ? "PRODUCT" : "PRODUCTS"}
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-96 bg-[var(--surface-1)] rounded-[var(--radius-panel)] animate-pulse" />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] overflow-hidden hover:border-[var(--accent)]/50 hover:border-[var(--accent)]/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col h-full"
                            >
                                {/* Image Container */}
                                <Link href={`/shop/${product.slug}`} className="block relative aspect-square overflow-hidden bg-[var(--surface-2)]">
                                    {product.image_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={getStorageUrl(product.image_url)}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-16 h-16 text-white/10" />
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    <div className="absolute top-3 right-3 z-10">
                                        {product.stock === 0 ? (
                                            <span className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded leading-none shadow-lg">
                                                SOLD OUT
                                            </span>
                                        ) : product.stock < 5 ? (
                                            <span className="px-2.5 py-1 bg-[var(--accent)]/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded leading-none shadow-lg flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                LOW STOCK
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-[var(--surface-1)]/85 backdrop-blur-sm text-white/85 text-[10px] font-bold uppercase tracking-widest rounded leading-none shadow-lg border border-white/10">
                                                IN STOCK
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <Link href={`/shop/${product.slug}`} className="mb-2">
                                        <h3 className="text-[15px] font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <div className="mt-auto pt-4 flex items-center justify-between gap-4 border-t border-white/[0.04]">
                                        <div className="font-display text-[20px] font-bold text-[var(--accent)] tracking-tight leading-none">
                                            {Number(product.price).toLocaleString('bs-BA', { minimumFractionDigits: 2 })}
                                            <span className="text-[11px] font-bold text-white/50 ml-1">KM</span>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.stock === 0}
                                            className="btn-command w-10 h-10 flex items-center justify-center bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all"
                                            title="Add to Cart"
                                        >
                                            <ShoppingCart className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : search ? (
                    <ListingEmptyState
                        icon={Search}
                        title="No products found"
                        description={`No results for "${search}". Try a different search.`}
                    />
                ) : (
                    <ListingEmptyState
                        icon={Sparkles}
                        title="Coming Soon"
                        description="We're stocking up on the latest gear. Check back shortly for our grand opening!"
                    />
                )}
            </div>

            <AddToCartDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                product={selectedProduct}
            />
        </div>
    );
}
