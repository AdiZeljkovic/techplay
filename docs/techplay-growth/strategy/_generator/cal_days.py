# Date-specific additions. Keys are field names; values are appended (lists) unless key starts with '=' (replace).
DAY = {}
def d(date, **kw): DAY[date] = kw

d("2026-09-28", theme="Day 1: trust reset, measurement and handles",
  objective="Remove every false claim; start measurement; claim missing social handles; verify the GTA 6 giveaway",
  article=["GTA 6 countdown opener: '52 days to Vice City: every confirmed fact so far' (update of /gta6/everything-we-know, no new URL)"],
  ops=["EIC 09:00: open Filament > Giveaways; record whether the GTA 6 draw (closing 20 Oct per JoinPrompt.tsx comment) exists and is active (C09)",
       "DEV: D-001 remove '15K+ MEMBERS · 50K+ GAMES', 'Earn XP for every article you read', 'Join thousands of fans', WoW '50K+ players · 4.9/5', 'Midnight launches March 2, 2026', '140,000+' titles; D-004 replace discord.gg/techplaygg and discord.gg/techplay with https://discord.gg/wPQG9gUMXH",
       "DEV (W40): D-041 bot giveaway links, D-039a base points on entry, D-039b IP limit on all entry paths, D-040 WoW copy, D-012 /newsletter landing",
       "SC: claim TikTok @techplay.gg, Bluesky techplaygg.bsky.social (domain handle later via the HTTPS well-known file, no DNS change), Threads @techplaygg; link X @TechPlayGG from the site footer",
       "SC: create one Discord invite code per active campaign (C04, C06, C07, C35, C40, C47) and log them in the campaign sheet",
       "EIC: create the campaign sheet (C01–C71, owners, dates, UTM) from 28-CAMPAIGN-LIBRARY"],
  reddit=["C47 starts: EIC and ED read and log the rules of all 18 target subreddits; set Reddit profiles to 'Editor at TechPlay.gg'; no links this week"],
  discord=["C35 Discord rebuild starts: SC audits channels and roles against 12-DISCORD; pins the only working invite"],
  priority="P0", extra_h=10)
d("2026-09-29", theme="Minecraft Dungeons II launch; The Last Disc revival; overdue giveaway draw",
  ops=["EIC: run the overdue World of Tanks draw in public (R01: 207 days undrawn) and post the winner announcement on 30 Sep (25-GIVEAWAYS template); no new giveaway is promoted until D-039a (base points on entry) ships"],
  article=["News: Minecraft Dungeons II is out: platforms, price, cross-play (ED, 16:00 CET)",
           "C66: 'Sony and the disc: what the survey actually asked' explainer + refreshed /last-disc petition page (EIC)"],
  gnews=["Minecraft Dungeons II launch", "Sony disc explainer"],
  x=["C66 thread, first post: «What Sony asked about discs, what it didn't, and what you can do: https://techplay.gg/last-disc?utm_source=x&utm_medium=organic-social&utm_campaign=c66-last-disc&utm_content=thread-1»"],
  community=["/last-disc petition pinned in Discord #announcements"], extra_h=3)
d("2026-09-30", theme="PS Plus October reveal; first Poll of the Week",
  article=["News (on reveal): PS Plus Essential October games, each linked to its /games page with 'add to library' (ED)"],
  gnews=["PS Plus Essential October games"], extra_h=1)
d("2026-10-01", theme="Steam Autumn Sale opens; GTA 6 ledger launches",
  article=["C05: 'Steam Autumn Sale 2026: 20 picks from the games TechPlay members wishlist most' (ED, publish 19:15 CET, 15 min after Steam's start)",
           "C07: /gta6/everything-we-know relaunched as the Confirmed-or-Rumour ledger (ED)"],
  seo=["C07 ledger: FAQPage schema kept; add 'Last updated' date and a changelog block"],
  gnews=["Steam Autumn Sale picks"],
  fb=["C05 link post: «The Autumn Sale is on until 8 Oct. These are the 20 games our members wishlist most, and what they cost today.»"],
  x=["C05 thread: 5 picks, one per tweet, each with price and link", "C07: «We've split every GTA VI claim into Confirmed, Reported and Rumour. 18 claims, each with a source. https://techplay.gg/gta6/everything-we-know?utm_source=x&utm_medium=organic-social&utm_campaign=c07-gta6-ledger&utm_content=launch»"],
  newsletter=["No send: sale picks go in Friday's first Save File"], priority="P0", extra_h=4)
