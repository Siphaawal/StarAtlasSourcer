import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { listRewardsWithStats } from "@/lib/rewards";
import { shortAddress } from "@/lib/solana";
import { RedeemForm } from "./RedeemForm";
import { RedemptionStatus } from "@prisma/client";

export const metadata = { title: "Rewards — Star Atlas Sourcer" };

const STATUS_STYLE: Record<RedemptionStatus, string> = {
  PENDING: "border-[#f5c451]/50 text-[#f5c451]",
  PAID: "border-[#3ce8a0]/50 text-[#3ce8a0]",
  CANCELLED: "border-[#5a6c8f]/50 text-[#5a6c8f]",
};

export default async function RewardsPage() {
  const user = await getCurrentUser();
  const [rewards, myRedemptions] = await Promise.all([
    listRewardsWithStats(),
    user
      ? prisma.redemption.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          include: { reward: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const visible = rewards.filter((r) => r.active || r.claimed > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-sm text-[#8da2c7]">Spend the points you earn from accepted submissions on Star Atlas rewards.</p>
        </div>
        {user && (
          <div className="rounded-lg border border-[#f5c451]/30 bg-[#f5c451]/5 px-4 py-2 text-center">
            <div className="glow-gold font-mono text-2xl font-bold text-[#f5c451]">{user.points}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8da2c7]">your points</div>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="panel p-10 text-center text-[#8da2c7]">No rewards yet. Check back soon.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <div key={r.id} className={`panel overflow-hidden ${!r.active ? "opacity-60" : ""}`}>
              <div className="relative aspect-video w-full bg-[#0a0e1c]">
                {r.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imagePath} alt={r.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl text-[#2f4068]">🚀</span>
                )}
                <span className="absolute right-2 top-2 chip border-[#f5c451]/50 text-[#f5c451]">{r.pointCost} pts</span>
                <span className="absolute left-2 top-2 chip">{r.remaining} / {r.quantity} left</span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold text-[#e7eefc]">{r.name}</h3>
                  {r.description && <p className="mt-0.5 line-clamp-2 text-xs text-[#8da2c7]">{r.description}</p>}
                </div>
                <RedeemForm
                  rewardId={r.id}
                  pointCost={r.pointCost}
                  remaining={r.remaining}
                  userPoints={user?.points ?? 0}
                  signedIn={!!user}
                  defaultAddress={user?.solanaAddress ?? ""}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {user && myRedemptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your redemptions</h2>
          <div className="panel divide-y divide-[#1f2c47]">
            {myRedemptions.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[#e7eefc]">{r.reward.name}</div>
                  <div className="font-mono text-xs text-[#5a6c8f]">{r.pointsSpent} pts → {shortAddress(r.solanaAddress)}</div>
                </div>
                <span className={`chip ${STATUS_STYLE[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
