// Build a PDF pitch deck for Star Atlas Sourcer (for ATMTA / Star Atlas management).
//   npm run deck    (server not required; uses the screenshots in docs/screenshots)
// Output: docs/StarAtlasSourcer-Pitch.pdf

import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const SHOTS = path.join(process.cwd(), "docs", "screenshots");
const OUT = path.join(process.cwd(), "docs", "StarAtlasSourcer-Pitch.pdf");

async function dataUri(name) {
  const buf = await readFile(path.join(SHOTS, `${name}.png`));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const C = {
  void: "#05070f", panel: "#0f1626", edge: "#1f2c47", cyan: "#34e0ff",
  gold: "#f5c451", violet: "#7b6cff", ink: "#e7eefc", muted: "#8da2c7", faint: "#5a6c8f", green: "#3ce8a0",
};

function frame(inner, kicker) {
  return `<div class="slide">
    <div class="bg"></div>
    <header class="hd">
      <div class="brand"><span class="logo">✦</span><div><div class="bn">STAR ATLAS <b>SOURCER</b></div><div class="bs">AEP · AEPHIA GUILD</div></div></div>
      ${kicker ? `<div class="kicker">${kicker}</div>` : ""}
    </header>
    <div class="body">${inner}</div>
  </div>`;
}

function bullets(items) {
  return `<ul class="b">${items.map((i) => `<li><span class="dot">▸</span><span>${i}</span></li>`).join("")}</ul>`;
}

function shot(uri, caption) {
  return `<figure class="shot"><img src="${uri}"/>${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
}

export async function buildHtml() {
  const img = Object.fromEntries(
    await Promise.all(
      ["landing", "new-request", "team-review", "request-detail", "submissions", "leaderboard", "rewards", "ue5-coming-soon", "admin"].map(
        async (n) => [n, await dataUri(n)]
      )
    )
  );

  const slides = [];

  // 1 — Title
  slides.push(`<div class="slide title">
    <div class="bg"></div>
    <div class="center">
      <div class="badge">A PROPOSAL FOR ATMTA · STAR ATLAS</div>
      <div class="big"><span class="logo xl">✦</span></div>
      <h1>STAR ATLAS <span class="cy">SOURCER</span></h1>
      <p class="sub">A community-sourced asset pipeline — bounties in, vetted on-spec art out.</p>
      <div class="by">Presented by the <b>AEP · Aephia</b> guild</div>
    </div>
  </div>`);

  // 2 — Opportunity
  slides.push(frame(`
    <div class="col">
      <h2>The opportunity</h2>
      ${bullets([
        "Star Atlas is a universe of <b>thousands</b> of assets — an ever-growing content demand.",
        "The community is full of <b>talented, eager creators</b> already making fan art.",
        "But there's <b>no structured way</b> to source, vet, and ship community art at scale.",
        "Sourcer turns that energy into a <b>curated content pipeline</b> you control.",
      ])}
    </div>`, "The opportunity"));

  // 3 — Solution
  slides.push(frame(`
    <div class="split">
      <div class="col">
        <h2>One clean pipeline</h2>
        <div class="pipeline">
          <span>Request</span><i>→</i><span>Submit</span><i>→</i><span>Vote</span><i>→</i><span>Review</span><i>→</i><span class="g">Ship</span>
        </div>
        ${bullets([
          "Your team posts bounties with <b>exact specs</b>.",
          "The community submits and <b>upvotes</b> the best.",
          "You review only the <b>community-vetted shortlist</b>.",
          "Accepted art ships <b>straight to your repo</b>.",
        ])}
      </div>
      ${shot(img.landing, "The Sourcer hub")}
    </div>`, "The solution"));

  // 4 — How it works
  slides.push(frame(`
    <div class="col">
      <h2>How it works</h2>
      <div class="steps">
        ${[
          ["01", "Team posts a bounty", "Title, asset type, tier range, aspect ratio, resolution, format, multi-image sets + a reference background."],
          ["02", "Community submits", "Creators generate art to spec and submit (exactly the number of images requested)."],
          ["03", "Pilots upvote", "Crossing an admin-set threshold promotes a submission to review — the rest never reach you."],
          ["04", "Team reviews", "Accept or reject the curated shortlist in one place."],
          ["05", "Ship + reward", "Accepted art auto-commits to your GitHub repo; the creator earns points."],
        ].map(([n, t, d]) => `<div class="step"><div class="sn">${n}</div><div><div class="st">${t}</div><div class="sd">${d}</div></div></div>`).join("")}
      </div>
    </div>`, "How it works"));

  // 5 — For ATMTA
  slides.push(frame(`
    <div class="split">
      <div class="col">
        <h2>Built for the <span class="cy">ATMTA team</span></h2>
        ${bullets([
          "<b>Precise requests:</b> tier range, aspect ratio, resolution, format, multi-image sets, reference background, output filename.",
          "You only ever review <b>community-vetted</b> work — no noise.",
          "<b>One-click accept → GitHub commit</b> with consistent, per-tier naming.",
          "Set the <b>points reward per request</b> — pay more for harder / UE5 work.",
        ])}
      </div>
      ${shot(img["new-request"], "Posting a bounty, to spec")}
    </div>`, "For the team"));

  // 6 — Quality control
  slides.push(frame(`
    <div class="split">
      ${shot(img["team-review"], "The review queue — only the shortlist")}
      <div class="col">
        <h2>Quality control, by design</h2>
        ${bullets([
          "An <b>upvote threshold</b> (you configure it) filters before your team sees anything.",
          "Only the <b>best submissions</b> reach review.",
          "<b>Multi-image sets</b> handled natively (e.g. Warp Drive Tier 1–5 = 5 images).",
          "Every accept commits with a <b>predictable filename</b> you define.",
        ])}
      </div>
    </div>`, "Quality control"));

  // 7 — Community & incentives
  slides.push(frame(`
    <div class="split">
      <div class="col">
        <h2>Motivated community</h2>
        ${bullets([
          "Public <b>leaderboard</b> — recognition drives participation.",
          "<b>Points per accepted asset</b>, configurable by difficulty.",
          "<b>Rewards store:</b> creators redeem points for prizes (e.g. ships), paid out by you.",
          "Solana wallet capture for <b>manual payouts</b> — you stay in control.",
        ])}
      </div>
      ${shot(img.rewards, "Rewards store (mock ships)")}
    </div>`, "Community & incentives"));

  // 8 — Scale & automation
  slides.push(frame(`
    <div class="split">
      ${shot(img["ue5-coming-soon"], "Web today · UE5 on the roadmap")}
      <div class="col">
        <h2>Ready to scale</h2>
        ${bullets([
          "<b>Agent API + MCP:</b> post requests programmatically or via AI agents.",
          "<b>Platform tagging</b> — Web now, <b>UE5-ready</b> (roadmap) for 3D assets.",
          "<b>Draft / publish</b> workflow so agent-created requests can be human-approved.",
          "Role-based access: Member · Team · Admin.",
        ])}
      </div>
    </div>`, "Scale & automation"));

  // 9 — IP & control
  slides.push(frame(`
    <div class="col">
      <h2>IP &amp; control stay with <span class="cy">you</span></h2>
      ${bullets([
        "Every submission requires agreement to a <b>usage license granting ATMTA full rights</b> — with no obligation to the creator (acceptance recorded per submission).",
        "Accepted assets land in <b>your repo, your branch, your naming convention</b>.",
        "You control everything: thresholds, acceptance, reward payouts, roles, and the GitHub target.",
        "<i>Disclaimer text is placeholder — to be finalized by ATMTA counsel.</i>",
      ])}
    </div>`, "IP & control"));

  // 10 — Status
  slides.push(frame(`
    <div class="split">
      <div class="col">
        <h2>Working today</h2>
        ${bullets([
          "A real, running <b>MVP</b> — not a mockup.",
          "Built on <b>Next.js + Prisma</b>; Discord login; GitHub commit integration.",
          "Live: requests, submissions, voting, review, leaderboard, rewards, agent API.",
          "Open roadmap: UE5 assets, image-spec validation, notifications.",
        ])}
      </div>
      ${shot(img.admin, "Admin: thresholds, GitHub, rewards, roles, API keys")}
    </div>`, "Status"));

  // 11 — The ask
  slides.push(`<div class="slide ask">
    <div class="bg"></div>
    <div class="center">
      <div class="badge gold">LET'S PILOT IT</div>
      <h1>A steady stream of <span class="gd">vetted, on-brand</span> community art.</h1>
      <div class="askgrid">
        <div class="card"><div class="ct">What we need</div><div class="cd">A sample set of asset requests &amp; a target GitHub repo.</div></div>
        <div class="card"><div class="ct">What you get</div><div class="cd">Curated, on-spec art — filtered by the community before it reaches you.</div></div>
        <div class="card"><div class="ct">Next step</div><div class="cd">A short pilot with the Aephia guild and your feedback.</div></div>
      </div>
      <div class="contact">Siphaawal · <span class="cy">@Siphaawal</span> · siphaawal.xyz</div>
    </div>
  </div>`);

  const css = `
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size: 1280px 720px; margin:0; }
    body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:${C.ink}; }
    .slide { position:relative; width:1280px; height:720px; overflow:hidden; background:${C.void}; page-break-after: always; }
    .slide:last-child { page-break-after: auto; }
    .bg { position:absolute; inset:0;
      background-image:
        radial-gradient(900px 500px at 85% -10%, rgba(52,224,255,.10), transparent 60%),
        radial-gradient(800px 460px at 5% 110%, rgba(123,108,255,.10), transparent 60%),
        radial-gradient(700px 360px at 50% 50%, rgba(245,196,81,.04), transparent 70%);
    }
    .hd { position:relative; display:flex; align-items:center; justify-content:space-between; padding:34px 56px 0; }
    .brand { display:flex; align-items:center; gap:12px; }
    .logo { color:${C.cyan}; font-size:26px; text-shadow:0 0 18px rgba(52,224,255,.6); }
    .logo.xl { font-size:72px; }
    .bn { font-size:15px; font-weight:600; letter-spacing:.5px; }
    .bn b { color:${C.cyan}; }
    .bs { font-size:10px; letter-spacing:3px; color:${C.gold}; margin-top:2px; }
    .kicker { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:${C.faint}; border:1px solid ${C.edge}; padding:6px 12px; border-radius:999px; }
    .body { position:relative; padding:38px 56px 56px; height:calc(720px - 70px); display:flex; }
    h2 { font-size:40px; line-height:1.1; margin-bottom:22px; font-weight:700; }
    .cy { color:${C.cyan}; } .gd { color:${C.gold}; } .g { color:${C.green}; }
    .col { flex:1; display:flex; flex-direction:column; justify-content:center; }
    .split { display:flex; gap:40px; align-items:center; width:100%; }
    .split .col { flex:1.05; }
    ul.b { list-style:none; display:flex; flex-direction:column; gap:16px; }
    ul.b li { display:flex; gap:12px; font-size:21px; line-height:1.4; color:#cfdcf5; }
    ul.b li b { color:${C.ink}; } ul.b li i { color:${C.muted}; }
    .dot { color:${C.cyan}; font-weight:700; }
    .shot { flex:1; border:1px solid ${C.edge}; border-radius:14px; overflow:hidden; background:${C.panel}; box-shadow:0 20px 60px rgba(0,0,0,.5); }
    .shot img { width:100%; display:block; }
    .shot figcaption { font-size:12px; color:${C.faint}; padding:8px 12px; border-top:1px solid ${C.edge}; }
    .pipeline { display:flex; align-items:center; gap:10px; margin-bottom:22px; flex-wrap:wrap; }
    .pipeline span { background:${C.panel}; border:1px solid ${C.edge}; border-radius:8px; padding:8px 14px; font-weight:600; font-size:17px; }
    .pipeline span.g { border-color:${C.green}; color:${C.green}; }
    .pipeline i { color:${C.faint}; font-style:normal; }
    .steps { display:flex; flex-direction:column; gap:14px; }
    .step { display:flex; gap:18px; align-items:flex-start; background:${C.panel}; border:1px solid ${C.edge}; border-radius:12px; padding:14px 18px; }
    .sn { font-family:ui-monospace,monospace; font-size:26px; font-weight:700; color:${C.gold}; min-width:46px; }
    .st { font-size:20px; font-weight:600; } .sd { font-size:15px; color:${C.muted}; margin-top:2px; }
    /* title + ask */
    .center { position:relative; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 80px; }
    .badge { font-size:12px; letter-spacing:4px; color:${C.cyan}; border:1px solid rgba(52,224,255,.4); background:rgba(52,224,255,.06); padding:8px 16px; border-radius:999px; margin-bottom:24px; }
    .badge.gold { color:${C.gold}; border-color:rgba(245,196,81,.4); background:rgba(245,196,81,.06); }
    .big { margin-bottom:8px; }
    h1 { font-size:62px; line-height:1.05; font-weight:800; letter-spacing:-1px; }
    .ask h1 { font-size:46px; max-width:980px; }
    .sub { font-size:22px; color:${C.muted}; margin-top:18px; max-width:760px; }
    .by { margin-top:26px; font-size:16px; color:${C.faint}; }
    .by b { color:${C.gold}; }
    .askgrid { display:flex; gap:18px; margin:38px 0 30px; }
    .card { background:${C.panel}; border:1px solid ${C.edge}; border-radius:14px; padding:22px; width:300px; text-align:left; }
    .ct { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:${C.cyan}; margin-bottom:10px; }
    .cd { font-size:17px; color:#cfdcf5; line-height:1.4; }
    .contact { font-size:18px; color:${C.muted}; }
    .contact .cy { font-weight:600; }
  `;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${slides.join("")}</body></html>`;
  return { html, count: slides.length };
}

async function build() {
  const { html, count } = await buildHtml();
  await mkdir(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({ path: OUT, width: "1280px", height: "720px", printBackground: true });
  await browser.close();
  console.log(`Deck written to ${OUT} (${count} slides)`);
}

// Run as a script (not when imported for tests/preview).
if (import.meta.url === `file://${process.argv[1]?.replace(/\\\\/g, "/")}` || process.argv[1]?.endsWith("build-deck.mjs")) {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
