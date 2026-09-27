# 19 — Video Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Scope: gaming video formats on YouTube, Shorts, TikTok, Instagram Reels and Facebook Reels; which ones a small editorial team without on-camera presenters could produce; and how articles, database pages and tools could feed video.

**Evidence limits, stated first.** The video agent was stopped before it researched platform documentation, so this file makes **no verified claims about 2026 YouTube, TikTok or Instagram policies, lengths or monetisation.** Those are listed as questions in §6. The format evidence comes from YouTube search results captured by the GTA 6 agent on 27 Sep 2026 (the most-viewed topic in gaming right now), competitor channel pages (04), podcast data (15) and TechPlay's own channel state (02).

## Executive summary

1. **FACT — TechPlay has a YouTube channel with 20 subscribers and no videos found, and no TikTok** (02). There is no video pipeline to build on.
2. **FACT — On GTA 6, the formats that surface in YouTube search are breakdowns, deep dives, map explainers and reactions.** Examples: "48 Things You MISSED in GTA 6 Trailer!" (Caylus), "50 THINGS YOU MISSED IN THE GTA 6 TRAILER!" (TGG), "89 Details From GTA 6 Trailer 2" (IGN), "GTA 6: Vehicles Work Differently Now | Exclusive Deep Dive" (TGG), "The Entire GTA 6 Map Explained in 12 Minutes" (HiPE), "The Evolution of GTA Map's From 1997 to 2025" (RandomData), "Visiting GTA 6 Trailer Locations In Real Life!" (Joel Franco), "Thoughts on the GTA 6 Gameplay Reveal" (penguinz0).
3. **FACT — Publishers re-upload official footage within hours.** GameSpot's "An Extended Look | 26 Minute Gameplay Reveal" and IGN's "Official Extended Gameplay" sit next to Rockstar's own upload in the same results.
4. **FACT — Data-driven comparison videos travel.** "GTA Games Maps Size Comparison" (Horizon) and the RandomData map-evolution video appear in map results. TechPlay holds a 1,058-location GTA 6 map and structured data for 333k games.
5. **HYPOTHESIS — TechPlay's efficient video lane is data and database visuals, not personality.** Release-week lists, map and size comparisons, "confirmed vs rumoured" cards and chart animations can be produced from existing data without a presenter.
6. **RECOMMENDATION — Pick one short-form platform and one repeatable weekly format, and test for four to six weeks** before adding long-form.

## 1. Format catalogue (22)

Example URLs are YouTube watch links built from video IDs captured on 27 Sep 2026. "No example captured" means the format is standard in gaming video but was not observed in this session.

| # | Format | Platform | Example | Why it works (OBSERVATION) | TechPlay source asset | Effort | Cadence | Role | Risk |
|---|---|---|---|---|---|---|---|---|---|
| 1 | "N things you missed" breakdown | YouTube | https://www.youtube.com/watch?v=t7QtrXqvICU (Caylus); https://www.youtube.com/watch?v=JmKZUB1NBag (IGN) | Rewards rewatching; strong titles with numbers | GTA 6 hub data | M | per trailer | Discovery | Uses official footage |
| 2 | Exclusive deep dive on one system | YouTube | https://www.youtube.com/watch?v=5PEKC28azRU (TGG, vehicles) | Depth on a single question | Vehicles DB | M | per beat | Authority | Accuracy |
| 3 | Map explained / map size comparison | YouTube, Shorts | https://www.youtube.com/watch?v=WS0zzZHx1-0 (HiPE); https://www.youtube.com/watch?v=57gT-69DeHE (Horizon) | Visual, data-heavy, evergreen | 1,058-location map | M | once, updated | Discovery | Sourcing |
| 4 | Series evolution over time | YouTube | https://www.youtube.com/watch?v=BHmJ2JGCmpw (RandomData) | Nostalgia + data | Series relations in DB | M | monthly | Discovery | — |
| 5 | Real-world location comparison | YouTube | https://www.youtube.com/watch?v=dQPdtqA4PK8 (Joel Franco) | Novelty | Map + vehicles real-world data | L (travel) | rare | Discovery | Not feasible without travel |
| 6 | Reaction / opinion | YouTube | https://www.youtube.com/watch?v=b-If5Nq0log (penguinz0) | Personality | — | L | per event | Discovery | Needs a presenter |
| 7 | Official footage re-upload | YouTube | https://www.youtube.com/watch?v=AsyOVBDRgtk (GameSpot) | Speed | — | S | per event | Discovery | Rights; majors win on speed |
| 8 | Hands-on impressions | YouTube | https://www.youtube.com/watch?v=Mfx1B_LBSV0 (TGG) | Access | — | L | rare | Authority | Needs publisher access |
| 9 | "Everything we know" explainer | YouTube | https://www.youtube.com/watch?v=1rjw7yD6H8Y (T5G) | Search demand | Everything We Know page | M | monthly update | Discovery | Rumour labelling |
| 10 | Creator stunt ("I tried making GTA 6") | YouTube | https://www.youtube.com/watch?v=Q0X3XcErGXs (LazarBeam) | Entertainment | — | XL | — | — | Not TechPlay's lane |
| 11 | Weekly news roundup (voice-over + clips) | YouTube, podcast | No example captured | Habit, one per week | 20+ news posts a week | M | weekly | Retention | Rights for clips |
| 12 | "Games out this week" short | Shorts, TikTok, Reels | No example captured | Useful, recurring | Release calendar | S | weekly | Discovery + reminders | Low |
| 13 | "Games like X" short | Shorts, TikTok | No example captured | Recommendation demand | "Games like" data | S | 2–3 a week | Discovery | Low |
| 14 | Number card animation ("X sold 1.9M in 3 days") | Shorts, Reels | No example captured (headline pattern in 06) | Single striking stat travels | News + data | S | as news lands | Discovery | Sourcing |
| 15 | Countdown short | Shorts, Stories | No example captured | Daily habit before launch | GTA 6 hub | S | daily to 19 Nov | Retention | Repetitive |
| 16 | "Confirmed vs rumour" card | Shorts, carousel | No example captured | Trust | GTA 6 ledger (17) | S | weekly | Authority | Must be accurate |
| 17 | Tier list | Shorts, YouTube | No example captured | Debate and comments | Tier-list feature | S | monthly | Engagement | Low |
| 18 | PC fix in 60 seconds | Shorts, TikTok | No example captured | Problem-solving search | PC fix guides (09) | S | weekly | Discovery | Low |
| 19 | "Rate my character" (WoW) | Shorts, YouTube | No example captured | Participation | WoW Analyzer | M | weekly | Community | Needs submissions |
| 20 | Steam chart movers | Shorts, X | No example captured | Data news | Steam charts API | S | weekly | Authority | Low |
| 21 | Podcast (two editors) | YouTube, audio | Friends Per Second runs two episodes a month since 2022 (Podchaser) | Loyalty | Editors | M | fortnightly | Retention | Consistency |
| 22 | Interview clips | Shorts from long interviews | No example captured | Reuse | Interviews (none yet) | M | per interview | Authority | Needs access |

