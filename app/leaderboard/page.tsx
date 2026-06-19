import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { listRewardsWithStats } from "@/lib/rewards";
import { SubmissionStatus } from "@prisma/client";

export const metadata = { title: "Leaderboard — Star Atlas Sourcer" };

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  const [users, acceptedCounts, rewards] = await Promise.all([
    prisma.user.findMany({
      where: { OR: [{ points: { gt: 0 } }, { submissions: { some: {} } }] },
      orderBy: [{ points: "desc" }, { createdAt: "asc" }],
      take: 100,
    }),
    prisma.submission.groupBy({
      by: ["authorId"],
      where: { status: SubmissionStatus.ACCEPTED },
      _count: { _all: true },
    }),
    listRewardsWithStats({ activeOnly: true }),
  ]);

  const acceptedByUser = new Map(acceptedCounts.map((a) => [a.authorId, a._count._all]));
  const medal = ["🥇", "🥈", "🥉"];
  const featured = rewards.filter((r) => r.remaining > 0).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-[#8da2c7]">Earn points when the team accepts your submission — then spend them on rewards.</p>
      </div>

      {featured.length > 0 && (
        <section className="space-y-3 rounded-xl border border-[#f5c451]/30 bg-[#f5c451]/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#f5c451]">🎁 Rewards you can earn</h2>
            <Link href="/rewards" className="text-xs text-[#f5c451] hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featured.map((r) => (
              <Link key={r.id} href="/rewards" className="panel panel-hover overflow-hidden">
                <div className="relative aspect-video w-full bg-[#0a0e1c]">
                  {r.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imagePath} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl text-[#2f4068]">🚀</span>
                  )}
                  <span className="absolute right-1.5 top-1.5 chip border-[#f5c451]/50 text-[#f5c451]">{r.pointCost} pts</span>
                </div>
                <div className="p-2">
                  <div className="truncate text-xs font-medium text-[#e7eefc]">{r.name}</div>
                  <div className="text-[10px] text-[#5a6c8f]">{r.remaining} left</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {users.length === 0 ? (
        <div className="panel p-10 text-center text-[#8da2c7]">No points yet. Be the first to get an asset accepted!</div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-3 border-b border-[#1f2c47] px-4 py-3 text-xs uppercase tracking-wider text-[#5a6c8f]">
            <span>Rank</span>
            <span>Pilot</span>
            <span className="text-right">Accepted</span>
            <span className="text-right">Points</span>
          </div>
          <div className="divide-y divide-[#1f2c47]">
            {users.map((u, i) => {
              const isMe = u.id === user?.id;
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[3rem_1fr_auto_auto] items-center gap-3 px-4 py-3 ${
                    isMe ? "bg-[#34e0ff]/5" : ""
                  }`}
                >
                  <span className="font-mono text-lg">{i < 3 ? medal[i] : <span className="text-[#5a6c8f]">#{i + 1}</span>}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.image} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2c47] text-sm font-bold text-[#8da2c7]">
                        {(u.username || u.name || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium text-[#e7eefc]">
                      {u.username || u.name || "Pilot"}
                      {isMe && <span className="ml-2 text-xs text-[#34e0ff]">you</span>}
                    </span>
                  </div>
                  <span className="text-right font-mono text-sm text-[#8da2c7]">{acceptedByUser.get(u.id) || 0}</span>
                  <span className="glow-gold text-right font-mono text-lg font-bold text-[#f5c451]">{u.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
