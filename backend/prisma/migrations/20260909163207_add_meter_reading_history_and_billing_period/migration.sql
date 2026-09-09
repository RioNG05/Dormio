-- AlterTable
ALTER TABLE "meter_readings" ADD COLUMN     "billing_month" INTEGER,
ADD COLUMN     "billing_year" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "meter_reading_histories" (
    "id" UUID NOT NULL,
    "meter_reading_id" UUID NOT NULL,
    "old_value" DECIMAL(65,30),
    "new_value" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "modified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meter_reading_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meter_reading_histories_meter_reading_id_idx" ON "meter_reading_histories"("meter_reading_id");

-- CreateIndex
CREATE INDEX "meter_readings_room_id_service_id_billing_month_billing_yea_idx" ON "meter_readings"("room_id", "service_id", "billing_month", "billing_year");

-- AddForeignKey
ALTER TABLE "meter_reading_histories" ADD CONSTRAINT "meter_reading_histories_meter_reading_id_fkey" FOREIGN KEY ("meter_reading_id") REFERENCES "meter_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_reading_histories" ADD CONSTRAINT "meter_reading_histories_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
