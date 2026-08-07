"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Minus, Plus } from "lucide-react";
import { getStorageUrl } from "@/lib/imageUrl";

export default function CartClient() {
    const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center py-20 px-8">
                    <div className="w-20 h-20 bg-[var(--surface-1)] border border-[var(--line)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-white/35" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
                    <p className="text-white/55 mb-8">Looks like you haven't added anything yet.</p>
                    <Link href="/shop" className="inline-flex items-center gap-2 h-[48px] px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-[var(--radius-card)] transition-colors uppercase tracking-[0.08em] text-[13px]">
                        Start Shopping
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-[var(--surface-1)] border-b border-[var(--line)]">
                <div className="container-page py-6">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-[var(--accent)] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Continue Shopping
                    </Link>

                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
                        <button
                            onClick={clearCart}
                            className="text-sm text-[var(--accent)] hover:underline"
                        >
                            Clear Cart
                        </button>
                    </div>
                </div>
            </div>

            {/* Cart Content */}
            <div className="container-page py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-8">
                        <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-2)] text-white/35 text-xs uppercase">
                                    <tr>
                                        <th className="p-4 text-left">Product</th>
                                        <th className="p-4 text-center hidden sm:table-cell">Price</th>
                                        <th className="p-4 text-center">Quantity</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-[var(--radius-card)] bg-[var(--surface-2)] overflow-hidden relative flex-shrink-0">
                                                        {item.image_url ? (
                                                            <Image
                                                                src={getStorageUrl(item.image_url)}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="w-6 h-6 text-white/35" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-white">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-white/55 hidden sm:table-cell">
                                                {item.price.toFixed(2)} KM
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-[var(--accent)]">
                                                {(item.price * item.quantity).toFixed(2)} KM
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-white/35 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-card)] p-6 sticky top-24">
                            <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-white/55">
                                    <span>Subtotal</span>
                                    <span>{totalPrice.toFixed(2)} KM</span>
                                </div>
                                <div className="flex justify-between text-white/55">
                                    <span>Shipping</span>
                                    <span className="text-white/35">Calculated at checkout</span>
                                </div>
                                <hr className="border-[var(--line)]" />
                                <div className="flex justify-between text-lg font-bold text-white">
                                    <span>Total</span>
                                    <span className="text-[var(--accent)]">{totalPrice.toFixed(2)} KM</span>
                                </div>
                            </div>

                            <Link href="/checkout" className="flex items-center justify-center gap-2 h-[50px] w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-[var(--radius-card)] transition-colors uppercase tracking-[0.08em] text-[13px] shadow-lg shadow-[var(--accent)]/20">
                                Proceed to Checkout
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
