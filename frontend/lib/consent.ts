/**
 * What Google is told before anybody asks anything.
 *
 * Until 20 September 2026 this file also carried a whole consent system: a
 * shape for the reader's preferences, three storage keys, a mapping from those
 * preferences to Consent Mode signals, and a head script that read the stored
 * answer back. All of it existed to serve a banner we wrote ourselves.
 *
 * That banner is gone. Google requires publishers serving personalised ads in
 * the EEA, the UK and Switzerland to use a CMP it has certified against the
 * IAB TCF — a hand-written dialog calling gtag('consent','update') does not
 * qualify however correct it is, and AdSense had limited ad serving on the
 * whole site because of it. Google's own certified CMP now asks, through the
 * AdSense tag that was already on every page.
 *
 * What is left here is the one thing a CMP does not do: the default, which is
 * what applies before a message is shown and to every reader who is never
 * shown one.
 */

/**
 * Where a reader has to be asked before anything is stored.
 *
 * ISO 3166-1 for countries; Google also accepts ISO 3166-2 for subdivisions,
 * which is how the US state rules would be expressed if we ever add them.
 *
 * The list is the EEA (the EU plus Iceland, Liechtenstein and Norway), the UK
 * and Switzerland — the three jurisdictions Google's European regulations
 * message covers, so that the default and the message agree about who is being
 * protected.
 */
const ASK_FIRST = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    'IS', 'LI', 'NO',
    'GB', 'CH',
];

/**
 * The Consent Mode defaults, as raw JavaScript for the document head.
 *
 * It has to run before gtag.js executes: a default that arrives after the
 * library has already sent its first hit is not a default, it is a correction
 * nobody sees.
 *
 * Two blocks, regional first and global second, which is the order Google's own
 * documented example uses.
 *
 * It was written the other way round on 20 September, on the reasoning that the
 * most specific default wins regardless of order. Measured, it did not: after
 * that deploy every hit carried `gcs=G100`, denied, including one from a
 * verified Bosnian address that matches no region in the list below. The
 * permissive block was not being applied to anybody. Whatever gtag does
 * internally, the documented order is the one to write.
 *
 * Granted outside those regions rather than denied everywhere, which is what
 * this used to do. Denied-by-default worldwide sounds cautious and is not: with
 * no banner left to grant it, every reader on earth would have been served
 * non-personalised ads for ever — including the ones no privacy law in their
 * country asks us to treat that way. The cost of that is real and falls
 * entirely on us.
 */
export function consentBootstrapScript(): string {
    return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  region: ${JSON.stringify(ASK_FIRST)}
});
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});`.trim();
}
