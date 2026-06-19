import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RequestStatus, SubmissionStatus } from "@prisma/client";

export default async function Home() {
  const [openRequests, totalSubmissions, accepted, pilots] = await Promise.all([
    prisma.collabRequest.count({ where: { status: RequestStatus.OPEN } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: SubmissionStatus.ACCEPTED } }),
    prisma.user.count(),
  ]);

  const stats = [
    { label: "Open Requests", value: openRequests },
    { label: "Submissions", value: totalSubmissions },
    { label: "Accepted Assets", value: accepted },
    { label: "Pilots", value: pilots },
  ];

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-[#1f2c47] bg-gradient-to-b from-[#0f1626] to-[#0a0e1c] px-6 py-16 text-center sm:px-10">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#f5c451]">
            ✦ AEP · Aephia Guild
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Community-sourced art for <span className="glow-cyan text-[#34e0ff]">Star Atlas</span>
          </h1>
          <p className="mx-auto max-w-2xl text-[#8da2c7]">
            The team posts asset bounties. The community generates and submits art. Pilots upvote the best,
            the team reviews the top picks, and accepted work ships straight to the repo — earning the creator
            a spot on the leaderboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/requests" className="btn-primary">
              Browse Collab Requests
            </Link>
            <Link href="/leaderboard" className="btn-ghost">
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5 text-center">
            <div className="glow-cyan font-mono text-3xl font-bold text-[#34e0ff]">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-[#8da2c7]">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { n: "01", t: "Team posts a request", d: "With a reference background and full spec: tier range, aspect ratio, resolution, format and style notes." },
          { n: "02", t: "Community submits & votes", d: "Pilots generate art to match, submit it, and upvote each other. Crossing the threshold unlocks team review." },
          { n: "03", t: "Team accepts → it ships", d: "Accepted assets commit to the configured GitHub repo and the creator earns a leaderboard point." },
        ].map((step) => (
          <div key={step.n} className="panel p-6">
            <div className="glow-gold mb-3 font-mono text-2xl font-bold text-[#f5c451]">{step.n}</div>
            <h3 className="mb-1 font-semibold text-[#e7eefc]">{step.t}</h3>
            <p className="text-sm text-[#8da2c7]">{step.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
