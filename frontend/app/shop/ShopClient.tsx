"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ShoppingCart, Search, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import PageHero from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";

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

import { useState } from "react";
import AddToCartDialog from "@/components/shop/AddToCartDialog";

// ... (imports remain)

export default function ShopClient() {
    const { addToCart } = useCart();
    const { data, isLoading } = useSWR<ProductsResponse>('/shop/products', fetcher);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleAddToCart = (product: Product) => {
        addToCart(product);
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* ... Hero ... */}
            <PageHero
                title="TechShop"
                description="Official merchandise, premium gaming gear, and exclusive hardware accessories."
                icon={ShoppingBag}
            />

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Search ... */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-96 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : data?.data && data.data.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.data.map((product) => (
                            <div
                                key={product.id}
                                className="group relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col h-full"
                            >
                                {/* Image Container */}
                                <Link href={`/shop/${product.slug}`} className="block relative aspect-square overflow-hidden bg-[var(--bg-elevated)]">
                                    {product.image_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={product.image_url.startsWith('http')
                                                    ? product.image_url
                                                    : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${product.image_url}`}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                                            <ShoppingBag className="w-16 h-16 opacity-20" />
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    <div className="absolute top-3 right-3 z-10">
                                        {product.stock === 0 ? (
                                            <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg border border-red-400">
                                                SOLD OUT
                                            </span>
                                        ) : product.stock < 5 ? (
                                            <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg border border-orange-400 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                LOW SOCK
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-[var(--bg-elevated)]/90 backdrop-blur-sm text-[var(--text-primary)] text-xs font-bold rounded-full shadow-lg border border-[var(--border)]">
                                                IN STOCK
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <Link href={`/shop/${product.slug}`} className="mb-2">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <div className="mt-auto pt-4 flex items-center justify-between gap-4">
                                        <div className="text-2xl font-bold text-[var(--accent)] tracking-tight">
                                            {product.price.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-[var(--text-muted)]">KM</span>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.stock === 0}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-[var(--text-primary)] disabled:hover:text-[var(--bg-primary)] transition-all shadow-lg"
                                            title="Add to Cart"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                        <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10 text-[var(--text-muted)]" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Coming Soon</h2>
                        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                            We're stocking up on the latest gear. Check back shortly for our grand opening!
                        </p>
                    </div>
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
