# 34 — Release Calendar Aggregator

**Status:** live since 08/2026. Replaces the RAWG-backed calendar entirely.

## Why it exists

The calendar used to call RAWG on every cache miss. On 4 August 2026 RAWG went
down — API and status page both — and the calendar went down with it. Nothing we
could have done on our side would have prevented that.

The fix was not better caching. It was to stop borrowing: read the stores
ourselves on a schedule, store the result, and serve only what we already hold.
`CalendarTest` runs under `Http::preventStrayRequests()`, so any network call
from that endpoint now fails the suite.

## The four sources

| Store | Index | Detail | Auth | First pass | Later passes |
|---|---|---|---|---|---|
| **Steam** | search listing, 100/page, **carries dates** | `appdetails`, 1/game | none | ~40 min/month | minutes |
| **Nintendo** | Solr query — **listing is the whole record** | none needed | none | 0.4 s | 0.4 s |
| **Xbox** | sitemap, 42k ids, **no dates** | display catalogue, 200/request | none | ~5 min | seconds |
| **PlayStation** | ✗ **no usable index** — see below | product page `__NEXT_DATA__`, 1/game | none | — | — |

Two shapes fall out of that table, and they are the whole design.

**Stores that name a date in their listing** (Steam, Nintendo) can be filtered to
the window for free. A title costs a detail request once in its life; after that
the listing alone is enough to notice a delay, which is the only thing about an
unreleased game that actually changes.

**Stores that do not** (Xbox, and PlayStation if it is ever made to work) have to
be asked product by product just to learn what is coming. `BlindCatalogueSync` handles both: every answer is
kept, *including for products outside the window*, which get a row carrying
their date and nothing else. A window rolling forward into next quarter is then
a question for our own tables.

## Tables

- **`game_store_links`** — one row per store listing ever seen. `unique(store,
  store_id)` is what makes repeat syncs cheap: matching happens once, then every
  sync is an exact lookup. `game_id` is null for a listing that never became a
  calendar entry, and `rejected_reason` says why.
- **`game_match_decisions`** — an editor's ruling on a pair. Stored against
  normalised titles, not game ids, because the point of "these are the same
  game" is that one of them stops existing straight afterwards.
- **`games`** gains `match_key`, `release_precision`, `hype_score`,
  `is_editorial`, `locked_fields`.

`match_key` is what separates a calendar entry from the 200,000 historical rows
`games` also carries. Only the aggregator sets it. The archive is never a merge
candidate and never appears in the calendar.

## The quality gate

Steam ships ~1,800 titles a month and much of it is asset flips. Roughly half
are rejected; the per-rule breakdown is printed at the end of every sync and is
how we tell a gate that is working from one that is too tight.

Thresholds are **per store** (`config/releases.php`) because they cannot be the
same everywhere:

- **Steam** — 200-character description, 4 screenshots. Adult content is caught
  twice: by tag ids visible in the search listing, which costs nothing, and again
  by content descriptors.
- **Nintendo** — 40 characters. What the eShop calls a description is a one-line
  hook of about sixty; Steam's threshold would erase the catalogue rather than
  filter it.
- **Xbox** — same as Steam. `ProductKind` separates games from add-ons before any
  of it applies.
- **PlayStation** — same as Steam. `storeDisplayClassification = FULL_GAME` does
  most of the work. Not currently reached; see below.

**A caution learned the hard way.** The Xbox adult filter originally matched
`sex` across ratings codes and caught **29% of a 200-title sample** — what it was
catching was `PEGI:SexInn`, sexual innuendo, on ordinary JRPGs. Boards flag a
spectrum; only the top of it means a product does not belong. Xbox and
PlayStation barely need the filter at all, because neither storefront admits
adult products in the first place.

## Merging

`releases:merge` folds one game arriving from several stores into one entry.
Without it, Call of Duty appears three times and each copy claims the game is
exclusive to the one platform it was found on.

- `platform_names` becomes the **union** across every store. This is the point.
- Fields are taken **on merit**, not from the survivor: the fullest description,
  the most screenshots, art by store priority, and the **earliest** date when
  stores disagree.
