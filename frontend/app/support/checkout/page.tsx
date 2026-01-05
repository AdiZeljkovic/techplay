"use client";

import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { SupportTier } from "@/types/support";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Loader2, CheckCircle2, Shield, Calendar, AlertCircle, ChevronRight, ArrowLeft, Star, Coins, CreditCard } from "lucide-react";

export default function SupportCheckoutPage() {
    const searchParams = useSearchParams();
    const tierId = searchParams.get('tier');

    // Auth Hook
    const { user, isLoading: authLoading } = useAuth({ middleware: 'auth' });
    const router = useRouter();

    const [tier, setTier] = useState<SupportTier | null>(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'one-time'>('monthly');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Step State
    const [step, setStep] = useState(1);

    // Fetch Tier Data
    useEffect(() => {
        if (authLoading) return;

        if (!tierId) {
            router.push('/support');
            return;
        }

        async function fetchTier() {
            try {
                const res = await axios.get('/support/tiers');
                const tiers: SupportTier[] = res.data;
                const selected = tiers.find(t => t.id.toString() === tierId);
                if (selected) {
                    setTier(selected);
                } else {
                    setError("Tier not found.");
                }
            } catch (error) {
                console.error("Failed to fetch tier", error);
                setError("Failed to load tier details.");
            } finally {
                setLoading(false);
            }
        }
        fetchTier();
    }, [tierId, router, authLoading]);

    if (loading || authLoading) return <LoadingView />;

    if (!tier) return <div className="min-h-screen bg-[var(--bg-primary)] text-white flex items-center justify-center">Tier not found.</div>;

    if (success) return <SuccessView user={user} router={router} />;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-20 px-4 font-sans selection:bg-[var(--accent)]/30">
            {/* Background Texture */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_50%)] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.4),transparent_50%)] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => step === 1 ? router.back() : setStep(1)}
                            className="group flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {step === 1 ? 'Cancel Pledge' : 'Back to Options'}
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            {step === 1 ? 'Customize Your Pledge' : 'Secure Checkout'}
                        </h1>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-4 bg-[var(--bg-secondary)] px-6 py-3 rounded-full border border-white/5">
                        <Step active={step >= 1} completed={step > 1} number={1} label="Plan" />
                        <div className="w-8 h-px bg-white/10" />
                        <Step active={step >= 2} completed={false} number={2} label="Payment" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Main Interactive Area */}
                    <div className="lg:col-span-8">
                        {step === 1 ? (
                            <div className="space-y-6">
                                {/* Tier Card */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 relative overflow-hidden group hover:border-[var(--accent)]/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Shield className="w-40 h-40 text-white transform rotate-12" />
                                    </div>

                                    <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                                        <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                                            <Star className="w-10 h-10 text-white fill-white/20" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-bold text-white">{tier.name} Tier</h2>
                                                <span className="bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Selected</span>
                                            </div>
                                            <p className="text-[#94A3B8] text-lg leading-relaxed max-w-lg">
                                                Excellent choice! You're unlocking exclusive badges, ad-free access, and supporting the community.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <OptionCard
                                        selected={billingCycle === 'monthly'}
                                        onClick={() => setBillingCycle('monthly')}
                                        title="Monthly Subscription"
                                        price={tier.price}
                                        period="/ month"
                                        description="Best for long-term support. Auto-renews."
                                    />
                                    <OptionCard
                                        selected={billingCycle === 'one-time'}
                                        onClick={() => setBillingCycle('one-time')}
                                        title="One-Time Pass"
                                        price={tier.price}
                                        period=" flat fee"
                                        description="Support for a single month only."
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="bg-[var(--accent)] hover:bg-[#ff5722] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all hover:scale-[1.02] flex items-center gap-2"
                                    >
                                        Continue to Payment <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Payment Container */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 min-h-[500px] flex flex-col">
                                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5 shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent)]">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Payment Method</h2>
                                            <p className="text-[#94A3B8] text-sm">Securely processed by PayPal</p>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm flex items-start gap-3 shrink-0">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {/* PayPal Area */}
                                    <div className="flex-1 flex flex-col items-center justify-start w-full relative">
                                        <PayPalPaymentSection
                                            tier={tier}
                                            billingCycle={billingCycle}
                                            onSuccess={() => setSuccess(true)}
                                            onError={(msg: string) => setError(msg)}
                                        />
                                    </div>

                                    <div className="mt-8 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2 shrink-0">
                                        <Shield className="w-3 h-3" />
                                        Your payment information is encrypted and secure.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Summary Sticky */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-10">
                            <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                    <Coins className="w-5 h-5 text-[var(--accent)]" />
                                    Order Summary
                                </h3>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between text-[#94A3B8]">
                                        <span>Plan</span>
                                        <span className="text-white font-medium">{tier.name}</span>
                                    </div>
                                    <div className="flex justify-between text-[#94A3B8]">
                                        <span>Billing</span>
                                        <span className="text-white font-medium capitalize">{billingCycle}</span>
                                    </div>

                                    <div className="h-px bg-white/10 my-4" />

                                    <div className="flex justify-between items-end">
                                        <span className="text-white font-bold text-lg">Total</span>
                                        <div className="text-right">
                                            <span className="block text-3xl font-bold text-[var(--accent)]">{Number(tier.price).toFixed(2)}€</span>
                                            <span className="text-xs text-[#94A3B8] block mt-1">
                                                {billingCycle === 'monthly' ? 'per month' : 'one-time payment'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------------

function PayPalPaymentSection({ tier, billingCycle, onSuccess, onError }: any) {
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    const initialOptions = useMemo(() => ({
        clientId: paypalClientId || "test",
        currency: "EUR",
        intent: billingCycle === 'monthly' ? "subscription" : "capture",
        vault: billingCycle === 'monthly',
    }), [billingCycle]); // Re-create options only when cycle changes

    return (
        <div className="w-full max-w-md mx-auto" style={{ minHeight: "250px" }}>
            <PayPalScriptProvider options={initialOptions}>
                <PayPalButtonsWrapper
                    billingCycle={billingCycle}
                    tier={tier}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            </PayPalScriptProvider>
        </div>
    );
}

// Inner wrapper to use ScriptReducer hook
function PayPalButtonsWrapper({ billingCycle, tier, onSuccess, onError }: any) {
    const [{ isPending }] = usePayPalScriptReducer();

    return (
        <>
            {isPending && (
                <div className="w-full h-[150px] flex flex-col items-center justify-center bg-white/5 rounded-lg animate-pulse">
                    <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-2" />
                    <span className="text-xs text-gray-400">Loading secure payment...</span>
                </div>
            )}

            <div style={{ visibility: isPending ? "hidden" : "visible", minHeight: "150px" }}>
                <PayPalButtons
                    forceReRender={[billingCycle, tier.id]}
                    style={{
                        layout: "vertical",
                        color: "gold",
                        shape: "rect",
                        label: billingCycle === 'monthly' ? "subscribe" : "pay"
                    }}
                    createOrder={billingCycle === 'one-time' ? (data, actions) => {
                        return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [{
                                amount: { currency_code: "EUR", value: tier.price.toString() },
                                description: `TechPlay Support: ${tier.name}`
                            }],
                        });
                    } : undefined}
                    createSubscription={billingCycle === 'monthly' ? (data, actions) => {
                        if (!tier.paypal_plan_id) {
                            onError("Subscription plan not available.");
                            return Promise.reject("Plan ID missing");
                        }
                        return actions.subscription.create({
                            'plan_id': tier.paypal_plan_id
                        });
                    } : undefined}
                    onApprove={async (data: any) => {
                        try {
                            await axios.post('/support/pledge', {
                                tier_id: tier.id,
                                orderID: data.orderID,
                                subscriptionID: data.subscriptionID,
                                type: billingCycle === 'monthly' ? 'subscription' : 'one-time'
                            });
                            onSuccess();
                        } catch (e: any) {
                            console.error(e);
                            onError(e.response?.data?.message || "Payment verification failed.");
                        }
                    }}
                    onError={(err) => {
                        console.error("PayPal Error", err);
                        onError("An error occurred with PayPal. Please try refreshing.");
                    }}
                />
            </div>
        </>
    );
}

function Step({ active, completed, number, label }: any) {
    return (
        <div className={`flex items-center gap-2 ${active || completed ? 'text-white' : 'text-white/30'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completed ? 'bg-[var(--accent)] text-white' :
                    active ? 'bg-white text-[var(--bg-primary)]' :
                        'bg-white/10'
                }`}>
                {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : number}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </div>
    );
}

function OptionCard({ selected, onClick, title, price, period, description }: any) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 relative ${selected
                    ? 'bg-[var(--accent)]/5 border-[var(--accent)] shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.2)]'
                    : 'bg-[var(--bg-secondary)] border-transparent hover:border-white/10'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[var(--accent)]' : 'border-gray-600'}`}>
                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />}
                </div>
            </div>

            <div className="mb-2">
                <span className="text-3xl font-bold text-white">{Number(price).toFixed(2)}€</span>
                <span className="text-[#94A3B8] text-sm">{period}</span>
            </div>

            <h3 className={`font-bold text-lg mb-1 ${selected ? 'text-[var(--accent)]' : 'text-white'}`}>{title}</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">{description}</p>
        </div>
    );
}

function SuccessView({ user, router }: any) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border)] p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 w-full left-0 h-1 bg-[var(--accent)]" />

                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">Welcome Aboard!</h2>
                <p className="text-[#E0E7FF] mb-8">
                    You're now a supporter. All benefits have been activated for <strong>{user?.display_name || user?.username}</strong>.
                </p>

                <button
                    onClick={() => router.push(`/profile/${user?.username}`)}
                    className="w-full bg-[var(--accent)] hover:bg-[#ff5722] text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                    View Your Profile
                </button>
            </div>
        </div>
    );
}

function LoadingView() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        </div>
    );
}
