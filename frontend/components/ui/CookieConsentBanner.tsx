"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { applyConsent, CONSENT_STORAGE_KEY, DEFAULT_PREFERENCES, type CookiePreferences } from "@/lib/consent";

/**
 * Absolute, because this banner appears on two hostnames.
 *
 * It is rendered from the root layout, so it shows on help.techplay.gg as
 * well — where a host rewrite maps every path onto /help/*, and `/privacy`
 * would resolve to a help topic called "privacy" and 404. The two policies
 * are one document on the main site, so naming that site is also the more
 * honest link.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg").replace(/\/$/, "");

/** Stored preferences are untrusted input; a bad value must not take the page. */
function safeParse(raw: string) {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

/* The shape and the defaults live in lib/consent, beside the mapping that
   turns them into Consent Mode signals — three copies of "analytics: false"
   is how a banner comes to promise one thing and a tag to do another. */
const defaultPreferences = DEFAULT_PREFERENCES;

export default function CookieConsentBanner() {
    const { user, isAuthenticated } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

    useEffect(() => {
        const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!saved) {
            if (isAuthenticated && user?.cookie_preferences) {
                const fromAccount = user.cookie_preferences as unknown as CookiePreferences;
                localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fromAccount));
                setPreferences(fromAccount);
                setIsVisible(false);

                // A choice arriving from the account is still a choice. The head
                // script could not have seen it — it was not in this browser's
                // storage when the page loaded.
                applyConsent(fromAccount);
            }
            // No consent yet — banner already visible (initial state true)
        } else {
            setPreferences(safeParse(saved) ?? preferences);
            setIsVisible(false);
        }
    }, [isAuthenticated, user]);

    const savePreferences = async (newPreferences: CookiePreferences) => {
        // 1. Save to LocalStorage
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newPreferences));
        setPreferences(newPreferences);
        setIsVisible(false);

        /*
         * Tell Google, which nothing here has ever done.
         *
         * The banner asked, stored the answer, synced it to the account and
         * notified the ad slots — and Analytics was never in the conversation.
         * A reader could accept and still be counted as a stranger on their
         * next visit, because the tag was never allowed a cookie to recognise
         * them by.
         */
        applyConsent(newPreferences);

        // Writing localStorage fires no storage event in the tab that did the
        // writing, so anything already on screen that depends on consent —
        // the ad slots — would keep the answer it read on mount until a
        // reload. This is how they hear about it.
        window.dispatchEvent(new CustomEvent("techplay:consent", { detail: newPreferences }));

        // 2. Sync to Backend if logged in
        if (isAuthenticated) {
            try {
                const token = localStorage.getItem("token");
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/preferences`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ cookie_preferences: newPreferences }),
                });
            } catch (error) {
                console.error("Failed to sync cookie preferences:", error);
            }
        }
    };

    const handleAcceptAll = () => {
        savePreferences({ necessary: true, analytics: true, marketing: true });
    };

    const handleRejectAll = () => {
        savePreferences({ necessary: true, analytics: false, marketing: false });
    };

    const handleSaveCustom = () => {
        savePreferences(preferences);
    };

    const togglePreference = (key: keyof CookiePreferences) => {
        if (key === 'necessary') return; // Cannot toggle necessary
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    id="cookie-banner"
                    suppressHydrationWarning
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pb-[calc(1rem+var(--tabbar-h)+var(--safe-b))] md:pb-6 flex justify-center pointer-events-none"
                >
                    <div className="bg-[var(--surface-2)]/90 backdrop-blur-xl border border-[var(--line)] rounded-[var(--radius-panel)] shadow-2xl w-full max-w-4xl overflow-hidden pointer-events-auto ring-1 ring-white/10">
                        <div className="p-6 md:p-8">
                            <div className="flex items-start justify-between gap-6 mb-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0 text-[var(--accent)]">
                                        <Cookie className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">We value your privacy</h3>
                                        <p className="text-white/55 text-sm leading-relaxed max-w-2xl">
                                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                                            You can choose to accept all or customize your preferences. Read our <a href={`${SITE_URL}/privacy`} className="text-[var(--accent)] hover:underline">Privacy Policy</a> and <a href={`${SITE_URL}/cookies`} className="text-[var(--accent)] hover:underline">Cookie Policy</a>.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRejectAll()}
                                    className="text-white/35 hover:text-white transition-colors"
                                    aria-label="Close cookie consent"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Customization Panel */}
                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                                            {/* Necessary */}
                                            <div className="bg-[var(--surface-1)] border border-[var(--line)] p-4 rounded-[var(--radius-card)] flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-white block">Essential</span>
                                                    <span className="text-xs text-white/50">Required for the site to work.</span>
                                                </div>
                                                <div className="relative flex items-center">
                                                    <Check className="w-5 h-5 text-green-500" />
                                                </div>
                                            </div>

                                            {/* Analytics */}
                                            <div
                                                className={`cursor-pointer border p-4 rounded-[var(--radius-card)] flex items-center justify-between transition-all ${preferences.analytics ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--surface-1)] border-[var(--line)]'}`}
                                                onClick={() => togglePreference('analytics')}
                                            >
                                                <div>
                                                    <span className={`font-bold block ${preferences.analytics ? 'text-[var(--accent)]' : 'text-white'}`}>Analytics</span>
                                                    <span className="text-xs text-white/50">Help us improve the site.</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${preferences.analytics ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-muted)]'}`}>
                                                    {preferences.analytics && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>

                                            {/* Marketing */}
                                            <div
                                                className={`cursor-pointer border p-4 rounded-[var(--radius-card)] flex items-center justify-between transition-all ${preferences.marketing ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--surface-1)] border-[var(--line)]'}`}
                                                onClick={() => togglePreference('marketing')}
                                            >
                                                <div>
                                                    <span className={`font-bold block ${preferences.marketing ? 'text-[var(--accent)]' : 'text-white'}`}>Marketing</span>
                                                    <span className="text-xs text-white/50">Personalized offers.</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${preferences.marketing ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-muted)]'}`}>
                                                    {preferences.marketing && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--line)]">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-sm font-medium text-white/55 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    {showDetails ? 'Hide Details' : 'Customize Preferences'}
                                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {showDetails ? (
                                        <Button variant="outline" onClick={handleSaveCustom} className="flex-1 md:flex-none">
                                            Save Preferences
                                        </Button>
                                    ) : (
                                        <Button variant="outline" onClick={handleRejectAll} className="flex-1 md:flex-none">
                                            Reject All
                                        </Button>
                                    )}
                                    <Button onClick={handleAcceptAll} className="flex-1 md:flex-none min-w-[140px]">
                                        Accept All
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
