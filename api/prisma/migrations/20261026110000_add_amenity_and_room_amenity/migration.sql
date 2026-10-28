-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(100),
    "is_shared" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_amenities" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "amenities_boarding_house_id_idx" ON "amenities"("boarding_house_id");

-- CreateIndex
CREATE INDEX "room_amenities_room_id_idx" ON "room_amenities"("room_id");

-- CreateIndex
CREATE INDEX "room_amenities_amenity_id_idx" ON "room_amenities"("amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_amenities_room_id_amenity_id_key" ON "room_amenities"("room_id", "amenity_id");

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "boarding_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_amenities" ADD CONSTRAINT "room_amenities_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_amenities" ADD CONSTRAINT "room_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
