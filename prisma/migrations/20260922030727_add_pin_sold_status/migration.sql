-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "imageUrl" TEXT,
    "acquisitionDate" DATETIME,
    "acquisitionMethod" TEXT NOT NULL DEFAULT 'BOUGHT',
    "pricePaid" REAL,
    "currentValue" REAL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OWNED',
    "soldPrice" REAL,
    "soldDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pin" ("acquisitionDate", "acquisitionMethod", "createdAt", "currentValue", "id", "imageUrl", "name", "notes", "pricePaid", "series", "updatedAt") SELECT "acquisitionDate", "acquisitionMethod", "createdAt", "currentValue", "id", "imageUrl", "name", "notes", "pricePaid", "series", "updatedAt" FROM "Pin";
DROP TABLE "Pin";
ALTER TABLE "new_Pin" RENAME TO "Pin";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
