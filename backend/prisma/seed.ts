import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  UserStatus,
  Gender,
  BoardingHouseStatus,
  RoomStatus,
  ContractStatus,
  SubscriptionPackage,
  SubscriptionStatus,
  BillingCycle,
  ExpenseStatus,
  ServiceStatus,
  DepositType,
  DepositStatus,
  PostStatus,
  SourceType,
  PostPurchaseStatus,
  InvoiceStatus,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  MessageAttachmentType,
  AiMessageRole,
  AuditLogAction,
  GrievencePriority,
  GrievenceStatus,
  AssignmentStatus,
  ScheduleStatus,
  AttendanceStatus,
  NotifyChannel,
  NofifyTarget,
  NotifyStatus,
  OtpPurpose,
  Room,
} from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://dormio:dormio123@localhost:5432/dormio_db';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // ─── 0. CLEANUP EXISTING DATA (Reverse FK order) ───────────────────────────
  console.log('🧹 Cleaning existing data...');
  await prisma.grievanceImage.deleteMany();
  await prisma.grievance.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.workSchedule.deleteMany();
  await prisma.recurrencePattern.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.employeeAssignment.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.massNotificationJob.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.postReach.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.post.deleteMany();
  await prisma.postPurchase.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.tenantContract.deleteMany();
  await prisma.contractDocument.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.roomService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.boardingHouse.deleteMany();
  await prisma.userIdentification.deleteMany();
  await prisma.user.deleteMany();

  // ─── 1. USERS ───────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const password88 = await bcrypt.hash('88888888', 10);
  const passwordCommon = await bcrypt.hash('Secret@123', 10);

  // 1.1 Admin User (Requirement: ngquanghuy.work@gmail.com, 0344265925, 88888888, admin)
  const adminUser = await prisma.user.create({
    data: {
      username: 'Nguyễn Quang Huy',
      email: 'ngquanghuy.work@gmail.com',
      phoneNumber: '0344265925',
      hashedPassword: password88,
      bio: 'Quản trị viên hệ thống & Chủ đầu tư chuỗi nhà trọ Dormio',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      role: UserRole.admin,
      status: UserStatus.active,
      mustChangePassword: false,
    },
  });

  // 1.2 Tenant 1
  const tenant1 = await prisma.user.create({
    data: {
      username: 'Trần Thị Thuỳ Dung',
      email: 'dung.tran@gmail.com',
      phoneNumber: '0912345678',
      hashedPassword: passwordCommon,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      role: UserRole.tenant,
      status: UserStatus.active,
      mustChangePassword: false,
    },
  });

  // 1.3 Tenant 2
  const tenant2 = await prisma.user.create({
    data: {
      username: 'Lê Hoàng Nam',
      email: 'nam.le@gmail.com',
      phoneNumber: '0987654321',
      hashedPassword: passwordCommon,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      role: UserRole.tenant,
      status: UserStatus.active,
      mustChangePassword: false,
    },
  });

  // 1.4 Staff / Employee 1
  const employeeUser1 = await prisma.user.create({
    data: {
      username: 'Phạm Văn Bảo',
      email: 'bao.pham@dormio.vn',
      phoneNumber: '0901122334',
      hashedPassword: passwordCommon,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      role: UserRole.employee,
      status: UserStatus.active,
      mustChangePassword: false,
    },
  });

  // 1.5 Staff / Employee 2
  const employeeUser2 = await prisma.user.create({
    data: {
      username: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@dormio.vn',
      phoneNumber: '0905566778',
      hashedPassword: passwordCommon,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      role: UserRole.employee,
      status: UserStatus.active,
      mustChangePassword: false,
    },
  });

  // 1.6 Landlord 2 (for multi-landlord platform testing)
  const landlord2 = await prisma.user.create({
    data: {
      username: 'Võ Minh Trí',
      email: 'tri.vo@gmail.com',
      phoneNumber: '0933445566',
      hashedPassword: passwordCommon,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      role: UserRole.landlord,
      status: UserStatus.active,
      mustChangePassword: false,
    },
  });

  // ─── 2. USER IDENTIFICATIONS (CCCD / Passport) ──────────────────────────────
  console.log('🪪 Creating user identifications...');
  await prisma.userIdentification.create({
    data: {
      userId: adminUser.id,
      identityNumber: '001201008888',
      fullName: 'NGUYỄN QUANG HUY',
      dateOfBirth: new Date('1995-08-15'),
      gender: Gender.male,
      nationnality: 'Việt Nam',
      placeOfOrigin: { province: 'Hà Nội', district: 'Cầu Giấy' },
      placeOfResidence: { province: 'TP.HCM', district: 'Quận 1', address: '123 Nguyễn Huệ' },
      issueDate: new Date('2021-05-10'),
      expiryDate: new Date('2035-08-15'),
      personalIdentification: adminUser.id,
      note: 'CCCD gắn chip',
      cardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      cardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.userIdentification.create({
    data: {
      userId: tenant1.id,
      identityNumber: '079200001234',
      fullName: 'TRẦN THỊ THUỲ DUNG',
      dateOfBirth: new Date('2000-03-20'),
      gender: Gender.female,
      nationnality: 'Việt Nam',
      placeOfOrigin: { province: 'Đà Nẵng', district: 'Hải Châu' },
      placeOfResidence: { province: 'TP.HCM', district: 'Bình Thạnh' },
      issueDate: new Date('2022-01-15'),
      expiryDate: new Date('2040-03-20'),
      personalIdentification: tenant1.id,
      note: 'Sinh viên ĐH Quốc Gia',
      cardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      cardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.userIdentification.create({
    data: {
      userId: tenant2.id,
      identityNumber: '079200005678',
      fullName: 'LÊ HOÀNG NAM',
      dateOfBirth: new Date('1998-11-12'),
      gender: Gender.male,
      nationnality: 'Việt Nam',
      placeOfOrigin: { province: 'Bình Dương', district: 'Thủ Dầu Một' },
      placeOfResidence: { province: 'TP.HCM', district: 'Quận 1' },
      issueDate: new Date('2020-09-01'),
      expiryDate: new Date('2038-11-12'),
      personalIdentification: tenant2.id,
      note: 'Kỹ sư phần mềm',
      cardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      cardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    },
  });

  // ─── 3. BOARDING HOUSES (Admin owns 2 boarding houses) ──────────────────────
  console.log('🏢 Creating 2 boarding houses owned by admin...');
  const farFuture = new Date('2099-12-31');

  // House 1: TP.HCM
  const house1 = await prisma.boardingHouse.create({
    data: {
      ownerId: adminUser.id,
      name: 'Dormio Premier Quận 1',
      description: 'Khu căn hộ dịch vụ và phòng trọ cao cấp trung tâm Quận 1, đầy đủ tiện ích hiện đại.',
      country: 'Việt Nam',
      province: 'Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street: 'Nguyễn Huệ',
      houseNumber: '123',
      status: BoardingHouseStatus.active,
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      totalFloor: 4,
      builtAt: new Date('2022-01-01'),
      deletedAt: farFuture,
    },
  });

  // House 2: Hà Nội
  const house2 = await prisma.boardingHouse.create({
    data: {
      ownerId: adminUser.id,
      name: 'Dormio Campus Cầu Giấy',
      description: 'Toà nhà phòng trọ thông minh gần các trường đại học lớn Cầu Giấy, camera 24/7, ra vào khoá vân tay.',
      country: 'Việt Nam',
      province: 'Hà Nội',
      city: 'TP. Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Phường Dịch Vọng',
      street: 'Cầu Giấy',
      houseNumber: '88',
      status: BoardingHouseStatus.active,
      thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      totalFloor: 4,
      builtAt: new Date('2023-05-15'),
      deletedAt: farFuture,
    },
  });

  // ─── 4. ROOM TYPES (common & duplex for each house) ─────────────────────────
  console.log('🏷️ Creating room types (common & duplex)...');
  const house1TypeCommon = await prisma.roomType.create({
    data: {
      boardingHouseId: house1.id,
      name: 'common',
      description: 'Phòng Tiêu Chuẩn (Studio 1PN) - Thiết kế tinh gọn, ban công thoáng mát',
    },
  });

  const house1TypeDuplex = await prisma.roomType.create({
    data: {
      boardingHouseId: house1.id,
      name: 'duplex',
      description: 'Phòng Gác Lửng (Duplex) - Không gian nhân đôi, trần cao sang trọng',
    },
  });

  const house2TypeCommon = await prisma.roomType.create({
    data: {
      boardingHouseId: house2.id,
      name: 'common',
      description: 'Phòng Tiêu Chuẩn - Đầy đủ giường, tủ, máy lạnh, bàn học',
    },
  });

  const house2TypeDuplex = await prisma.roomType.create({
    data: {
      boardingHouseId: house2.id,
      name: 'duplex',
      description: 'Phòng Gác Lửng Sinh Viên Cao Cấp - Tiện nghi, ở được 3-4 người',
    },
  });

  // ─── 5. ROOMS (20 rooms in House 1, 20 rooms in House 2) ───────────────────
  console.log('🚪 Creating 20 rooms in House 1 and 20 rooms in House 2 (Total 40 rooms)...');
  
  const house1Rooms: Room[] = [];
  // House 1: Floors 1 & 2 = Common (10 rooms), Floors 3 & 4 = Duplex (10 rooms)
  for (let f = 1; f <= 4; f++) {
    const isCommon = f <= 2;
    const typeId = isCommon ? house1TypeCommon.id : house1TypeDuplex.id;
    const area = isCommon ? 22.5 : 35.0;
    const maxOccupants = isCommon ? 2 : 4;

    for (let r = 1; r <= 5; r++) {
      const roomNumber = `${f}0${r}`;
      let status: RoomStatus = RoomStatus.available;
      if (f === 1 && r <= 2) status = RoomStatus.occupied; // 101, 102
      else if (f === 3 && r === 1) status = RoomStatus.occupied; // 301
      else if (f === 1 && r === 3) status = RoomStatus.deposited; // 103
      else if (f === 2 && r === 5) status = RoomStatus.maintainace; // 205

      const room = await prisma.room.create({
        data: {
          boardingHouseId: house1.id,
          roomNumber,
          roomTypeId: typeId,
          floor: f,
          area,
          maxOccupants,
          status,
          image_url: isCommon
            ? 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        },
      });
      house1Rooms.push(room);
    }
  }

  const house2Rooms: Room[] = [];
  // House 2: Floors 1 & 2 = Common (10 rooms), Floors 3 & 4 = Duplex (10 rooms)
  for (let f = 1; f <= 4; f++) {
    const isCommon = f <= 2;
    const typeId = isCommon ? house2TypeCommon.id : house2TypeDuplex.id;
    const area = isCommon ? 20.0 : 32.0;
    const maxOccupants = isCommon ? 2 : 4;

    for (let r = 1; r <= 5; r++) {
      const roomNumber = `${f}0${r}`;
      let status: RoomStatus = RoomStatus.available;
      if (f === 1 && r === 1) status = RoomStatus.occupied; // 101
      else if (f === 3 && r === 1) status = RoomStatus.occupied; // 301
      else if (f === 1 && r === 2) status = RoomStatus.deposited; // 102
      else if (f === 2 && r === 4) status = RoomStatus.maintainace; // 204

      const room = await prisma.room.create({
        data: {
          boardingHouseId: house2.id,
          roomNumber,
          roomTypeId: typeId,
          floor: f,
          area,
          maxOccupants,
          status,
          image_url: isCommon
            ? 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=600&q=80',
        },
      });
      house2Rooms.push(room);
    }
  }

  // ─── 6. SERVICES & ROOM SERVICES ────────────────────────────────────────────
  console.log('⚡ Creating services and assigning to rooms...');
  const h1Electricity = await prisma.service.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Điện sinh hoạt',
      price: 3500,
      unit: 'kWh',
      autoApplied: true,
      isMetered: true,
      status: ServiceStatus.active,
    },
  });

  const h1Water = await prisma.service.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Nước máy sinh hoạt',
      price: 25000,
      unit: 'm³',
      autoApplied: true,
      isMetered: true,
      status: ServiceStatus.active,
    },
  });

  const h1Internet = await prisma.service.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Internet cáp quang',
      price: 100000,
      unit: 'phòng/tháng',
      autoApplied: true,
      isMetered: false,
      status: ServiceStatus.active,
    },
  });

  const h1Cleaning = await prisma.service.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Vệ sinh & Rác',
      price: 50000,
      unit: 'phòng/tháng',
      autoApplied: true,
      isMetered: false,
      status: ServiceStatus.active,
    },
  });

  const h2Electricity = await prisma.service.create({
    data: {
      boardingHouseId: house2.id,
      name: 'Điện sinh hoạt',
      price: 3800,
      unit: 'kWh',
      autoApplied: true,
      isMetered: true,
      status: ServiceStatus.active,
    },
  });

  const h2Water = await prisma.service.create({
    data: {
      boardingHouseId: house2.id,
      name: 'Nước sạch sinh hoạt',
      price: 28000,
      unit: 'm³',
      autoApplied: true,
      isMetered: true,
      status: ServiceStatus.active,
    },
  });

  // Assign services to all rooms
  for (const r of house1Rooms) {
    await prisma.roomService.createMany({
      data: [
        { roomId: r.id, serviceId: h1Electricity.id },
        { roomId: r.id, serviceId: h1Water.id },
        { roomId: r.id, serviceId: h1Internet.id },
        { roomId: r.id, serviceId: h1Cleaning.id },
      ],
    });
  }

  for (const r of house2Rooms) {
    await prisma.roomService.createMany({
      data: [
        { roomId: r.id, serviceId: h2Electricity.id },
        { roomId: r.id, serviceId: h2Water.id },
      ],
    });
  }

  // ─── 7. SUBSCRIPTION PLANS & USER SUBSCRIPTIONS ─────────────────────────────
  console.log('💳 Creating subscription plans & user subscriptions...');
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        planName: SubscriptionPackage.free,
        dailyPostQuote: 1,
        priceMonthly: 0,
        priceYearly: 0,
        maxRoom: 10,
        description: 'Gói miễn phí cho chủ nhà nhỏ dưới 10 phòng',
      },
      {
        planName: SubscriptionPackage.plus,
        dailyPostQuote: 5,
        priceMonthly: 199000,
        priceYearly: 1990000,
        maxRoom: 50,
        description: 'Gói tiêu chuẩn cho chủ trọ từ 10 - 50 phòng',
      },
      {
        planName: SubscriptionPackage.pro,
        dailyPostQuote: 20,
        priceMonthly: 499000,
        priceYearly: 4990000,
        maxRoom: 200,
        description: 'Gói chuyên nghiệp không giới hạn tính năng cho hệ thống chuỗi phòng trọ',
      },
    ],
  });

  const adminSub = await prisma.userSubscription.create({
    data: {
      userId: adminUser.id,
      planName: SubscriptionPackage.pro,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      billingCycle: BillingCycle.yearly,
      price: 4990000,
      status: SubscriptionStatus.active,
    },
  });

  await prisma.userSubscription.create({
    data: {
      userId: landlord2.id,
      planName: SubscriptionPackage.plus,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-01'),
      billingCycle: BillingCycle.monthly,
      price: 199000,
      status: SubscriptionStatus.active,
    },
  });

  // ─── 8. CONTRACTS & TENANT CONTRACTS ────────────────────────────────────────
  console.log('📄 Creating contracts and tenant contracts...');
  const contract1 = await prisma.contract.create({
    data: {
      roomId: house1Rooms[0].id, // Room 101 House 1
      rentPrice: 4500000,
      monthlyPaymentDate: 5,
      status: ContractStatus.active,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      note: 'Hợp đồng thuê 1 năm, đóng tiền ngày 5 hàng tháng',
    },
  });

  await prisma.tenantContract.create({
    data: {
      tenantId: tenant1.id,
      contractId: contract1.id,
      isPrimary: true,
    },
  });

  await prisma.contractDocument.createMany({
    data: [
      {
        contractId: contract1.id,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
      {
        contractId: contract1.id,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
    ],
  });

  const contract2 = await prisma.contract.create({
    data: {
      roomId: house1Rooms[10].id, // Room 301 House 1 (Duplex)
      rentPrice: 6500000,
      monthlyPaymentDate: 1,
      status: ContractStatus.active,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-02-28'),
      note: 'Hợp đồng duplex full option',
    },
  });

  await prisma.tenantContract.create({
    data: {
      tenantId: tenant2.id,
      contractId: contract2.id,
      isPrimary: true,
    },
  });

  await prisma.contractDocument.create({
    data: {
      contractId: contract2.id,
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
  });

  // ─── 9. DEPOSITS ────────────────────────────────────────────────────────────
  console.log('💰 Creating deposits...');
  const deposit1 = await prisma.deposit.create({
    data: {
      roomId: house1Rooms[0].id,
      boardingHouseId: house1.id,
      contractId: contract1.id,
      type: DepositType.contract,
      amount: 4500000,
      status: DepositStatus.paid,
      recordedManually: true,
      recordedBy: adminUser.id,
      note: 'Đặt cọc 1 tháng tiền phòng khi ký hợp đồng',
    },
  });

  await prisma.deposit.create({
    data: {
      roomId: house1Rooms[2].id, // Room 103 House 1
      boardingHouseId: house1.id,
      type: DepositType.platform,
      amount: 2000000,
      status: DepositStatus.paid,
      recordedManually: false,
      recordedBy: tenant2.id,
      note: 'Giữ chỗ qua nền tảng trong 7 ngày',
    },
  });

  // ─── 10. INVOICES & INVOICE ITEMS ───────────────────────────────────────────
  console.log('🧾 Creating invoices and invoice items...');
  const inv1 = await prisma.invoice.create({
    data: {
      roomId: house1Rooms[0].id,
      contractId: contract1.id,
      totalAmount: 5125000,
      status: InvoiceStatus.paid,
      dueDate: new Date('2026-08-05'),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv1.id, quantity: 1, unitPrice: 4500000, amount: 4500000 },
      { invoiceId: inv1.id, serviceId: h1Electricity.id, quantity: 120, unitPrice: 3500, amount: 420000 },
      { invoiceId: inv1.id, serviceId: h1Water.id, quantity: 6, unitPrice: 25000, amount: 150000 },
      { invoiceId: inv1.id, serviceId: h1Cleaning.id, quantity: 1, unitPrice: 55000, amount: 55000 },
    ],
  });

  const inv2 = await prisma.invoice.create({
    data: {
      roomId: house1Rooms[0].id,
      contractId: contract1.id,
      totalAmount: 5200000,
      status: InvoiceStatus.unpaid,
      dueDate: new Date('2026-09-05'),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv2.id, quantity: 1, unitPrice: 4500000, amount: 4500000 },
      { invoiceId: inv2.id, serviceId: h1Electricity.id, quantity: 140, unitPrice: 3500, amount: 490000 },
      { invoiceId: inv2.id, serviceId: h1Water.id, quantity: 6, unitPrice: 25000, amount: 150000 },
      { invoiceId: inv2.id, serviceId: h1Internet.id, quantity: 1, unitPrice: 60000, amount: 60000 },
    ],
  });

  // ─── 11. PAYMENTS ───────────────────────────────────────────────────────────
  console.log('💵 Creating payments...');
  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      payerId: tenant1.id,
      type: PaymentType.charge,
      amount: 5125000,
      method: PaymentMethod.banking,
      status: PaymentStatus.success,
      transactionRef: 'TXN-20260804-001',
      receiptNumber: 'REC-0801',
      paidAt: new Date('2026-08-04T10:30:00Z'),
    },
  });

  await prisma.payment.create({
    data: {
      depositId: deposit1.id,
      payerId: tenant1.id,
      type: PaymentType.charge,
      amount: 4500000,
      method: PaymentMethod.banking,
      status: PaymentStatus.success,
      transactionRef: 'TXN-20260101-DEP',
      receiptNumber: 'REC-DEP-001',
      paidAt: new Date('2026-01-01T09:00:00Z'),
    },
  });

  await prisma.payment.create({
    data: {
      subscriptionId: adminSub.id,
      payerId: adminUser.id,
      type: PaymentType.charge,
      amount: 4990000,
      method: PaymentMethod.banking,
      status: PaymentStatus.success,
      transactionRef: 'TXN-SUB-PRO-2026',
      receiptNumber: 'REC-SUB-01',
      paidAt: new Date('2026-01-01T00:00:00Z'),
    },
  });

  // ─── 12. METER READINGS ─────────────────────────────────────────────────────
  console.log('⏱️ Creating meter readings...');
  await prisma.meterReading.createMany({
    data: [
      {
        serviceId: h1Electricity.id,
        roomId: house1Rooms[0].id,
        readingValue: 1540,
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
      },
      {
        serviceId: h1Water.id,
        roomId: house1Rooms[0].id,
        readingValue: 125,
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
      },
      {
        serviceId: h1Electricity.id,
        roomId: house1Rooms[10].id,
        readingValue: 2480,
      },
    ],
  });

  // ─── 13. EXPENSES ───────────────────────────────────────────────────────────
  console.log('📉 Creating expenses...');
  await prisma.expense.createMany({
    data: [
      {
        boardingHouseId: house1.id,
        roomId: house1Rooms[9].id, // Room 205
        name: 'Sửa chữa và bảo dưỡng máy lạnh',
        description: 'Vệ sinh bơm gas máy lạnh Inverter Daikin',
        category: 'Bảo trì',
        status: ExpenseStatus.paid,
        amount: 850000,
        paidAt: new Date('2026-07-20'),
      },
      {
        boardingHouseId: house1.id,
        name: 'Phí bảo trì thang máy định kỳ quý 3',
        description: 'Bảo trì kỹ thuật thang máy Fuji',
        category: 'Vận hành',
        status: ExpenseStatus.paid,
        amount: 2500000,
        paidAt: new Date('2026-08-01'),
      },
      {
        boardingHouseId: house2.id,
        name: 'Thay thế cụm camera an ninh cổng chính',
        description: 'Lắp đặt 2 mắt camera Hikvision 4MP',
        category: 'An ninh',
        status: ExpenseStatus.paid,
        amount: 1800000,
        paidAt: new Date('2026-08-10'),
      },
    ],
  });

  // ─── 14. POST PURCHASES, POSTS & REACHES ────────────────────────────────────
  console.log('📢 Creating posts, images, saved posts and reaches...');
  const postPurchase1 = await prisma.postPurchase.create({
    data: {
      buyerId: adminUser.id,
      quantityPurchase: 10,
      unitPrice: 20000,
      totalAmount: 200000,
      status: PostPurchaseStatus.paid,
      activatedAt: new Date('2026-08-01'),
    },
  });

  await prisma.postPurchase.create({
    data: {
      buyerId: landlord2.id,
      quantityPurchase: 5,
      unitPrice: 20000,
      totalAmount: 100000,
      status: PostPurchaseStatus.paid,
      activatedAt: new Date('2026-08-05'),
    },
  });

  const post1 = await prisma.post.create({
    data: {
      postedBy: adminUser.id,
      roomId: house1Rooms[11].id, // Room 302 Duplex
      title: 'Cho thuê phòng Duplex cao cấp Quận 1 - Full nội thất, ban công riêng',
      content: 'Toà nhà Dormio Premier 123 Nguyễn Huệ, an ninh 24/7, giờ giấc tự do, bếp riêng, máy giặt riêng.',
      depositAmount: 6500000,
      status: PostStatus.posted,
      sourceType: SourceType.free_quote,
      postPurchaseId: postPurchase1.id,
      deletedAt: farFuture,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      postedBy: adminUser.id,
      roomId: house2Rooms[0].id,
      title: 'Phòng trọ sinh viên tiện nghi gần ĐH Quốc Gia Cầu Giấy, giá cực tốt',
      content: 'Phòng mới xây 100%, đầy đủ máy lạnh, nước nóng, khoá vân tay, wifi tốc độ cao.',
      depositAmount: 3500000,
      status: PostStatus.posted,
      sourceType: SourceType.purchased,
      postPurchaseId: postPurchase1.id,
      deletedAt: farFuture,
    },
  });

  await prisma.postImage.createMany({
    data: [
      {
        postId: post1.id,
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      },
      {
        postId: post1.id,
        url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      },
      {
        postId: post2.id,
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      },
    ],
  });

  await prisma.savedPost.createMany({
    data: [
      { postId: post1.id, savedBy: tenant1.id },
      { postId: post2.id, savedBy: tenant2.id },
    ],
  });

  await prisma.postReach.createMany({
    data: [
      { postId: post1.id, viewedBy: tenant1.id, viewedAt: new Date() },
      { postId: post1.id, viewedBy: tenant2.id, viewedAt: new Date() },
      { postId: post2.id, viewedBy: tenant1.id, viewedAt: new Date() },
    ],
  });

  // ─── 15. CONVERSATIONS & MESSAGES ───────────────────────────────────────────
  console.log('💬 Creating conversations & messages...');
  const conv1 = await prisma.conversation.create({
    data: {
      name: 'Trao đổi phòng 101 - Dormio Premier',
      user1Id: adminUser.id,
      user2Id: tenant1.id,
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      name: 'Tư vấn thuê phòng 301',
      user1Id: adminUser.id,
      user2Id: tenant2.id,
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderId: tenant1.id,
      content: 'Dạ anh Huy ơi, em đã nhận được thông báo tiền phòng tháng này rồi ạ.',
      isReacted: true,
      sentAt: new Date('2026-08-04T08:00:00Z'),
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderId: adminUser.id,
      content: 'Ok em Dung nhé, em thanh toán qua QR VietQR trên app là hệ thống tự gạch nợ nhé.',
      isReacted: false,
      sentAt: new Date('2026-08-04T08:05:00Z'),
    },
  });

  await prisma.messageAttachment.createMany({
    data: [
      {
        messageId: msg1.id,
        type: MessageAttachmentType.image,
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
        sizeBytes: 102400,
        sortOrder: 1,
      },
      {
        messageId: msg2.id,
        type: MessageAttachmentType.file,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        sizeBytes: 204800,
        sortOrder: 1,
      },
    ],
  });

  // ─── 16. AI CONVERSATIONS & MESSAGES ────────────────────────────────────────
  console.log('🤖 Creating AI assistant conversations...');
  const aiConv1 = await prisma.aiConversation.create({
    data: {
      userId: adminUser.id,
      boardingHouseId: house1.id,
    },
  });

  await prisma.aiMessage.createMany({
    data: [
      {
        aiConversationId: aiConv1.id,
        role: AiMessageRole.user,
        content: 'Hãy phân tích tỷ lệ lấp đầy phòng tại toà Dormio Premier Quận 1 tháng 8/2026.',
        model: 'gemini-1.5-pro',
        tokenUsage: 45,
      },
      {
        aiConversationId: aiConv1.id,
        role: AiMessageRole.assistant,
        content: 'Toà nhà Dormio Premier Quận 1 hiện có 20 phòng, trong đó 3 phòng đang có khách thuê, 1 phòng đặt cọc, 1 phòng bảo trì và 15 phòng trống. Tỷ lệ lấp đầy đạt 20%.',
        model: 'gemini-1.5-pro',
        tokenUsage: 120,
      },
    ],
  });

  const aiConv2 = await prisma.aiConversation.create({
    data: {
      userId: adminUser.id,
      boardingHouseId: house2.id,
    },
  });

  await prisma.aiMessage.createMany({
    data: [
      {
        aiConversationId: aiConv2.id,
        role: AiMessageRole.user,
        content: 'Gợi ý bài đăng marketing cho toà Dormio Campus Cầu Giấy thu hút sinh viên.',
        model: 'gemini-1.5-flash',
        tokenUsage: 35,
      },
      {
        aiConversationId: aiConv2.id,
        role: AiMessageRole.assistant,
        content: 'Tiêu đề gợi ý: "Phòng Trọ Duplex Xịn Xò Ngay Cạnh ĐH Quốc Gia - Full Đồ Giá Sinh Viên!". Điểm nhấn: Gác lửng cao, wifi căng đét, máy giặt chung miễn phí.',
        model: 'gemini-1.5-flash',
        tokenUsage: 150,
      },
    ],
  });

  // ─── 17. AUDIT LOGS ─────────────────────────────────────────────────────────
  console.log('📜 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        boardingHouseId: house1.id,
        action: AuditLogAction.create,
        entityType: 'CONTRACT',
        entityId: contract1.id,
        oldValue: {},
        newValue: { rentPrice: 4500000, tenant: 'Trần Thị Thuỳ Dung' },
        ipAddress: '127.0.0.1',
      },
      {
        userId: tenant1.id,
        boardingHouseId: house1.id,
        action: AuditLogAction.payment,
        entityType: 'PAYMENT',
        entityId: inv1.id,
        oldValue: { status: 'unpaid' },
        newValue: { status: 'paid', amount: 5125000 },
        ipAddress: '127.0.0.1',
      },
    ],
  });

  // ─── 18. NOTIFICATIONS & MASS NOTIFICATION JOBS ─────────────────────────────
  console.log('🔔 Creating notifications & mass notification jobs...');
  await prisma.notification.createMany({
    data: [
      {
        boardingHouseId: house1.id,
        senderId: adminUser.id,
        receiverId: null, // Broadcast announcement
        content: 'Thông báo lịch cắt điện định kỳ bảo trì lưới điện từ 08:00 - 11:30 ngày 15/09/2026.',
        type: 'maintenance_broadcast',
        isRead: false,
      },
      {
        boardingHouseId: house1.id,
        senderId: adminUser.id,
        receiverId: tenant1.id,
        content: 'Hoá đơn tiền phòng tháng 09/2026 đã sẵn sàng. Hạn thanh toán đến hết ngày 05/09/2026.',
        type: 'billing_due',
        isRead: false,
      },
      {
        boardingHouseId: house2.id,
        senderId: adminUser.id,
        receiverId: null,
        content: 'Kính đề nghị cư dân không gây tiếng ồn sau 23:00 và luôn đóng cổng chính khi ra vào toà nhà.',
        type: 'general_notice',
        isRead: true,
      },
    ],
  });

  await prisma.massNotificationJob.createMany({
    data: [
      {
        createdBy: adminUser.id,
        channel: NotifyChannel.zalo,
        targetType: NofifyTarget.all_users,
        title: 'Chúc mừng năm mới - Dormio',
        content: 'Dormio kính chúc quý khách hàng một năm mới an khang thịnh vượng!',
        status: NotifyStatus.sent,
        sentCount: 150,
        failedCount: 0,
      },
      {
        createdBy: adminUser.id,
        channel: NotifyChannel.sms,
        targetType: NofifyTarget.all_landlords,
        title: 'Cập nhật tính năng Quản lý Nhân sự & Chấm công',
        content: 'Hệ thống đã cập nhật tính năng phân ca và chấm công vị trí cho nhân viên toà nhà.',
        status: NotifyStatus.sent,
        sentCount: 45,
        failedCount: 2,
      },
    ],
  });

  // ─── 19. GRIEVANCES & GRIEVANCE IMAGES ──────────────────────────────────────
  console.log('⚠️ Creating grievances...');
  const gr1 = await prisma.grievance.create({
    data: {
      tenantId: tenant1.id,
      boardingHouseId: house1.id,
      roomId: house1Rooms[0].id,
      title: 'Vòi nước bồn rửa mặt bị rò rỉ',
      description: 'Vòi xả nước lavabo trong toilet bị rỉ nước liên tục gây lãng phí, nhờ ban quản lý cho thợ qua xem giúp em.',
      priority: GrievencePriority.medium,
      status: GrievenceStatus.in_progress,
      resolvedBy: adminUser.id,
      resolvedAt: null,
    },
  });

  const gr2 = await prisma.grievance.create({
    data: {
      tenantId: tenant2.id,
      boardingHouseId: house1.id,
      roomId: house1Rooms[10].id,
      title: 'Đèn ban công tầng 3 bị cháy bóng',
      description: 'Bóng đèn led ban công phía ngoài phòng 301 không sáng.',
      priority: GrievencePriority.low,
      status: GrievenceStatus.resolved,
      resolvedBy: adminUser.id,
      resolvedAt: new Date('2026-08-10'),
    },
  });

  await prisma.grievanceImage.createMany({
    data: [
      {
        grievanceId: gr1.id,
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      },
      {
        grievanceId: gr2.id,
        url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
      },
    ],
  });

  // ─── 20. EMPLOYEES, JOB POSITIONS & ASSIGNMENTS ─────────────────────────────
  console.log('👷 Creating staff, job positions and assignments...');
  const emp1 = await prisma.employee.create({
    data: { userId: employeeUser1.id },
  });

  const emp2 = await prisma.employee.create({
    data: { userId: employeeUser2.id },
  });

  const posManager = await prisma.jobPosition.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Quản lý toà nhà',
      description: 'Chịu trách nhiệm vận hành, tiếp khách thuê và giải quyết phản ánh',
    },
  });

  await prisma.jobPosition.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Bảo vệ an ninh',
      description: 'Trực cổng, tuần tra an ninh và kiểm soát xe cộ',
    },
  });

  const posCleaning = await prisma.jobPosition.create({
    data: {
      boardingHouseId: house2.id,
      name: 'Nhân viên tạp vụ',
      description: 'Dọn dẹp hành lang, cầu thang và khu vực công cộng',
    },
  });

  await prisma.employeeAssignment.createMany({
    data: [
      {
        employeeId: emp1.id,
        positionId: posManager.id,
        boardingHouseId: house1.id,
        status: AssignmentStatus.active,
        joinedAt: new Date('2026-01-01'),
        leftAt: farFuture,
      },
      {
        employeeId: emp2.id,
        positionId: posCleaning.id,
        boardingHouseId: house2.id,
        status: AssignmentStatus.active,
        joinedAt: new Date('2026-02-01'),
        leftAt: farFuture,
      },
    ],
  });

  // ─── 21. SHIFTS, SCHEDULES & ATTENDANCES ────────────────────────────────────
  console.log('⏰ Creating shifts, schedules & attendances...');
  const shiftMorning = await prisma.shift.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Ca Sáng (06:00 - 14:00)',
      startTime: new Date('1970-01-01T06:00:00Z'),
      endTime: new Date('1970-01-01T14:00:00Z'),
    },
  });

  const shiftEvening = await prisma.shift.create({
    data: {
      boardingHouseId: house1.id,
      name: 'Ca Chiều (14:00 - 22:00)',
      startTime: new Date('1970-01-01T14:00:00Z'),
      endTime: new Date('1970-01-01T22:00:00Z'),
    },
  });

  const recPattern1 = await prisma.recurrencePattern.create({
    data: {
      employeeId: emp1.id,
      boardingHouseId: house1.id,
      shiftId: shiftMorning.id,
      daysOfWeek: '2,3,4,5,6', // Thứ 2 đến thứ 6
      startTime: new Date('2026-01-01T06:00:00Z'),
      endTime: new Date('2026-12-31T14:00:00Z'),
      createdBy: adminUser.id,
    },
  });

  const recPattern2 = await prisma.recurrencePattern.create({
    data: {
      employeeId: emp2.id,
      boardingHouseId: house1.id,
      shiftId: shiftEvening.id,
      daysOfWeek: '2,4,6',
      startTime: new Date('2026-01-01T14:00:00Z'),
      endTime: new Date('2026-12-31T22:00:00Z'),
      createdBy: adminUser.id,
    },
  });

  const sched1 = await prisma.workSchedule.create({
    data: {
      employeeId: emp1.id,
      boardingHouseId: house1.id,
      shiftId: shiftMorning.id,
      workDate: new Date('2026-08-31'),
      recurrenceId: recPattern1.id,
      status: ScheduleStatus.scheduled,
    },
  });

  const sched2 = await prisma.workSchedule.create({
    data: {
      employeeId: emp2.id,
      boardingHouseId: house1.id,
      shiftId: shiftEvening.id,
      workDate: new Date('2026-08-31'),
      recurrenceId: recPattern2.id,
      status: ScheduleStatus.scheduled,
    },
  });

  await prisma.attendance.createMany({
    data: [
      {
        workScheduleId: sched1.id,
        employeeId: emp1.id,
        checkIn: new Date('2026-08-31T05:58:00Z'),
        checkOut: new Date('2026-08-31T14:02:00Z'),
        status: AttendanceStatus.on_time,
        editedBy: adminUser.id,
      },
      {
        workScheduleId: sched2.id,
        employeeId: emp2.id,
        checkIn: new Date('2026-08-31T14:15:00Z'),
        checkOut: null,
        status: AttendanceStatus.late,
        editedBy: adminUser.id,
      },
    ],
  });

  // ─── 22. OTP CODES ──────────────────────────────────────────────────────────
  console.log('🔢 Creating OTP codes...');
  const otpHash1 = await bcrypt.hash('123456', 10);
  const otpHash2 = await bcrypt.hash('654321', 10);

  await prisma.otpCode.create({
    data: {
      userId: tenant1.id,
      codeHash: otpHash1,
      purpose: OtpPurpose.login_verifycation,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // +10 mins
      verifiedAt: new Date(),
      attemptCount: 1,
    },
  });

  await prisma.otpCode.create({
    data: {
      userId: tenant2.id,
      codeHash: otpHash2,
      purpose: OtpPurpose.reset_password,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verifiedAt: new Date(),
      attemptCount: 0,
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 ADMIN CREDENTIALS:');
  console.log('   Email:     ngquanghuy.work@gmail.com');
  console.log('   Phone:     0344265925');
  console.log('   Password:  88888888');
  console.log('   Role:      admin');
  console.log('   Properties: 2 Boarding Houses (40 rooms total: 20 common, 20 duplex)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
