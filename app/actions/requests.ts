"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { saveImage } from "@/lib/storage";
import { Role, RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg } from "@/lib/action-utils";
import { normalizeRequestInput } from "@/lib/request-input";

type ActionResult = { ok: boolean; error?: string; id?: string };

export async function createRequest(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.TEAM, Role.ADMIN);

    const norm = normalizeRequestInput({
      title: formData.get("title"),
      description: formData.get("description"),
      assetType: formData.get("assetType"),
      outputFileName: formData.get("outputFileName"),
      imageCount: formData.get("imageCount"),
      rewardPoints: formData.get("rewardPoints"),
      targetWeb: formData.get("targetWeb") === "on",
      targetUE5: formData.get("targetUE5") === "on",
      tierMin: formData.get("tierMin"),
      tierMax: formData.get("tierMax"),
      aspectRatio: formData.get("aspectRatio"),
      resolution: formData.get("resolution"),
      format: formData.get("format"),
      colorPalette: formData.get("colorPalette"),
      styleNotes: formData.get("styleNotes"),
      maxFileSizeMB: formData.get("maxFileSizeMB"),
    });
    if (!norm.ok) return { ok: false, error: norm.error };

    let backgroundPath: string | undefined;
    const bg = formData.get("background");
    if (bg instanceof File && bg.size > 0) {
      backgroundPath = await saveImage(bg, "backgrounds", { maxBytes: 20 * 1024 * 1024 });
    }

    const created = await prisma.collabRequest.create({
      data: { ...norm.data, backgroundPath, authorId: user.id },
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
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteRequest(requestId: string): Promise<ActionResult> {
  try {
    await requireRole(Role.TEAM, Role.ADMIN);
    await prisma.collabRequest.delete({ where: { id: requestId } });
    revalidatePath("/requests");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
