// Hard cap on how many images a single request can ask for (and a submission can include).
export const MAX_IMAGES_PER_SUBMISSION = 5;

export function clampImageCount(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_IMAGES_PER_SUBMISSION, Math.max(1, Math.floor(n)));
}
