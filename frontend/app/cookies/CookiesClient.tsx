"use client";

import PageHero from "@/components/ui/PageHero";
import { Cookie, Calendar, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Cookie Policy"
                description="A full breakdown of every cookie we use, why we use it, and how you can control it."
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
                                <p className="text-2xl font-bold text-[var(--text-primary)]">March 24, 2026</p>
                            </div>

                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-orange-400" /> Cookie Categories
                                </h3>
                                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        Strictly Necessary
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                        Analytics (consent required)
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                                        Advertising (consent required)
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 flex-shrink-0" />
                                        Marketing (consent required)
                                    </li>
                                </ul>
                                <p className="text-xs text-[var(--text-secondary)] mt-4 leading-relaxed">
                                    You can change your preferences at any time via the Cookie Settings link in the site footer.
                                </p>
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
                                    Cookies are small text files that a website stores on your device when you visit. They are widely used across the web — to keep you logged in, remember your preferences, count visitors, and serve relevant advertisements. Cookies cannot execute code, carry viruses, or read other data from your device.
                                </p>
                                <p>
                                    This policy covers all cookies and similar technologies (such as local storage and pixel tags) used on TechPlay.gg. We have tried to make it as specific and practical as possible — not a copy-paste template, but an accurate description of what we actually use.
                                </p>

                                <h2>2. How We Manage Your Consent</h2>
                                <p>
                                    When you first visit TechPlay.gg, a consent banner appears at the bottom of the screen. It gives you three clear options:
                                </p>
                                <ul>
                                    <li><strong>Accept All</strong> — you consent to strictly necessary, analytics, advertising, and marketing cookies.</li>
                                    <li><strong>Reject All</strong> — only strictly necessary cookies are placed. Ads are still shown, but they will not be personalised.</li>
                                    <li><strong>Customise</strong> — you can enable or disable analytics and marketing categories independently.</li>
                                </ul>
                                <p>
                                    We use <strong>Google Consent Mode v2</strong>, which means ad and analytics scripts default to a fully denied state until you have made your choice. No tracking data is sent to Google before your consent is recorded. Your preference is saved in a cookie named <code>techplay_cookie_consent</code> and is valid for 365 days. You can revisit your choices at any time by clicking <strong>Cookie Settings</strong> in the site footer.
                                </p>

                                <h2>3. Strictly Necessary Cookies</h2>
                                <p>
                                    These cookies are essential for the website to function. They cannot be disabled through our consent banner, though you can block them via your browser settings (which will break most site functionality). No consent is required to place these cookies under GDPR, as they fall under the &quot;legitimate interest for service delivery&quot; basis.
                                </p>
                                <ul>
                                    <li>
                                        <strong>Session &amp; Authentication:</strong> When you log in, Laravel sets a session cookie (typically named <code>techplay_session</code> or similar) that keeps you authenticated as you navigate the site. Without it, you would be logged out on every page load. This cookie expires at the end of your browser session or after a set period of inactivity.
                                    </li>
                                    <li>
                                        <strong>CSRF Token:</strong> A cross-site request forgery protection token (<code>XSRF-TOKEN</code>) is set to prevent malicious third-party sites from submitting forms or requests on your behalf. This is a security requirement, not a tracking mechanism.
                                    </li>
                                    <li>
                                        <strong>Consent Preference:</strong> We store your cookie consent choice in <code>techplay_cookie_consent</code>. This cookie is what allows us to respect your decision and not re-prompt you on every visit. It expires after 365 days.
                                    </li>
                                    <li>
                                        <strong>Theme Preference:</strong> If you switch between light and dark mode, your preference is stored locally so the correct theme loads immediately on your next visit without a flash.
                                    </li>
                                </ul>

                                <h2>4. Analytics Cookies</h2>
                                <p>
                                    <em>Requires your consent. Not placed if you decline analytics cookies.</em>
                                </p>
                                <p>
                                    We use <strong>Google Analytics 4</strong> (GA4) to understand how visitors use TechPlay.gg — which articles are read the most, where traffic comes from, how long people spend on the site, and what devices they use. This helps us make decisions about what content to create and how to improve the experience.
                                </p>
                                <p>
                                    GA4 sets the following cookies when you consent to analytics:
                                </p>
                                <ul>
                                    <li><strong>_ga</strong> — the main GA4 identifier. Distinguishes unique users by assigning a randomly generated number. Expires after 2 years.</li>
                                    <li><strong>_ga_[ID]</strong> — used to persist session state. Expires after 2 years.</li>
                                    <li><strong>_gid</strong> — distinguishes users. Expires after 24 hours.</li>
                                    <li><strong>_gat</strong> — used to throttle request rate. Expires after 1 minute.</li>
                                </ul>
                                <p>
                                    All analytics data is aggregated and does not identify individual users by name. We do not pass personal data to Google Analytics. If you decline analytics cookies, these scripts are never loaded — not even in a &quot;denied&quot; state.
                                    You can also opt out of GA4 across all sites using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
                                </p>

                                <h2>5. Advertising Cookies (Google AdSense)</h2>
                                <p>
                                    <em>Requires your consent for personalised ads. Non-personalised ads are shown without cookies if you decline.</em>
                                </p>
                                <p>
                                    TechPlay.gg displays advertisements served by <strong>Google AdSense</strong> (Google LLC, Mountain View, CA, USA). Our publisher ID is <strong>pub-7427807317921666</strong>. If you have consented to advertising cookies, AdSense uses cookies and similar technologies to serve ads that may be relevant to your browsing history and interests across sites that use Google services.
                                </p>
                                <p>
                                    If you decline advertising cookies, ads are still displayed but they will be non-personalised — Google will not use your browsing history to select them, and no advertising cookies are placed by AdSense.
                                </p>
                                <p>
                                    Common AdSense/Google advertising cookies include:
                                </p>
                                <ul>
                                    <li><strong>IDE</strong> — set by Google DoubleClick. Used to record user actions and serve targeted ads. Expires after 1 year. Domain: <code>.doubleclick.net</code>.</li>
                                    <li><strong>DSID</strong> — used for signed-in Google users to serve ads based on account activity. Domain: <code>.doubleclick.net</code>.</li>
                                    <li><strong>test_cookie</strong> — a short-lived cookie set by DoubleClick to check that the browser accepts cookies. Expires in 15 minutes.</li>
                                    <li><strong>__gads / __gpi</strong> — set directly by our domain on behalf of Google to help measure ad performance and prevent fraud. Expires after 13 months.</li>
                                </ul>
                                <p>
                                    You can opt out of personalised advertising at any time through <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">Google My Ad Center</a> or the <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">YourAdChoices</a> portal.
                                    Google&apos;s full advertising privacy policy is available at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">policies.google.com/technologies/ads</a>.
                                </p>

                                <h2>6. Marketing Cookies (Meta Pixel)</h2>
                                <p>
                                    <em>Requires your explicit consent. Not loaded at all if you decline marketing cookies.</em>
                                </p>
                                <p>
                                    We use the <strong>Meta Pixel</strong> (Meta Platforms Ireland Ltd., 4 Grand Canal Square, Dublin 2, Ireland) to measure how well our content and any promotional campaigns perform on Facebook and Instagram. The Pixel is a small JavaScript snippet that fires only after you have explicitly accepted marketing cookies. If you decline, the Pixel script is never loaded — not even partially.
                                </p>
                                <p>
                                    When active, Meta may set the following cookies:
                                </p>
                                <ul>
                                    <li><strong>_fbp</strong> — used by Facebook to deliver advertisements and track conversions from Facebook ads. Expires after 90 days. Set on our domain.</li>
                                    <li><strong>_fbc</strong> — stores the last Facebook click parameter. Expires after 90 days. Set on our domain.</li>
                                    <li><strong>fr</strong> — Facebook&apos;s primary advertising cookie for tracking and serving ads. Set on <code>.facebook.com</code>.</li>
                                </ul>
                                <p>
                                    You can manage your Facebook ad preferences at <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">facebook.com/adpreferences</a>.
                                    Meta&apos;s privacy policy is at <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">facebook.com/privacy/policy</a>.
                                </p>

                                <h2>7. Third-Party Login Cookies</h2>
                                <p>
                                    If you choose to sign in using Discord, Battle.net, or Google, the respective OAuth flow will set temporary state and code-verification cookies during the login process. These are short-lived (session-scoped) and are cleared once authentication is complete. They do not track your browsing activity and are not used for advertising.
                                </p>
                                <p>
                                    After you log in, no additional third-party login cookies persist on your device — only our own session cookie described in Section 3.
                                </p>

                                <h2>8. What We Do Not Use</h2>
                                <p>
                                    To be clear about the technologies we have deliberately chosen not to use:
                                </p>
                                <ul>
                                    <li>We do not use fingerprinting or device identification techniques that operate without cookies.</li>
                                    <li>We do not share cookie data with data brokers or sell it to third parties.</li>
                                    <li>We do not use LinkedIn, Twitter/X, or any other social platform pixels.</li>
                                    <li>Wowhead tooltip scripts (used on WoW-related pages) do not set cookies or collect personal data — they are loaded in a privacy-safe, lazy manner and do not require your consent.</li>
                                </ul>

                                <h2>9. Managing Cookies</h2>
                                <p>
                                    You have several ways to control cookies on TechPlay.gg:
                                </p>
                                <ul>
                                    <li><strong>Our consent banner:</strong> The easiest way. Click &quot;Cookie Settings&quot; in the site footer at any time to review and update your choices.</li>
                                    <li><strong>Browser settings:</strong> All major browsers allow you to block or delete cookies. Note that blocking strictly necessary cookies will prevent you from logging in and using account features.
                                        <ul>
                                            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome cookie settings</a></li>
                                            <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Firefox Enhanced Tracking Protection</a></li>
                                            <li><a href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer">Edge cookie settings</a></li>
                                            <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari cookie settings</a></li>
                                        </ul>
                                    </li>
                                    <li><strong>Ad network opt-outs:</strong> Use <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">Google My Ad Center</a> and <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">YourAdChoices</a> to opt out of interest-based advertising globally, independent of our consent banner.</li>
                                </ul>

                                <h2>10. Changes to This Policy</h2>
                                <p>
                                    We will update this policy whenever we add or remove cookies — for instance, if we start using a new analytics provider or stop using Meta Pixel. When we do, the &quot;Last Updated&quot; date at the top will change. For significant changes, we will notify registered users via email or a notice on the website.
                                </p>

                                <h2>11. Contact</h2>
                                <p>
                                    Questions about this Cookie Policy? Reach out:<br />
                                    Email: <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a><br />
                                    Address: Luminor Solutions, 71000 Sarajevo, Bosnia and Herzegovina
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
