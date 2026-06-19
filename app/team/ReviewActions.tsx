"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptSubmission, rejectSubmission } from "@/app/actions/review";

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "warn" | "err"; text: string } | null>(null);

  function handle(action: "accept" | "reject") {
    setMsg(null);
    start(async () => {
      const res = action === "accept" ? await acceptSubmission(submissionId) : await rejectSubmission(submissionId);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.error || "Failed." });
        return;
      }
      if (action === "accept") {
        const warn = (res as { githubWarning?: string }).githubWarning;
        setMsg({ kind: warn ? "warn" : "ok", text: warn || "Accepted — point awarded & asset committed." });
      } else {
        setMsg({ kind: "ok", text: "Rejected." });
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button disabled={pending} onClick={() => handle("accept")} className="btn-success flex-1">
          {pending ? "…" : "✓ Accept"}
        </button>
        <button disabled={pending} onClick={() => handle("reject")} className="btn-danger flex-1">
          ✕ Reject
        </button>
      </div>
      {msg && (
        <div
          className={`text-xs ${
            msg.kind === "ok" ? "text-[#3ce8a0]" : msg.kind === "warn" ? "text-[#f5c451]" : "text-[#ff5c7a]"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