d("2026-10-02", theme="The Save File #1; Ace Combat 8; first Fix It Friday",
  article=["News: Ace Combat 8: Wings of Theve is out, PC specs and platforms (ED)"],
  newsletter=["C40 The Save File #1: send 15:00 CET (09:00 ET) to verified subscribers. Sections: Out this week / 3 stories that matter / Autumn Sale picks / GTA countdown / One from the database (Hidden Gem)"],
  ops=["DEV: C01 closes; screenshot every page the false claims were removed from and file in /docs/techplay-growth/ops/"],
  priority="P0", extra_h=3)
d("2026-10-03", theme="In Order #1: Gears of War (C63 starts)")
d("2026-10-05", theme="Video system starts; registration rebuild starts; Next Fest outreach",
  ops=["C49 vertical video starts: first 'Out This Week' vertical (TikTok, Shorts, Reels, FB Reels from one edit)",
       "C44 registration rebuild starts (DEV: D-014 register page rewrite + honour redirect)",
       "C46 interim: D-012 newsletter form under articles from 5 Oct; ED adds 3–5 contextual links by hand (D-010 block moves to Feb 2027)",
       "EIC decides D-031 Option A (no pixel, no Meta in 2026; default) or B (6 h pixel slice) today"],
  partner=["C71: EIC emails 10 Next Fest developers whose demos are in TechPlay's DB, offering a slot in the Next Fest Diary (template in 24-PARTNERSHIPS)"],
  discord=["C13: #wow pin: 'Patch 12.1.5 is predicted for ~6 Oct. Run /wow-analyzer before and after.'"], extra_h=4)
d("2026-10-06", theme="Gears of War: E-Day launch; Verdict restart announced (first Verdict Thu 8 Oct)",
  article=["News: Gears of War: E-Day is out: platforms, Game Pass status, PC specs (ED, 16:00 CET)",
           "If Blizzard ships 12.1.5: patch notes digest with Analyzer CTA (ED)"],
  gnews=["Gears of War: E-Day launch"], reels=["Launch vertical: «Gears of War: E-Day is out. Here's what you need to know in 30 seconds.»"],
  extra_h=2)
d("2026-10-07", theme="PR: Release Congestion Index 2026",
  article=["C20 data story: 'Release Congestion Index 2026: the busiest weeks of the year, measured' at /data/release-congestion-2026 with CSV + method note (EIC)"],
  pr=["C20: send embargo-free pitch at 10:00 CET to the press list (GamesIndustry.biz, GamesRadar+, PC Gamer, VGC, Insider Gaming); personalised first line per outlet"],
  reddit=["C48: r/dataisbeautiful [OC] chart with tool + source comment; r/Games only if the sub's rules allow original analysis (checked 28 Sep)"],
  linkedin=["C20 post by EIC: chart + method in 3 lines + link"],
  bluesky=["C20 chart + 'what we counted and what we didn't'"], priority="P0", extra_h=6)
d("2026-10-08", theme="Autumn Sale last day",
  x=["Last-day reminder: «The Autumn Sale ends today at 19:00 CET. Last look at the 20 picks.»"], fb=["Autumn Sale last-day reminder, same link, new image"], extra_h=0.5)
d("2026-10-09", theme="Ownership and press pages; Dragon's Dogma 2: Dark Arisen",
  article=["News: Dragon's Dogma 2: Dark Arisen is out, incl. Switch 2 (ED)"],
  ops=["C54 interim: EIC publishes 'Who owns TechPlay, how it is funded, and how we use AI' as an article linked from /about (names Luminor Solutions as in the Impressum); /about/ownership and /press pages follow 18 Dec (D-038)",
       "D-020: EIC decision on GTA map attribution with gtadb.org; if no answer, location facts stay out of the countdown"],
  priority="P0", extra_h=3)
