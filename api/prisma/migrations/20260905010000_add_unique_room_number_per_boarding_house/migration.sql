-- CreateIndex
CREATE INDEX "rooms_boarding_house_id_idx" ON "rooms"("boarding_house_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_boarding_house_id_room_number_key" ON "rooms"("boarding_house_id", "room_number");
