"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { saveImage } from "@/lib/storage";
import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

export async function submitAsset(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const requestId = String(formData.get("requestId") || "");
    if (!requestId) return { ok: false, error: "Missing request." };

    const request = await prisma.collabRequest.findUnique({ where: { id: requestId } });
    if (!request) return { ok: false, error: "Request not found." };
    if (request.status !== RequestStatus.OPEN) return { ok: false, error: "This request is closed." };

    // The author must accept the ATMTA usage disclaimer.
    if (formData.get("agree") !== "on") {
      return { ok: false, error: "You must accept the submission terms before submitting." };
    }

    // A submission must include exactly the number of images the team requested.
    const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    const required = request.imageCount;
    if (files.length < required) {
      return { ok: false, error: `This request needs ${required} image${required === 1 ? "" : "s"} — you added ${files.length}.` };
    }
    if (files.length > required) {
      return { ok: false, error: `This request only accepts ${required} image${required === 1 ? "" : "s"} — you added ${files.length}.` };
    }

    // Save all images first (so a later failure doesn't create a partial submission).
    const paths: string[] = [];
    for (const file of files) {
      paths.push(await saveImage(file, "submissions", { maxBytes: request.maxFileSizeMB * 1024 * 1024 }));
    }

    const created = await prisma.submission.create({
      data: {
        requestId,
        authorId: user.id,
        title: String(formData.get("title") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
        termsAcceptedAt: new Date(),
        images: { create: paths.map((path, position) => ({ path, position })) },
      },
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/submissions");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