d("2026-10-12", theme="PC Fix Hub, MW4 hub, Discord relaunch, welcome emails",
  article=["C60 interim: 'PC fixes: every guide we've tested, in one place' pillar guide (ED); becomes /guides/pc-fixes by 301 in Jan 2027 (D-032)",
           "C17: 'Modern Warfare 4: release times, editions, early access and platforms' hub page (ED)"],
  seo=["C60 pillar guide: link from every PC guide and from /hardware"],
  discord=["C35 complete: Onboarding + Server Guide live; C36 Road to 500 announced with the invite code per campaign",
           "C68 Founding 100 announced: first 100 activated members get the Founder badge"],
  ops=["C42 interim: SC sends a short manual welcome to the week's verified subscribers every Friday until D-013 ships (~6 Nov)", "C36: SC reads invite-code 'uses' in Server Settings → Invites every Monday (D-011 moves to 2027)"], priority="P0", extra_h=5)
d("2026-10-13", theme="Planet Zoo 2", article=["News: Planet Zoo 2 is out (ED)"])
d("2026-10-14", theme="Studios Closed tracker; GTA 6 release-time tool",
  article=["C22: /data/studios-closed-2026 tracker live (ED)", "C08: /gta6/release-time live: pick your time zone, set a reminder (DEV D-018 + ED)",
           "News: PS Plus Extra/Premium October games revealed (if Sony posts)"],
  pr=["C22: pitch to GamesIndustry.biz and industry newsletters: 'a sourced, updated list'"],
  x=["C08: «When does GTA VI unlock where you are? We'll tell you, and remind you. https://techplay.gg/gta6/release-time?utm_source=x&utm_medium=organic-social&utm_campaign=c08-gta6-release-time&utm_content=launch»"],
  priority="P0", extra_h=4)
d("2026-10-15", theme="Enshrouded 1.0, Castlevania: Belmont's Curse, Crimson Desert DLC",
  article=["Release-day roundup: three launches, one article, links to each /games page (ED)"], extra_h=1)
d("2026-10-16", theme="MW4 campaign early access; measurement gate",
  article=["News: MW4 campaign early access is live for digital pre-orders: unlock times by region incl. CET (ED)"],
  ops=["C03 status review (EIC + DEV): D-007 phase A lands W43, D-008 W44; no paid spend before 2 Nov"],
  priority="P0", extra_h=2)
d("2026-10-18", theme="Quiet Sunday; Valorant Champions final (no coverage unless an owner exists)")
d("2026-10-19", theme="Steam Next Fest opens; off-site alerts live; paid search starts",
  article=["C18/F23 Next Fest Diary day 1: three demos tried and rated, each linked to its /games page (ED)",
           "C18: '20 Next Fest demos to try first' (published 19:00 CET when the fest opens)"],
  ops=["C43 interim: SC posts 'Out today' in Discord #releases each morning from /calendar (email alerts ~6 Nov)", "C45 slips to 18 Dec (lite); until then guest buttons go to /login?redirect= after D-014"],
  priority="P0", extra_h=5)
d("2026-10-20", theme="GTA 6 giveaway closes (if live); Steam Curator; creator programme",
  article=["F23 Next Fest Diary day 2 (ED)", "News: PS Plus Extra/Premium drop incl. Mycopunk"],
  ops=["C09: if the draw is live, close at the time set in admin; export entrants; run the draw on the 21st",
       "C69: TechPlay Steam Curator page live with 20 reviewed games; follow link from /steam later (ED)"],
  creator=["C51: send data-partnership offer to 10 creators (GTA/WoW/Steam niches): TechPlay data point + chart for their video, credit link"],
  extra_h=4)
d("2026-10-21", theme="GTA 6 vehicle guide; giveaway winner",
  article=["C12: 'GTA VI vehicles and their real-world inspirations' (only entries with a cited source; others marked 'unconfirmed') (ED)", "F23 day 3"],
  community=["C09 winner post (if the draw ran): first name + country only, with consent; same text in Discord and on the giveaway page"],
  extra_h=3)
