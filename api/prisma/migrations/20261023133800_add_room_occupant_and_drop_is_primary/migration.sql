-- CreateEnum
CREATE TYPE "OccupantStatus" AS ENUM ('active', 'moved_out');

-- AlterTable
ALTER TABLE "tenant_contracts" DROP COLUMN "is_primary";

-- CreateTable
CREATE TABLE "room_occupants" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "status" "OccupantStatus" NOT NULL DEFAULT 'active',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "room_occupants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_occupants_boarding_house_id_status_idx" ON "room_occupants"("boarding_house_id", "status");

-- CreateIndex
CREATE INDEX "room_occupants_room_id_idx" ON "room_occupants"("room_id");

-- CreateIndex
CREATE INDEX "room_occupants_tenant_id_idx" ON "room_occupants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_occupants_room_id_tenant_id_status_key" ON "room_occupants"("room_id", "tenant_id", "status");

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "boarding_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

