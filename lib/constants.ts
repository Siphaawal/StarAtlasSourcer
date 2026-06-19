// Hard cap on how many images a single request can ask for (and a submission can include).
export const MAX_IMAGES_PER_SUBMISSION = 5;

export function clampImageCount(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_IMAGES_PER_SUBMISSION, Math.max(1, Math.floor(n)));
}

// ─── Platform targeting ───
export type Platform = "web" | "ue5";

export function platformChips(req: { targetWeb: boolean; targetUE5: boolean }): string[] {
  const chips: string[] = [];
  if (req.targetWeb) chips.push("🌐 Web");
  if (req.targetUE5) chips.push("🎮 UE5");
  return chips;
}

// ─── ATMTA submission disclaimer ───
// NOTE: placeholder legal language — have counsel review before relying on it (tracked in TODO.md).
export const SUBMISSION_DISCLAIMER_VERSION = "v1-2026-06";

export const SUBMISSION_DISCLAIMER = `By submitting, you grant ATMTA, Inc. and Automata Studios — the creators of Star Atlas — a perpetual, irrevocable, worldwide, royalty-free, non-exclusive, sublicensable and transferable license to use, reproduce, modify, adapt, translate, distribute, publicly display and incorporate your submitted asset(s) into Star Atlas and any related products, marketing, or materials, in any media now known or later developed.

You acknowledge that ATMTA is under no obligation to use, credit, or compensate you, and that acceptance of a submission does not guarantee its use. You represent and warrant that the work is your original creation (or that you hold all necessary rights), that it does not infringe or misappropriate any third party's intellectual property, privacy, or other rights, and that it contains no confidential or unlawful content. To the maximum extent permitted by law, you waive any moral rights in the work and agree to indemnify ATMTA against claims arising from your submission.

This text is provided for convenience and is not legal advice.`;