d("2026-10-22", theme="FF Resonance, Switch Sports Resort, Once Human: Isles of Abyss; Halloween starts; GTA III is 25",
  article=["Release-day roundup (ED)", "C19: 'Horror games for Scream Fest and Halloween, picked from the database' (ED)", "F23 day 4"], extra_h=2)
d("2026-10-23", theme="Call of Duty: Modern Warfare 4 launch",
  article=["News: MW4 is out on PS5, Xbox, PC and Switch 2: unlock times, file size, what's in Season 1 (only what Activision states) (ED, 06:00 CET)", "F23 day 5"],
  gnews=["MW4 launch"], reels=["MW4 launch vertical: «MW4 is out. Four platforms, one thing to check first.»"],
  priority="P0", extra_h=2)
d("2026-10-24", theme="Next Fest weekend", article=["F23 day 6"])
d("2026-10-25", theme="Next Fest final full day", article=["F23 day 7"])
d("2026-10-26", theme="Next Fest ends; Switch 2 hub; first personalised email; Scream Fest",
  article=["F23 wrap: 'The 10 Next Fest demos worth wishlisting' (ED)", "C61 interim: 'Every Switch 2 Edition: upgrade path and price, in one list' pillar article (ED); /switch-2 hub absorbs it by 301 in Jan 2027"],
  ops=["C44: D-014 register rewrite live (social-first, honest copy, honours ?from= and redirect); Steam sign-in moves to 2027-W01", "C41 moves to Mon 23 Nov (D-028)", "C67: check Season 2 in admin today; the repo holds no Season 2 configuration"],
  priority="P0", extra_h=5)
d("2026-10-27", theme="Minecraft Bedrock on Switch 2", article=["News: Minecraft Bedrock on Switch 2 (ED)"])
d("2026-10-28", theme="PR: World Atlas of Game Studios + Balkan Game Dev Census; WoW: Forever explainer",
  article=["C21: /data/studio-atlas + 'Balkan Game Dev Census 2026' (EIC)", "C14: 'WoW: Forever explained: what it is, what it costs, who it's for' (ED)"],
  pr=["C21: pitch regional tech media (UNVERIFIED which cover games) in local language + GamesIndustry.biz in English"],
  reddit=["C48: r/dataisbeautiful [OC] studio map; regional subs only where rules allow"],
  partner=["C55 prep: EIC emails 5 Bosnian/Croatian/Serbian studios from the census offering a profile interview"],
  linkedin=["C21 post by EIC"], priority="P0", extra_h=6)
d("2026-10-29", theme="Phantom Blade Zero launch; Game Club night; Vice City is 24",
  article=["News: Phantom Blade Zero is out: PS5 and PC, specs (ED)"],
  community=["C38 Game Club: Control Resonant discussion night, Discord stage 20:00 CET"], extra_h=2)
d("2026-10-30", theme="YouTube pilot: Release Radar November",
  youtube=["C50 Release Radar: November 2026 (8–10 min, voice-over, official trailers with credit; chapters per game; links with UTM)"], extra_h=5)
d("2026-10-31", theme="Halloween", x=["Halloween (from the database, link to the C19 list): «Horror you can finish tonight: five games under five hours.»"])
d("2026-11-01", theme="Season 2 'Overdrive'; Fortnite season change (rumour)",
  ops=["C67: Season 2 goes live only if it is configured in admin (checked 26 Oct); otherwise no announcement"],
  discord=["C67 announcement: 'Season 2: Overdrive. New quests, same XP rules.'", "C38: Game Club November pick: GTA VI (discussion 3 Dec)"],
  article=["Fortnite: only if Epic confirms the new season; otherwise no article"])
d("2026-11-02", theme="Steam hub; paid social test (gated); PlayStation Stars ends",
  article=["C62 interim: 'Steam this quarter: sales, fests and the charts, in one guide' pillar article (ED); /steam hub in Jan 2027", "News: PlayStation Stars ends today, what happens to points (ED)"],
  paid=["C56 Google branded + tool terms may start today if D-007 and D-008 are live (26-PAID-MEDIA)"],
  extra_h=4)
