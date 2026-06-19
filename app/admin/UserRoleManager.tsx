"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/app/actions/settings";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["MEMBER", "TEAM", "ADMIN"];

type U = { id: string; username: string | null; name: string | null; image: string | null; role: Role; points: number };

export function UserRoleManager({ users, meId }: { users: U[]; meId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(userId: string, role: Role) {
    setError(null);
    start(async () => {
      const res = await updateUserRole(userId, role);
      if (!res.ok) setError(res.error || "Failed.");
      router.refresh();
    });
  }

  return (
    <div className="panel overflow-hidden">
      {error && <div className="border-b border-[#ff5c7a]/40 bg-[#ff5c7a]/5 p-2 text-xs text-[#ff5c7a]">{error}</div>}
      <div className="divide-y divide-[#1f2c47]">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2c47] text-sm font-bold text-[#8da2c7]">
                {(u.username || u.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[#e7eefc]">
                {u.username || u.name || "Pilot"}
                {u.id === meId && <span className="ml-2 text-xs text-[#34e0ff]">you</span>}
              </div>
              <div className="text-xs text-[#5a6c8f]">{u.points} pts</div>
            </div>
            <select
              value={u.role}
              disabled={pending}
              onChange={(e) => change(u.id, e.target.value as Role)}
              className="input w-32"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
