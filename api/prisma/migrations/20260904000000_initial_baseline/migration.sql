-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AiMessageRole" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "public"."AssignmentStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('not_yet', 'on_time', 'late', 'absent');

-- CreateEnum
CREATE TYPE "public"."AuditLogAction" AS ENUM ('create', 'update', 'delete', 'login', 'payment');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "public"."BoardingHouseStatus" AS ENUM ('active', 'inactive', 'banned');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('draft', 'active', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "public"."DepositStatus" AS ENUM ('pending', 'paid', 'refund', 'forfeited');

-- CreateEnum
CREATE TYPE "public"."DepositType" AS ENUM ('contract', 'platform');

-- CreateEnum
CREATE TYPE "public"."ExpenseStatus" AS ENUM ('pending', 'paid', 'canceled');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "public"."GrievencePriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "public"."GrievenceStatus" AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('unpaid', 'paid', 'overdue');

-- CreateEnum
CREATE TYPE "public"."MessageAttachmentType" AS ENUM ('image', 'file');

-- CreateEnum
CREATE TYPE "public"."NofifyTarget" AS ENUM ('all_users', 'all_landlords', 'all_staff', 'all_admins', 'specific_user');

-- CreateEnum
CREATE TYPE "public"."NotifyChannel" AS ENUM ('zalo', 'sms', 'email');

-- CreateEnum
CREATE TYPE "public"."NotifyStatus" AS ENUM ('pending', 'sent', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "public"."OtpPurpose" AS ENUM ('login_verifycation', 'reset_password');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('cash', 'banking');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('charge', 'refund');

-- CreateEnum
CREATE TYPE "public"."PostPurchaseStatus" AS ENUM ('pending', 'paid', 'canceled', 'failed');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('draft', 'posted', 'hidden');

-- CreateEnum
CREATE TYPE "public"."RoomStatus" AS ENUM ('available', 'deposited', 'occupied', 'maintainace');

-- CreateEnum
CREATE TYPE "public"."ScheduleStatus" AS ENUM ('scheduled', 'canceled');

-- CreateEnum
CREATE TYPE "public"."ServiceStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."SourceType" AS ENUM ('free_quote', 'purchased');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPackage" AS ENUM ('free', 'plus', 'pro');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('pending', 'active', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('leasing_agent', 'tenant', 'employee', 'landlord', 'admin');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'inactive', 'banned');

-- CreateTable
CREATE TABLE "public"."PostImage" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostReach" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "viewed_by" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostReach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedPost" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "savedBy" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_messages" (
    "id" UUID NOT NULL,
    "ai_conversation_id" UUID NOT NULL,
    "role" "public"."AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "token_usage" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendances" (
    "id" UUID NOT NULL,
    "work_schedule_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'not_yet',
    "edited_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "boarding_house_id" UUID,
    "action" "public"."AuditLogAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."boarding_houses" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "country" VARCHAR(255) NOT NULL,
    "province" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "ward" VARCHAR(255) NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "house_number" VARCHAR(255) NOT NULL,
    "status" "public"."BoardingHouseStatus" NOT NULL DEFAULT 'active',
    "thumbnail" TEXT,
    "total_floor" INTEGER,
    "built_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boarding_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_documents" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "rent_price" DECIMAL(65,30) NOT NULL,
    "monthly_payment_date" INTEGER NOT NULL,
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deposits" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "contract_id" UUID,
    "post_id" UUID,
    "type" "public"."DepositType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."DepositStatus" NOT NULL,
    "recored_manually" BOOLEAN NOT NULL,
    "recored_by" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_assignments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'active',
    "joined_at" TIMESTAMP(3) NOT NULL,
    "left_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenses" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "room_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "public"."ExpenseStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grievance_images" (
    "id" UUID NOT NULL,
    "grievance_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grievances" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."GrievencePriority" NOT NULL DEFAULT 'medium',
    "status" "public"."GrievenceStatus" NOT NULL DEFAULT 'pending',
    "resolved_by" UUID,
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "contract_id" UUID,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_item" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "service_id" UUID,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_positions" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mass_notification_jobs" (
    "id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "channel" "public"."NotifyChannel" NOT NULL,
    "targetType" "public"."NofifyTarget" NOT NULL,
    "targetId" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."NotifyStatus" NOT NULL DEFAULT 'pending',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mass_notification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_attachments" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "type" "public"."MessageAttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "isReacted" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meter_readings" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "reading_value" DECIMAL(65,30),
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_id" UUID,

    CONSTRAINT "meter_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."otp_codes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "public"."OtpPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "payment_refund_id" UUID,
    "deposit_id" UUID,
    "post_purchase_id" UUID,
    "subscription_id" UUID,
    "payer_id" UUID,
    "invoice_id" UUID,
    "type" "public"."PaymentType" NOT NULL,
    "amount" DECIMAL NOT NULL,
    "qr_code_url" TEXT,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "transaction_ref" TEXT,
    "receipt_number" VARCHAR(255),
    "paid_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_purchases" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "quantity_purchase" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."PostPurchaseStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" UUID NOT NULL,
    "posted_by" UUID NOT NULL,
    "room_id" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deposti_amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."PostStatus" NOT NULL,
    "source_type" "public"."SourceType" NOT NULL,
    "post_purchase_id" UUID,
    "resulted_contract_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recurrence_patterns" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "shiftId" UUID NOT NULL,
    "days_of_week" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "recurrence_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_services" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_types" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "room_number" VARCHAR(255) NOT NULL,
    "room_type_id" UUID NOT NULL,
    "area" DECIMAL,
    "floor" INTEGER NOT NULL,
    "max_occupants" INTEGER,
    "status" "public"."RoomStatus" NOT NULL DEFAULT 'available',
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "unit" VARCHAR(255) NOT NULL,
    "auto_applied" BOOLEAN NOT NULL DEFAULT true,
    "is_metered" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ServiceStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shifts" (
    "id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "plan_name" "public"."SubscriptionPackage" NOT NULL,
    "daily_post_quote" INTEGER NOT NULL,
    "price_monthly" DECIMAL(65,30) NOT NULL,
    "price_yearly" DECIMAL(65,30) NOT NULL,
    "max_room" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "public"."tenant_contracts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_identifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "identityNumber" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "nationnality" VARCHAR(255) NOT NULL,
    "place_of_origin" JSONB NOT NULL,
    "place_of_residence" JSONB NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "personal_identification" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "card_front_url" TEXT NOT NULL,
    "card_back_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_identifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_name" "public"."SubscriptionPackage" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "billing_cycle" "public"."BillingCycle" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(255),
    "phone_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "hashed_password" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'leasing_agent',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'active',
    "room_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_schedules" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "boarding_house_id" UUID NOT NULL,
    "shiftId" UUID NOT NULL,
    "work_date" TIMESTAMP(3) NOT NULL,
    "recurrenceId" UUID,
    "status" "public"."ScheduleStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposits_contract_id_key" ON "public"."deposits"("contract_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "deposits_post_id_key" ON "public"."deposits"("post_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "public"."employees"("user_id" ASC);

-- CreateIndex
CREATE INDEX "meter_readings_room_id_invoice_id_idx" ON "public"."meter_readings"("room_id" ASC, "invoice_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_deposit_id_key" ON "public"."payments"("deposit_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_id_key" ON "public"."payments"("invoice_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_refund_id_key" ON "public"."payments"("payment_refund_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_post_purchase_id_key" ON "public"."payments"("post_purchase_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_subscription_id_key" ON "public"."payments"("subscription_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "posts_resulted_contract_id_key" ON "public"."posts"("resulted_contract_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_plan_name_key" ON "public"."subscription_plans"("plan_name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_identifications_identityNumber_key" ON "public"."user_identifications"("identityNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_identifications_user_id_key" ON "public"."user_identifications"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "public"."users"("phone_number" ASC);

-- AddForeignKey
ALTER TABLE "public"."PostImage" ADD CONSTRAINT "PostImage_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReach" ADD CONSTRAINT "PostReach_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReach" ADD CONSTRAINT "PostReach_viewed_by_fkey" FOREIGN KEY ("viewed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_savedBy_fkey" FOREIGN KEY ("savedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_conversations" ADD CONSTRAINT "ai_conversations_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_messages" ADD CONSTRAINT "ai_messages_ai_conversation_id_fkey" FOREIGN KEY ("ai_conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_work_schedule_id_fkey" FOREIGN KEY ("work_schedule_id") REFERENCES "public"."work_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boarding_houses" ADD CONSTRAINT "boarding_houses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_documents" ADD CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposits" ADD CONSTRAINT "deposits_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposits" ADD CONSTRAINT "deposits_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposits" ADD CONSTRAINT "deposits_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposits" ADD CONSTRAINT "deposits_recored_by_fkey" FOREIGN KEY ("recored_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposits" ADD CONSTRAINT "deposits_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_assignments" ADD CONSTRAINT "employee_assignments_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_assignments" ADD CONSTRAINT "employee_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_assignments" ADD CONSTRAINT "employee_assignments_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grievance_images" ADD CONSTRAINT "grievance_images_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice" ADD CONSTRAINT "invoice_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice" ADD CONSTRAINT "invoice_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_item" ADD CONSTRAINT "invoice_item_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_item" ADD CONSTRAINT "invoice_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_positions" ADD CONSTRAINT "job_positions_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mass_notification_jobs" ADD CONSTRAINT "mass_notification_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mass_notification_jobs" ADD CONSTRAINT "mass_notification_jobs_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meter_readings" ADD CONSTRAINT "meter_readings_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meter_readings" ADD CONSTRAINT "meter_readings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meter_readings" ADD CONSTRAINT "meter_readings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_payment_refund_id_fkey" FOREIGN KEY ("payment_refund_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_post_purchase_id_fkey" FOREIGN KEY ("post_purchase_id") REFERENCES "public"."post_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_purchases" ADD CONSTRAINT "post_purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_post_purchase_id_fkey" FOREIGN KEY ("post_purchase_id") REFERENCES "public"."post_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_resulted_contract_id_fkey" FOREIGN KEY ("resulted_contract_id") REFERENCES "public"."contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurrence_patterns" ADD CONSTRAINT "recurrence_patterns_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurrence_patterns" ADD CONSTRAINT "recurrence_patterns_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurrence_patterns" ADD CONSTRAINT "recurrence_patterns_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurrence_patterns" ADD CONSTRAINT "recurrence_patterns_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_services" ADD CONSTRAINT "room_services_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_services" ADD CONSTRAINT "room_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_types" ADD CONSTRAINT "room_types_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rooms" ADD CONSTRAINT "rooms_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rooms" ADD CONSTRAINT "rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_contracts" ADD CONSTRAINT "tenant_contracts_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_contracts" ADD CONSTRAINT "tenant_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_identifications" ADD CONSTRAINT "user_identifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_name_fkey" FOREIGN KEY ("plan_name") REFERENCES "public"."subscription_plans"("plan_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_boarding_house_id_fkey" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "public"."recurrence_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
