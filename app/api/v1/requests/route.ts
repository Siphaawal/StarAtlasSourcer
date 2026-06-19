import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiKey, bearerFrom } from "@/lib/api-keys";
import { normalizeRequestInput } from "@/lib/request-input";
import { saveRemoteImage } from "@/lib/storage";
import { getSettings } from "@/lib/settings";
import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
}

/**
 * POST /api/v1/requests
 * Auth: Authorization: Bearer <api key>
 * Body (JSON): { title*, description?, assetType?, outputFileName?, imageCount?,
 *   targetWeb?, targetUE5?, tierMin?, tierMax?, aspectRatio?, resolution?, format?,
 *   colorPalette?, styleNotes?, maxFileSizeMB?, backgroundUrl?, publish? }
 * `publish` overrides the admin default (Settings.agentAutoPublish): true → OPEN, false → DRAFT.
 */
export async function POST(req: Request) {
  const user = await resolveApiKey(bearerFrom(req.headers.get("authorization")));
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const norm = normalizeRequestInput(body);
  if (!norm.ok) return NextResponse.json({ error: norm.error }, { status: 400 });

  // Optional background via URL.
  let backgroundPath: string | undefined;
  if (typeof body.backgroundUrl === "string" && body.backgroundUrl.trim()) {
    try {
      backgroundPath = await saveRemoteImage(body.backgroundUrl.trim(), "backgrounds", { maxBytes: 20 * 1024 * 1024 });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Background fetch failed." }, { status: 400 });
    }
  }

  const settings = await getSettings();
  const publish = typeof body.publish === "boolean" ? body.publish : settings.agentAutoPublish;
  const status = publish ? RequestStatus.OPEN : RequestStatus.DRAFT;

  const created = await prisma.collabRequest.create({
    data: { ...norm.data, backgroundPath, authorId: user.id, status, createdViaApi: true },
  });

  revalidatePath("/requests");
  revalidatePath("/admin");

  const origin = new URL(req.url).origin;
  return NextResponse.json(
    {
      id: created.id,
      status: created.status,
      title: created.title,
      url: `${origin}/requests/${created.id}`,
      author: user.username || user.name,
    },
    { status: 201 }
  );
}

/** GET /api/v1/requests — list recent requests (auth required). */
export async function GET(req: Request) {
  const user = await resolveApiKey(bearerFrom(req.headers.get("authorization")));
  if (!user) return unauthorized();

  const requests = await prisma.collabRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      assetType: true,
      imageCount: true,
      targetWeb: true,
      targetUE5: true,
      createdViaApi: true,
      createdAt: true,
      _count: { select: { submissions: true } },
    },
  });
  return NextResponse.json({ requests });
}
