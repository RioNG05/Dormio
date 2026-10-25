-- AlterTable
ALTER TABLE "mass_notification_jobs" ADD COLUMN "target_ids" UUID[] NOT NULL DEFAULT '{}';

