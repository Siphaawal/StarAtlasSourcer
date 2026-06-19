-- CreateTable
CREATE TABLE "RequestTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL DEFAULT '',
    "tierMin" INTEGER NOT NULL DEFAULT 1,
    "tierMax" INTEGER NOT NULL DEFAULT 5,
    "aspectRatio" TEXT NOT NULL DEFAULT '1:1',
    "resolution" TEXT NOT NULL DEFAULT '1024x1024',
    "format" TEXT NOT NULL DEFAULT 'PNG',
    "colorPalette" TEXT NOT NULL DEFAULT '',
    "styleNotes" TEXT NOT NULL DEFAULT '',
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
