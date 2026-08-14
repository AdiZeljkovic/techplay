/**
 * What the site actually does on a phone.
 *
 * The mobile rebuild is judged by numbers, not by how the screenshots feel, so
 * this is the metre. It renders each page under real device emulation — 390px
 * CSS width, 2× pixels, touch, an iPhone Safari UA — because Chrome without
 * all four lays the page out as a narrow desktop and every measurement it
 * gives back is a lie. The first run of this audit was done with a plain
 * headless window and reported a page that was simply cropped.
 *
 * Usage:
 *   node scripts/mobile-audit.mjs                      # against production
 *   node scripts/mobile-audit.mjs http://localhost:3000
 *   node scripts/mobile-audit.mjs http://localhost:3000 --shots ./out
 *
 * Needs puppeteer-core and a Chrome on the machine; set CHROME_PATH if yours
 * is somewhere unusual. It is deliberately not a dependency of the app.
 */

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const BASE = process.argv[2]?.startsWith("http") ? process.argv[2].replace(/\/$/, "") : "https://techplay.gg";
const SHOT_DIR = process.argv.includes("--shots")
    ? process.argv[process.argv.indexOf("--shots") + 1]
    : null;

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const IPHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/** The pages the rebuild is measured on. */
const PAGES = [
    ["home", "/"],
    ["feed", "/latest"],
    ["news", "/news"],
    ["games", "/games"],
    ["forum", "/forum"],
    ["leaderboard", "/leaderboard"],
    ["calendar", "/calendar"],
];

/** Runs in the page. Everything it returns is measured, nothing is judged. */
function measure() {
    const VIEWPORT = 844;

    // Where the reader first meets something they came for.
    //
    // The first cut of this asked for `main p` among others and duly reported
    // the hero's own description as content — so compacting the hero appeared
    // to make the number worse. A card is the honest target: a link or article
    // tall enough to be one, carrying a picture or a headline of its own.
    let firstContentY = null;
    for (const el of document.querySelectorAll("main a, main article, main li")) {
        const r = el.getBoundingClientRect();
        if (r.height < 64 || r.width < 180) continue;
        // A card carries a picture, a heading, or a sentence of its own — a
        // nav row carries a word. Requiring a heading alone missed the forum
        // boards and the database shelves, which label themselves in spans.
        const words = (el.textContent || "").trim();
        if (!el.querySelector("img") && !el.querySelector("h2, h3, h4") && words.length < 24) continue;
        if (el.closest("header, nav")) continue;
        firstContentY = Math.round(r.top + window.scrollY);
        break;
    }
    // An article page has no cards; its content is the prose.
    if (firstContentY === null) {
        const p = document.querySelector(".prose p, article p");
        if (p) firstContentY = Math.round(p.getBoundingClientRect().top + window.scrollY);
    }

    // Apple asks for 44pt, Google for 48dp. Anything under is aimed at.
    const small = [];
    for (const el of document.querySelectorAll('a, button, [role="button"], input, select')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 44 || r.width < 44) {
            small.push({
                tag: el.tagName.toLowerCase(),
                w: Math.round(r.width),
                h: Math.round(r.height),
                txt: (el.textContent || "").trim().slice(0, 24),
            });
        }
    }

    // Only elements with their own text count — asking every node its font
    // size counts each paragraph once per ancestor.
    const tiny = {};
    for (const el of document.querySelectorAll("body *")) {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) tiny[fs] = (tiny[fs] || 0) + 1;
    }

    // Anything wider than the screen. The page itself rarely scrolls sideways
    // — a single child sticking out is what does the damage.
    const bleed = [];
    for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
            bleed.push({
                tag: el.tagName.toLowerCase(),
                cls: String(el.className || "").slice(0, 50),
                left: Math.round(r.left),
                right: Math.round(r.right),
            });
        }
    }

    const doc = document.documentElement;
    return {
        docH: doc.scrollHeight,
        screens: +(doc.scrollHeight / VIEWPORT).toFixed(1),
        scrollW: doc.scrollWidth,
        firstContentY,
        small: small.length,
        smallSample: small.slice(0, 3),
        tiny,
        tinyTotal: Object.values(tiny).reduce((a, b) => a + b, 0),
        bleed: bleed.length,
        bleedSample: bleed.slice(0, 3),
        hasTabBar: !!document.querySelector('nav[aria-label="Main"]'),
    };
}

const puppeteer = require("puppeteer-core");

if (SHOT_DIR) mkdirSync(SHOT_DIR, { recursive: true });

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--hide-scrollbars", "--disable-gpu"],
});

console.log(`\n  ${BASE}  ·  390×844 · 2× · touch\n`);
console.log("  page          height    screens  first content  small taps  <12px  bleed");
console.log("  " + "─".repeat(72));

let worstScreens = 0;
let totalSmall = 0;
let totalTiny = 0;

for (const [name, path] of PAGES) {
    const page = await browser.newPage();
    await page.setViewport(IPHONE);
    await page.setUserAgent(UA);
    // Consent up front, or every page is measured with a banner over it.
    await page.evaluateOnNewDocument(() => {
        try {
            localStorage.setItem("cookie_preferences", JSON.stringify({ necessary: true, analytics: true, marketing: true }));
        } catch { /* private mode; the banner shows and the numbers shift a little */ }
    });

    let m = null;
    try {
        await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
        await new Promise((r) => setTimeout(r, 2000));
        m = await page.evaluate(measure);
    } catch (e) {
        console.log(`  ${name.padEnd(13)} failed: ${String(e.message).slice(0, 50)}`);
        await page.close();
        continue;
    }

    console.log(
        `  ${name.padEnd(13)} ${String(m.docH + "px").padEnd(9)} ${String(m.screens).padEnd(8)} ` +
        `${String(m.firstContentY === null ? "—" : m.firstContentY + "px").padEnd(14)} ` +
        `${String(m.small).padEnd(11)} ${String(m.tinyTotal).padEnd(6)} ${m.bleed}`
    );
    if (m.bleed) for (const b of m.bleedSample) console.log(`      bleeds: ${b.tag}.${b.cls} [${b.left}..${b.right}]`);
    if (m.small) for (const s of m.smallSample) console.log(`      small:  ${s.tag} ${s.w}×${s.h} "${s.txt}"`);
    if (!m.hasTabBar) console.log("      no tab bar on this page");

    worstScreens = Math.max(worstScreens, m.screens);
    totalSmall += m.small;
    totalTiny += m.tinyTotal;

    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/${name}.png` });
    await page.close();
}

console.log("  " + "─".repeat(72));
console.log(`  tallest page ${worstScreens} screens · ${totalSmall} small targets · ${totalTiny} tiny type\n`);

await browser.close();
