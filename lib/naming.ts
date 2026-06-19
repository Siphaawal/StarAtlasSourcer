// Pure helpers for naming committed asset files. Shared by the accept action
// and the Team Review preview so they always agree.

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "asset"
  );
}

/** Sanitize a team-provided file name base (drops any extension and unsafe path chars). */
export function sanitizeFileNameBase(s: string): string {
  return (
    s
      .trim()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^[-._]+|[-._]+$/g, "")
      .slice(0, 80)
  );
}

export type NameParams = {
  outputFileName: string;
  assetType: string;
  title: string;
  authorName: string;
  submissionId: string;
  position: number; // 0-based
  total: number; // number of images in the submission
  tierMin: number;
  tierMax: number;
  ext: string;
};

/**
 * Build the repo file name for one image of a (possibly multi-image) submission.
 * - Single image: "<base>.<ext>"
 * - Multi image, count matches tier span: "<base>-t<tier>.<ext>"
 * - Multi image otherwise: "<base>-<n>.<ext>"
 * Falls back to "<assetType>-<author>-<id>" when no team output name is set.
 */
export function buildAssetFileName(p: NameParams): string {
  const teamBase = sanitizeFileNameBase(p.outputFileName || "");
  const tierSpan = p.tierMax - p.tierMin + 1;

  let suffix = "";
  if (p.total > 1) {
    suffix = tierSpan === p.total ? `-t${p.tierMin + p.position}` : `-${p.position + 1}`;
  }

  const base = teamBase || `${slugify(p.assetType || p.title)}-${slugify(p.authorName)}-${p.submissionId.slice(0, 6)}`;
  return `${base}${suffix}.${p.ext}`;
}

export function extOf(path: string): string {
  return path.split(".").pop()?.toLowerCase() || "png";
}
