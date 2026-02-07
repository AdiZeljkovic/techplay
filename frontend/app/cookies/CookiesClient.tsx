"use client";

import PageHero from "@/components/ui/PageHero";
import { Cookie, Calendar, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Cookie Policy"
                description="Understand how and why we use cookies on TechPlay.gg."
                icon={Cookie}
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row gap-8"
                >
                    {/* Sidebar / Info Card */}
                    <div className="md:w-1/3 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4 text-[var(--accent)]">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-wide">Last Updated</span>
                                </div>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">January 1, 2026</p>
                            </div>

                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-orange-400" /> Controls
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">
                                    You can manage your cookie preferences through your browser settings.
                                </p>
                                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                                        Performance Cookies
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                                        Functional Cookies
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                                        Analytics
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-2/3">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

                            <div className="prose prose-invert prose-lg max-w-none relative z-10 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-light)]">

                                <h2>1. What Are Cookies</h2>
                                <p>
                                    As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience.
                                    This page describes what information they gather, how we use it, and why we sometimes need to store these cookies.
                                    We will also share how you can prevent these cookies from being stored, mostly through your browser settings.
                                </p>

                                <h2>2. How We Use Cookies</h2>
                                <p>
                                    We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely
                                    disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they
                                    are used to provide a service that you use (like keeping you logged in).
                                </p>

                                <h2>3. The Cookies We Set</h2>
                                <ul>
                                    <li>
                                        <strong>Account related cookies:</strong> If you create an account with us, we will use cookies for the management of the signup process and general administration. These cookies will usually be deleted when you log out however in some cases they may remain afterwards to remember your site preferences when logged out.
                                    </li>
                                    <li>
                                        <strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page. These cookies are typically removed or cleared when you log out to ensure that you can only access restricted features and areas when logged in.
                                    </li>
                                    <li>
                                        <strong>Site preferences cookies:</strong> In order to provide you with a great experience on this site we provide the functionality to set your preferences for how this site runs when you use it (like dark/light theme). In order to remember your preferences we need to set cookies so that this information can be called whenever you interact with a page is affected by your preferences.
                                    </li>
                                </ul>

                                <h2>4. Third Party Cookies</h2>
                                <p>
                                    In some special cases we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.
                                </p>
                                <ul>
                                    <li>
                                        <strong>Google Analytics:</strong> This site uses Google Analytics which is one of the most widespread and trusted analytics solution on the web for helping us to understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.
                                    </li>
                                    <li>
                                        <strong>Social Media Buttons:</strong> We also use social media buttons and/or plugins on this site that allow you to connect with your social network in various ways. For these to work the following social media sites (Facebook, Twitter, LinkedIn) will set cookies through our site which may be used to enhance your profile on their site or contribute to the data they hold for various purposes outlined in their respective privacy policies.
                                    </li>
                                </ul>

                                <h2>5. Managing Cookies</h2>
                                <p>
                                    You can restrict, block, or delete cookies by changing your browser settings. The Help feature on most browsers will tell you how to prevent your browser from accepting new cookies, how to have the browser notify you when you receive a new cookie, or how to disable cookies altogether.
                                </p>
                                <p>
                                    Please note that disabling cookies may affect the functionality of this and many other websites that you visit. Therefore, it is typically recommended that you do not disable cookies.
                                </p>

                                <h2>6. More Information</h2>
                                <p>
                                    Hopefully, that has clarified things for you. If there is something that you aren't sure whether you need or not, it's usually safer to leave cookies enabled in case it
                                    does interact with one of the features you use on our site.
                                </p>
                                <p>
                                    However, if you are still looking for more information, you can contact us at: <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
