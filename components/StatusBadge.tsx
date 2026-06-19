import { SubmissionStatus, RequestStatus } from "@prisma/client";

const SUB_STYLES: Record<SubmissionStatus, { label: string; cls: string }> = {
  PENDING: { label: "Voting", cls: "border-[#34e0ff]/40 text-[#34e0ff]" },
  TEAM_REVIEW: { label: "Team Review", cls: "border-[#7b6cff]/50 text-[#a99bff]" },
  ACCEPTED: { label: "Accepted", cls: "border-[#3ce8a0]/50 text-[#3ce8a0]" },
  REJECTED: { label: "Rejected", cls: "border-[#ff5c7a]/50 text-[#ff5c7a]" },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const s = SUB_STYLES[status];
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return status === RequestStatus.OPEN ? (
    <span className="chip border-[#3ce8a0]/50 text-[#3ce8a0]">● Open</span>
  ) : (
    <span className="chip border-[#5a6c8f]/50 text-[#5a6c8f]">Closed</span>
  );
}
