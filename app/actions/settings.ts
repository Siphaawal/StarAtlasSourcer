"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { verifyGithubAccess } from "@/lib/github";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole(Role.ADMIN);
    const threshold = Math.max(1, parseInt(String(formData.get("upvoteThreshold") || "5"), 10) || 5);

    await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        upvoteThreshold: threshold,
        githubOwner: String(formData.get("githubOwner") || "").trim(),
        githubRepo: String(formData.get("githubRepo") || "").trim(),
        githubBranch: String(formData.get("githubBranch") || "main").trim() || "main",
        githubPathPrefix: String(formData.get("githubPathPrefix") || "assets").trim(),
      },
      create: {
        id: 1,
        upvoteThreshold: threshold,
        githubOwner: String(formData.get("githubOwner") || "").trim(),
        githubRepo: String(formData.get("githubRepo") || "").trim(),
        githubBranch: String(formData.get("githubBranch") || "main").trim() || "main",
        githubPathPrefix: String(formData.get("githubPathPrefix") || "assets").trim(),
      },
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function testGithubConnection(owner: string, repo: string): Promise<ActionResult<{ message: string }>> {
  try {
    await requireRole(Role.ADMIN);
    const res = await verifyGithubAccess({ owner: owner.trim(), repo: repo.trim() });
    return { ok: res.ok, error: res.ok ? undefined : res.message, message: res.message };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function updateUserRole(userId: string, role: Role): Promise<ActionResult> {
  try {
    const admin = await requireRole(Role.ADMIN);
    if (userId === admin.id && role !== Role.ADMIN) {
      return { ok: false, error: "You can't demote yourself." };
    }
    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
