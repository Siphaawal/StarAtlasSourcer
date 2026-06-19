import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { SubmissionThumbs } from "@/components/SubmissionThumbs";
import { SubmissionStatus } from "@prisma/client";

export const metadata = { title: "Submissions — Star Atlas Sourcer" };

const FILTERS: { key: string; label: string; status?: SubmissionStatus }[] = [
  { key: "all", label: "All" },
  { key: "voting", label: "Voting", status: SubmissionStatus.PENDING },
  { key: "review", label: "In Review", status: SubmissionStatus.TEAM_REVIEW },
  { key: "accepted", label: "Accepted", status: SubmissionStatus.ACCEPTED },
  { key: "rejected", label: "Rejected", status: SubmissionStatus.REJECTED },
];

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const submissions = await prisma.submission.findMany({
    where: active.status ? { status: active.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      request: { select: { id: true, title: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-sm text-[#8da2c7]">Every asset submitted across all collab requests.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/submissions" : `/submissions?filter=${f.key}`}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              active.key === f.key
                ? "border-[#34e0ff] bg-[#34e0ff]/10 text-[#34e0ff]"
                : "border-[#1f2c47] text-[#8da2c7] hover:border-[#34e0ff]/40"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="panel p-10 text-center text-[#8da2c7]">No submissions{active.key === "all" ? " yet" : ` in “${active.label}”`}.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {submissions.map((s) => (
            <Link key={s.id} href={`/requests/${s.request.id}`} className="panel panel-hover block overflow-hidden">
              <div className="relative aspect-square w-full overflow-hidden bg-[#0a0e1c]">
                <SubmissionThumbs images={s.images} alt={s.title || "submission"} />
                <div className="absolute left-1.5 top-1.5 z-10">
                  <SubmissionStatusBadge status={s.status} />
                </div>
                <span className="absolute right-1.5 top-1.5 z-10 chip border-[#34e0ff]/40 text-[#34e0ff]">▲ {s.voteCount}</span>
                {s.images.length > 1 && (
                  <span className="absolute bottom-1.5 left-1.5 z-10 chip border-[#7b6cff]/50 text-[#a99bff]">{s.images.length} imgs</span>
                )}
              </div>
              <div className="space-y-0.5 p-3">
                {s.title && <div className="truncate text-sm font-semibold text-[#e7eefc]">{s.title}</div>}
                <div className="truncate text-xs text-[#8da2c7]">by {s.author.username || s.author.name || "Pilot"}</div>
                <div className="truncate text-[11px] text-[#5a6c8f]">{s.request.title}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
