import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canReview } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { ReviewActions } from "./ReviewActions";
import { SubmissionThumbs } from "@/components/SubmissionThumbs";
import { buildAssetFileName, extOf } from "@/lib/naming";
import { SubmissionStatus } from "@prisma/client";

export const metadata = { title: "Team Review — Star Atlas Sourcer" };

export default async function TeamReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!canReview(user.role)) redirect("/");

  const include = {
    author: true,
    request: true,
    images: { orderBy: { position: "asc" as const } },
  };

  const [settings, queue, recent] = await Promise.all([
    getSettings(),
    prisma.submission.findMany({
      where: { status: SubmissionStatus.TEAM_REVIEW },
      orderBy: [{ voteCount: "desc" }, { createdAt: "asc" }],
      include,
    }),
    prisma.submission.findMany({
      where: { status: { in: [SubmissionStatus.ACCEPTED, SubmissionStatus.REJECTED] } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      include,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Team Review</h1>
        <p className="text-sm text-[#8da2c7]">
          Submissions that reached <span className="font-mono text-[#34e0ff]">{settings.upvoteThreshold}</span> community
          upvotes. Accept to award a point and commit to the repo.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="panel p-10 text-center text-[#8da2c7]">Nothing waiting for review. The community is still voting.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {queue.map((s) => {
            const author = s.author.username || s.author.name || "Pilot";
            const fileNames = s.images.map((img) =>
              buildAssetFileName({
                outputFileName: s.request.outputFileName,
                assetType: s.request.assetType,
                title: s.request.title,
                authorName: author,
                submissionId: s.id,
                position: img.position,
                total: s.images.length,
                tierMin: s.request.tierMin,
                tierMax: s.request.tierMax,
                ext: extOf(img.path),
              })
            );
            return (
              <div key={s.id} className="panel overflow-hidden">
                <div className="relative aspect-square w-full overflow-hidden bg-[#0a0e1c]">
                  <SubmissionThumbs images={s.images} alt={s.title || "submission"} />
                  <span className="absolute right-2 top-2 z-10 chip border-[#34e0ff]/40 text-[#34e0ff]">▲ {s.voteCount}</span>
                  {s.images.length > 1 && (
                    <span className="absolute left-2 top-2 z-10 chip border-[#7b6cff]/50 text-[#a99bff]">{s.images.length} imgs</span>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <Link href={`/requests/${s.requestId}`} className="text-xs text-[#5a6c8f] hover:text-[#34e0ff]">
                      {s.request.title}
                    </Link>
                    {s.title && <div className="font-semibold text-[#e7eefc]">{s.title}</div>}
                    <div className="text-xs text-[#8da2c7]">
                      by {author} · accept awards <span className="font-semibold text-[#f5c451]">{s.request.rewardPoints} pts</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-2" title="Commits to these file names on accept">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-[#5a6c8f]">Commits as</div>
                    <div className="space-y-0.5">
                      {fileNames.map((fn, i) => (
                        <div key={i} className="truncate font-mono text-[11px] text-[#f5c451]">→ {fn}</div>
                      ))}
                    </div>
                  </div>
                  {s.notes && <p className="text-xs text-[#5a6c8f]">{s.notes}</p>}
                  <ReviewActions submissionId={s.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recently reviewed</h2>
          <div className="panel divide-y divide-[#1f2c47]">
            {recent.map((s) => {
              const committed = s.images.find((i) => i.committedUrl)?.committedUrl;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3">
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-[#1f2c47]">
                    <SubmissionThumbs images={s.images} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[#e7eefc]">
                      {s.title || s.request.title}
                      {s.images.length > 1 && <span className="ml-1 text-xs text-[#5a6c8f]">({s.images.length})</span>}
                    </div>
                    <div className="text-xs text-[#5a6c8f]">by {s.author.username || s.author.name}</div>
                  </div>
                  {s.status === SubmissionStatus.ACCEPTED ? (
                    <span className="chip border-[#3ce8a0]/50 text-[#3ce8a0]">Accepted</span>
                  ) : (
                    <span className="chip border-[#ff5c7a]/50 text-[#ff5c7a]">Rejected</span>
                  )}
                  {committed && (
                    <a href={committed} target="_blank" rel="noreferrer" className="text-xs text-[#3ce8a0] hover:underline">
                      ↗ repo
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
