"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { errMsg, type ActionResult } from "@/lib/action-utils";

/**
 * Toggle the current user's upvote on a submission.
 * When a submission's vote count reaches the admin threshold, it is promoted
 * to TEAM_REVIEW (and only then becomes visible to the team).
 */
export async function toggleVote(submissionId: string): Promise<ActionResult<{ voted: boolean; voteCount: number; promoted: boolean }>> {
  try {
    const user = await requireUser();

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return { ok: false, error: "Submission not found." };
    if (submission.authorId === user.id) return { ok: false, error: "You can't upvote your own submission." };
    if (submission.status === SubmissionStatus.ACCEPTED || submission.status === SubmissionStatus.REJECTED) {
      return { ok: false, error: "Voting is closed for this submission." };
    }

    const existing = await prisma.vote.findUnique({
      where: { submissionId_userId: { submissionId, userId: user.id } },
    });

    const settings = await getSettings();
    const threshold = Math.max(1, settings.upvoteThreshold);

    const result = await prisma.$transaction(async (tx) => {
      let voted: boolean;
      if (existing) {
        await tx.vote.delete({ where: { id: existing.id } });
        voted = false;
      } else {
        await tx.vote.create({ data: { submissionId, userId: user.id } });
        voted = true;
      }

      const voteCount = await tx.vote.count({ where: { submissionId } });

      // Promote/demote based on threshold (only while still in the community phase).
      let status = submission.status;
      let promoted = false;
      if (status === SubmissionStatus.PENDING && voteCount >= threshold) {
        status = SubmissionStatus.TEAM_REVIEW;
        promoted = true;
      } else if (status === SubmissionStatus.TEAM_REVIEW && voteCount < threshold) {
        // votes removed below threshold before review → back to community phase
        status = SubmissionStatus.PENDING;
      }

      await tx.submission.update({ where: { id: submissionId }, data: { voteCount, status } });
      return { voted, voteCount, promoted };
    });

    revalidatePath(`/requests/${submission.requestId}`);
    revalidatePath("/team");
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
