"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, isAdmin } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/api-keys";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

/** Create an API key for the current team/admin user. Returns the raw key ONCE. */
export async function createApiKey(name: string): Promise<ActionResult<{ rawKey: string }>> {
  try {
    const user = await requireRole(Role.TEAM, Role.ADMIN);
    const label = name.trim() || "Agent key";
    const { raw, hash, prefix } = generateApiKey();
    await prisma.apiKey.create({ data: { name: label, ownerId: user.id, hash, prefix } });
    revalidatePath("/admin");
    return { ok: true, rawKey: raw };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.TEAM, Role.ADMIN);
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return { ok: false, error: "Key not found." };
    if (key.ownerId !== user.id && !isAdmin(user.role)) {
      return { ok: false, error: "Only the owner or an admin can revoke this key." };
    }
    await prisma.apiKey.update({ where: { id }, data: { revoked: true } });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
