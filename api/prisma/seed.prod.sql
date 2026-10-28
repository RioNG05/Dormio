-- ─── Clean Production Reset & Seed ──────────────────────────────────────
-- 1. Wipe all existing test data (preserves migration tracking table)
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename != '_prisma_migrations'
    ) LOOP 
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE;'; 
    END LOOP; 
END $$;

-- 2. Subscription Plans (free, plus, pro)
INSERT INTO "subscription_plans" ("plan_name", "daily_post_quote", "price_monthly", "price_quarterly", "price_yearly", "max_room", "description")
VALUES 
  ('free', 0, 0, 0, 0, 10, 'Gói miễn phí cho chủ nhà nhỏ dưới 10 phòng'),
  ('plus', 5, 199000, 549000, 1990000, 30, 'Gói tiêu chuẩn cho chủ trọ từ 10 - 50 phòng'),
  ('pro', 10, 499000, 1399000, 4990000, 999999, 'Gói chuyên nghiệp không giới hạn tính năng cho hệ thống chuỗi phòng trọ')
ON CONFLICT ("plan_name") DO UPDATE SET
  "daily_post_quote" = EXCLUDED."daily_post_quote",
  "price_monthly" = EXCLUDED."price_monthly",
  "price_quarterly" = EXCLUDED."price_quarterly",
  "price_yearly" = EXCLUDED."price_yearly",
  "max_room" = EXCLUDED."max_room",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();

-- 3. System Administrators (Default initial password: '88888888')
-- Password bcrypt hash: $2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW
INSERT INTO "users" ("id", "username", "phone_number", "email", "hashed_password", "bio", "avatar_url", "role", "status", "must_change_password")
VALUES
  (gen_random_uuid(), 'Nguyễn Quang Huy', '0344265925', 'ngquanghuy.work@gmail.com', '$2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW', 'Quản trị viên hệ thống & Chủ đầu tư chuỗi nhà trọ Dormio', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80', 'admin', 'active', false),
  (gen_random_uuid(), 'Nguyễn Thảo Linh', '0836160161', 'nguyenthaolinhml@gmail.com', '$2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW', 'Quản trị viên hệ thống Dormio', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', 'admin', 'active', false),
  (gen_random_uuid(), 'Đồng Ngọc Gia Bảo', '0925502116', 'baodnghe181000@fpt.edu.vn', '$2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW', 'Quản trị viên hệ thống Dormio', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', 'admin', 'active', false),
  (gen_random_uuid(), 'Phạm Vân Anh', '0967013046', 'shinanhh@gmail.com', '$2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW', 'Quản trị viên hệ thống Dormio', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'admin', 'active', false),
  (gen_random_uuid(), 'Nguyễn Thị Cẩm Tú', '0364599095', 'nguyenthicamtu.alicia@gmail.com', '$2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW', 'Quản trị viên hệ thống Dormio', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', 'admin', 'active', false),
  (gen_random_uuid(), 'Mai Tiến Đạt', '0877719305', 'maidat217@gmail.com', '$2b$10$KzoN9SkH0N3Q0IUWBRypGuXO60OWV0serW8p/olTzr1yxxSNIqPLW', 'Quản trị viên hệ thống Dormio', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'admin', 'active', false)
ON CONFLICT ("phone_number") DO UPDATE SET
  "username" = EXCLUDED."username",
  "email" = EXCLUDED."email",
  "bio" = EXCLUDED."bio",
  "avatar_url" = EXCLUDED."avatar_url",
  "role" = 'admin',
  "status" = 'active';

-- 4. Pro Subscription for Primary Administrator
INSERT INTO "user_subscriptions" ("id", "user_id", "plan_name", "start_date", "end_date", "billing_cycle", "price", "status")
SELECT 
  gen_random_uuid(),
  u."id",
  'pro',
  NOW(),
  NOW() + INTERVAL '1 year',
  'yearly',
  4990000,
  'active'
FROM "users" u
WHERE u."email" = 'ngquanghuy.work@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM "user_subscriptions" us WHERE us."user_id" = u."id" AND us."status" = 'active'
  );
