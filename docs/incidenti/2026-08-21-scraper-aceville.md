# Invalid traffic incident — techplay.gg — 21 August 2026

Prepared from raw nginx access logs on the origin server. Keep this document:
if Google ever raises an invalid-traffic notice in the AdSense Policy Center,
this is the evidence to attach to the appeal.

## Summary

On 21 August 2026 the site received **855,079 HTTP requests**, against a normal
daily volume of roughly **110,000**. **274,930 of them (32%)** came from a single
network operator and were automated. The traffic executed JavaScript, so it was
counted by Google Analytics as human visitors and was served ads.

I did not solicit, purchase, or encourage this traffic, and I did not benefit
from it.

## Source

| | |
|---|---|
| Organisation | ACEVILLE PTE. LTD., 16 Collyer Quay, Singapore |
| ASN | **132203** (Tencent Cloud, Singapore) |
| Allocated range | **43.160.0.0 – 43.175.255.255** (43.160.0.0/12) |
| Distinct IP addresses used | **1,660** |
| Requests per address | ~215 average — deliberately below any per-IP rate limit |

## Evidence that the traffic was automated

1. **User-agent rotation.** Chrome version strings rotated across 133, 116, 131,
   107 and 110 in near-equal volumes (~29,000 each). A real audience is never
   distributed evenly across five superseded browser versions.
2. **Sequential catalogue walk.** `/games` 118,743 requests, `/api` 51,514,
   `/studios` 24,461, `/forum` 6,659 — the site's game database, walked in
   order. This began days after the catalogue grew from 142,000 to 332,000
   titles and a new Studios section was published.
3. **JavaScript execution.** Requests carried Next.js `?_rsc=` client-prefetch
   parameters and hit the site's own client-side error-reporting endpoint
   (`/api/2/envelope/`). Neither is produced by a simple HTTP scraper — these
   were headless browsers, which is why Analytics counted them as users and ads
   were served to them.
4. **Google Analytics signature.** ~16,000 "active users" for the day at an
   average engagement time of **1 second**.
5. **Ramp-up before the burst.** 8 requests on 14 Aug, 189 on 18 Aug, ~550 on
   20 Aug, then 274,944 on 21 Aug. 276,099 requests from that range in total,
   of which 5 were POSTs and the rest GETs. Nothing from that network has ever
   behaved like a reader.
6. **Concentration in time.** 218,990 requests in the 06:00 hour and 117,030 in
   the 07:00 hour (UTC).

## For contrast: declared crawlers the same day

These are separate, honestly identified, and do **not** execute JavaScript, so
they generated no Analytics sessions and no ad impressions:

| Crawler | Requests |
|---|---|
| ClaudeBot | 268,416 |
| GPTBot | 143,948 |
| Meta external agent | 112,040 |

They are permitted by the site's `robots.txt`.

## Mitigation applied — 22 August 2026

1. **Cloudflare WAF custom rule** — expression `(ip.geoip.asnum eq 132203)`,
   action **Block**, enabled.
2. **Cloudflare rate limiting** — the existing rule was extended from `/games/*`
   to cover both `/games` and `/studios` (50 requests / 10 s per IP, block).
   Note: rate limiting alone could never have stopped this attack, because the
   load was spread across 1,660 addresses and no single one approached the
   threshold.
3. **Origin firewall** — nginx returns `444` (connection closed, no response)
   for the whole of 43.160.0.0/12, as a backstop if the CDN rule is ever
   removed.

## Consequence: limited ad serving

The AdSense Policy Center shows **"Ad serving is currently limited", started
21 August 2026** — the same day. It is automatic and temporary; Google
re-assesses on its own as traffic quality is monitored, typically in under 30
days. There is no appeal form for it, which is why the AdSense "Contact us"
flow offers only the Community forum. The account itself is intact.

The only lever is traffic quality, so beyond blocking the scraper the ad
implementation was audited against the AdSense Program Policies
(`support.google.com/adsense/answer/48182`) and two things were fixed.

### Fixed: thin pages no longer carry advertising

The catalogue holds 332,128 games; **116,087 (35%) have under 200 characters of
description** and 26,886 have none at all. `/games/avalon-remake` was measured
at 1,666 characters of visible text, nearly all navigation, with roughly a
hundred belonging to the game — and it carried an ad. That is the "scaled
content" profile the policies describe.

The slot on `/games/[slug]` is now conditional on 200 characters of plain-text
description. Verified after deploy: `avalon-remake` and `ollies-manor` render
no ad slot, `tribes-vengeance` (4,952 characters of visible text) still does.

### Fixed: ads no longer load off-site

The Sites report listed `127.0.0.1` (9 page views) and `46.224.110.57` (1)
alongside techplay.gg. The publisher ID is compiled into the bundle and nothing
checked the hostname, so a local `npm run dev` browser session — or anyone
opening the origin by its bare IP — loaded real units and billed impressions.
Ads now load only on `techplay.gg` / `www.techplay.gg`, decided in the browser
because the server renders identical markup for every host. The publisher ID
also moved into one module instead of two places.

### What the audit found to be already correct

Auto ads off; three hand-placed formats, each used in the context it is drawn
for; no ad above content anywhere; none on 404, error, login, settings or
profile; the "Advertisement" label appears only once a unit fills; ads are
non-personalised without cookie consent; `ads.txt` present and matching; no
prohibited encouragement language, arrows or misleading labels; no pop-ups or
redirects (the three `window.open` calls are all user-initiated); ad markup
stays out of the server-rendered HTML.

### Still open

- **Supporters pay for an "Ad-free experience" and still see ads.** `/support`
  sells it; `AdSense.tsx` checks cookie consent and nothing else. Not a Google
  policy issue — a promise the code does not keep.
- **`noindex` for the 26,886 descriptionless games** — an SEO trade-off against
  a database whose whole point is scale. Owner's call.
- **`AdUnit`** (the in-house ad system, unrelated to AdSense) is dormant: the
  `ads` table does not exist and `/api/v1/ads/{position}` answers `{}`, yet the
  component still fires three requests on every article, guide and review. Its
  `code_block` renders through `dangerouslySetInnerHTML`, so AdSense markup
  pasted there would bypass the host gating above.

## Notes for an appeal, if one is ever needed

- The site is a gaming media publication; its game database is the asset being
  harvested.
- The traffic arrived entirely through Cloudflare — the origin firewall accepts
  ports 80/443 from Cloudflare ranges only — so the IP addresses recorded above
  are true visitor addresses restored from `CF-Connecting-IP`, not proxy
  addresses.
- Raw logs covering the period are retained on the origin server at
  `/var/log/nginx/access.log.1` (21 Aug) and rotated archives either side.
