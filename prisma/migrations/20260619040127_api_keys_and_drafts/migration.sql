-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "targetWeb" BOOLEAN NOT NULL DEFAULT true,
    "targetUE5" BOOLEAN NOT NULL DEFAULT false,
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
    "createdViaApi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "CollabRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollabRequest" ("aspectRatio", "assetType", "authorId", "backgroundPath", "colorPalette", "createdAt", "description", "format", "id", "imageCount", "maxFileSizeMB", "outputFileName", "resolution", "status", "styleNotes", "targetUE5", "targetWeb", "tierMax", "tierMin", "title") SELECT "aspectRatio", "assetType", "authorId", "backgroundPath", "colorPalette", "createdAt", "description", "format", "id", "imageCount", "maxFileSizeMB", "outputFileName", "resolution", "status", "styleNotes", "targetUE5", "targetWeb", "tierMax", "tierMin", "title" FROM "CollabRequest";
DROP TABLE "CollabRequest";
ALTER TABLE "new_CollabRequest" RENAME TO "CollabRequest";
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "upvoteThreshold" INTEGER NOT NULL DEFAULT 10,
    "githubOwner" TEXT NOT NULL DEFAULT '',
    "githubRepo" TEXT NOT NULL DEFAULT '',
    "githubBranch" TEXT NOT NULL DEFAULT 'main',
    "githubPathPrefix" TEXT NOT NULL DEFAULT 'assets',
    "agentAutoPublish" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Settings" ("githubBranch", "githubOwner", "githubPathPrefix", "githubRepo", "id", "updatedAt", "upvoteThreshold") SELECT "githubBranch", "githubOwner", "githubPathPrefix", "githubRepo", "id", "updatedAt", "upvoteThreshold" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");
