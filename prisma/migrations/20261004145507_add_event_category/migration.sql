-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CONCERT', 'PARTY', 'COMEDY', 'CONFERENCE', 'SPORT');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "category" "EventCategory" NOT NULL DEFAULT 'CONCERT';

-- CreateIndex
CREATE INDEX "Event_status_category_startsAt_idx" ON "Event"("status", "category", "startsAt");
