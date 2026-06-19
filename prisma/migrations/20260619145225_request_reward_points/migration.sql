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
    "rewardPoints" INTEGER NOT NULL DEFAULT 1,
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
INSERT INTO "new_CollabRequest" ("aspectRatio", "assetType", "authorId", "backgroundPath", "colorPalette", "createdAt", "createdViaApi", "description", "format", "id", "imageCount", "maxFileSizeMB", "outputFileName", "resolution", "status", "styleNotes", "targetUE5", "targetWeb", "tierMax", "tierMin", "title") SELECT "aspectRatio", "assetType", "authorId", "backgroundPath", "colorPalette", "createdAt", "createdViaApi", "description", "format", "id", "imageCount", "maxFileSizeMB", "outputFileName", "resolution", "status", "styleNotes", "targetUE5", "targetWeb", "tierMax", "tierMin", "title" FROM "CollabRequest";
DROP TABLE "CollabRequest";
ALTER TABLE "new_CollabRequest" RENAME TO "CollabRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
