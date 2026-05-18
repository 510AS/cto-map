/*
  Warnings:

  - A unique constraint covering the columns `[weekId,sortOrder]` on the table `Day` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Day_weekId_sortOrder_key" ON "Day"("weekId", "sortOrder");
