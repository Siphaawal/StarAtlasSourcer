import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canReview } from "@/lib/auth-helpers";
import { SpecChips } from "@/components/SpecChips";
import { RequestStatusBadge } from "@/components/StatusBadge";
import { PlatformFilter, platformWhere } from "@/components/PlatformFilter";
import { platformChips } from "@/lib/constants";
import { DraftActions } from "./DraftActions";

export const metadata = { title: "Collab Requests — Star Atlas Sourcer" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ platform?: string }> }) {
  const { platform = "all" } = await searchParams;
  const user = await getCurrentUser();
  const reviewer = canReview(user?.role);
  const platformFilter = platformWhere(platform);

  const requests = await prisma.collabRequest.findMany({
    where: { ...platformFilter, status: { in: ["OPEN", "CLOSED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { submissions: true } }, author: true },
  });

  // Drafts (e.g. agent-created, awaiting confirmation) are visible only to the team.
  const drafts = reviewer
    ? await prisma.collabRequest.findMany({
        where: { ...platformFilter, status: "DRAFT" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { submissions: true } }, author: true },
      })
    : [];

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

      <PlatformFilter current={platform} hrefFor={(k) => (k === "all" ? "/requests" : `/requests?platform=${k}`)} />

      {reviewer && drafts.length > 0 && (
        <div className="space-y-2 rounded-xl border border-[#f5c451]/30 bg-[#f5c451]/5 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#f5c451]">
            Drafts awaiting publish <span className="chip border-[#f5c451]/40 text-[#f5c451]">{drafts.length}</span>
          </h2>
          <p className="text-xs text-[#8da2c7]">Agent/API-created requests that haven&apos;t gone live yet. Only the team sees these.</p>
          <div className="divide-y divide-[#1f2c47] rounded-lg border border-[#1f2c47] bg-[#0a0e1c]">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3">
                <Link href={`/requests/${d.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-[#e7eefc]">{d.title}</span>
                    {d.createdViaApi && <span className="chip border-[#34e0ff]/40 text-[#34e0ff]">via API</span>}
                    {platformChips(d).map((c) => (
                      <span key={c} className="chip border-[#7b6cff]/40 text-[#a99bff]">{c}</span>
                    ))}
                  </div>
                  <div className="text-xs text-[#5a6c8f]">by {d.author.username || d.author.name || "Team"}</div>
                </Link>
                <DraftActions requestId={d.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="panel p-10 text-center text-[#8da2c7]">
          No {platform === "ue5" ? "UE5 " : platform === "web" ? "Web " : ""}requests yet.
          {canReview(user?.role) ? " Create the first one!" : " Check back soon."}
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
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold text-[#e7eefc]">{r.title}</h2>
                  <RequestStatusBadge status={r.status} />
                  {platformChips(r).map((c) => (
                    <span key={c} className="chip border-[#7b6cff]/40 text-[#a99bff]">{c}</span>
                  ))}
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
