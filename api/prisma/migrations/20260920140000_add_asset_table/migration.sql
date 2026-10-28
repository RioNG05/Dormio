-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('new', 'good', 'damaged', 'under_repair', 'lost', 'disposed');

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "room_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "location" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" "AssetCondition" NOT NULL DEFAULT 'good',
    "purchase_price" DECIMAL(12,2),
    "purchase_date" TIMESTAMP(3),
    "image_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_boarding_house_id_idx" ON "assets"("boarding_house_id");

-- CreateIndex
CREATE INDEX "assets_boarding_house_id_condition_idx" ON "assets"("boarding_house_id", "condition");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "boarding_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