## 2. Pipelines a lean team could run

Time costs are ESTIMATE for one editor with a template in a tool such as CapCut or Canva; they assume no on-camera presenter.

| Pipeline | Steps | Time per piece (ESTIMATE) | KPI | Risk |
|---|---|---|---|---|
| Release calendar → "out this week" short | Export the week's releases → template with cover art and dates → caption → post with link to calendar | 30–45 min | Views, calendar clicks, reminders set | Cover-art rights |
| News → number card | Pick the stat → sourced card → 15-second animation | 20–30 min | Shares, profile visits | Accuracy |
| Guide → short | Three steps from a fix guide → screen capture or text-over-footage | 45–60 min | Saves, guide visits | Game footage rights |
| Database → "games like X" | Pull similar games → cards with one line each | 30–45 min | Follows, shelf adds | Recommendation quality |
| GTA 6 hub → countdown / ledger | Daily template; weekly ledger card | 10 min daily; 30 min weekly | Reminder sign-ups | Repetition fatigue |
| Weekly news → roundup | Script from the week's posts → voice-over → clips/cards | 3–4 hours | Watch time, subscribers | Voice quality; AI-voice disclosure rules (unverified) |
| WoW Analyzer → "rate my character" | Collect Discord submissions → screen-record Analyzer → short commentary | 1–2 hours | Analyzer runs | Needs community input |
| Feature → long video | Script from a data feature (e.g. map evolution) → motion graphics | 1–2 days | Watch time | Production skill |

## 3. Minimum viable video stack (RECOMMENDATION)

1. **One weekly format** ("Games out this week") on **one short-form platform** chosen by the social test in 07, cross-posted to YouTube Shorts.
2. **One reactive format** (number cards) for big news days.
3. **GTA 6 daily countdown** until 19 Nov, then a launch-week "what to do first" series.
4. **No long-form** until the short-form format has run for six weeks and the team has a voice.
5. **Templates, not edits:** fixed layouts in a design tool so each video is data-in, video-out.

## 4. Copyright and footage (OBSERVATION)

- Publishers upload official footage quickly and other channels re-upload it; TechPlay would be last to that race.
- Rockstar issued new modding guidelines on 21 Sep 2026 and is actively policing its IP (17). Using only official trailers and screenshots, with credit, is the conservative path.
- Nintendo, Rockstar, Blizzard and Bethesda each publish video-content policies; they were **not fetched** this session and must be read before any gameplay-footage format launches.

## 5. Article → video → site loop

Every video should end on one action TechPlay can measure: set a reminder, add to shelf, run the Analyzer, or join Discord. The link lives in the description or profile; the action lives on the site.

## 6. Open questions the planning phase must verify (not researched)

- Current YouTube Shorts maximum length, how Shorts views are counted, and Partner Programme thresholds in 2026.
- TikTok's recommendation documentation and US operating status in 2026.
- Instagram's treatment of Reels versus carousels and links in 2026.
- Each platform's AI-generated voice and synthetic-media disclosure rules.
- Publisher video policies (Nintendo Game Content Guidelines, Rockstar, Blizzard, Bethesda, Take-Two).

## Sources used

YouTube search results for "gta 6", "gta 6 things you missed", "gta 6 extended look breakdown", "gta 6 map" and recent GTA 6 uploads, captured 27 Sep 2026 (video IDs listed in §1); competitor YouTube channel pages (04); Podchaser "Friends Per Second" (15); TechPlay's YouTube channel state (02); Rockstar Newswire and modding-guideline coverage (17).

## Gaps / needs more data

- All platform-policy questions in §6.
- No view counts were captured for the example videos.
- TikTok and YouTube trending pages did not render.
- No test data exists for TechPlay's own video.
