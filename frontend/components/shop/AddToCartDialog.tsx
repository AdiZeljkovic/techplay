import { ShoppingCart, X, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url?: string;
}

interface AddToCartDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export default function AddToCartDialog({ isOpen, onClose, product }: AddToCartDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const imageUrl = product?.image_url
        ? (product.image_url.startsWith('http')
            ? product.image_url
            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${product.image_url}`)
        : null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2 text-green-400">
                        <div className="p-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <ShoppingCart className="w-4 h-4" />
                        </div>
                        <span className="font-bold">Added to Cart</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[var(--bg-elevated)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {product && (
                        <div className="flex gap-4 mb-6">
                            <div className="relative w-20 h-20 bg-[var(--bg-elevated)] rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-[var(--text-muted)] opacity-20" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-[var(--text-primary)] line-clamp-2 mb-1">
                                    {product.name}
                                </h3>
                                <div className="text-[var(--accent)] font-bold">
                                    {product.price.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} KM
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/shop/checkout"
                            className="w-full py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/20"
                            onClick={onClose}
                        >
                            Checkout Now <ArrowRight className="w-4 h-4" />
                        </Link>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--bg-secondary)] border border-[var(--border)] transition-all"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
