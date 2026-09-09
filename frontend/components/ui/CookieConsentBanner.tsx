"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
    applyConsent,
    CONSENT_ANSWERED_ATTR,
    CONSENT_DISMISSED_KEY,
    CONSENT_STORAGE_KEY,
    DEFAULT_PREFERENCES,
    type CookiePreferences,
} from "@/lib/consent";

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

        // Already waved away in this tab. The head script has hidden it
        // already; this keeps React's idea of the world matching the DOM's.
        /*
         * Kept for the readers who dismissed the banner before it became a
         * dialog. Their tab remembers it was asked, and nothing here should
         * ask again mid-session just because the shape of the question
         * changed. New sessions get the dialog.
         */
        if (!saved && sessionStorage.getItem(CONSENT_DISMISSED_KEY)) {
            setIsVisible(false);

            return;
        }

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

        // So the next page load hides it before paint rather than after
        // hydration — the same stamp the head script applies on a later visit.
        document.documentElement.setAttribute(CONSENT_ANSWERED_ATTR, "answered");

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

    /*
     * The page does not scroll behind a question that has to be answered.
     *
     * Restored from whatever it was rather than set to "auto": the mobile
     * shell sets its own overflow while the menu is open, and clobbering that
     * on close would leave a page nobody can scroll for the rest of the visit.
     */
    useEffect(() => {
        if (!isVisible) return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => { document.body.style.overflow = previous; };
    }, [isVisible]);

    /*
     * Focus moves into the dialog, once.
     *
     * Without it a keyboard or screen-reader user is left on whatever was
     * behind, tabbing through a page they cannot see past — and a consent
     * dialog they cannot reach is a consent dialog they cannot answer.
     */
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) { dialogRef.current?.focus(); }
    }, [isVisible]);

    const togglePreference = (key: keyof CookiePreferences) => {
        if (key === 'necessary') return; // Cannot toggle necessary
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    /*
     * Drawn visible in the HTML, not after React hydrates.
     *
     * This used to ship at `opacity: 0, translateY(100px)` and only appear
     * once framer-motion ran, which is after hydration — so a reader who left
     * in the first seconds was never asked. Five people out of ninety-two
     * consented on 5 September, and analytics reported six visitors against a
     * hundred and thirty-five real ones.
     *
     * It is exactly the fault that was fixed on the analytics tag itself in
     * 0e104b43 ("the readers who leave fastest were the only ones never
     * counted"). The tag moved into the head; the question it depends on was
     * left waiting for React.
     *
     * A returning reader is spared the flash by the head script instead: it
     * reads the stored answer synchronously, before the first paint, and
     * stamps <html data-consent>, which the stylesheet acts on. That runs
     * whether or not hydration ever happens, which is the point.
     */
    if (!isVisible) return null;

    return (
        <div
            id="cookie-banner"
            suppressHydrationWarning
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-banner-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
            ref={dialogRef}
            tabIndex={-1}
        >
            {/*
              * The scrim is not a way out.
              *
              * Clicking it does nothing on purpose: a dismissal that is not a
              * decision is exactly what the close button used to be, and in a
              * centred dialog it would be the path of least resistance rather
              * than an escape hatch. Two buttons, both real answers.
              */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

            <div className="tp-consent-card relative bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-white/10 max-h-[90dvh] overflow-y-auto">
                <div className="p-6 md:p-8">
                    <div className="mb-6">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0 text-[var(--accent)]">
                                <Cookie className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 id="cookie-banner-title" className="text-xl font-bold text-white mb-2">
                                    Help us keep TechPlay free
                                </h3>
                                {/*
                                  * Both things are named, because both are
                                  * asked for.
                                  *
                                  * Consent Mode v2 has four signals and two of
                                  * them are advertising: ad_storage and
                                  * ad_personalization. A banner that mentions
                                  * only analytics leaves those denied for
                                  * every reader forever, which means every ad
                                  * on the site is non-personalised and pays
                                  * less. Asking for something without naming
                                  * it is also the part a regulator reads
                                  * first.
                                  */}
                                <p className="text-white/55 text-sm leading-relaxed">
                                    Essential cookies keep the site working and are always on. With your permission
                                    we would also like to measure what gets read, so we know what to write more of,
                                    and to show ads matched to your interests, which is what pays for the writing.
                                    You can say no to both and nothing on the site changes.
                                </p>
                                <p className="mt-2 text-white/40 text-xs">
                                    <a href={`${SITE_URL}/privacy`} className="text-[var(--accent)] hover:underline">Privacy Policy</a>
                                    <span className="mx-2">·</span>
                                    <a href={`${SITE_URL}/cookies`} className="text-[var(--accent)] hover:underline">Cookie Policy</a>
                                </p>
                            </div>
                        </div>
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

                        {/*
                          * Equal weight, deliberately.
                          *
                          * Refusing has to be as easy as agreeing — that is
                          * the letter of the rule and also the reason a
                          * regulator looks at a banner at all. Same row, same
                          * size, same prominence; the accent on one of them is
                          * as far as it goes.
                          */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto md:min-w-[340px]">
                            {showDetails ? (
                                <Button variant="outline" onClick={handleSaveCustom} className="w-full">
                                    Save my choices
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={handleRejectAll} className="w-full">
                                    Only essential
                                </Button>
                            )}
                            <Button onClick={handleAcceptAll} className="w-full">
                                Accept all
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
