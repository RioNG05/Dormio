-- =============================================================================
-- DORMIO DATABASE SEED DATA (PostgreSQL)
-- Initial seed data for testing & development
-- =============================================================================

-- 1. SEED USERS
INSERT INTO users (id, full_name, email, phone, password_hash, role, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin Quản Trị', 'admin@dormio.vn', '0901000001', '$2b$10$SampleHashForAdminPassword123', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('22222222-2222-2222-2222-222222222222', 'Nguyễn Văn Chủ Nhà', 'landlord@dormio.vn', '0902000002', '$2b$10$SampleHashForLandlordPassword123', 'LANDLORD', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('33333333-3333-3333-3333-333333333333', 'Trần Thị Khách Thuê', 'tenant@dormio.vn', '0903000003', '$2b$10$SampleHashForTenantPassword123', 'TENANT', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('44444444-4444-4444-4444-444444444444', 'Lê Văn Nhân Viên', 'staff@dormio.vn', '0904000004', '$2b$10$SampleHashForStaffPassword123', 'STAFF', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

-- 2. SEED BOARDING HOUSES
INSERT INTO boarding_houses (id, landlord_id, name, address, city, district, ward, total_floors, description, rules) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Dormio House Quận 1', '123 Nguyễn Huệ', 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 5, 'Tòa nhà căn hộ dịch vụ cao cấp full nội thất', 'Giờ giấc tự do, không hút thuốc trong phòng, giữ vệ sinh chung'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Dormio Student House Cầu Giấy', '45 Chùa Láng', 'Hà Nội', 'Đống Đa', 'Phường Láng Thượng', 4, 'Chung cư mini giá rẻ gần các trường đại học', 'Không tụ tập quá 23h, để xe đúng nơi quy định');

-- 3. SEED ROOMS
INSERT INTO rooms (id, house_id, code, title, floor, price, deposit_amount, area_sqm, max_occupants, status, facilities, images) VALUES
('r1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'P101', 'Phòng Studio Studio Ban Công Q1', 1, 4500000, 4500000, 25.00, 2, 'RENTED', ARRAY['wifi', 'air_con', 'parking', 'fridge', 'balcony'], ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800']),
('r2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'P102', 'Phòng Đơn Cao Cấp Tầng 1', 1, 4000000, 4000000, 22.00, 2, 'AVAILABLE', ARRAY['wifi', 'air_con', 'fridge'], ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']),
('r3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'P201', 'Phòng Trọ Khép Kín Cầu Giấy', 2, 2800000, 2800000, 20.00, 2, 'AVAILABLE', ARRAY['wifi', 'air_con', 'water_heater'], ARRAY['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800']);

-- 4. SEED SERVICE CONFIGS
INSERT INTO service_configs (house_id, name, unit, price, is_mandatory) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tiền Điện', 'KWH', 3800.00, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tiền Nước', 'M3', 18000.00, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Internet Wifi', 'ROOM', 100000.00, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vệ Sinh & Rác', 'PERSON', 30000.00, TRUE);

-- 5. SEED CONTRACTS
INSERT INTO contracts (id, contract_code, house_id, room_id, landlord_id, tenant_id, start_date, end_date, rental_price, deposit_amount, status) VALUES
('c1111111-1111-1111-1111-111111111111', 'HD-2026-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'r1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '2026-01-01', '2027-01-01', 4500000, 4500000, 'ACTIVE');

-- 6. SEED INVOICES
INSERT INTO invoices (id, invoice_code, contract_id, house_id, room_id, month, year, electricity_start, electricity_end, water_start, water_end, room_amount, electricity_amount, water_amount, service_amount, total_amount, paid_amount, status, due_date) VALUES
('inv11111-1111-1111-1111-111111111111', 'INV-2026-07-001', 'c1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'r1111111-1111-1111-1111-111111111111', 7, 2026, 1200, 1350, 45, 52, 4500000, 570000, 126000, 130000, 5326000, 0, 'UNPAID', '2026-08-05');

-- 7. SEED COMPLAINTS
INSERT INTO complaints (house_id, room_id, tenant_id, title, description, priority, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'r1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Máy lạnh phát ra tiếng kêu to', 'Máy lạnh phòng 101 chạy kêu rất to và hơi lạnh yếu, nhờ chủ nhà qua kiểm tra lại ga.', 'HIGH', 'PENDING');

-- 8. SEED LISTINGS
INSERT INTO listings (house_id, room_id, title, description, rental_price, deposit, images, is_published) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'r2222222-2222-2222-2222-222222222222', 'Phòng trọ cao cấp Full đồ tại Quận 1, ban công rộng rãi', 'Căn hộ Studio thiết kế hiện đại, đầy đủ tiện nghi điều hòa, tủ lạnh, giường nệm. An ninh tuyệt đối 24/7.', 4500000, 4500000, ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'], TRUE);
