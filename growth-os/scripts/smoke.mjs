#!/usr/bin/env node
// End-to-end smoke test in a real browser (Playwright + Chromium).
// Start the app first, pointing state at a throwaway file:
//   GROWTH_OS_STATE_FILE=/tmp/gos-smoke.json npm start
// then: npm run e2e   (BASE_URL defaults to http://127.0.0.1:3100)
import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const exe = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const results = [];
const ok = (name, cond, detail = "") => { results.push({ name, pass: Boolean(cond), detail }); console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"], colorScheme: "dark" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/404/.test(m.text())) errors.push(m.text()); });

const ROUTES = ["/", "/today", "/calendar", "/tasks", "/copy", "/assets", "/campaigns", "/campaigns/C06", "/content", "/social?tab=discord", "/seo", "/community", "/video", "/email", "/paid", "/pr", "/partnerships", "/experiments", "/analytics", "/opportunities", "/utm", "/docs", "/docs/19-GTA6", "/settings"];
for (const r of ROUTES) {
  const before = errors.length;
  const res = await page.goto(BASE + r, { waitUntil: "networkidle" });
  const h1 = await page.locator("h1, .day-objective").first().textContent().catch(() => "");
  ok(`route ${r}`, res?.status() === 200 && h1 && errors.length === before, errors.slice(before).join(" | ").slice(0, 200));
}

// Today: copy button copies exactly the public text
await page.goto(`${BASE}/today?date=2026-10-01`, { waitUntil: "networkidle" });
const block = page.locator(".copy-block").first();
const expected = (await block.locator(".copy-text").textContent())?.trim();
await block.locator("button.btn-copy").click();
const clip = (await page.evaluate(() => navigator.clipboard.readText())).trim();
ok("copy button copies only the copy text", clip === expected && clip.length > 10, `${clip.slice(0, 60)}…`);
ok("copy shows success feedback", await page.locator(".toast").first().isVisible());

// Mark complete persists across reload
const first = page.locator("article.item").first();
const id = await first.getAttribute("id");
await first.locator("button.check").click();
await page.waitForTimeout(400);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);
const done = await page.locator(`article.item[id="${id}"]`).getAttribute("class");
ok("mark complete persists after reload", /is-done/.test(done || ""), id);
await page.locator(`article.item[id="${id}"] button.check`).click();
await page.waitForTimeout(300);

// Today filters
const total = await page.locator("article.item").count();
await page.selectOption('select[aria-label="Area"]', "social");
const social = await page.locator("article.item").count();
ok("Today area filter narrows items", social > 0 && social < total, `${social}/${total}`);
await page.check("text=Only items with copy");
const withCopy = await page.locator("article.item").count();
const copyBlocks = await page.locator("article.item").filter({ has: page.locator(".copy-block, details") }).count();
ok("'only items with copy' filter", withCopy === copyBlocks, `${withCopy}`);

// Calendar filters
await page.goto(`${BASE}/calendar`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: "Week" }).click();
const allChips = await page.locator(".cal-chip").count();
await page.selectOption('select[aria-label="Channel"]', "x");
const xChips = await page.locator(".cal-chip").count();
const labels = await page.locator(".cal-chip b").allTextContents();
ok("calendar channel filter", xChips > 0 && xChips < allChips && labels.every((l) => l.startsWith("X ")), `${xChips}/${allChips}`);
await page.locator(".cal-chip").first().click();
await page.waitForSelector(".drawer .item");
ok("calendar item opens full details", await page.locator(".drawer .item").count() === 1);
await page.keyboard.press("Escape");
await page.getByRole("tab", { name: "Month" }).click();
ok("month view renders days", (await page.locator("button.cal-cell").count()) >= 7);

// Campaign filters
await page.goto(`${BASE}/campaigns`, { waitUntil: "networkidle" });
const campRows = await page.locator("table.table tbody tr").count();
await page.selectOption('select[aria-label="Type"]', "PR");
const prRows = await page.locator("table.table tbody tr").count();
ok("campaign type filter", prRows > 0 && prRows < campRows, `${prRows}/${campRows}`);

// Global search
await page.keyboard.press("/");
await page.keyboard.type("countdown");
await page.waitForSelector(".palette-list button");
const hits = await page.locator(".palette-list button").allTextContents();
ok("global search finds C06", hits.some((h) => h.includes("C06")), hits.slice(0, 3).join(" | ").slice(0, 120));
await page.keyboard.press("Escape");

// UTM builder validation
await page.goto(`${BASE}/utm`, { waitUntil: "networkidle" });
await page.fill('input[placeholder="c06-gta6-countdown"]', "c99-bad");
ok("UTM builder rejects bad campaign", await page.locator(".field-error").first().isVisible());
await page.fill('input[placeholder="c06-gta6-countdown"]', "c04-out-this-week");
await page.fill('input[placeholder="f01-carousel-a"]', "f01-carousel-a");
ok("UTM builder builds a valid URL", (await page.locator(".copy-text").textContent())?.includes("utm_campaign=c04-out-this-week"));

// Tasks: add and complete
await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "New task" }).click();
await page.fill(".drawer input.input >> nth=0", "Smoke test task");
await page.getByRole("button", { name: "Save task" }).click();
await page.waitForTimeout(300);
const newTask = page.locator("li", { hasText: "Smoke test task" }).first();
ok("custom task created", await newTask.isVisible());
await newTask.locator("button.check").click();
await page.waitForTimeout(300);
ok("task quick-complete hides it", !(await page.locator("li", { hasText: "Smoke test task" }).first().isVisible().catch(() => false)));

// Analytics manual value
await page.goto(`${BASE}/analytics`, { waitUntil: "networkidle" });
await page.locator("button.kpi", { hasText: "Discord members" }).click();
await page.fill('.drawer input[type="number"]', "171");
await page.locator(".drawer button[type=submit]").click();
await page.waitForTimeout(300);
ok("KPI value recorded", (await page.locator(".drawer table").textContent())?.includes("171"));
await page.keyboard.press("Escape");

// Empty state
await page.goto(`${BASE}/today?date=2027-01-05`, { waitUntil: "networkidle" });
ok("empty state outside the plan", await page.locator(".empty-title").first().isVisible());

// Mobile
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
for (const r of ["/today", "/tasks", "/copy", "/campaigns", "/"]) {
  await mob.goto(BASE + r, { waitUntil: "networkidle" });
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`mobile ${r} has no horizontal scroll`, overflow <= 1, `overflow ${overflow}px`);
}
ok("mobile tab bar visible", await mob.locator(".tabbar").isVisible());
await mob.locator('button[aria-label="Open menu"]').click();
ok("mobile menu opens", await mob.locator(".sidebar.is-open").isVisible());

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
