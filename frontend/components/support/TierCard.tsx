"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SupportTier } from "@/types/support";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";

interface TierCardProps {
    tier: SupportTier;
}

export default function TierCard({ tier }: TierCardProps) {
    const { user, isLoading: authLoading } = useAuth(); // No middleware needed
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        // Prevent action while checking auth
        if (authLoading) return;

        if (!user) {
            // Encode redirect URL properly
            const redirectUrl = encodeURIComponent(`/support/checkout?tier=${tier.id}`);
            router.push(`/login?redirect=${redirectUrl}`);
            return;
        }

        setLoading(true);
        try {
            await axios.post('/support/pledge', { tier_id: tier.id });

            // On success
            router.push(`/profile/${user.username}?success=pledge`);
        } catch (error: any) {
            console.error(error);
            // Fallback: If pledge fails (e.g. requires payment steps), go to checkout page
            // The previous logic was: POST pledge -> Success. 
            // BUT checkout page assumes we go there first?
            // The checkout page is where payment happens. 
            // Wait, the "Join Now" button should GO TO CHECKOUT PAGE, NOT pledge immediately.
            // My previous refactor changed behavior to pledge immediately? 
            // The original code: router.push(`/support/checkout?tier=${tier.id}`)
            // My recent change in Step 17903: axios.post('/support/pledge') inside handleSubscribe? 
            // NO! I messed up the logic in Step 17903. 
            // The user wants to GO TO CHECKOUT. The checkout page handles payment.
            // I accidentally made "Join Now" try to *execute* the pledge immediately without payment.
            // Reverting logic to navigation only.
            router.push(`/support/checkout?tier=${tier.id}`);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic gradient or border color based on tier name or color prop
    const getBorderColor = () => {
        if (tier.color) return tier.color;
        switch (tier.name.toLowerCase()) {
            case 'legend': return '#f59e0b'; // Gold
            case 'super fan': return '#8b5cf6'; // Violet
            default: return '#14b8a6'; // Teal
        }
    };

    const borderColor = getBorderColor();

    return (
        <div
            className="relative bg-[#000B25]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col h-full hover:border-[var(--card-border-hover)] transition-all group overflow-hidden"
            style={{ '--card-border-hover': borderColor } as any}
        >
            {/* Glow Effect */}
            <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: borderColor }}
            />

            <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">${parseFloat(tier.price).toFixed(0)}</span>
                <span className="text-gray-400 text-sm">/month</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {tier.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                        <div
                            className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: `${borderColor}30` }} // 30% opacity
                        >
                            <Check className="w-3 h-3" />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                onClick={() => {
                    if (authLoading) return; // Wait for auth

                    if (!user) {
                        const redirectUrl = encodeURIComponent(`/support/checkout?tier=${tier.id}`);
                        router.push(`/login?redirect=${redirectUrl}`);
                    } else {
                        router.push(`/support/checkout?tier=${tier.id}`);
                    }
                }}
                disabled={authLoading}
                className="w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: borderColor, boxShadow: `0 10px 40px -10px ${borderColor}60` }}
            >
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Now'}
            </button>
        </div>
    );
}
