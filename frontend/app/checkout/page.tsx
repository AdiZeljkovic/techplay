"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const { user } = useAuth({ middleware: 'auth' });
    const router = useRouter();

    const [shippingDetails, setShippingDetails] = useState({
        address: '',
        city: '',
        zip: '',
        phone: '',
        notes: ''
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setShippingDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const isFormValid = () => {
        return shippingDetails.address && shippingDetails.city && shippingDetails.zip && shippingDetails.phone;
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto py-20 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Order Placed!</h2>
                <p className="text-gray-400 mb-8">Thank you for your order. We'll contact you shortly.</p>
                <div className="text-sm text-gray-500">Redirecting to shop...</div>
            </div>
        );
    }

    if (items.length === 0) return null;

    const initialOptions = {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        currency: "EUR",
        intent: "capture",
    };

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-8">Checkout</h1>

                    <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Shipping Details</h2>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Address</label>
                                <input
                                    required
                                    name="address"
                                    type="text"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                    value={shippingDetails.address}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">City</label>
                                    <input
                                        required
                                        name="city"
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        value={shippingDetails.city}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">ZIP Code</label>
                                    <input
                                        required
                                        name="zip"
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        value={shippingDetails.zip}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                                <input
                                    required
                                    name="phone"
                                    type="tel"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                    value={shippingDetails.phone}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Order Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none h-24"
                                    value={shippingDetails.notes}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-4">Payment Method</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                                    {error}
                                </div>
                            )}

                            {!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                                <div className="text-red-500">PayPal configuration missing.</div>
                            ) : isFormValid() ? (
                                <div className="z-0 relative">
                                    <PayPalButtons
                                        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                        createOrder={async (data, actions) => {
                                            setError(null);
                                            try {
                                                const shippingAddress = `${shippingDetails.address}, ${shippingDetails.city} ${shippingDetails.zip}\nPhone: ${shippingDetails.phone}`;

                                                const res = await axios.post('/shop/orders', {
                                                    items: items.map(item => ({ product_id: item.id, quantity: item.quantity })),
                                                    shipping_address: shippingAddress,
                                                    notes: shippingDetails.notes,
                                                });

                                                return res.data.id; // Return PayPal Order ID from backend
                                            } catch (err: any) {
                                                console.error("Create Order Error:", err);
                                                setError("Failed to create order. Please try again.");
                                                throw err;
                                            }
                                        }}
                                        onApprove={async (data, actions) => {
                                            setIsProcessing(true);
                                            try {
                                                const res = await axios.post('/shop/orders/capture', {
                                                    orderID: data.orderID
                                                });

                                                if (res.data.status === 'COMPLETED') {
                                                    setSuccess(true);
                                                    clearCart();
                                                    setTimeout(() => router.push('/shop'), 3000);
                                                }
                                            } catch (err) {
                                                console.error("Capture Error:", err);
                                                setError("Payment failed. Please try again.");
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }}
                                        onError={(err) => {
                                            console.error("PayPal Error:", err);
                                            setError("An error occurred with PayPal.");
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-white/5 rounded-lg text-gray-400">
                                    Please fill in all shipping details to proceed to payment.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 sticky top-24">
                        <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-white/10 rounded-md overflow-hidden shrink-0">
                                        {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium">{item.name}</h4>
                                        <div className="text-sm text-gray-400">Qty: {item.quantity}</div>
                                    </div>
                                    <div className="text-white font-medium">
                                        {(item.price * item.quantity).toFixed(2)} KM
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal</span>
                                <span>{totalPrice.toFixed(2)} KM</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10 mt-2">
                                <span>Total</span>
                                <span>{totalPrice.toFixed(2)} KM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}