d("2026-11-04", theme="WoW: Forever launch; PR: Sequel Gap Inflation",
  article=["News: WoW: Forever is live (ED)", "C23: 'Why GTA VI took 13 years: sequel gaps, measured' (EIC)"],
  pr=["C23: pitch to GTA-heavy outlets (Dexerto, GamesRadar+, VGC) with the chart and a quote from EIC"],
  reddit=["C48: r/dataisbeautiful [OC] sequel-gap chart"], priority="P0", extra_h=6)
d("2026-11-05", theme="Stellar Blade Complete, Guardians of the Galaxy, Edge of Memories", article=["Release-day roundup (ED)"])
d("2026-11-06", theme="PS Plus renewal price change (verify first)",
  article=["Only if Sony confirms: 'PS Plus renewals: what you pay from today, by region' (ED)"])
d("2026-11-09", theme="Web push for reminders; Reddit paid test",
  paid=["C58 Reddit ads test: GTA 6 hub and WoW Analyzer, r/GTA6 + r/wow interest targeting, US 18+ (EIC/SC)"], extra_h=3)
d("2026-11-10", theme="MMO hub", article=["C15 interim: 'Which MMO to play this winter: WoW, FFXIV or Guild Wars 2' pillar article with Analyzer entry (ED); /mmo hub in Jan 2027"], extra_h=3)
d("2026-11-11", theme="PR: The $80 Tracker", article=["C24: /data/80-dollar-tracker (EIC/ED)"],
  pr=["C24: pitch to consumer and deals desks: 'every 2026 game at $79.99 or more, and who blinked'"], priority="P0", extra_h=5)
d("2026-11-12", theme="YouTube: Every GTA game in order; Switch 2 editions",
  youtube=["C50 long-form pilot: 'Every GTA game in order before VI' (12–15 min, voice-over, chapters per game)"],
  article=["News: Pikmin 4 Switch 2 Edition + Metaphor: ReFantazio Switch 2 are out (ED)"], priority="P0", extra_h=6)
d("2026-11-13", theme="Pre-launch Save File", newsletter=["The Save File #7 is the GTA VI prep edition: release-time tool, storage fix, editions, ledger"])
d("2026-11-14", theme="LoL Worlds final (one results item only if an owner exists)")
d("2026-11-16", theme="GTA VI launch week begins (C10)",
  article=["C10: 'GTA VI launch week: what happens when' (unlock times only as published by Rockstar/platforms)"],
  discord=["C10: Discord Scheduled Event 'GTA VI launch night' created, start = confirmed unlock time"], priority="P0", extra_h=4)
d("2026-11-17", theme="GTA VI pre-load (if platforms publish it)",
  article=["If published: 'GTA VI pre-load is live: file size and how to start it on PS5 and Xbox' (ED)"], priority="P0", extra_h=2)
d("2026-11-18", theme="Launch eve; TGA prediction league opens",
  ops=["C29: TGA prediction league opens as forum polls (SC; no new code, D-026 moved to 2027 per 19/21)"],
  article=["'GTA VI: everything confirmed the night before launch' (ledger final pass) (ED)"], priority="P0", extra_h=4)
d("2026-11-19", theme="GTA VI launch day",
  objective="Be the useful page on launch day: unlock times, map progress tracker, fixes, and a place to talk",
  article=["News at unlock: 'GTA VI is out' (ED)", "C11: /gta6/map progress tracker live: tick off locations as you find them (DEV)",
           "Launch-day live page: issues, patches, server status (ED, updated hourly 08:00–24:00 CET)"],
  newsletter=["Special edition 'GTA VI is out': tracker, fixes, what's confirmed about Online (send at unlock + 1 h)"],
  discord=["Launch-night event runs; #gta6-spoilers opens; Buffy pins the tracker"], priority="P0", extra_h=12)
d("2026-11-20", theme="GTA VI day two; Black Friday price alerts start",
  article=["Review in progress: 'GTA VI after 12 hours' (EIC)", "First guides from real play, only what staff have verified in-game (ED)"],
  ops=["C31: Deal Radar (F16) posts without personalisation from today; wishlist price-drop emails go live Wed 25 Nov (D-027)"], priority="P0", extra_h=6)
