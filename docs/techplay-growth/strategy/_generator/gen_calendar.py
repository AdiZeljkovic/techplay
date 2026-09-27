import datetime as dt, csv, json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from cal_data import GTA, GTA_FACTS, OTD, OTD_RULE, W
from cal_days import DAY
import re
def _load_countdown():
    out={}
    for line in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "19-GTA6.md")):
        if not re.match(r"^\| \d+ \| \w{3} \d+ \w{3} \| \d+ \|", line): continue
        cells=[c.strip() for c in re.split(r"(?<!\\)\|", line.strip())[1:-1]]
        n,date,days,typ,post,src,link,gate,fb=cells[:9]
        post=post.replace("\\|","|"); fb=fb.replace("\\|","|")
        out[int(days)]=dict(post=post,src=src,link=link,gate=gate,fb=fb,type=typ)
    return out
CD=_load_countdown()
assert len(CD)==53, len(CD)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FIELDS = ["Date","Day","Week","Theme","Primary objective","Primary audience","Article / editorial","SEO","Google News","Google Discover angle",
 "Facebook","Facebook Groups","Instagram","Stories","Reels","TikTok","YouTube","YouTube Shorts","X","Threads","Bluesky","Reddit","Discord",
 "Newsletter","Push","Community","PR","Creator activity","Partnership activity","Paid campaign","Retargeting","Operations / product",
 "CTA","Landing page","Creative","Owner","Estimated effort (h)","Priority","KPI","Tracking","Status"]

def monday(x): return x - dt.timedelta(days=x.weekday())
def inwin(x, a, b): return dt.date.fromisoformat(a) <= x <= dt.date.fromisoformat(b)
def utm(src, med, camp, content): return f"?utm_source={src}&utm_medium={med}&utm_campaign={camp}&utm_content={content}"
def L(path, src, camp, content, med="organic-social"):
    p, _, frag = path.partition("#")
    return "https://techplay.gg" + p + utm(src, med, camp, content) + (("#" + frag) if frag else "")
# Public copy is wrapped in «…» so tools (Growth OS) can copy exactly the text that gets posted.

VIDEO_START = dt.date(2026,10,5)
REDDIT_SUBS = {0:"r/patientgamers, r/gaming (discussion answers)",1:"r/wow, r/pcgaming",2:"r/GTA6 (answers only; no self-posts)",
 3:"r/Steam, r/pcmasterrace",4:"r/buildapc, r/pcgaming (fix questions)",5:"r/NintendoSwitch2, r/PS5, r/XboxSeriesX",6:"r/truegaming (read, comment only if useful)"}

