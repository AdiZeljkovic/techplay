"use client";

import PageHero from "@/components/ui/PageHero";
import TierCard from "@/components/support/TierCard";
import { SupportTier } from "@/types/support";
import { Heart, Shield, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function SupportPage() {
    const [tiers, setTiers] = useState<SupportTier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTiers() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/tiers`);
                if (res.ok) {
                    const data = await res.json();
                    setTiers(data);
                }
            } catch (error) {
                console.error("Failed to fetch tiers", error);
            } finally {
                setLoading(false);
            }
        }
        fetchTiers();
    }, []);

    const initialOptions = {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        currency: "EUR",
        intent: "capture",
    };

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <PageHero
                    title="Support TechPlay"
                    description="Join our inner circle. Get exclusive benefits while supporting independent gaming journalism."
                    icon={Heart}
                />

                <div className="container mx-auto px-4 py-20">
                    {/* Intro */}
                    <div className="max-w-3xl mx-auto text-center mb-20 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-bold text-white">
                            Level Up Your <span className="text-[var(--accent)]">Experience</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            TechPlay is built by gamers, for gamers. Your support helps us remain independent, ad-free for members, and focused on high-quality content without clickbait.
                        </p>
                    </div>

                    {/* Tiers Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
                            {tiers.map((tier) => (
                                <TierCard key={tier.id} tier={tier} />
                            ))}
                        </div>
                    )}

                    {/* Benefits / Why Support */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mx-auto mb-6">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Ad-Free Experience</h3>
                            <p className="text-gray-400">
                                Browse TechPlay without interruptions. No banners, no pop-ups, just pure content.
                            </p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mx-auto mb-6">
                                <Star className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Exclusive Badges</h3>
                            <p className="text-gray-400">
                                Stand out in comments and forums with a unique profile badge showcasing your rank.
                            </p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-6">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Direct Impact</h3>
                            <p className="text-gray-400">
                                Your contribution directly funds hardware for reviews, server costs, and freelance writers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}
