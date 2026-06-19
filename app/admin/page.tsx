import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";
import { UserRoleManager } from "./UserRoleManager";
import { ApiKeysManager } from "./ApiKeysManager";
import { RewardsManager } from "./RewardsManager";
import { RedemptionsQueue } from "./RedemptionsQueue";
import { listRewardsWithStats } from "@/lib/rewards";

export const metadata = { title: "Admin — Star Atlas Sourcer" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!isAdmin(user.role)) redirect("/");

  const [settings, users, apiKeys, rewards, pendingRedemptions] = await Promise.all([
    getSettings(),
    prisma.user.findMany({ orderBy: [{ role: "asc" }, { points: "desc" }], take: 200 }),
    prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { username: true, name: true } } },
    }),
    listRewardsWithStats(),
    prisma.redemption.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { reward: { select: { name: true } }, user: { select: { username: true, name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-[#8da2c7]">Configure voting, the GitHub commit target, and member roles.</p>
        </div>
        <Link href="/requests/new" className="btn-gold whitespace-nowrap">+ New Request</Link>
      </div>

      <SettingsForm settings={settings} tokenPresent={!!process.env.GITHUB_TOKEN} />

      <ApiKeysManager keys={apiKeys} />

      <RewardsManager rewards={rewards} />

      <RedemptionsQueue pending={pendingRedemptions} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Members &amp; roles</h2>
        <p className="text-sm text-[#8da2c7]">
          <span className="font-semibold text-[#34e0ff]">TEAM</span> can post requests and review.{" "}
          <span className="font-semibold text-[#f5c451]">ADMIN</span> can also change settings and roles.
        </p>
        <UserRoleManager users={users} meId={user.id} />
      </section>
    </div>
  );
}
