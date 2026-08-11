"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import TierCard from "@/components/support/TierCard";
import type { SupportTier } from "@/types/support";

/**
 * The tier grid, and the only part of /support that needs the browser.
 *
 * PayPalScriptProvider used to wrap the whole page, which made the hero, the
 * intro and three benefit tiles client-rendered so a payment SDK could load
 * underneath them. It wraps the cards it actually serves now.
 *
 * The tiers themselves arrive from the server. Fetching them in a useEffect
 * meant the page had nothing to show until JavaScript had run — a spinner
 * where the offer should be.
 */
export default function SupportTiers({ tiers }: { tiers: SupportTier[] }) {
    if (tiers.length === 0) {
        return (
            <p className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] px-5 py-8 text-center text-[13px] text-[var(--ink-low)]">
                Support tiers are unavailable right now. Please try again shortly.
            </p>
        );
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                currency: "EUR",
                intent: "capture",
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                    <TierCard key={tier.id} tier={tier} />
                ))}
            </div>
        </PayPalScriptProvider>
    );
}
