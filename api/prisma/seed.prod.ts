import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  UserStatus,
  SubscriptionPackage,
  SubscriptionStatus,
  BillingCycle,
} from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://dormio:dormio123@localhost:5432/dormio_db';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting clean production database seed...');

  // ─── 1. SUBSCRIPTION PLANS (Required for Platform Operation) ─────────────
  console.log('💳 Initializing subscription plans...');
  const plans = [
    {
      planName: SubscriptionPackage.free,
      dailyPostQuote: 0,
      priceMonthly: 0,
      priceQuarterly: 0,
      priceYearly: 0,
      maxRoom: 10,
      description: 'Gói miễn phí cho chủ nhà nhỏ dưới 10 phòng',
    },
    {
      planName: SubscriptionPackage.plus,
      dailyPostQuote: 5,
      priceMonthly: 199000,
      priceQuarterly: 549000,
      priceYearly: 1990000,
      maxRoom: 30,
      description: 'Gói tiêu chuẩn cho chủ trọ từ 10 - 50 phòng',
    },
    {
      planName: SubscriptionPackage.pro,
      dailyPostQuote: 10,
      priceMonthly: 499000,
      priceQuarterly: 1399000,
      priceYearly: 4990000,
      maxRoom: 999999,
      description: 'Gói chuyên nghiệp không giới hạn tính năng cho hệ thống chuỗi phòng trọ',
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planName: plan.planName },
      update: {
        dailyPostQuote: plan.dailyPostQuote,
        priceMonthly: plan.priceMonthly,
        priceQuarterly: plan.priceQuarterly,
        priceYearly: plan.priceYearly,
        maxRoom: plan.maxRoom,
        description: plan.description,
      },
      create: plan,
    });
  }
  console.log('✅ Subscription plans initialized (free, plus, pro).');

  // ─── 2. ADMIN USERS (Non-destructive upsert) ──────────────────────────────
  console.log('👤 Initializing system administrators...');
  const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || '88888888';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const adminUsers = [
    {
      username: 'Nguyễn Quang Huy',
      email: 'ngquanghuy.work@gmail.com',
      phoneNumber: '0344265925',
      bio: 'Quản trị viên hệ thống & Chủ đầu tư chuỗi nhà trọ Dormio',
      avatarUrl:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    },
    {
      username: 'Nguyễn Thảo Linh',
      email: 'nguyenthaolinhml@gmail.com',
      phoneNumber: '0836160161',
      bio: 'Quản trị viên hệ thống Dormio',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
    {
      username: 'Đồng Ngọc Gia Bảo',
      email: 'baodnghe181000@fpt.edu.vn',
      phoneNumber: '0925502116',
      bio: 'Quản trị viên hệ thống Dormio',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    },
    {
      username: 'Phạm Vân Anh',
      email: 'shinanhh@gmail.com',
      phoneNumber: '0967013046',
      bio: 'Quản trị viên hệ thống Dormio',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      username: 'Nguyễn Thị Cẩm Tú',
      email: 'nguyenthicamtu.alicia@gmail.com',
      phoneNumber: '0364599095',
      bio: 'Quản trị viên hệ thống Dormio',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    {
      username: 'Mai Tiến Đạt',
      email: 'maidat217@gmail.com',
      phoneNumber: '0877719305',
      bio: 'Quản trị viên hệ thống Dormio',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
  ];

  for (const admin of adminUsers) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: admin.phoneNumber },
      update: {
        role: UserRole.admin,
        status: UserStatus.active,
        username: admin.username,
        email: admin.email,
        bio: admin.bio,
        avatarUrl: admin.avatarUrl,
      },
      create: {
        username: admin.username,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        hashedPassword,
        bio: admin.bio,
        avatarUrl: admin.avatarUrl,
        role: UserRole.admin,
        status: UserStatus.active,
        mustChangePassword: false,
      },
    });

    // Ensure the primary admin has an active Pro subscription for feature testing
    if (admin.email === 'ngquanghuy.work@gmail.com') {
      const existingSub = await prisma.userSubscription.findFirst({
        where: { userId: user.id, status: SubscriptionStatus.active },
      });

      if (!existingSub) {
        await prisma.userSubscription.create({
          data: {
            userId: user.id,
            planName: SubscriptionPackage.pro,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            billingCycle: BillingCycle.yearly,
            price: 4990000,
            status: SubscriptionStatus.active,
          },
        });
      }
    }
  }

  console.log('✅ System administrators initialized successfully.');
  console.log('---------------------------------------------------------');
  console.log('🎉 Production seed completed without modifying real data!');
  console.log(`🔐 Primary Admin: ngquanghuy.work@gmail.com / (phone: 0344265925)`);
  console.log(`🔑 Initial Password: ${defaultPassword}`);
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during production seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