d("2026-11-21", theme="GTA VI weekend", article=["GTA VI guides batch 2 (ED)"], extra_h=3)
d("2026-11-22", theme="Launch week wrap", article=["Buffy's Wrap special: GTA VI week in numbers (tracker ticks, members online)"], extra_h=1)
d("2026-11-23", theme="PR: Best Value Games of 2026", article=["C25: 'Best value games of 2026: cost per hour' (EIC; only if the time-to-beat source's terms allow)"],
  pr=["C25: pitch to deals desks for Black Friday week"], extra_h=5)
d("2026-11-26", theme="US Thanksgiving; Release Radar December",
  youtube=["C50 Release Radar: December 2026 (8–10 min)"], extra_h=5)
d("2026-11-27", theme="Black Friday",
  article=["C31: 'Black Friday 2026: the games on your wishlist that are actually cheaper' (ED, 08:30 CET, updated 3× through the day)"],
  newsletter=["Price-drop email to members whose wishlisted game dropped (D-027)"], priority="P0", extra_h=5)
d("2026-11-30", theme="Cyber Monday", article=["C32: Cyber Monday Deal Radar (ED)"], priority="P0", extra_h=3)
d("2026-12-01", theme="Community Awards open; gift guide; Game Club vote",
  article=["C30: /awards/2026 Community Awards nominations open (SC)", "C33: 'Gift guide from real wishlists' (ED)"],
  discord=["C38: Game Club December vote (3 options, native poll)"],
  priority="P0", extra_h=5)
d("2026-12-03", theme="Dawn of War IV and three more launches", article=["Release-day roundup (ED)"], community=["C38 Game Club: GTA VI discussion night 20:00 CET"])
d("2026-12-04", theme="Monster Hunter Wilds on Switch 2", article=["News: MH Wilds Switch 2 is out (ED)"])
d("2026-12-05", theme="GTA VI trailer 1 is three years old")
d("2026-12-08", theme="C26 moved to 2027-W09 (DEV capacity); State of the Catalogue drafting",
  ops=["EIC: C27 State of the Catalogue data pull and outline (publish 12 Jan 2027, needs the IGDB licence answer by 18 Dec)"], extra_h=3)
d("2026-12-10", theme="The Game Awards",
  article=["F20 live blog: every reveal with a link to its /games page (starts 01:30 CET 11 Dec; ED + EIC on shift)"],
  ops=["C29 prediction league locks at showtime", "C28 Year in Review build must be done today (DEV D-025)"],
  x=["F20 live thread: one post per reveal, platform + date + link"], discord=["F20 watch party in stage channel"], priority="P0", extra_h=10)
d("2026-12-11", theme="TGA recap; Path of Exile 2 1.0",
  article=["'Every TGA 2026 announcement in one table' (ED, 09:00 CET)", "News: Path of Exile 2 1.0 (ED)", "C29 league results"],
  newsletter=["Save File #11 is the TGA edition"], priority="P0", extra_h=5)
d("2026-12-14", theme="Your 2026 in Games; OpenCritic application",
  article=["C28: /year-in-review live for members (share card per member)"],
  ops=["C53: EIC submits TechPlay to OpenCritic with the ≥8 Verdicts published since 6 Oct"], priority="P0", extra_h=4)
d("2026-12-15", theme="State of the Catalogue drafting", ops=["C27: EIC drafts State of the Catalogue 2026 (publish 12 Jan 2027)"])
d("2026-12-17", theme="Steam Winter Sale opens",
  article=["C34: 'Steam Winter Sale 2026: picks from your wishlists' (ED, 19:15 CET)"], newsletter=["Price-drop emails to wishlist followers (D-027)"], priority="P0", extra_h=4)
d("2026-12-20", theme="Community Awards results", article=["C30 results article (SC)"], extra_h=2)
d("2026-12-21", theme="2027 Most Anticipated", article=["C70: '2027's most anticipated games, by TechPlay member follows' (ED)"], extra_h=3)
d("2026-12-23", theme="Holiday Save File (moved from Fri 25 Dec)",
  newsletter=["The Save File holiday edition, 15:00 CET"], article=["Fix It Friday moved: new console first-hour settings (ED)"])
