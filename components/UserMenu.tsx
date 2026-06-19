"use client";

import { signIn, signOut } from "next-auth/react";
import Link from "next/link";

type Props = {
  user: { name?: string | null; username?: string | null; image?: string | null; role: string; points: number } | null;
};

export function UserMenu({ user }: Props) {
  if (!user) {
    return (
      <button onClick={() => signIn()} className="btn-primary">
        Sign in
      </button>
    );
  }

  const display = user.username || user.name || "Pilot";
  const initial = display.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Link href="/leaderboard" className="hidden items-center gap-1.5 sm:flex">
        <span className="text-xs text-[#8da2c7]">Points</span>
        <span className="glow-gold font-mono font-bold text-[#f5c451]">{user.points}</span>
      </Link>
      <div className="flex items-center gap-2 rounded-full border border-[#1f2c47] bg-[#0a0e1c] py-1 pl-1 pr-3">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#34e0ff]/20 text-sm font-bold text-[#34e0ff]">
            {initial}
          </span>
        )}
        <div className="leading-tight">
          <div className="text-xs font-medium text-[#e7eefc]">{display}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5a6c8f]">{user.role}</div>
        </div>
      </div>
      <button onClick={() => signOut()} className="btn-ghost px-3 py-1.5 text-xs">
        Sign out
      </button>
    </div>
  );
}
