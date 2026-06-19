import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const PREFIX = "sas_";

export function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Generate a new raw API key + its storable hash/prefix. Raw is shown to the user once. */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = PREFIX + randomBytes(24).toString("hex");
  return { raw, hash: hashKey(raw), prefix: raw.slice(0, 12) };
}

/**
 * Resolve an API key to its owning team/admin user, or null if invalid/revoked.
 * Updates lastUsedAt on success.
 */
export async function resolveApiKey(raw: string | null | undefined) {
  if (!raw || !raw.startsWith(PREFIX)) return null;
  const record = await prisma.apiKey.findUnique({ where: { hash: hashKey(raw) }, include: { owner: true } });
  if (!record || record.revoked) return null;
  if (record.owner.role !== Role.TEAM && record.owner.role !== Role.ADMIN) return null;
  await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
  return record.owner;
}

/** Extract a Bearer token from an Authorization header. */
export function bearerFrom(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
