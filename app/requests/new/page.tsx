import { redirect } from "next/navigation";
import { getCurrentUser, canReview, isAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RequestForm } from "./RequestForm";

export const metadata = { title: "New Request — Star Atlas Sourcer" };

const SPEC_SELECT = {
  assetType: true,
  tierMin: true,
  tierMax: true,
  aspectRatio: true,
  resolution: true,
  format: true,
  colorPalette: true,
  styleNotes: true,
  maxFileSizeMB: true,
} as const;

export default async function NewRequestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!canReview(user.role)) redirect("/requests");

  const [templates, requests] = await Promise.all([
    prisma.requestTemplate.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, ownerId: true, ...SPEC_SELECT },
    }),
    prisma.collabRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, ...SPEC_SELECT },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Collab Request</h1>
        <p className="text-sm text-[#8da2c7]">Post a bounty for the community to fulfill.</p>
      </div>
      <RequestForm
        templates={templates}
        requests={requests}
        currentUserId={user.id}
        isAdmin={isAdmin(user.role)}
      />
    </div>
  );
}
