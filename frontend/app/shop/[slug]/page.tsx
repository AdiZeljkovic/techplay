"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, PackageOpen, ArrowLeft, Truck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import Image from "next/image";

import AddToCartDialog from "@/components/shop/AddToCartDialog";
import { getStorageUrl } from "@/lib/imageUrl";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addToCart } = useCart();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: product, isLoading } = useSWR(slug ? `/shop/products/${slug}` : null, fetcher);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            setIsDialogOpen(true);
        }
    };

    if (isLoading) {
        // ... (keep loading state)
        return (
            <div className="min-h-screen">
                <PageHero title="Loading..." icon={PackageOpen} />
                <div className="container-page py-12">
                    <div className="animate-pulse h-96 bg-[var(--surface-1)] rounded-[var(--radius-panel)]" />
                </div>
            </div>
        )
    }

    if (!product) {
        // ... (keep not found state)
        return (
            <div className="min-h-screen">
                <PageHero title="Product Not Found" icon={PackageOpen} />
                <div className="container-page py-12 text-center">
                    <Link href="/shop" className="text-[var(--accent)] hover:underline">Return to Shop</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <PageHero
                title="TechShop"
                description="Premium gear for the ultimate gaming experience."
                icon={PackageOpen}
            />

            <div className="container-page py-12">
                <div className="mb-8">
                    <Link href="/shop" className="inline-flex items-center gap-2 text-white/55 hover:text-[var(--accent)] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Product Image */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] opacity-10 blur-2xl rounded-[var(--radius-panel)]" />
                        <div className="relative bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] overflow-hidden aspect-square flex items-center justify-center p-8 shadow-2xl">
                            {product.image_url ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={getStorageUrl(product.image_url)}
                                        alt={product.name}
                                        fill
                                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="text-white/35 flex flex-col items-center">
                                    <PackageOpen className="w-24 h-24 opacity-20 mb-4" />
                                    <span>No Image Available</span>
                                </div>
                            )}

                            {/* Tags/Badges */}
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                {product.stock < 5 && product.stock > 0 && (
                                    <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg border border-orange-400">
                                        Low Stock
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="text-4xl font-bold text-[var(--accent)]">
                                {product.price.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} <span className="text-lg text-white/35">KM</span>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${product.stock > 0 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </div>
                        </div>

                        <div className="prose prose-invert prose-lg text-white/55 mb-10 max-w-none">
                            <p>{product.description || "No description provided for this product."}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="flex-1 py-4 px-8 rounded-[var(--radius-card)] font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-2)] disabled:text-white/35 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-6 h-6" /> Add to Cart
                            </button>
                        </div>

                        {/* Features / Assurance */}
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-[var(--line)]">
                            <div className="flex items-center gap-3 text-white/55">
                                <Truck className="w-5 h-5 text-[var(--accent)]" />
                                <span className="text-sm">Fast Delivery (24-48h)</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/55">
                                <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                                <span className="text-sm">Official Warranty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddToCartDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                product={product}
            />
        </div>
    );
}
