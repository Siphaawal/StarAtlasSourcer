/*
  Warnings:

  - You are about to drop the column `committedSha` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `committedUrl` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `imagePath` on the `Submission` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SubmissionImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "committedSha" TEXT,
    "committedUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmissionImage_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollabRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "assetType" TEXT NOT NULL DEFAULT '',
    "outputFileName" TEXT NOT NULL DEFAULT '',
    "imageCount" INTEGER NOT NULL DEFAULT 1,
    "tierMin" INTEGER NOT NULL DEFAULT 1,
    "tierMax" INTEGER NOT NULL DEFAULT 5,
    "backgroundPath" TEXT,
    "aspectRatio" TEXT NOT NULL DEFAULT '1:1',
    "resolution" TEXT NOT NULL DEFAULT '1024x1024',
    "format" TEXT NOT NULL DEFAULT 'PNG',
    "colorPalette" TEXT NOT NULL DEFAULT '',
    "styleNotes" TEXT NOT NULL DEFAULT '',
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "CollabRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollabRequest" ("aspectRatio", "assetType", "authorId", "backgroundPath", "colorPalette", "createdAt", "description", "format", "id", "maxFileSizeMB", "outputFileName", "resolution", "status", "styleNotes", "tierMax", "tierMin", "title") SELECT "aspectRatio", "assetType", "authorId", "backgroundPath", "colorPalette", "createdAt", "description", "format", "id", "maxFileSizeMB", "outputFileName", "resolution", "status", "styleNotes", "tierMax", "tierMin", "title" FROM "CollabRequest";
DROP TABLE "CollabRequest";
ALTER TABLE "new_CollabRequest" RENAME TO "CollabRequest";
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CollabRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("authorId", "createdAt", "id", "notes", "requestId", "reviewedAt", "reviewedById", "status", "title", "voteCount") SELECT "authorId", "createdAt", "id", "notes", "requestId", "reviewedAt", "reviewedById", "status", "title", "voteCount" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubmissionImage_submissionId_idx" ON "SubmissionImage"("submissionId");
