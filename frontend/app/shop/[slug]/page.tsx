"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check, PackageOpen, ArrowLeft, Truck, ShieldCheck, Heart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import Image from "next/image";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addToCart } = useCart();

    const [added, setAdded] = useState(false);

    const { data: product, isLoading } = useSWR(slug ? `/shop/products/${slug}` : null, fetcher);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <PageHero title="Loading..." icon={PackageOpen} />
                <div className="container mx-auto px-4 py-12">
                    <div className="animate-pulse h-96 bg-[var(--bg-card)] rounded-2xl" />
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <PageHero title="Product Not Found" icon={PackageOpen} />
                <div className="container mx-auto px-4 py-12 text-center">
                    <Link href="/shop" className="text-[var(--accent)] hover:underline">Return to Shop</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="TechShop"
                description="Premium gear for the ultimate gaming experience."
                icon={PackageOpen}
            />

            <div className="container mx-auto px-4 py-12">
                <div className="mb-8">
                    <Link href="/shop" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Product Image */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] opacity-10 blur-2xl rounded-3xl" />
                        <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-8 shadow-2xl">
                            {product.image_url ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={product.image_url.startsWith('http') ? product.image_url : `/storage/${product.image_url}`}
                                        alt={product.name}
                                        fill
                                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="text-[var(--text-muted)] flex flex-col items-center">
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
                        <h1 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="text-4xl font-bold text-[var(--accent)]">
                                {product.price.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} <span className="text-lg text-[var(--text-muted)]">KM</span>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${product.stock > 0 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </div>
                        </div>

                        <div className="prose prose-invert prose-lg text-[var(--text-secondary)] mb-10 max-w-none">
                            <p>{product.description || "No description provided for this product."}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_20px_var(--accent-glow)]
                                ${added
                                        ? 'bg-green-600 text-white'
                                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed'
                                    }`}
                            >
                                {added ? (
                                    <>
                                        <Check className="w-6 h-6" /> Added to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-6 h-6" /> Add to Cart
                                    </>
                                )}
                            </button>

                            <button className="w-full sm:w-auto py-4 px-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--text-secondary)] transition-all flex items-center justify-center">
                                <Heart className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Features / Assurance */}
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-[var(--border)]">
                            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                                <Truck className="w-5 h-5 text-[var(--accent)]" />
                                <span className="text-sm">Fast Delivery (24-48h)</span>
                            </div>
                            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                                <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                                <span className="text-sm">Official Warranty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
