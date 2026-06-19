import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { canReview, isAdmin } from "@/lib/auth-helpers";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const user = await getCurrentUser();

  const links: { href: string; label: string }[] = [
    { href: "/requests", label: "Collab Requests" },
    { href: "/submissions", label: "Submissions" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];
  if (canReview(user?.role)) links.push({ href: "/team", label: "Team Review" });
  if (isAdmin(user?.role)) links.push({ href: "/admin", label: "Admin" });

  return (
    <header className="sticky top-0 z-40 border-b border-[#1f2c47] bg-[#05070f]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#34e0ff]/40 bg-[#0a0e1c] text-lg">
            <span className="glow-cyan">✦</span>
          </span>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight text-[#e7eefc]">
              STAR ATLAS <span className="text-[#34e0ff]">SOURCER</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#b8923a]">AEP · Aephia Guild</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#8da2c7] transition hover:bg-[#141d33] hover:text-[#e7eefc]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <UserMenu user={user} />
      </div>

      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-[#1f2c47] px-4 py-2 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-[#8da2c7] hover:text-[#e7eefc]"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
