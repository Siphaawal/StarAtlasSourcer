import { prisma } from "@/lib/prisma";

export type RewardWithStats = Awaited<ReturnType<typeof listRewardsWithStats>>[number];

/** List rewards with claimed/remaining counts (CANCELLED redemptions free their slot). */
export async function listRewardsWithStats(opts?: { activeOnly?: boolean }) {
  const rewards = await prisma.reward.findMany({
    where: opts?.activeOnly ? { active: true } : undefined,
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  const counts = await prisma.redemption.groupBy({
    by: ["rewardId"],
    where: { status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  const claimedBy = new Map(counts.map((c) => [c.rewardId, c._count._all]));
  return rewards.map((r) => {
    const claimed = claimedBy.get(r.id) ?? 0;
    return { ...r, claimed, remaining: Math.max(0, r.quantity - claimed) };
  });
}
