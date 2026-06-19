import { PrismaClient, Role, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Settings singleton
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, upvoteThreshold: 5, githubBranch: "main", githubPathPrefix: "assets" },
  });

  // Seed users for a believable leaderboard
  const admin = await prisma.user.upsert({
    where: { email: "admin@aephia.dev" },
    update: { role: Role.ADMIN },
    create: { email: "admin@aephia.dev", name: "Aephia Admin", username: "AephiaAdmin", role: Role.ADMIN, points: 0 },
  });

  const team = await prisma.user.upsert({
    where: { email: "team@staratlas.dev" },
    update: { role: Role.TEAM },
    create: { email: "team@staratlas.dev", name: "Star Atlas Team", username: "SA_Team", role: Role.TEAM, points: 0 },
  });

  const members = await Promise.all(
    [
      ["nova@aephia.dev", "NovaPilot", 7],
      ["rigel@aephia.dev", "RigelForge", 4],
      ["vela@aephia.dev", "VelaRender", 2],
    ].map(([email, username, points]) =>
      prisma.user.upsert({
        where: { email: email as string },
        update: {},
        create: { email: email as string, name: username as string, username: username as string, role: Role.MEMBER, points: points as number },
      })
    )
  );

  // A sample collab request from the team
  const existing = await prisma.collabRequest.findFirst({ where: { title: "Warp Drive — Tiers 1-5" } });
  if (!existing) {
    await prisma.collabRequest.create({
      data: {
        title: "Warp Drive — Tiers 1-5",
        description:
          "We need warp drive concept art spanning Tier 1 (scrappy/industrial) through Tier 5 (sleek/exotic). Match the reference background lighting.",
        assetType: "Warp Drive",
        outputFileName: "warp-drive",
        imageCount: 5,
        rewardPoints: 25,
        tierMin: 1,
        tierMax: 5,
        aspectRatio: "1:1",
        resolution: "1024x1024",
        format: "PNG",
        colorPalette: "Deep space blues, AEP gold accents",
        styleNotes: "Clean sci-fi industrial. Subtle glow on energy components.",
        maxFileSizeMB: 10,
        authorId: team.id,
      },
    });
  }

  // A second sample request targeting UE5 (and Web) to demo platform filtering.
  const ue5Existing = await prisma.collabRequest.findFirst({ where: { title: "Station Module — UE5 Prop" } });
  if (!ue5Existing) {
    await prisma.collabRequest.create({
      data: {
        title: "Station Module — UE5 Prop",
        description: "Concept art for a modular station prop, intended for an Unreal Engine 5 asset down the line.",
        assetType: "Station Module",
        outputFileName: "station-module",
        imageCount: 1,
        rewardPoints: 50,
        targetWeb: true,
        targetUE5: true,
        tierMin: 1,
        tierMax: 1,
        aspectRatio: "16:9",
        resolution: "1920x1080",
        format: "PNG",
        colorPalette: "Industrial greys, warning amber",
        styleNotes: "Modular, greebled surfaces, readable silhouette.",
        authorId: team.id,
      },
    });
  }

  console.log("Seeded:", {
    admin: admin.username,
    team: team.username,
    members: members.map((m) => m.username),
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