def build(x):
    wk = W[monday(x).isoformat()]; wd = x.weekday(); dname = x.strftime("%A")
    days = (GTA - x).days
    iso = x.isoformat(); o = DAY.get(iso, {})
    R = {k: [] for k in FIELDS}
    tag = f"2026w{wk['n']}"
    aud = []
    # ---------- GTA countdown (daily to launch) ----------
    if 0 <= days <= 52:
        c = CD[days]; gate = "" if c["gate"] in ("—","") else f" [gate: {c['gate']}; fallback: {c['fb']}]"
        R["Stories"].append(f"F02 IG + FB Story 12:00 CET, 1080x1920: day number large + first sentence; link sticker {c['link']}{gate}: «{c['post']}»")
        _l = c['link'] if c['link'].startswith('/') else '/gta6'
        _path, _, _frag = _l.partition('#')
        _url = "https://techplay.gg" + _path + utm('x','organic-social','c06-gta6-countdown',f'f02-day{days}-post') + (('#' + _frag) if _frag else '')
        R["X"].append(f"F02 09:00 CET ({c['type']}){gate}: «{c['post']} {_url}»")
        R["Threads"].append(f"F02 09:00 CET: «{c['post']} {L(_l,'threads','c06-gta6-countdown',f'f02-day{days}-post')}»")
        R["Discord"].append(f"F02 #gta6 09:05, Buffy embed, footer 'Source: {c['src']}': «{c['post']}»")
        aud.append("S4")
    # ---------- On This Day ----------
    otd = OTD.get(x.strftime("%m-%d"), "")
    R["Discord"].append(f"F06 On This Day 09:00 #general: «On this day: {otd}»" if otd else f"F06 On This Day 09:00 #general: {OTD_RULE}")
    if otd: R["Threads"].append(f"F06 On This Day: «{otd} Did you play it at launch?»")
    # ---------- Weekday franchises ----------
    ed=[]; seo=[]; gn=[]; disc=""; fb=[]; fbg=[]; ig=[]; reels=[]; yt=[]; ys=[]; xx=[]; th=[]; bs=[]; rd=[]; dc=[]; nl=[]; push=[]; com=[]
    cta=""; lp=""; crea=[]; own=set(); eff=0.0; pri="P1"; kpi=""; trk=[]
    if wd == 0:  # Monday
        ed.append(f"F01 Out This Week ({tag}), publish 08:30 CET: {wk['otw']}. Every title links its /games page with 'Remind me'")
        if wk.get('verdict') and wk['verdict'][0]=="mon": ed.append(f"F24 {wk['verdict'][1]} (EIC)")
        ed.append("F11 forum thread 'What are you playing?'")
        seo.append("/calendar: confirm this week's dates and platforms; fix any release_precision='day' mismatches found while writing F01")
        gn.append("F01 Out This Week")
        disc = f"'Out this week: {wk['otw'].split(',')[0].split('(')[0].strip()} and the rest, with what each costs'"
        fb.append(f"F01 link post 1200x630: «Out this week: {wk['otw']}. Which one are you getting? {L('/calendar','facebook','c04-out-this-week','f01-link-'+tag)}»")
        ig.append(f"F01 carousel 1080x1350 (cover 'Out this week' / one slide per game: art, date, platforms, price / last slide 'Set reminders: link in bio'), caption: «Out this week: {wk['otw']}. Dates, platforms and prices on the slides. Set a reminder for any of them: link in bio.»")
        xx.append(f"F01 thread 10:00 CET, first post (then one post per release with its /games link): «Out this week: {wk['otw']}. Dates, platforms and prices, with a reminder for each: {L('/calendar','x','c04-out-this-week','f01-thread-'+tag)}»")
        th.append(f"F11: «{wk['wayp']}»"); bs.append(f"F01 link post: «Out this week: {wk['otw']}. {L('/calendar','bluesky','c04-out-this-week','f01-post-'+tag)}»")
        dc.append(f"F11 thread in #general: «{wk['wayp']}»"); dc.append(f"F01 embed in #releases: «Out this week: {wk['otw']}. Reminders: {L('/calendar','discord','c04-out-this-week','f01-embed-'+tag,'community')}»")
        com.append("F11 What Are You Playing? (C37)")
        if x >= VIDEO_START:
            reels.append(f"F01 vertical 30–40s, one card per game, script: «Hook: These games are out this week, and one is worth clearing a weekend for. Cards: {wk['otw']}. CTA: Reminders for all of them at techplay.gg/calendar.»")
        yt.append("Community tab poll with the week's top 4 titles as options: «Which one are you playing this week?»")
        cta="Remind me when it's out"; lp="/calendar"; crea.append("F01 carousel + 1200x630 + vertical (DS template T-F01)")
        own |= {"ED","SC","DS"}; eff += 9; kpi="Remind-me clicks from F01 ÷ F01 sessions (cta_click cta_id=f01-remind); F11 replies"
        trk.append("utm_campaign=c04-out-this-week; utm_content=f01-<asset>-"+tag)
        aud += ["S1","S2","S10"]
    elif wd == 1:  # Tuesday
        ed.append(f"F08 Where Can I Play It?: {wk['wcip_tue']} (ED)")
        ed.append(f"F13 {wk['movers']} (ED, short)")
        if wk.get('verdict') and wk['verdict'][0]=="tue": ed.append(f"F24 {wk['verdict'][1]} (EIC)")
        seo.append("F08 page: answer in the first 60 words; platform table; link to /games page and /calendar")
        disc = f"'{wk['wcip_tue']}'"
        fb.append(f"F04 The Number image 1080x1350: «{wk['num_tue']}»")
        fbg.append("Groups slot (SC, 30 min): answer 2–3 questions in platform-owner or PC groups per the 06-FACEBOOK ladder; link only when it is the answer")
        ig.append(f"F04 single 1080x1350: «{wk['num_tue']}»")
        xx.append(f"F04 The Number (source line in the image): «{wk['num_tue']}»"); xx.append(f"F15 Readiness Check 16:00 CET (US reset): «{wk['ready']} Check your character: {L('/wow-analyzer','x','c13-wow-readiness','f15-'+tag)}»")
        th.append(f"F04: «{wk['num_tue']}»"); bs.append(f"F04: «{wk['num_tue']}»")
        dc.append(f"F15 #wow: «{wk['ready']} {L('/wow-analyzer','discord','c13-wow-readiness','f15-'+tag,'community')}»"); dc.append("F13 Steam Movers post in #pc")
        cta="Check where you can play it"; lp="/games/<slug> (from F08)"; crea.append("F04 number card (T-F04)")
        own |= {"ED","SC","DS"}; eff += 7; kpi="F08 search clicks (Search Console, page-level, 28-day); Analyzer runs from Discord (tool_run tool=wow, utm_source=discord)"
        trk.append("utm_campaign=c65-franchises; utm_content=f04-"+tag+" / f15-"+tag)
        aud += ["S1","S3","S5"]
    elif wd == 2:  # Wednesday
        ed.append(f"F12 Poll of the Week: {wk['poll']}")
        if wk.get('wit'): ed.append(f"F10 Worth It in 2026?: {wk['wit']} (ED)")
        ed.append(f"F17 {wk['studio']}")
        gn.append("F17 Studio Watch (if news)")
        disc = f"'{wk['wit']}'" if wk.get('wit') else "'Poll result + the story behind it'"
        fb.append(f"F12 question post (reply to vote): «{wk['poll']} Reply with your pick.»")
        R["Stories"].append("F12 poll sticker (2 options) on IG + FB Stories; result frame Thu")
        ig.append("No feed post (poll lives in Stories)")
        seo.append("F10 page targets 'is <game> worth it 2026': verdict in the first paragraph, what changed since launch, price today")
        xx.append(f"F12 native poll: «{wk['poll']}»")
        th.append(f"F12 as an open question: «{wk['poll']}»")
        bs.append(f"F17: {wk['studio']} (industry audience)")
        dc.append(f"F12 native Discord poll (24 h): «{wk['poll']}»")
        if x >= VIDEO_START and days > 0:
            reels.append(f"F02 GTA countdown vertical 20–25s (gate as in 19-GTA6 §6.2), script: «Hook: {days} day{'s' if days!=1 else ''} to GTA VI. Fact: {CD[days]['post']} CTA: Every confirmed fact at techplay.gg/gta6.»")
        elif x >= VIDEO_START and wk.get('wit'):
            reels.append(f"F10 Worth It short 30s, hook: «{wk['wit'].split('?')[0]}? Our answer in 30 seconds.»")
        com.append("F12 Poll (C39)")
        cta="Vote, then see what everyone else picked"; lp="/forum (poll thread)"; crea.append("F12 poll card (T-F12)")
        own |= {"ED","SC","DS"}; eff += 7; kpi="Poll votes across Discord + X + Stories (sum, week over week); F10 page sessions"
        trk.append("utm_campaign=c39-poll-of-the-week; utm_content=f12-"+tag)
        aud += ["S10","S8","S1"]
    elif wd == 3:  # Thursday
        if wk.get('verdict') and wk['verdict'][0]=="thu": ed.append(f"F24 {wk['verdict'][1]} (EIC)")
        if wk.get('hg'): ed.append(f"F05 Hidden Gem Thursday: {wk['hg']} (ED; editor pick, the /games/hidden-gems rail is not good enough to use unedited)")
        if wk.get('ledger') and days >= 0: ed.append(f"F03 Confirmed or Rumour?: {wk['ledger']}")
        elif wk.get('ledger'): ed.append(f"F03 ledger: {wk['ledger']}")
        seo.append("F05: add the game's /games page to the Hidden Gems list page; F03: update 'Last updated' on /gta6/everything-we-know")
        gn.append("F03 ledger update (news-eligible only when there is new information)")
        disc = f"'Hidden gem: {wk['hg'].split('(')[0].strip()}'" if wk.get('hg') else ""
        if wk.get('hg'): fb.append(f"F05 image post: «Hidden gem of the week: {wk['hg']}. Played it?»")
        fbg.append("Groups slot (SC, 30 min): value-first participation per 06-FACEBOOK; no links in the first 30 days")
        ig.append("Carousel 1080x1350: " + ("F03 'Confirmed or Rumour?' (odd weeks)" if wk['n']%2 else f"F05 Hidden Gem: {wk['hg'].split('(')[0].strip() if wk.get('hg') else ''} (even weeks)"))
        if wk.get('num_thu'): xx.append(f"F04 The Number: «{wk['num_thu']}»"); th.append(f"F04: «{wk['num_thu']}»"); bs.append(f"F04: «{wk['num_thu']}»")
        if wk.get('ledger') and days > 0: xx.append("F03 thread: this week's ledger changes, each with its source link")
        if wk.get('num_thu'): R["Community"].append(f"LinkedIn (EIC, Thu only): F04 «{wk['num_thu']}»")
        if wk.get('hg'): dc.append(f"F05 #recommendations: «Hidden gem of the week: {wk['hg']}. Played it? Tell us below.»")
        cta="Add it to your library"; lp="/games/<hidden-gem slug>"; crea.append("F05 or F03 carousel (T-F05 / T-F03)")
        own |= {"ED","SC","DS"}; eff += 7; kpi="shelf_add from F05 pages; F03 ledger sessions from X/Reddit referrals"
        trk.append("utm_campaign=c64-hidden-gem / c07-gta6-ledger; utm_content=f05-"+tag+" / f03-"+tag)
        aud += ["S1","S2","S4"]
    elif wd == 4:  # Friday
        if wk.get('fif'): ed.append(f"F07 Fix It Friday: {wk['fif']} (ED; test every step on real hardware or cite the vendor doc)")
        seo.append("F07 guide goes into /guides/pc-fixes (after 12 Oct) with HowTo-style steps; link from related /games pages")
        disc = f"'{wk['fif']}'" if wk.get('fif') else ""
        if wk.get('sf_subj'): nl.append(f"F21 The Save File, 15:00 CET, subject: «{wk['sf_subj']}»")
        fb.append(f"F07 link post: «{wk['fif']}. Full steps: {L('/guides','facebook','c60-pc-fixes','f07-'+tag)}»" if wk.get('fif') else "F07 link post: the fix in one sentence, 'full steps' link")
        ig.append("Stories: 'This week on TechPlay' 3 frames (top story, fix, newsletter sign-up link sticker)")
        if x >= VIDEO_START and wk.get('fif'): reels.append(f"F07 vertical 45–60s screen capture, steps on screen, script: «Hook: If your game does this, try these three things. Topic: {wk['fif']}. CTA: Full steps at techplay.gg/guides.»")
        xx.append(f"F07: «{wk['fif']}. Full steps: {L('/guides','x','c60-pc-fixes','f07-'+tag)}»" if wk.get('fif') else "F07: problem in one line + fix link"); th.append("F07: «What's the one PC fix you wish you'd known sooner?»")
        dc.append(f"F07 #pc-help pin: «{wk['fif']}. {L('/guides','discord','c60-pc-fixes','f07-'+tag,'community')}»" if wk.get('fif') else "F07 #pc-help pin"); dc.append(f"#announcements: «The Save File is out. Get it every Friday: {L('/newsletter','discord','c40-save-file-'+tag,'f21-announce','community')}»")
        if x >= dt.date(2026,11,6): com.append("F19 Library Card: one member's Gamer DNA card (opt-in only)")
        cta="Get The Save File every Friday"; lp="/newsletter (new)"; crea.append("F07 cover 1200x630 + vertical (T-F07); newsletter header")
        own |= {"ED","SC","DS"}; eff += 8; kpi="newsletter_verified per week; open→click rate of The Save File; F07 search clicks"
        trk.append("utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-"+tag)
        aud += ["S3","S1","S10"]
    elif wd == 5:  # Saturday
        if wk.get('io'): ed.append(f"F09 In Order: {wk['io']} (ED; C63)")
        if wk.get('wcip_sat'): ed.append(f"F08 Where Can I Play It?: {wk['wcip_sat']} (ED)")
        seo.append("F09 series page: ordered list with year and platform, 'where to start' answer first; link every entry to /games")
        disc = f"'{wk['io']}'" if wk.get('io') else ""
        if wk.get('io'): ig.append(f"F09 carousel 1080x1350, caption: «{wk['io']}. Save this for later.»"); fb.append(f"F09 link post: «{wk['io']}. {L('/games','facebook','c63-in-order','f09-'+tag)}»")
        fbg.append("Groups slot (SC, 20 min)")
        if wk.get('num_sat'): xx.append(f"F04 The Number: «{wk['num_sat']}»"); th.append(f"F04: «{wk['num_sat']}»")
        if x >= dt.date(2026,11,7) and wk.get('io'): reels.append(f"F09 vertical 45s, hook: «{wk['io'].split(':')[0]}, in 45 seconds.»")
        dc.append("Weekend: #gaming-night thread (SC schedules Fri)")
        cta="Start with the right one"; lp="/games/series/<slug> or the F09 article"; crea.append("F09 carousel (T-F09)")
        own |= {"ED","SC"}; eff += 4; pri = "P2"; kpi="F09/F08 search clicks (28-day); shelf_add from series pages"
        trk.append("utm_campaign=c63-in-order; utm_content=f09-"+tag)
        aud += ["S1","S2"]
    else:  # Sunday
        if wk.get('gl'): ed.append(f"F18 Games Like…: {wk['gl']} (ED, written Fri, scheduled)")
        seo.append("F18 page targets 'games like <title>' with list items linked to /games pages")
        disc = f"'{wk['gl']}'" if wk.get('gl') else ""
        dc.append("F14 Buffy's Weekly Wrap 20:00 CET: member of the week, top 3 stories, next week's releases")
        if wk.get('gl'): fb.append(f"F18 link post: «{wk['gl']}. {L('/games','facebook','c65-franchises','f18-'+tag)}»")
        xx.append(f"F14 thread, first post (then 3 links, one per top story): «This week on TechPlay: the three stories worth your time, and what's out next week. {L('/calendar','x','c65-franchises','f14-'+tag)}»")
        cta="See next week's releases"; lp="/calendar"; crea.append("F18 cover 1200x630")
        own |= {"ED","SC"}; eff += 1.5; pri = "P2"; kpi="F14 recap clicks in Discord; F18 search clicks (28-day)"
        trk.append("utm_source=discord&utm_medium=community&utm_campaign=c36-road-to-500&utm_content=f14-"+tag)
        aud += ["S10","S1"]
    # Reddit baseline
    rd.append(f"C47 helpful answers (SC 30 min, EIC/ED 15 min): {REDDIT_SUBS[wd]}. Link TechPlay only when it is the best answer; log every comment in the Reddit sheet")
    # YouTube Shorts mirrors vertical video
    if reels:
        ys = [r + " (same edit, Shorts title ≤60 chars, no link in title)" for r in reels]
        tik = [r + " (same edit, native captions, 3 hashtags max)" for r in reels]
    else: tik = []
    # Campaign windows
    if inwin(x,"2026-10-01","2026-10-08"): ed.append("C05 Autumn Sale picks updated daily 19:15 CET") if wd not in (5,6) else None
    if inwin(x,"2026-10-19","2026-10-26") and wd in (1,2,3,5): ed.append("F23 Next Fest Diary: three demos, each with a verdict line and a wishlist link") if not any("F23" in e for e in ed+o.get('article',[])) else None
    if inwin(x,"2026-10-22","2026-11-02") and wd == 5: xx.append("C19: horror pick of the day from the Scream Fest list")
    if inwin(x,"2026-11-25","2026-12-01") and wd in (0,2,4): nl.append("C31 price-drop emails to members whose wishlisted game dropped (D-027, live 25 Nov)")
    if inwin(x,"2026-12-17","2027-01-04") and wd in (0,3): ed.append("C34 Winter Sale picks refreshed")
    if inwin(x,"2026-12-14","2026-12-31") and wd in (1,4): com.append("C28: share your Year in Review card (#year-in-review channel)")
    push = ["Not live in 2026: C59 web push goes to the 1 Jan 2027 decision (32-DEVELOPMENT-BACKLOG); reminders go by email and the bell"]
    # Paid
    paid = []
    if x < dt.date(2026,11,2): paid.append("None: paid waits for D-007 and D-008 (measurement); C56 earliest 2 Nov")
    else:
        paid.append("C56 Google Search, branded + tool terms only, no GTA game-name terms (from 2 Nov if D-007/D-008 are live; EIC checks search terms Mondays)")
        if inwin(x,"2026-11-09","2026-11-25"): paid.append("C58 Reddit ads test (WoW Analyzer; GTA 6 hub only if D-020 cleared)")
        if inwin(x,"2026-11-02","2026-12-14"): paid.append("C57 Meta: not in 2026 by default (D-031 Option A; EIC decides 5 Oct)")
    # Retargeting
    ret = []
    if x < dt.date(2026,11,6): ret.append("Owned only: Friday manual welcome campaign to the week's verified subscribers; Discord pins; Save File")
    else: ret.append("Owned: welcome and reminder mail (C42/C43 email, live ~6 Nov) to A1-not-A2 members; no paid retargeting in 2026 unless EIC picks D-031 Option B on 5 Oct (27-RETARGETING)")
    if inwin(x,"2026-11-16","2026-11-30"): ret.append("GTA briefing subscribers → map tracker message by email and Discord")
    # Merge overrides
    def add(field, vals): R[field].extend(vals if isinstance(vals, list) else [vals])
    ed = o.get('article', []) + ed
    seo += o.get('seo', []); gn = o.get('gnews', []) + gn
    fb = o.get('fb', []) + fb; xx = o.get('x', []) + xx; rd = o.get('reddit', []) + rd; dc = o.get('discord', []) + dc
    nl = o.get('newsletter', []) + nl; push = o.get('push', []) + push; com = o.get('community', []) + com
    reels = o.get('reels', []) + reels; yt = o.get('youtube', []) + yt; bs = o.get('bluesky', []) + bs
    if o.get('linkedin'): com = [f"LinkedIn (EIC): {v}" for v in o['linkedin']] + com
    if o.get('paid'): paid = o['paid'] + [p for p in paid if not p.startswith("None")]
    ops = o.get('ops', [])
    if o.get('reels'): tik = o['reels'] + tik; ys = o['reels'] + ys
    theme = f"{wk['theme']}" + (f" / {o['theme']}" if o.get('theme') else "")
    obj_default = {0:"Turn release interest into reminders and follows",1:"Answer platform and access questions that people search",2:"Get members talking and voting",3:"Discovery: one game worth adding, plus the GTA 6 ledger",4:"Grow verified newsletter subscribers; publish one real PC fix",5:"Evergreen search pages",6:"Keep Discord alive with the weekly wrap"}[wd]
    R["Date"]=[iso]; R["Day"]=[dname]; R["Week"]=[tag]; R["Theme"]=[theme]
    R["Primary objective"]=[o.get('objective', obj_default)]
    R["Primary audience"]=[", ".join(dict.fromkeys(aud))]
    R["Article / editorial"] = ed + ["Reactive news slot: up to 3 pillar-filtered stories (P1–P5), slots 08:30, 14:30 and 19:00 CET per 13-SEO-CONTENT; no general tech or phones"]
    R["SEO"]=seo; R["Google News"]=gn; R["Google Discover angle"]=[f"Headline for Discover: {disc}; 1200px+ 16:9 image, no text on image" if disc else "No Discover-led piece today"]
    R["Facebook"]=fb or ["No post"]; R["Facebook Groups"]=fbg or ["No slot today"]; R["Instagram"]=ig or ["No feed post"]
    if days < 0 or not R["Stories"]: R["Stories"]=["Story: today's top story, link sticker with UTM"] + R["Stories"]
    R["Reels"]=reels or ["No vertical today"]; R["TikTok"]=tik or ["No post"]; R["YouTube"]=yt or ["No long-form"]; R["YouTube Shorts"]=ys or ["No Short"]
    R["X"] = R["X"] + xx; R["Threads"] = R["Threads"] + th or ["No post"]; R["Bluesky"]=bs or ["No post"]
    R["Reddit"]=rd; R["Discord"] = R["Discord"] + dc
    R["Newsletter"]=nl or ["No send"]; R["Push"]=push; R["Community"]=R["Community"] + com or ["Moderation queue under 24 h"]
    R["PR"]=o.get('pr', ["No pitch today"]); R["Creator activity"]=o.get('creator', ["None"]); R["Partnership activity"]=o.get('partner', ["None"])
    if inwin(x,"2026-10-05","2026-10-20") and not o.get('partner') and wd in (1,3): R["Partnership activity"]=["C71: follow up with Next Fest developers contacted 5 Oct (one follow-up only)"]
    if inwin(x,"2026-11-02","2026-11-27") and wd == 2 and not o.get('partner'): R["Partnership activity"]=["C55: Balkan partnerships: one outreach or follow-up (studio, A1 Adria League, regional outlet)"]
    if inwin(x,"2026-10-20","2026-12-10") and wd == 3 and not o.get('creator'): R["Creator activity"]=["C51: send one data point to a creator in the pipeline; log reply in the creator sheet"]
    R["Paid campaign"]=paid; R["Retargeting"]=ret; R["Operations / product"]=ops or ["None beyond the dev sprint (32-DEVELOPMENT-BACKLOG)"]
    R["CTA"]=[o.get('cta', cta)]; R["Landing page"]=[o.get('lp', lp)]; R["Creative"]=crea
    if o.get('kpi'): kpi = o['kpi'] + " | also: " + kpi
    for opx in ops + ed + R["PR"] + R["Partnership activity"]:
        for code in ("DEV","EIC","SC","ED","DS"):
            if code in opx: own.add(code)
    R["Owner"]=[", ".join(sorted(own))]
    R["Estimated effort (h)"]=[str(round(eff + o.get('extra_h',0),1))]
    R["Priority"]=[o.get('priority', pri)]
    R["KPI"]=[kpi]; R["Tracking"]=trk
    if o.get('cta'): R["Creative"] = [f"Campaign creative per 29-CREATIVE-BRIEFS for the day's campaign"] + R["Creative"]
    R["Status"]=["planned" + ("; verify before publishing (depends on unannounced info)" if any(w in " ".join(ed+ops) for w in ["If ","if ","Only if","verify","(if"]) else "")]
    out = {k: " | ".join(v for v in R[k] if v) for k in FIELDS}
    if not out["Google News"]: out["Google News"] = "No planned news piece; reactive news only (in the news sitemap)"
    if not out["X"]: out["X"] = "No planned post; reactive news links only"
    if not out["SEO"]: out["SEO"] = "No planned SEO task"
    return out

rows=[]; x=dt.date(2026,9,28)
while x <= dt.date(2026,12,31):
    rows.append(build(x)); x += dt.timedelta(days=1)
by_month={}
for r in rows: by_month.setdefault(r["Date"][:7], []).append(r)
for m, rs in by_month.items():
    with open(f"{OUT}/calendar-{m}.csv","w",newline="") as f:
        w=csv.DictWriter(f, fieldnames=FIELDS); w.writeheader(); w.writerows(rs)
json.dump({"generated":"2026-09-27","start":"2026-09-28","end":"2026-12-31","fields":FIELDS,"days":rows}, open(f"{OUT}/calendar.json","w"), ensure_ascii=False, indent=1)
print(len(rows), {m:len(v) for m,v in by_month.items()})