d("2026-12-24", theme="Christmas Eve: scheduled posts only")
d("2026-12-25", theme="Christmas: scheduled posts only", article=["Pinned: 'Just got a PS5, Xbox or Switch 2? Start here' (scheduled)"])
d("2026-12-31", theme="Year-end", article=["'2026 on TechPlay: what we got right, what we got wrong' (EIC)"],
  ops=["EIC: keep/kill review of experimental channels against 31-EXPERIMENTS thresholds; Q1 plan in 34-2027-BRIDGE"], extra_h=3)

# ---- CTA / landing / KPI / extra overrides for key days ----
K = {
"2026-10-01": ("Follow the games you want; we'll tell you when they drop in price", "/calendar and the C05 article", "C05 article sessions; game_followed from the article (cta_id=c05-follow)"),
"2026-10-02": ("Get The Save File every Friday", "/newsletter (new)", "Save File #1 open rate and click rate; newsletter_signup → newsletter_verified in 48 h"),
"2026-10-07": ("Download the data (CSV) / cite it", "/data/release-congestion-2026", "Referring domains to the page in 30 days (Search Console links + manual log); pitch replies ÷ pitches sent"),
"2026-10-09": ("Read who owns TechPlay and how we work", "/about/ownership", "Page live with no placeholder numbers; /press linked from footer"),
"2026-10-12": ("Find the fix for your problem", "C60 PC fixes pillar guide (hub in Jan 2027)", "PC fixes guide sessions (organic, 28-day); Discord onboarding completion rate (Server Insights once available)"),
"2026-10-14": ("Set your GTA VI reminder", "/gta6/release-time", "reminder_set (tool=release-time) per day; tool_run tool=release-time"),
"2026-10-19": ("Wishlist the demos worth your time", "C18 Next Fest article", "Next Fest article sessions; outbound Steam clicks (cta_id=c18-wishlist); alert opt-ins (C43)"),
"2026-10-21": ("See every GTA VI vehicle and where it comes from", "/gta6/vehicles", "C12 page organic clicks (28-day); share of vehicles with a cited real-world source"),
"2026-10-23": ("Check unlock time and file size before you start", "MW4 hub", "MW4 hub sessions on launch day; Discover clicks for MW4 pieces"),
"2026-10-26": ("See every Switch 2 Edition and upgrade path", "C61 Switch 2 pillar article", "Register page completion rate after D-014 (registration_complete ÷ registration_start); C61 article sessions"),
"2026-10-28": ("Find the studios in your country", "/data/studio-atlas", "Referring domains (30 days); regional pitch replies; census page sessions"),
"2026-11-02": ("Everything Steam, in one place", "C62 Steam pillar article", "C62 article sessions; C56 cost per click and registrations (if running)"),
"2026-11-04": ("See how long every sequel took", "C23 data page", "Referring domains (30 days); r/dataisbeautiful post not removed; sessions from pitches"),
"2026-11-11": ("See which games cost $80 or more", "/data/80-dollar-tracker", "Referring domains (30 days); sessions from deals desks"),
"2026-11-12": ("Watch: every GTA game in order", "YouTube video + /gta6", "YouTube views at 7 days; average view duration; clicks to /gta6 from the description (utm_source=youtube)"),
"2026-11-16": ("Set your reminder for your time zone", "/gta6/release-time", "reminder_set per day during launch week; Discord event RSVPs"),
"2026-11-17": ("Check your storage before the pre-load", "Fix It Friday storage guide + pre-load news", "Pre-load article sessions; reminder_set"),
"2026-11-18": ("Make your picks for The Game Awards", "/awards/2026", "Prediction league entries (tool_run tool=calc / list_created); reminder_set"),
"2026-11-19": ("Track your map progress", "/gta6/map", "Map tracker users (members with ≥1 location ticked); registrations with from=gta6-map; launch-day sessions to /gta6/*"),
"2026-11-20": ("Track your map progress / get price alerts", "/gta6/map; /calendar", "Tracker returning members (D1); C31 alert opt-ins"),
"2026-11-23": ("See which games give you the most hours per dollar", "C25 data page", "Referring domains; deals-desk pitch replies"),
"2026-11-27": ("See what dropped on your wishlist", "C31 Black Friday article", "alert_clicked from price-drop emails/push; shelf_add; affiliate clicks disclosed (if any)"),
"2026-11-30": ("See today's real deals", "C32 Deal Radar", "Deal Radar sessions; alert_clicked"),
"2026-12-01": ("Nominate your Game of the Year", "/awards/2026", "Nominations per day; registrations with from=awards"),
"2026-12-08": ("See which genres have the hardest achievements", "C26 data page", "Referring domains (30 days); r/dataisbeautiful post not removed"),
"2026-12-10": ("Follow the live blog; add what's announced to your list", "TGA live blog", "Live blog sessions; game_followed from the live blog; league scores viewed"),
"2026-12-11": ("Add every TGA announcement to your list", "TGA recap article", "game_followed from the recap; Discover clicks"),
"2026-12-14": ("Get your 2026 in Games", "/year-in-review", "share_card_generated (type=year-in-review); registrations with from=year-in-review"),
"2026-12-17": ("See your wishlist games on sale", "C34 Winter Sale article", "alert_clicked; shelf_add; Winter Sale article sessions"),
"2026-12-20": ("See who won", "/awards/2026", "Results page sessions; share_card_generated"),
"2026-12-21": ("Follow the 2027 games you want", "C70 article", "game_followed from C70"),
}
for k,(c,l,m) in K.items():
    DAY.setdefault(k, {}); DAY[k]['cta']=c; DAY[k]['lp']=l; DAY[k]['kpi']=m

