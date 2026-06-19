// Capture README screenshots of the running app.
//
//   1. npm run dev            (server on http://localhost:3000)
//   2. npm run db:seed && node scripts/demo-seed.mjs   (for realistic data)
//   3. node scripts/screenshots.mjs
//
// Writes PNGs to docs/screenshots/. Re-run any time the UI changes.

import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs", "screenshots");

async function shoot(page, name) {
  await page.waitForTimeout(400); // let fonts/images settle
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`✓ ${name}.png`);
}

async function devLogin(page, username, role) {
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle" });
  await page.fill('input[value="NovaPilot"], input', username).catch(() => {});
  await page.getByRole("button", { name: role, exact: true }).click();
  await page.getByRole("button", { name: /Dev sign-in/i }).click();
  await page.waitForSelector("text=Sign out", { timeout: 15000 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // Logged-out sign-in page first.
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle" });
  await shoot(page, "signin");

  // Sign in as ADMIN so every page is reachable.
  await devLogin(page, "AephiaAdmin", "ADMIN");

  const pages = [
    ["/", "landing"],
    ["/requests", "requests-list"],
    ["/submissions", "submissions"],
    ["/team", "team-review"],
    ["/leaderboard", "leaderboard"],
    ["/admin", "admin"],
    ["/requests/new", "new-request"],
  ];
  for (const [url, name] of pages) {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await shoot(page, name);
  }

  // Request detail — open an actual request row (exclude the "New Request" button).
  await page.goto(`${BASE}/requests`, { waitUntil: "networkidle" });
  await page.locator('a[href^="/requests/"]:not([href="/requests/new"])').first().click();
  await page.waitForLoadState("networkidle");
  await shoot(page, "request-detail");

  await browser.close();
  console.log(`\nScreenshots written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
