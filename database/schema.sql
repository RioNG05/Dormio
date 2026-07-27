-- =============================================================================
-- DORMIO DATABASE SCHEMA (PostgreSQL DDL)
-- Comprehensive Web App platform for boarding house management & room rental
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUMS DEFINITION
-- -----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('ADMIN', 'LANDLORD', 'TENANT', 'STAFF');

CREATE TYPE room_status AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'DEPOSITED');

CREATE TYPE contract_status AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

CREATE TYPE invoice_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

CREATE TYPE service_unit AS ENUM ('KWH', 'M3', 'PERSON', 'ROOM', 'MONTH');

CREATE TYPE deposit_status AS ENUM ('PENDING', 'CONFIRMED', 'REFUNDED', 'FORFEITED');

CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE complaint_status AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

CREATE TYPE payment_method AS ENUM ('CASH', 'BANK_TRANSFER', 'VIETQR', 'MOMO');

-- -----------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- -----------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'TENANT',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenants_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    identity_card_number VARCHAR(20) UNIQUE,
    issue_date DATE,
    issue_place VARCHAR(100),
    permanent_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    gender VARCHAR(10),
    date_of_birth DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. BOARDING HOUSES & ROOMS
-- -----------------------------------------------------------------------------

CREATE TABLE boarding_houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    total_floors INT DEFAULT 1,
    description TEXT,
    rules TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    floor INT DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL,
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    area_sqm NUMERIC(6, 2) NOT NULL,
    max_occupants INT DEFAULT 2,
    status room_status NOT NULL DEFAULT 'AVAILABLE',
    facilities TEXT[], -- Array of facility keys e.g. ['wifi', 'air_con', 'parking', 'fridge']
    images TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_room_code_per_house UNIQUE (house_id, code)
);

CREATE TABLE room_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    asset_code VARCHAR(50),
    quantity INT DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'GOOD', -- e.g. NEW, GOOD, FAIR, DAMAGED
    value NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    unit service_unit NOT NULL DEFAULT 'MONTH',
    price NUMERIC(12, 2) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. CONTRACTS & DEPOSITS
-- -----------------------------------------------------------------------------

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_code VARCHAR(50) UNIQUE NOT NULL,
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_price NUMERIC(12, 2) NOT NULL,
    deposit_amount NUMERIC(12, 2) NOT NULL,
    billing_cycle_day INT DEFAULT 1, -- Day of month for invoice generation
    status contract_status NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_move_in DATE NOT NULL,
    status deposit_status NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. INVOICES & PAYMENTS & EXPENSES
-- -----------------------------------------------------------------------------

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_code VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    month INT NOT NULL,
    year INT NOT NULL,
    electricity_start NUMERIC(10, 2) DEFAULT 0,
    electricity_end NUMERIC(10, 2) DEFAULT 0,
    water_start NUMERIC(10, 2) DEFAULT 0,
    water_end NUMERIC(10, 2) DEFAULT 0,
    room_amount NUMERIC(12, 2) NOT NULL,
    electricity_amount NUMERIC(12, 2) DEFAULT 0,
    water_amount NUMERIC(12, 2) DEFAULT 0,
    service_amount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'UNPAID',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_invoice_per_contract_month UNIQUE (contract_id, month, year)
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'BANK_TRANSFER',
    transaction_code VARCHAR(100),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE operating_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g. MAINTENANCE, UTILITIES, SALARY, TAX, OTHER
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    receipt_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. COMPLAINTS & WORKORDERS
-- -----------------------------------------------------------------------------

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    images TEXT[],
    priority complaint_priority NOT NULL DEFAULT 'MEDIUM',
    status complaint_status NOT NULL DEFAULT 'PENDING',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. MARKETPLACE & LISTINGS
-- -----------------------------------------------------------------------------

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    rental_price NUMERIC(12, 2) NOT NULL,
    deposit NUMERIC(12, 2) NOT NULL,
    images TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_saved_listing UNIQUE (user_id, listing_id)
);

-- -----------------------------------------------------------------------------
-- 7. STAFF SHIFTS & AI LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE staff_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_name VARCHAR(50) NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_chat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_rooms_house_status ON rooms(house_id, status);
CREATE INDEX idx_contracts_tenant_landlord ON contracts(tenant_id, landlord_id, status);
CREATE INDEX idx_invoices_contract_status ON invoices(contract_id, status);
CREATE INDEX idx_invoices_house_month_year ON invoices(house_id, month, year);
CREATE INDEX idx_complaints_house_status ON complaints(house_id, status);
CREATE INDEX idx_listings_published ON listings(is_published);

-- -----------------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_boarding_houses_timestamp BEFORE UPDATE ON boarding_houses FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_rooms_timestamp BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_contracts_timestamp BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_invoices_timestamp BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_complaints_timestamp BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_listings_timestamp BEFORE UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
