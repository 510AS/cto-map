-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Day" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayLabel" TEXT NOT NULL,
    "learnTask" TEXT NOT NULL,
    "buildTask" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "learnComplete" BOOLEAN NOT NULL DEFAULT false,
    "buildComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "note" TEXT,
    "weekId" INTEGER NOT NULL,
    CONSTRAINT "Day_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Day" ("buildTask", "completedAt", "dayLabel", "id", "isComplete", "learnTask", "note", "sortOrder", "weekId") SELECT "buildTask", "completedAt", "dayLabel", "id", "isComplete", "learnTask", "note", "sortOrder", "weekId" FROM "Day";
DROP TABLE "Day";
ALTER TABLE "new_Day" RENAME TO "Day";
CREATE UNIQUE INDEX "Day_weekId_sortOrder_key" ON "Day"("weekId", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
