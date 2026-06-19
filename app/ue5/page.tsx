import Link from "next/link";

export const metadata = { title: "UE5 Assets (Coming Soon) — Star Atlas Sourcer" };

export default function UE5Page() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="panel relative overflow-hidden p-10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#7b6cff]/10 to-transparent" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7b6cff]/40 bg-[#7b6cff]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#a99bff]">
            🎮 Coming soon
          </div>
          <h1 className="text-3xl font-bold">
            UE5 <span className="text-[#a99bff]">Assets</span>
          </h1>
          <p className="mx-auto max-w-md text-[#8da2c7]">
            Unreal Engine 5 asset bounties are on the way — meshes, materials, and props sourced from the
            community for the Star Atlas universe. Specs, submission formats, and review tooling for UE5 are
            being built out.
          </p>
          <div className="mx-auto grid max-w-md gap-2 text-left text-sm text-[#8da2c7]">
            {[
              "UE5-tagged collab requests (already supported on request creation)",
              "Submission formats for meshes & materials (.fbx, .uasset, textures)",
              "Validation against UE5 asset specs",
              "Per-platform leaderboards",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-3">
                <span className="text-[#a99bff]">◐</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/requests?platform=web" className="btn-primary">
              Browse Web requests
            </Link>
            <Link href="/requests?platform=ue5" className="btn-ghost">
              See UE5-tagged requests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
