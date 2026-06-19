import { clampImageCount } from "@/lib/constants";

export type RequestInput = {
  title?: unknown;
  description?: unknown;
  assetType?: unknown;
  outputFileName?: unknown;
  imageCount?: unknown;
  targetWeb?: unknown;
  targetUE5?: unknown;
  tierMin?: unknown;
  tierMax?: unknown;
  aspectRatio?: unknown;
  resolution?: unknown;
  format?: unknown;
  colorPalette?: unknown;
  styleNotes?: unknown;
  maxFileSizeMB?: unknown;
};

export type NormalizedRequest = {
  title: string;
  description: string;
  assetType: string;
  outputFileName: string;
  imageCount: number;
  targetWeb: boolean;
  targetUE5: boolean;
  tierMin: number;
  tierMax: number;
  aspectRatio: string;
  resolution: string;
  format: string;
  colorPalette: string;
  styleNotes: string;
  maxFileSizeMB: number;
};

function int(v: unknown, fallback: number): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
function str(v: unknown, fallback = ""): string {
  return v === undefined || v === null ? fallback : String(v).trim();
}

/** Validate + normalize request fields shared by the create form and the REST API. */
export function normalizeRequestInput(input: RequestInput): { ok: true; data: NormalizedRequest } | { ok: false; error: string } {
  const title = str(input.title);
  if (!title) return { ok: false, error: "Title is required." };

  const targetWeb = input.targetWeb === undefined ? true : Boolean(input.targetWeb);
  const targetUE5 = Boolean(input.targetUE5);
  if (!targetWeb && !targetUE5) return { ok: false, error: "Pick at least one platform (Web or UE5)." };

  const tierMin = Math.max(1, int(input.tierMin, 1));
  const tierMax = Math.max(tierMin, int(input.tierMax, 5));
  const maxFileSizeMB = Math.min(50, Math.max(1, int(input.maxFileSizeMB, 10)));

  return {
    ok: true,
    data: {
      title,
      description: str(input.description),
      assetType: str(input.assetType),
      outputFileName: str(input.outputFileName),
      imageCount: clampImageCount(int(input.imageCount, 1)),
      targetWeb,
      targetUE5,
      tierMin,
      tierMax,
      aspectRatio: str(input.aspectRatio, "1:1") || "1:1",
      resolution: str(input.resolution, "1024x1024") || "1024x1024",
      format: str(input.format, "PNG") || "PNG",
      colorPalette: str(input.colorPalette),
      styleNotes: str(input.styleNotes),
      maxFileSizeMB,
    },
  };
}
