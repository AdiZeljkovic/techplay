/**
 * What Google is told before anybody asks anything.
 *
 * Until 20 September 2026 this file carried a whole consent system: a shape for
 * the reader's preferences, three storage keys, a mapping from those
 * preferences to Consent Mode signals, and a head script that read the stored
 * answer back. All of it existed to serve a banner we wrote ourselves.
 *
 * That banner is gone. Google requires publishers serving personalised ads in
 * the EEA, the UK and Switzerland to use a CMP it has certified against the IAB
 * TCF — a hand-written dialog calling gtag('consent','update') does not qualify
 * however correct it is, and AdSense had limited ad serving on the whole site
 * because of it. Google's own certified CMP now asks, through the AdSense tag
 * that was already on every page.
 *
 * The default that applies before any message is shown is no longer written
 * here either, and that is the part worth reading.
 *
 * It was, briefly, as a pair of `gtag('consent','default',…)` calls where the
 * restrictive one carried `region: [ …32 European codes… ]`. That does not
 * work, and the way it fails is silent. gtag resolves a `region` default by
 * fetching https://www.google.com/ccm/geo, which is asynchronous; until the
 * answer arrives it does not know where the reader is and assumes the
 * strictest case. Our page_view fires immediately, from the head. So every hit
 * the site sent carried `gcs=G100` — denied — for readers in Bosnia and the
 * United States as much as in Germany. Measured after the deploy: 203 hits, not
 * one granted, including a verified Bosnian address.
 *
 * The old banner had hidden this for as long as it existed, because it sent
 * `consent update`, which Google honours at any time. That is all the 1-2% of
 * `gcs=G111` hits ever were: the people who clicked Accept. The default beneath
 * them had never applied to anyone.
 *
 * Cloudflare has already told our own server the reader's country by the time
 * nginx answers, so the answer is stated rather than waited for.
 * `/etc/nginx/snippets/techplay-consent-js.conf` serves `/consent.js`, whose
 * granted-or-denied comes from `CF-IPCountry` through the map in
 * `conf.d/zz-techplay-consent.conf` — and that map, not this file, is where the
 * list of protected countries now lives.
 */

/**
 * The queue and the function, and nothing else.
 *
 * `/consent.js` defines both as well, so this is not what normally sets them.
 * It is here because the config call below it in the document is inline and
 * will run whether or not that request succeeded: without this, a failed
 * /consent.js would take the whole of Analytics down with a `gtag is not
 * defined`, which is a far worse failure than a missing default.
 */
export function consentBootstrapScript(): string {
    return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}`.trim();
}