LAUNCH_VIDEO = {
"2026-11-16": "C10 vertical: «GTA VI launch week: the 4 dates that matter this week» (release, album, reminder tool, Discord event)",
"2026-11-17": "C10 vertical: «Free up space before GTA VI: PS5 and Xbox in 40 seconds» (screen capture)",
"2026-11-18": "C10 vertical: «Tomorrow. What's confirmed, what isn't» (ledger in 30 seconds)",
"2026-11-19": "C10 vertical at unlock: «GTA VI is out. Track the map with us» (tracker screen capture)",
"2026-11-20": "C10 vertical: «First 12 hours: 3 things we'd tell a friend» (EIC voice-over, own gameplay capture only if Rockstar's policy allows; otherwise text on official screenshots)",
"2026-11-21": "C10 vertical: «Map tracker: the locations members found first» (tracker data)",
"2026-11-22": "C10 vertical: «GTA VI week one, in numbers from the tracker»",
}
for k,v in LAUNCH_VIDEO.items():
    DAY.setdefault(k, {}); DAY[k].setdefault('reels', []).append(v)
for k in ["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22"]:
    DAY[k].setdefault('reddit', []).append("r/GTA6: answer launch questions (unlock time, pre-load, storage) with sourced replies; link the release-time tool only when asked")

d("2026-11-06", theme="PS Plus renewal price change (verify first); welcome and reminder mail go live",
  article=["Only if Sony confirms: 'PS Plus renewals: what you pay from today, by region' (ED)"],
  ops=["C42 welcome sequence and C43 release-day email alerts live after EIC's deliverability sign-off (D-013)"], extra_h=2)
d("2026-11-23", theme="PR: Best Value Games of 2026; first personalised releases email",
  article=["C25: 'Best value games of 2026: cost per hour' (EIC; only if the IGDB licence and time-to-beat terms allow)"],
  newsletter=["C41 first 'Your releases this week', 08:00 CET, to members with at least one followed or wishlisted game (D-028)"],
  pr=["C25: pitch to deals desks for Black Friday week"], extra_h=5)
DAY["2026-11-23"].update(cta=K["2026-11-23"][0], lp=K["2026-11-23"][1], kpi=K["2026-11-23"][2])
d("2026-11-25", theme="Wishlist price alerts live", ops=["C31: D-027 price-drop emails switched on"], priority="P0", extra_h=1)
d("2026-12-18", theme="Ownership and press pages; guest Remind me (lite)",
  ops=["C54: /about/ownership and /press live (D-038)", "C45: guest 'Remind me' modal (lite) live (D-016)"], extra_h=2)
