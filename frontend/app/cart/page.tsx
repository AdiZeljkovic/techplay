"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center py-20 px-8">
                    <div className="w-20 h-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Your cart is empty</h2>
                    <p className="text-[var(--text-secondary)] mb-8">Looks like you haven't added anything yet.</p>
                    <Link href="/shop">
                        <Button>Start Shopping</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Continue Shopping
                    </Link>

                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Shopping Cart</h1>
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
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-8">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs uppercase">
                                    <tr>
                                        <th className="p-4 text-left">Product</th>
                                        <th className="p-4 text-center hidden sm:table-cell">Price</th>
                                        <th className="p-4 text-center">Quantity</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-lg bg-[var(--bg-elevated)] overflow-hidden relative flex-shrink-0">
                                                        {item.image_url ? (
                                                            <Image
                                                                src={item.image_url}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="w-6 h-6 text-[var(--text-muted)]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-[var(--text-secondary)] hidden sm:table-cell">
                                                {item.price.toFixed(2)} KM
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium text-[var(--text-primary)]">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
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
                                                    className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
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
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 sticky top-24">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Subtotal</span>
                                    <span>{totalPrice.toFixed(2)} KM</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Shipping</span>
                                    <span className="text-[var(--text-muted)]">Calculated at checkout</span>
                                </div>
                                <hr className="border-[var(--border)]" />
                                <div className="flex justify-between text-lg font-bold text-[var(--text-primary)]">
                                    <span>Total</span>
                                    <span className="text-[var(--accent)]">{totalPrice.toFixed(2)} KM</span>
                                </div>
                            </div>

                            <Link href="/checkout" className="block">
                                <Button className="w-full">
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
