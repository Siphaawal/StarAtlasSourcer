import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canReview } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { platformChips } from "@/lib/constants";
import { SpecChips } from "@/components/SpecChips";
import { RequestStatusBadge } from "@/components/StatusBadge";
import { SubmissionCard } from "@/components/SubmissionCard";
import { SubmitForm } from "./SubmitForm";
import { RequestStatusToggle } from "./RequestStatusToggle";
import { RequestStatus, SubmissionStatus } from "@prisma/client";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, settings, request] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    prisma.collabRequest.findUnique({
      where: { id },
      include: {
        author: true,
        submissions: {
          orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
          include: { author: true, images: { orderBy: { position: "asc" } } },
        },
      },
    }),
  ]);

  if (!request) notFound();

  // Public page shows community-voting submissions and the accepted showcase.
  // Items promoted to TEAM_REVIEW move to the team queue and are hidden here.
  const voting = request.submissions.filter((s) => s.status === SubmissionStatus.PENDING);
  const accepted = request.submissions.filter((s) => s.status === SubmissionStatus.ACCEPTED);
  const inReview = request.submissions.filter((s) => s.status === SubmissionStatus.TEAM_REVIEW).length;

  // Which of these the current user has upvoted.
  let myVotes = new Set<string>();
  if (user) {
    const visibleIds = [...voting, ...accepted].map((s) => s.id);
    const votes = await prisma.vote.findMany({
      where: { userId: user.id, submissionId: { in: visibleIds } },
      select: { submissionId: true },
    });
    myVotes = new Set(votes.map((v) => v.submissionId));
  }

  const tier =
    request.tierMin === request.tierMax ? `Tier ${request.tierMin}` : `Tier ${request.tierMin}–${request.tierMax}`;

  return (
    <div className="space-y-8">
      <Link href="/requests" className="text-sm text-[#8da2c7] hover:text-[#34e0ff]">
        ← All requests
      </Link>

      {/* Header */}
      <div className="panel overflow-hidden">
        {request.backgroundPath && (
          <div className="relative h-48 w-full overflow-hidden bg-[#0a0e1c] sm:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={request.backgroundPath} alt="reference background" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1626] via-transparent to-transparent" />
            <span className="absolute bottom-2 left-3 chip border-[#f5c451]/40 text-[#f5c451]">Reference background</span>
          </div>
        )}
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <p className="text-sm text-[#5a6c8f]">
                {tier} · posted by {request.author.username || request.author.name || "Team"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {platformChips(request).map((c) => (
                <span key={c} className="chip border-[#7b6cff]/40 text-[#a99bff]">{c}</span>
              ))}
              <RequestStatusBadge status={request.status} />
              {canReview(user?.role) && <RequestStatusToggle requestId={request.id} status={request.status} />}
            </div>
          </div>
          {request.description && <p className="text-[#8da2c7]">{request.description}</p>}
          {(request.colorPalette || request.styleNotes) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {request.colorPalette && (
                <div className="rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-3">
                  <div className="label">Color palette</div>
                  <div className="text-sm text-[#e7eefc]">{request.colorPalette}</div>
                </div>
              )}
              {request.styleNotes && (
                <div className="rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-3">
                  <div className="label">Style notes</div>
                  <div className="text-sm text-[#e7eefc]">{request.styleNotes}</div>
                </div>
              )}
            </div>
          )}
          <SpecChips request={request} />
          {canReview(user?.role) && inReview > 0 && (
            <div className="rounded-lg border border-[#7b6cff]/30 bg-[#7b6cff]/5 p-3 text-sm text-[#a99bff]">
              {inReview} submission{inReview === 1 ? "" : "s"} crossed the threshold and {inReview === 1 ? "is" : "are"} waiting in{" "}
              <Link href="/team" className="underline">Team Review</Link>.
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      {request.status === RequestStatus.OPEN ? (
        user ? (
          <SubmitForm requestId={request.id} maxFileSizeMB={request.maxFileSizeMB} imageCount={request.imageCount} />
        ) : (
          <div className="panel p-5 text-sm text-[#8da2c7]">
            <Link href="/signin" className="text-[#34e0ff] hover:underline">Sign in</Link> to submit an asset for this request.
          </div>
        )
      ) : (
        <div className="panel p-5 text-sm text-[#5a6c8f]">This request is closed to new submissions.</div>
      )}

      {/* Voting pool */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          In the running
          <span className="chip">{voting.length}</span>
          <span className="ml-auto text-xs font-normal text-[#5a6c8f]">{settings.upvoteThreshold} upvotes unlocks team review</span>
        </h2>
        {voting.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-[#8da2c7]">No submissions in voting yet. Be the first!</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voting.map((s) => (
              <SubmissionCard
                key={s.id}
                submission={s}
                threshold={settings.upvoteThreshold}
                votedByMe={myVotes.has(s.id)}
                isOwn={user?.id === s.authorId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Accepted showcase */}
      {accepted.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#3ce8a0]">
            Accepted <span className="chip border-[#3ce8a0]/50 text-[#3ce8a0]">{accepted.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accepted.map((s) => (
              <SubmissionCard
                key={s.id}
                submission={s}
                threshold={settings.upvoteThreshold}
                votedByMe={myVotes.has(s.id)}
                isOwn={user?.id === s.authorId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
