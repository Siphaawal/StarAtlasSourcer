"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { saveImage } from "@/lib/storage";
import { isValidSolanaAddress } from "@/lib/solana";
import { Role, RedemptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

function int(v: FormDataEntryValue | null, fallback: number): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

// ─── Admin: manage rewards ───

export async function createReward(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireRole(Role.ADMIN);
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Name is required." };
    const pointCost = Math.max(1, int(formData.get("pointCost"), 1));
    const quantity = Math.max(1, int(formData.get("quantity"), 1));

    let imagePath: string | undefined;
    const img = formData.get("image");
    if (img instanceof File && img.size > 0) {
      imagePath = await saveImage(img, "rewards", { maxBytes: 10 * 1024 * 1024 });
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description: String(formData.get("description") || "").trim(),
        pointCost,
        quantity,
        imagePath,
        createdById: admin.id,
      },
    });
    revalidatePath("/rewards");
    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    return { ok: true, id: reward.id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function setRewardActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireRole(Role.ADMIN);
    await prisma.reward.update({ where: { id }, data: { active } });
    revalidatePath("/rewards");
    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteReward(id: string): Promise<ActionResult> {
  try {
    await requireRole(Role.ADMIN);
    await prisma.reward.delete({ where: { id } });
    revalidatePath("/rewards");
    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

// ─── User: redeem a reward ───

export async function redeemReward(rewardId: string, solanaAddress: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const addr = solanaAddress.trim();
    if (!isValidSolanaAddress(addr)) return { ok: false, error: "Enter a valid Solana wallet address." };

    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) return { ok: false, error: "Reward not found." };
    if (!reward.active) return { ok: false, error: "This reward isn't available." };

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.redemption.count({ where: { rewardId, status: { not: RedemptionStatus.CANCELLED } } });
      if (claimed >= reward.quantity) throw new Error("This reward is sold out.");

      const fresh = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      if (fresh.points < reward.pointCost) throw new Error(`Not enough points — you need ${reward.pointCost}, you have ${fresh.points}.`);

      await tx.user.update({
        where: { id: user.id },
        data: { points: { decrement: reward.pointCost }, solanaAddress: addr },
      });
      await tx.redemption.create({
        data: { rewardId, userId: user.id, pointsSpent: reward.pointCost, solanaAddress: addr },
      });
    });

    revalidatePath("/rewards");
    revalidatePath("/leaderboard");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

// ─── Admin: fulfill redemptions ───

export async function markRedemptionPaid(id: string, txSignature?: string, note?: string): Promise<ActionResult> {
  try {
    const admin = await requireRole(Role.ADMIN);
    const r = await prisma.redemption.findUnique({ where: { id } });
    if (!r) return { ok: false, error: "Redemption not found." };
    if (r.status !== RedemptionStatus.PENDING) return { ok: false, error: "Only pending redemptions can be marked paid." };
    await prisma.redemption.update({
      where: { id },
      data: {
        status: RedemptionStatus.PAID,
        txSignature: txSignature?.trim() || null,
        adminNote: note?.trim() || null,
        paidById: admin.id,
        paidAt: new Date(),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/rewards");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

/** Cancel a pending redemption and refund the points (frees the slot). */
export async function cancelRedemption(id: string): Promise<ActionResult> {
  try {
    await requireRole(Role.ADMIN);
    await prisma.$transaction(async (tx) => {
      const r = await tx.redemption.findUniqueOrThrow({ where: { id } });
      if (r.status !== RedemptionStatus.PENDING) throw new Error("Only pending redemptions can be cancelled.");
      await tx.user.update({ where: { id: r.userId }, data: { points: { increment: r.pointsSpent } } });
      await tx.redemption.update({ where: { id }, data: { status: RedemptionStatus.CANCELLED } });
    });
    revalidatePath("/admin");
    revalidatePath("/rewards");
    revalidatePath("/leaderboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
