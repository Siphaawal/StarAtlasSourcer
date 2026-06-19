// Demo seed: generates placeholder tier assets + submissions in varied states
// so the README screenshots look realistic. Idempotent — clears its own [demo] rows first.
//
//   node scripts/demo-seed.mjs
//
// Safe to delete in production; only touches demo-marked submissions.

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "submissions");
const DEMO_TAG = "[demo]";

const TIER_COLORS = [
  ["#1c93ad", "#34e0ff"],
  ["#2f4068", "#7b6cff"],
  ["#b8923a", "#f5c451"],
  ["#1f7a5a", "#3ce8a0"],
  ["#7a2f4a", "#ff5c7a"],
];

function tierSvg(tier, label) {
  const [c1, c2] = TIER_COLORS[(tier - 1) % TIER_COLORS.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="512" height="512" fill="#0a0e1c"/>
  <circle cx="256" cy="210" r="130" fill="url(#g)" opacity="0.9"/>
  <circle cx="256" cy="210" r="130" fill="none" stroke="#e7eefc" stroke-opacity="0.15" stroke-width="3"/>
  <text x="256" y="225" font-family="sans-serif" font-size="120" font-weight="bold" fill="#05070f" text-anchor="middle">T${tier}</text>
  <text x="256" y="430" font-family="sans-serif" font-size="34" fill="#e7eefc" text-anchor="middle">${label}</text>
</svg>`;
}

async function writeTierImages(prefix, tiers, label) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const paths = [];
  for (const t of tiers) {
    const filename = `demo-${prefix}-t${t}.svg`;
    await writeFile(path.join(UPLOAD_DIR, filename), tierSvg(t, label));
    paths.push(`/uploads/submissions/${filename}`);
  }
  return paths;
}

async function main() {
  const request = await prisma.collabRequest.findFirst({ where: { title: "Warp Drive — Tiers 1-5" } });
  if (!request) throw new Error("Run `npm run db:seed` first (sample request missing).");

  const members = await prisma.user.findMany({ where: { email: { in: ["nova@aephia.dev", "rigel@aephia.dev", "vela@aephia.dev"] } } });
  const byUser = Object.fromEntries(members.map((m) => [m.username, m]));

  // Clear previous demo submissions for a clean re-run.
  await prisma.submission.deleteMany({ where: { requestId: request.id, notes: { contains: DEMO_TAG } } });

  const tiers = [1, 2, 3, 4, 5];
  const plan = [
    { author: "NovaPilot", status: "ACCEPTED", votes: 9, title: "Exotic plasma core set", reviewed: true },
    { author: "RigelForge", status: "TEAM_REVIEW", votes: 6, title: "Industrial drive series" },
    { author: "VelaRender", status: "PENDING", votes: 3, title: "Neon coil concept" },
    { author: "NovaPilot", status: "PENDING", votes: 1, title: "Minimal hull-matched set" },
  ];

  for (const [i, p] of plan.entries()) {
    const user = byUser[p.author];
    if (!user) continue;
    const paths = await writeTierImages(`${p.author.toLowerCase()}-${i}`, tiers, `${p.author} · ${p.title}`);
    await prisma.submission.create({
      data: {
        requestId: request.id,
        authorId: user.id,
        title: p.title,
        notes: `${DEMO_TAG} Generated to spec — one image per tier.`,
        status: p.status,
        voteCount: p.votes,
        reviewedById: p.reviewed ? user.id : null,
        reviewedAt: p.reviewed ? new Date() : null,
        images: { create: paths.map((path, position) => ({ path, position })) },
      },
    });
    console.log(`+ ${p.author} (${p.status}) — ${paths.length} images`);
  }

  console.log("Demo seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
