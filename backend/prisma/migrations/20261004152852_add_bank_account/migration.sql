/*
  Warnings:

  - A unique constraint covering the columns `[order_code]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GrievanceType" AS ENUM ('complaint', 'inquiry', 'feedback');

-- AlterEnum
ALTER TYPE "BillingCycle" ADD VALUE 'quarterly';

-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'locked';

-- DropForeignKey
ALTER TABLE "grievances" DROP CONSTRAINT "grievances_boarding_house_id_fkey";

-- DropForeignKey
ALTER TABLE "grievances" DROP CONSTRAINT "grievances_room_id_fkey";

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "check_in_explanation" TEXT,
ADD COLUMN     "check_in_photo" TEXT,
ADD COLUMN     "check_in_watermark" JSONB,
ADD COLUMN     "check_out_explanation" TEXT,
ADD COLUMN     "check_out_photo" TEXT,
ADD COLUMN     "check_out_watermark" JSONB,
ADD COLUMN     "duty_tasks" JSONB,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "grievances" ADD COLUMN     "type" "GrievanceType" NOT NULL DEFAULT 'complaint',
ALTER COLUMN "boarding_house_id" DROP NOT NULL,
ALTER COLUMN "room_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "order_code" BIGINT,
ADD COLUMN     "payment_link_id" TEXT,
ALTER COLUMN "paid_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "price_quarterly" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_user_id_key" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE INDEX "grievances_type_idx" ON "grievances"("type");

-- CreateIndex
CREATE INDEX "grievances_status_idx" ON "grievances"("status");

-- CreateIndex
CREATE INDEX "grievances_tenant_id_idx" ON "grievances"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_code_key" ON "payments"("order_code");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "boarding_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
