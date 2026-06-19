export type ActionResult<T = Record<never, never>> = { ok: boolean; error?: string } & Partial<T>;

/** Map internal errors to user-friendly messages for server-action responses. */
export function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : "Something went wrong.";
  if (m === "UNAUTHENTICATED") return "You must be signed in.";
  if (m === "FORBIDDEN") return "You don't have permission to do that.";
  return m;
}
