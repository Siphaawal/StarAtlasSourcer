"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { saveImage } from "@/lib/storage";
import { Role, RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg } from "@/lib/action-utils";
import { clampImageCount } from "@/lib/constants";

type ActionResult = { ok: boolean; error?: string; id?: string };

function num(v: FormDataEntryValue | null, fallback: number): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function createRequest(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.TEAM, Role.ADMIN);

    const title = String(formData.get("title") || "").trim();
    if (!title) return { ok: false, error: "Title is required." };

    const tierMin = Math.max(1, num(formData.get("tierMin"), 1));
    const tierMax = Math.max(tierMin, num(formData.get("tierMax"), 5));
    const maxFileSizeMB = Math.min(50, Math.max(1, num(formData.get("maxFileSizeMB"), 10)));

    let backgroundPath: string | undefined;
    const bg = formData.get("background");
    if (bg instanceof File && bg.size > 0) {
      backgroundPath = await saveImage(bg, "backgrounds", { maxBytes: 20 * 1024 * 1024 });
    }

    const created = await prisma.collabRequest.create({
      data: {
        title,
        description: String(formData.get("description") || ""),
        assetType: String(formData.get("assetType") || ""),
        outputFileName: String(formData.get("outputFileName") || "").trim(),
        imageCount: clampImageCount(num(formData.get("imageCount"), 1)),
        tierMin,
        tierMax,
        aspectRatio: String(formData.get("aspectRatio") || "1:1"),
        resolution: String(formData.get("resolution") || "1024x1024"),
        format: String(formData.get("format") || "PNG"),
        colorPalette: String(formData.get("colorPalette") || ""),
        styleNotes: String(formData.get("styleNotes") || ""),
        maxFileSizeMB,
        backgroundPath,
        authorId: user.id,
      },
    });

    revalidatePath("/requests");
    revalidatePath("/admin");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function setRequestStatus(requestId: string, status: RequestStatus): Promise<ActionResult> {
  try {
    await requireRole(Role.TEAM, Role.ADMIN);
    await prisma.collabRequest.update({ where: { id: requestId }, data: { status } });
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
