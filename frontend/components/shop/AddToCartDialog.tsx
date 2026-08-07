import { ShoppingCart, X, ArrowRight, ShoppingBag, Minus, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getStorageUrl } from "@/lib/imageUrl";
import { useCart } from "@/context/CartContext";

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
    const { items, updateQuantity } = useCart();
    const [isVisible, setIsVisible] = useState(false);
    const [quantity, setQuantity] = useState(1);

    /* The caller already added one; the stepper edits that line, it does not
       collect a number nobody reads. */
    const setLineQuantity = (next: number) => {
        const q = Math.max(1, next);
        setQuantity(q);
        if (product) updateQuantity(product.id, q);
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Show what the cart actually holds. Resetting to 1 on every open
            // meant the next tap of "+" wrote an absolute 2 over a line of 4.
            const line = product ? items.find((i) => i.id === product.id) : undefined;
            setQuantity(line?.quantity ?? 1);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen, product, items]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isVisible && !isOpen) return null;

    const imageUrl = product?.image_url
        ? (getStorageUrl(product.image_url))
        : null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Added to cart"
                className={`relative w-full max-w-md bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] shadow-[0_28px_60px_rgba(0,0,0,0.7)] overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="h-[3px] bg-[var(--accent)] w-full" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-card)] bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="font-display text-[15px] font-bold text-white uppercase tracking-[0.05em]">Added to Cart</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-[var(--radius-card)] flex items-center justify-center text-white/45 hover:text-[var(--accent)] hover:bg-white/5 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {product && (
                        <div className="flex gap-4 mb-6">
                            <div className="relative w-20 h-20 bg-[var(--surface-2)] rounded-[var(--radius-card)] overflow-hidden border border-white/[0.07] flex-shrink-0">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={product.name}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-white/10" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-bold text-white line-clamp-2 leading-snug mb-1.5">
                                    {product.name}
                                </h3>
                                <div className="font-display text-[18px] font-bold text-[var(--accent)] leading-none">
                                    {Number(product.price).toLocaleString('bs-BA', { minimumFractionDigits: 2 })}
                                    <span className="text-[11px] font-bold text-white/35 ml-1">KM</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mb-5 p-3.5 bg-[#070A0F] rounded-[var(--radius-card)] border border-white/[0.07]">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/35">Quantity</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setLineQuantity(quantity - 1)}
                                aria-label="Decrease quantity"
                                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-white/45 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
                            >
                                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center font-display font-bold text-[15px] text-white">{quantity}</span>
                            <button
                                onClick={() => setLineQuantity(quantity + 1)}
                                aria-label="Increase quantity"
                                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-white/45 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/shop/checkout"
                            className="w-full h-[48px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-[var(--radius-card)] transition-colors flex items-center justify-center gap-2 uppercase tracking-[0.08em] text-[12px] shadow-lg shadow-[var(--accent)]/20"
                            onClick={onClose}
                        >
                            Checkout Now <ArrowRight className="w-4 h-4" />
                        </Link>

                        <button
                            onClick={onClose}
                            className="w-full h-[48px] border border-white/[0.07] text-white/45 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] font-bold rounded-[var(--radius-card)] transition-colors uppercase tracking-[0.08em] text-[12px]"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
