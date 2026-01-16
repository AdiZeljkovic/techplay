"use client";

import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHero from "@/components/ui/PageHero";
import { ShoppingCart, CreditCard, Truck, CheckCircle2, AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "@/lib/axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const router = useRouter();

    const [shippingDetails, setShippingDetails] = useState({
        fullName: "",
        address: "",
        city: "",
        zipCode: "",
        country: "Bosnia & Herzegovina", // Default
        phone: ""
    });

    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cod'>('cod');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        if (items.length === 0 && !orderSuccess) {
            // Optional: Redirect if empty and not just finished
            // router.push('/shop');
        }
    }, [items, orderSuccess, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShippingDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleCODOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const payload = {
                items: items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                })),
                shipping_address: `${shippingDetails.address}, ${shippingDetails.city} ${shippingDetails.zipCode}, ${shippingDetails.country}`,
                notes: `Receiver: ${shippingDetails.fullName}, Phone: ${shippingDetails.phone}`,
                payment_method: 'cod'
            };

            await axios.post('/shop/orders/cod', payload);

            setOrderSuccess(true);
            clearCart();
            toast.success("Order placed successfully!");
            window.scrollTo(0, 0);

        } catch (error: any) {
            console.error("Order failed", error);
            toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <PageHero title="Checkout" icon={ShoppingCart} />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Order Confirmed!</h2>
                    <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                        Thank you for your purchase. We have received your order and are preparing it for shipment. You will receive a confirmation email shortly.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all"
                    >
                        <Package className="w-5 h-5" /> Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <PageHero title="Checkout" icon={ShoppingCart} />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="w-24 h-24 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
                        <ShoppingCart className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Your Cart is Empty</h2>
                    <p className="text-[var(--text-secondary)] mb-8">Looks like you haven't added any gear yet.</p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all"
                    >
                        Go to Shop
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Secure Checkout"
                description="Complete your purchase securely."
                icon={ShoppingCart}
            />

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Shipping & Payment */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Shipping Form */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-[var(--accent)]" /> Shipping Details
                            </h2>
                            <form id="checkout-form" onSubmit={handleCODOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={shippingDetails.fullName}
                                        onChange={handleInputChange}
                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={shippingDetails.phone}
                                        onChange={handleInputChange}
                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                                        placeholder="+387 61 123 456"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        value={shippingDetails.address}
                                        onChange={handleInputChange}
                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                                        placeholder="Street Name 123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        required
                                        value={shippingDetails.city}
                                        onChange={handleInputChange}
                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                                        placeholder="Sarajevo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Zip Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        required
                                        value={shippingDetails.zipCode}
                                        onChange={handleInputChange}
                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                                        placeholder="71000"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-[var(--accent)]" /> Payment Method
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'cod' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[var(--accent)]' : 'border-[var(--text-muted)]'}`}>
                                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-[var(--text-primary)]">Cash on Delivery</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Pay when you receive package</div>
                                    </div>
                                    <Truck className="ml-auto w-6 h-6 text-[var(--text-secondary)]" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('paypal')}
                                    disabled={!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'paypal' ? 'border-[#0070BA] bg-[#0070BA]/5' : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]'} ${!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'paypal' ? 'border-[#0070BA]' : 'border-[var(--text-muted)]'}`}>
                                        {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 rounded-full bg-[#0070BA]" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-[var(--text-primary)]">PayPal</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Secure online payment</div>
                                    </div>
                                    {/* Simple PayPal Icon SVG could go here */}
                                    <span className="ml-auto font-bold text-[#003087] italic">Pay<span className="text-[#009cde]">Pal</span></span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="relative w-16 h-16 bg-[var(--bg-elevated)] rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url.startsWith('http')
                                                        ? item.image_url
                                                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${item.image_url}`}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-[var(--text-muted)] opacity-20" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 right-0 bg-[var(--accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                                x{item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{item.name}</h4>
                                            <p className="text-sm text-[var(--accent)] font-bold">{item.price.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} KM</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[var(--border)] pt-4 space-y-2 mb-6">
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Subtotal</span>
                                    <span>{totalPrice.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} KM</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Shipping</span>
                                    <span className="text-green-500 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                                    <span>Total</span>
                                    <span>{totalPrice.toLocaleString('bs-BA', { minimumFractionDigits: 2 })} KM</span>
                                </div>
                            </div>

                            {paymentMethod === 'cod' ? (
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <>Processing...</>
                                    ) : (
                                        <>Place Order (COD)</>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full">
                                    {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                                        <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, currency: "EUR" }}>
                                            <PayPalButtons
                                                style={{ layout: "vertical", shape: "rect", borderRadius: 10 }}
                                                createOrder={async (data, actions) => {
                                                    try {
                                                        const res = await axios.post('/shop/orders', {
                                                            amount: totalPrice,
                                                            items: items.map(item => ({
                                                                product_id: item.id,
                                                                quantity: item.quantity
                                                            })),
                                                            shipping_address: `${shippingDetails.address}, ${shippingDetails.city} ${shippingDetails.zipCode}, ${shippingDetails.country}`
                                                        });
                                                        return res.data.id;
                                                    } catch (err) {
                                                        console.error("Create Order Error", err);
                                                        toast.error("Could not initiate PayPal payment.");
                                                        return ""; // Return empty string to cancel
                                                    }
                                                }}
                                                onApprove={async (data, actions) => {
                                                    try {
                                                        await axios.post('/shop/orders/capture', {
                                                            orderID: data.orderID
                                                        });
                                                        setOrderSuccess(true);
                                                        clearCart();
                                                        toast.success("Payment successful!");
                                                    } catch (err) {
                                                        console.error("Capture Error", err);
                                                        toast.error("Payment failed.");
                                                    }
                                                }}
                                            />
                                        </PayPalScriptProvider>
                                    ) : (
                                        <div className="text-red-500 text-center text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                            PayPal Client ID not configured.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex items-start gap-2 text-xs text-[var(--text-muted)]">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>By placing an order, you agree to our Terms of Service and Privacy Policy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
