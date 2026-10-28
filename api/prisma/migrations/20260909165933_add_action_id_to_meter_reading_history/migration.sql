-- AlterTable
ALTER TABLE "meter_reading_histories" ADD COLUMN     "action_id" UUID;

-- CreateIndex
CREATE INDEX "meter_reading_histories_action_id_idx" ON "meter_reading_histories"("action_id");
