"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false,
};

export default function CookieConsentBanner() {
    const { user, isAuthenticated } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

    useEffect(() => {
        // Check localStorage first
        const saved = localStorage.getItem("cookie_preferences");
        if (!saved) {
            // If user is logged in, check if they have settings in DB
            if (isAuthenticated && user?.cookie_preferences) {
                // Sync from DB to LocalStorage
                localStorage.setItem("cookie_preferences", JSON.stringify(user.cookie_preferences));
                setPreferences(user.cookie_preferences as unknown as CookiePreferences);
            } else {
                // No settings found anywhere -> Show Banner
                const timer = setTimeout(() => setIsVisible(true), 1500); // Delay slightly for aesthetics
                return () => clearTimeout(timer);
            }
        } else {
            // Already accepted on this device
            setPreferences(JSON.parse(saved));
        }
    }, [isAuthenticated, user]);

    const savePreferences = async (newPreferences: CookiePreferences) => {
        // 1. Save to LocalStorage
        localStorage.setItem("cookie_preferences", JSON.stringify(newPreferences));
        setPreferences(newPreferences);
        setIsVisible(false);

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
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 flex justify-center pointer-events-none"
                >
                    <div className="bg-[var(--bg-elevated)]/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden pointer-events-auto ring-1 ring-white/10">
                        <div className="p-6 md:p-8">
                            <div className="flex items-start justify-between gap-6 mb-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--accent)]">
                                        <Cookie className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">We value your privacy</h3>
                                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
                                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                                            You can choose to accept all or customize your preferences. Read our <Link href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link> and <Link href="/cookies" className="text-[var(--accent)] hover:underline">Cookie Policy</Link>.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRejectAll()}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
                                            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-[var(--text-primary)] block">Essential</span>
                                                    <span className="text-xs text-[var(--text-muted)]">Required for the site to work.</span>
                                                </div>
                                                <div className="relative flex items-center">
                                                    <Check className="w-5 h-5 text-green-500" />
                                                </div>
                                            </div>

                                            {/* Analytics */}
                                            <div
                                                className={`cursor-pointer border p-4 rounded-xl flex items-center justify-between transition-all ${preferences.analytics ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}
                                                onClick={() => togglePreference('analytics')}
                                            >
                                                <div>
                                                    <span className={`font-bold block ${preferences.analytics ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>Analytics</span>
                                                    <span className="text-xs text-[var(--text-muted)]">Help us improve the site.</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${preferences.analytics ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-muted)]'}`}>
                                                    {preferences.analytics && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>

                                            {/* Marketing */}
                                            <div
                                                className={`cursor-pointer border p-4 rounded-xl flex items-center justify-between transition-all ${preferences.marketing ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}
                                                onClick={() => togglePreference('marketing')}
                                            >
                                                <div>
                                                    <span className={`font-bold block ${preferences.marketing ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>Marketing</span>
                                                    <span className="text-xs text-[var(--text-muted)]">Personalized offers.</span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${preferences.marketing ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-muted)]'}`}>
                                                    {preferences.marketing && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
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
