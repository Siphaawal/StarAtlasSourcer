"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setRequestStatus, deleteRequest } from "@/app/actions/requests";

export function DraftActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-[#ff5c7a]">{error}</span>}
      <button
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await setRequestStatus(requestId, "OPEN");
            if (!res.ok) setError(res.error || "Failed.");
            else router.refresh();
          });
        }}
        className="btn-success px-3 py-1.5 text-xs"
      >
        Publish
      </button>
      <button
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await deleteRequest(requestId);
            if (!res.ok) setError(res.error || "Failed.");
            else router.refresh();
          });
        }}
        className="btn-danger px-3 py-1.5 text-xs"
      >
        Discard
      </button>
    </div>
  );
}
