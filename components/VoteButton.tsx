"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleVote } from "@/app/actions/votes";

export function VoteButton({
  submissionId,
  initialVoted,
  initialCount,
  threshold,
  isOwn,
  locked,
}: {
  submissionId: string;
  initialVoted: boolean;
  initialCount: number;
  threshold: number;
  isOwn: boolean;
  locked: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const authed = status === "authenticated";
  const disabled = pending || isOwn || locked || !authed;
  const remaining = Math.max(0, threshold - count);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await toggleVote(submissionId);
      if (!res.ok) {
        setError(res.error || "Failed.");
        return;
      }
      setVoted(!!res.voted);
      setCount(res.voteCount ?? count);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        title={isOwn ? "You can't vote on your own submission" : locked ? "Voting closed" : !authed ? "Sign in to vote" : ""}
        className={`btn px-3 py-1.5 text-sm ${
          voted
            ? "bg-[#34e0ff] text-[#05070f] hover:bg-[#5fe9ff]"
            : "border border-[#1f2c47] text-[#e7eefc] hover:border-[#34e0ff]/50 hover:bg-[#141d33]"
        }`}
      >
        <span>▲</span>
        <span className="font-mono">{count}</span>
      </button>
      {!locked && remaining > 0 && (
        <span className="text-[10px] text-[#5a6c8f]">{remaining} to review</span>
      )}
      {error && <span className="max-w-[160px] text-right text-[10px] text-[#ff5c7a]">{error}</span>}
    </div>
  );
}
