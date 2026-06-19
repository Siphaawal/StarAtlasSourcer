"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { commitAssetToGithub, githubConfigured } from "@/lib/github";
import { buildAssetFileName, extOf } from "@/lib/naming";
import { Role, SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

export async function rejectSubmission(submissionId: string): Promise<ActionResult> {
  try {
    const reviewer = await requireRole(Role.TEAM, Role.ADMIN);
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return { ok: false, error: "Submission not found." };
    if (submission.status === SubmissionStatus.ACCEPTED) {
      return { ok: false, error: "Already accepted; cannot reject." };
    }
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.REJECTED, reviewedById: reviewer.id, reviewedAt: new Date() },
    });
    revalidatePath("/team");
    revalidatePath(`/requests/${submission.requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

/**
 * Accept a submission: award the author a leaderboard point and (if configured)
 * commit every image to the team's GitHub repo. GitHub failure does not block the
 * acceptance/point award — it's reported back so the team can retry config.
 */
export async function acceptSubmission(
  submissionId: string
): Promise<ActionResult<{ githubWarning?: string; committedCount?: number }>> {
  try {
    const reviewer = await requireRole(Role.TEAM, Role.ADMIN);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { author: true, request: true, images: { orderBy: { position: "asc" } } },
    });
    if (!submission) return { ok: false, error: "Submission not found." };
    if (submission.status === SubmissionStatus.ACCEPTED) {
      return { ok: false, error: "This submission is already accepted." };
    }

    // Award the point + mark accepted atomically.
    await prisma.$transaction([
      prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.ACCEPTED, reviewedById: reviewer.id, reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: submission.authorId },
        data: { points: { increment: submission.request.rewardPoints } },
      }),
    ]);

    // Commit every image (best-effort).
    let githubWarning: string | undefined;
    let committedCount = 0;
    const settings = await getSettings();
    const target = {
      owner: settings.githubOwner,
      repo: settings.githubRepo,
      branch: settings.githubBranch,
      pathPrefix: settings.githubPathPrefix,
    };
    const author = submission.author.username || submission.author.name || "pilot";

    if (githubConfigured(target)) {
      const total = submission.images.length;
      const failures: string[] = [];
      for (const image of submission.images) {
        try {
          const ext = extOf(image.path);
          const destFileName = buildAssetFileName({
            outputFileName: submission.request.outputFileName,
            assetType: submission.request.assetType,
            title: submission.request.title,
            authorName: author,
            submissionId: submission.id,
            position: image.position,
            total,
            tierMin: submission.request.tierMin,
            tierMax: submission.request.tierMax,
            ext,
          });
          const commit = await commitAssetToGithub({
            target,
            localPublicPath: image.path,
            destFileName,
            commitMessage: `Add ${submission.request.title} (${destFileName}) by ${author} — accepted via Star Atlas Sourcer`,
          });
          await prisma.submissionImage.update({
            where: { id: image.id },
            data: { committedSha: commit.sha, committedUrl: commit.url },
          });
          committedCount++;
        } catch (ghError) {
          failures.push(errMsg(ghError));
        }
      }
      if (failures.length) {
        githubWarning = `Accepted & point awarded. Committed ${committedCount}/${total} image${total === 1 ? "" : "s"}; ${failures.length} failed: ${failures[0]}`;
      }
    } else {
      githubWarning = "Accepted & point awarded. GitHub is not configured, so nothing was committed.";
    }

    revalidatePath("/team");
    revalidatePath("/leaderboard");
    revalidatePath("/submissions");
    revalidatePath(`/requests/${submission.requestId}`);
    return { ok: true, githubWarning, committedCount };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
