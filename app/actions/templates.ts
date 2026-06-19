"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, isAdmin } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

export type SpecInput = {
  name: string;
  assetType: string;
  tierMin: number;
  tierMax: number;
  aspectRatio: string;
  resolution: string;
  format: string;
  colorPalette: string;
  styleNotes: string;
  maxFileSizeMB: number;
};

function normalizeSpec(input: SpecInput) {
  const tierMin = Math.max(1, Math.floor(input.tierMin) || 1);
  const tierMax = Math.max(tierMin, Math.floor(input.tierMax) || tierMin);
  return {
    assetType: String(input.assetType || "").trim(),
    tierMin,
    tierMax,
    aspectRatio: String(input.aspectRatio || "1:1"),
    resolution: String(input.resolution || "1024x1024"),
    format: String(input.format || "PNG"),
    colorPalette: String(input.colorPalette || "").trim(),
    styleNotes: String(input.styleNotes || "").trim(),
    maxFileSizeMB: Math.min(50, Math.max(1, Math.floor(input.maxFileSizeMB) || 10)),
  };
}

export async function createTemplate(input: SpecInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole(Role.TEAM, Role.ADMIN);
    const name = String(input.name || "").trim();
    if (!name) return { ok: false, error: "Give the template a name." };

    const created = await prisma.requestTemplate.create({
      data: { name, ownerId: user.id, ...normalizeSpec(input) },
    });
    revalidatePath("/requests/new");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.TEAM, Role.ADMIN);
    const tpl = await prisma.requestTemplate.findUnique({ where: { id } });
    if (!tpl) return { ok: false, error: "Template not found." };
    if (tpl.ownerId !== user.id && !isAdmin(user.role)) {
      return { ok: false, error: "Only the owner or an admin can delete this template." };
    }
    await prisma.requestTemplate.delete({ where: { id } });
    revalidatePath("/requests/new");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
