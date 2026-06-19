import { SubmissionStatus } from "@prisma/client";
import { SubmissionStatusBadge } from "./StatusBadge";
import { VoteButton } from "./VoteButton";
import { SubmissionLightbox } from "./SubmissionLightbox";

export type SubmissionCardData = {
  id: string;
  title: string;
  notes: string;
  status: SubmissionStatus;
  voteCount: number;
  author: { username: string | null; name: string | null; image: string | null };
  images: { path: string; position: number; committedUrl?: string | null }[];
};

export function SubmissionCard({
  submission,
  threshold,
  votedByMe,
  isOwn,
}: {
  submission: SubmissionCardData;
  threshold: number;
  votedByMe: boolean;
  isOwn: boolean;
}) {
  const locked = submission.status === SubmissionStatus.ACCEPTED || submission.status === SubmissionStatus.REJECTED;
  const author = submission.author.username || submission.author.name || "Pilot";
  const committed = submission.images.find((i) => i.committedUrl)?.committedUrl;

  return (
    <div className="panel panel-hover overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-[#0a0e1c]">
        <SubmissionLightbox images={submission.images} alt={submission.title || "submission"} />
        <div className="absolute left-2 top-2 z-10">
          <SubmissionStatusBadge status={submission.status} />
        </div>
        {submission.images.length > 1 && (
          <span className="absolute right-2 top-2 z-10 chip border-[#7b6cff]/50 text-[#a99bff]">
            {submission.images.length} imgs
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {submission.title && <div className="truncate text-sm font-semibold text-[#e7eefc]">{submission.title}</div>}
            <div className="truncate text-xs text-[#8da2c7]">by {author}{isOwn ? " (you)" : ""}</div>
          </div>
          <VoteButton
            submissionId={submission.id}
            initialVoted={votedByMe}
            initialCount={submission.voteCount}
            threshold={threshold}
            isOwn={isOwn}
            locked={locked}
          />
        </div>
        {submission.notes && <p className="line-clamp-2 text-xs text-[#5a6c8f]">{submission.notes}</p>}
        {committed && (
          <a href={committed} target="_blank" rel="noreferrer" className="text-xs text-[#3ce8a0] hover:underline">
            ↗ View committed asset{submission.images.length > 1 ? "s" : ""}
          </a>
        )}
      </div>
    </div>
  );
}
