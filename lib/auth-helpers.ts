import { auth } from "@/auth";
import { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Returns the user or throws a 401-ish error for server actions. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Throws unless the current user has one of the allowed roles. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export function canReview(role?: Role | null) {
  return role === Role.TEAM || role === Role.ADMIN;
}

export function isAdmin(role?: Role | null) {
  return role === Role.ADMIN;
}
