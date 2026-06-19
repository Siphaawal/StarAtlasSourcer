// Seed mock Star Atlas ship rewards with placeholder ship images.
//   node scripts/seed-rewards.mjs
// Idempotent: replaces rewards whose name is in the mock set. Placeholder art —
// swap imagePath for real ship renders when available.

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const DIR = path.join(process.cwd(), "public", "uploads", "rewards");

const SHIPS = [
  { name: "Pearce X4 Fighter", desc: "Opal Empire light fighter — fast, agile, iconic.", cost: 15, qty: 3, c: ["#1c93ad", "#34e0ff"] },
  { name: "Calico Compakt Hero", desc: "Versatile multi-role hauler. Great starter ship.", cost: 25, qty: 2, c: ["#2f4068", "#7b6cff"] },
  { name: "Opal Jet", desc: "Sleek racing-class shuttle in Aephia gold trim.", cost: 40, qty: 1, c: ["#b8923a", "#f5c451"] },
  { name: "Fimbul ECOS Treager", desc: "Rugged industrial frigate for the long haul.", cost: 60, qty: 2, c: ["#1f7a5a", "#3ce8a0"] },
];

function shipSvg(name, [c1, c2]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e1c"/><stop offset="1" stop-color="#05070f"/></linearGradient>
    <linearGradient id="hull" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 71) % 450}" r="${(i % 3) + 1}" fill="#34e0ff" opacity="0.25"/>`).join("")}
  <g transform="translate(400 215)">
    <polygon points="-230,0 60,-60 220,-18 220,18 60,60" fill="url(#hull)" opacity="0.95"/>
    <polygon points="60,-60 160,-110 200,-40 60,-18" fill="${c2}" opacity="0.6"/>
    <polygon points="60,60 160,110 200,40 60,18" fill="${c2}" opacity="0.6"/>
    <circle cx="150" cy="0" r="26" fill="#e7eefc" opacity="0.85"/>
    <rect x="-260" y="-12" width="40" height="24" fill="${c2}"/>
    <ellipse cx="-280" cy="0" rx="40" ry="14" fill="#34e0ff" opacity="0.5"/>
  </g>
  <text x="40" y="410" font-family="sans-serif" font-size="34" font-weight="bold" fill="#e7eefc">${name}</text>
  <text x="40" y="44" font-family="sans-serif" font-size="16" letter-spacing="3" fill="#b8923a">STAR ATLAS · AEP</text>
</svg>`;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("Run `npm run db:seed` first (no admin user).");
  await mkdir(DIR, { recursive: true });

  for (const s of SHIPS) {
    const file = `demo-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    await writeFile(path.join(DIR, file), shipSvg(s.name, s.c));
    const imagePath = `/uploads/rewards/${file}`;

    const existing = await prisma.reward.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.reward.update({ where: { id: existing.id }, data: { description: s.desc, pointCost: s.cost, quantity: s.qty, imagePath, active: true } });
    } else {
      await prisma.reward.create({
        data: { name: s.name, description: s.desc, pointCost: s.cost, quantity: s.qty, imagePath, createdById: admin.id },
      });
    }
    console.log(`+ ${s.name} (${s.cost} pts, qty ${s.qty})`);
  }
  console.log("Reward seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