- Same title more than 60 days apart is **never** merged — that is a port or a
  remaster and belongs as its own entry.
- Two ids in one store are two products and are never candidates.
- Anything closer than certain waits for an editor. An unmerged duplicate is
  visible and embarrassing; a wrong merge is invisible and wrong.

Candidate search blocks on the first four characters of the normalised title,
because comparing every title against every other is a square of the catalogue.

## Ranking

RAWG published an "added" count. No store publishes anything comparable, so the
calendar no longer claims to measure anticipation. `Notability` scores what we
can observe: how many stores carry a title (by far the strongest signal — a game
shipping on three platforms has a publisher behind it), whether critics scored
it, how much the publisher prepared, and how many of our own visitors wishlisted
it. The page says "Biggest", not "Most anticipated", because that is what it is.

## Running it

```bash
php artisan releases:sync                      # steam, nintendo, xbox
php artisan releases:sync --store=steam        # one
php artisan releases:sync --from=2026-08 --to=2026-08
php artisan releases:merge                     # fold duplicates, rescore
php artisan releases:merge --pending           # pairs waiting on an editor
php artisan releases:sync --store=playstation  # opt-in; see the caveat below
php artisan releases:forget playstation        # undo a sweep that read the wrong thing
```

Scheduled weekly (`routes/console.php`): sync at 03:00 Monday, merge at 05:30.
The window is relative to today, so the far month joins it without being asked.

**Deploys that add a config file must run `php artisan config:cache`.** A stale
config cache once made the sync report zero upcoming games, which looked exactly
like the store having nothing to say. `SteamCatalog::assertConfigured()` now
makes that failure loud.

## The editor's screen

Admin → Editorial Tools → **Release Calendar**. Shows what each store
contributed, releases per month, the pairs waiting on a decision, and the
rulings already made. Rulings are permanent and obeyed by every later sync, so
they are listed and can be withdrawn.

`locked_fields` on a game is how a hand correction survives: anything listed
there is left alone by both sync and merge.

## What is fragile, and what to do about it

**PlayStation does not currently contribute anything**, and the reason is worth
recording so nobody repeats the afternoon it cost.

Reading a PlayStation *product* works: `PlaystationCatalog::details()` returns a
title, date, platforms, publisher, hero art, screenshots and a full description,
all from the JSON Sony's own page carries. What does not work is finding out
*which* products to read. Sony's only server-rendered listing is the back
catalogue — the page is titled **"All PS4 Games"** — and unreleased titles do not
appear in it at all. Sixty pages produced 1,440 products dated between June 2024
and July 2026 and not one upcoming release. The store's own "Coming soon" control
is a facet (`conceptReleaseDate=next_thirty_days`) applied in the browser;
passing it as a query parameter changes nothing.

The mistake that cost the time was mine and was avoidable: the category id came
from a url early in the session, it returned products with plausible dates, and
I never opened the page's `<title>` to see what collection it actually was.

PlayStation is therefore excluded from `--store=all` and from the schedule. The
code stays and still runs on request. The remaining way in is Sony's whitelisted
GraphQL with the persisted-query hash read out of their own JS at runtime, which
is worth trying and is the next thing to attempt.

Two bugs were fixed along the way and both are instructive about this source's
shape: the page is built from fragments carrying overlapping slices of one
Apollo cache, most of them thin, so merging by replacement erased the release
date — they are unioned now. And the art hangs off the *concept*, not the
product, so images are gathered by shape rather than by path.

`releases:forget playstation` clears a mistaken sweep so a source can be asked
again from scratch. It refuses to drop listings that became calendar entries
unless told to.

**Epic and Ubisoft** are not sources. Both block automated access outright.
Their games are covered anyway — Ubisoft returned to Steam in 2022, and most of
Epic's catalogue is also on Steam — so the real gap is Epic timed exclusives,
which is what the editorial override is for.

**If a store changes shape**, the sync reports it rather than inventing data: an
unparseable page is skipped, a failed request is retried next pass, and only a
positive "no such product" is remembered as final.
