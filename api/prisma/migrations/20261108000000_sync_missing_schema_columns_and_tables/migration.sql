-- AlterTable
ALTER TABLE "boarding_houses" ADD COLUMN IF NOT EXISTS "monthly_payment_date" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN IF NOT EXISTS "price" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "depreciation_years" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "model_code" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "serial_number" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "supplier" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "warranty_period" VARCHAR(100);

-- CreateTable
CREATE TABLE IF NOT EXISTS "asset_maintenance_logs" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "performer" VARCHAR(255),
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "asset_maintenance_logs_asset_id_idx" ON "asset_maintenance_logs"("asset_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "asset_maintenance_logs_boarding_house_id_idx" ON "asset_maintenance_logs"("boarding_house_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_contracts_tenant_id_idx" ON "tenant_contracts"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_contracts_contract_id_idx" ON "tenant_contracts"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_contracts_tenant_id_contract_id_key" ON "tenant_contracts"("tenant_id", "contract_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'asset_maintenance_logs_asset_id_fkey'
    ) THEN
        ALTER TABLE "asset_maintenance_logs" ADD CONSTRAINT "asset_maintenance_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'asset_maintenance_logs_boarding_house_id_fkey'
    ) THEN
        ALTER TABLE "asset_maintenance_logs" ADD CONSTRAINT "asset_maintenance_logs_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "boarding_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
