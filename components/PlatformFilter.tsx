import Link from "next/link";

const OPTIONS = [
  { key: "all", label: "All platforms" },
  { key: "web", label: "🌐 Web" },
  { key: "ue5", label: "🎮 UE5" },
];

/** Platform filter pills. `hrefFor` lets each page preserve its own other query params. */
export function PlatformFilter({ current, hrefFor }: { current: string; hrefFor: (key: string) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <Link
          key={o.key}
          href={hrefFor(o.key)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            current === o.key
              ? "border-[#7b6cff] bg-[#7b6cff]/10 text-[#a99bff]"
              : "border-[#1f2c47] text-[#8da2c7] hover:border-[#7b6cff]/40"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/** Prisma where-fragment for a platform filter value. */
export function platformWhere(platform?: string) {
  if (platform === "web") return { targetWeb: true };
  if (platform === "ue5") return { targetUE5: true };
  return {};
}
