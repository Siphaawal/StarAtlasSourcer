"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRequestStatus } from "@/app/actions/requests";
import type { RequestStatus } from "@prisma/client";

export function RequestStatusToggle({ requestId, status }: { requestId: string; status: RequestStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next: RequestStatus = status === "OPEN" ? "CLOSED" : "OPEN";

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setRequestStatus(requestId, next);
          router.refresh();
        })
      }
      className="btn-ghost px-3 py-1.5 text-xs"
    >
      {pending ? "…" : next === "CLOSED" ? "Close request" : "Reopen request"}
    </button>
  );
}
