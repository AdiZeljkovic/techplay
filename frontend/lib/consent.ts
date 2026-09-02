/**
 * What the reader chose, translated into the only vocabulary Google reads.
 *
 * The banner has collected a choice since long before this file existed, saved
 * it, synced it to the account, and told the ad slots about it — and never once
 * told Google Analytics. So the site asked for consent it then ignored: with
 * `client_storage: 'none'` set unconditionally, GA could not use a cookie for
 * anyone, including the readers who had just said yes.
 *
 * That is why every visit counted as a new person and why the reports showed a
 * five-second average engagement. Nothing was measuring returning readers,
 * because nothing could tell one from a stranger.
 *
 * The mapping lives here alone. The head needs it as raw JavaScript before any
 * module has loaded, and the banner needs it as a function afterwards — two
 * shapes, one set of rules, because a consent mapping that disagrees with
 * itself is the kind of bug nobody finds by looking.
 */

export interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

/** Where the choice is kept. The account copy is a mirror of this. */
export const CONSENT_STORAGE_KEY = "cookie_preferences";

/** Nothing but what the site cannot run without, until somebody says otherwise. */
export const DEFAULT_PREFERENCES: CookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false,
};

type Signal = "granted" | "denied";

/** Consent Mode v2, from one set of preferences. */
export function consentSignals(prefs: CookiePreferences): Record<string, Signal> {
    const analytics: Signal = prefs.analytics ? "granted" : "denied";
    const ads: Signal = prefs.marketing ? "granted" : "denied";

    return {
        analytics_storage: analytics,
        ad_storage: ads,
        ad_user_data: ads,
        ad_personalization: ads,
    };
}

/**
 * Tell Google what just changed.
 *
 * Safe to call before gtag.js has landed: the stub in the head queues into
 * dataLayer and the library reads the queue when it arrives.
 */
export function applyConsent(prefs: CookiePreferences): void {
    if (typeof window === "undefined") return;

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;

    gtag("consent", "update", consentSignals(prefs));
}

/**
 * The same rules as raw JavaScript, for the document head.
 *
 * It has to run before gtag.js executes, and it has to read the stored choice
 * synchronously. A returning reader who consented last week would otherwise
 * have their first page view of every visit recorded without them — the one
 * hit that decides which landing page gets the credit.
 *
 * Denied by default, always. Consent Mode still sends a cookieless ping in that
 * state, so a reader who declines is counted without being identified, and
 * nothing has to be guessed about whether they are in the EU.
 */
export function consentBootstrapScript(): string {
    return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
try {
  var raw = localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)});
  if (raw) {
    var p = JSON.parse(raw);
    if (p && typeof p === 'object') {
      gtag('consent', 'update', {
        analytics_storage: p.analytics ? 'granted' : 'denied',
        ad_storage: p.marketing ? 'granted' : 'denied',
        ad_user_data: p.marketing ? 'granted' : 'denied',
        ad_personalization: p.marketing ? 'granted' : 'denied'
      });
    }
  }
} catch (e) {
  /* A reader with storage blocked stays denied, which is already the default. */
}`.trim();
}
