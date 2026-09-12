-- AlterTable
ALTER TABLE "employee_assignments" ALTER COLUMN "left_at" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SavedPost_post_id_savedBy_key" ON "SavedPost"("post_id", "savedBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employee_assignments_boarding_house_id_status_idx" ON "employee_assignments"("boarding_house_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employee_assignments_employee_id_idx" ON "employee_assignments"("employee_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_positions_boarding_house_id_idx" ON "job_positions"("boarding_house_id");
