import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canReview } from "@/lib/auth-helpers";
import { SpecChips } from "@/components/SpecChips";
import { RequestStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Collab Requests — Star Atlas Sourcer" };

export default async function RequestsPage() {
  const user = await getCurrentUser();
  const requests = await prisma.collabRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { submissions: true } }, author: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collab Requests</h1>
          <p className="text-sm text-[#8da2c7]">Pick a bounty, generate art to spec, and submit it for the community to upvote.</p>
        </div>
        {canReview(user?.role) && (
          <Link href="/requests/new" className="btn-gold whitespace-nowrap">
            + New Request
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="panel p-10 text-center text-[#8da2c7]">
          No requests yet.{canReview(user?.role) ? " Create the first one!" : " Check back soon."}
        </div>
      ) : (
        <div className="panel divide-y divide-[#1f2c47] overflow-hidden">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/requests/${r.id}`}
              className="flex items-center gap-4 p-4 transition hover:bg-[#141d33]/70"
            >
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-[#1f2c47] bg-[#0a0e1c]">
                {r.backgroundPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.backgroundPath} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl text-[#2f4068]">✦</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-semibold text-[#e7eefc]">{r.title}</h2>
                  <RequestStatusBadge status={r.status} />
                </div>
                {r.description && <p className="line-clamp-1 text-sm text-[#8da2c7]">{r.description}</p>}
                <SpecChips request={r} />
              </div>
              <div className="hidden flex-shrink-0 flex-col items-end gap-1 text-xs text-[#5a6c8f] sm:flex">
                <span className="font-mono text-base font-bold text-[#34e0ff]">{r._count.submissions}</span>
                <span>submission{r._count.submissions === 1 ? "" : "s"}</span>
                <span className="text-[#5a6c8f]">by {r.author.username || r.author.name || "Team"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
