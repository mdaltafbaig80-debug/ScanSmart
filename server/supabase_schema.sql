-- =============================================
-- ScanMart Supabase Database Schema
-- Run this entire file in: Supabase → SQL Editor → New Query → Run
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text unique not null,
    mobile_number text unique not null,
    password_hash text not null,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz default now()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
create table if not exists products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text default '',
    price numeric(10, 2) not null check (price >= 0),
    category text not null check (category in ('Dairy', 'Beverages', 'Snacks', 'Groceries', 'Fruits', 'Vegetables', 'Bakery', 'Frozen', 'Personal Care', 'Household', 'Other')),
    stock integer not null default 0 check (stock >= 0),
    qr_code text unique not null,
    image text default '/images/default-product.png',
    is_active boolean default true,
    discount_percent numeric(5, 2) default 0 check (discount_percent >= 0 and discount_percent <= 100),
    discount_valid_until timestamptz default null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =============================================
-- CART ITEMS TABLE (one row per user-product pair)
-- =============================================
create table if not exists cart_items (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references users(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    quantity integer not null default 1 check (quantity >= 1),
    price numeric(10, 2) not null,
    created_at timestamptz default now(),
    unique (user_id, product_id)
);

-- =============================================
-- BILLS TABLE
-- =============================================
create table if not exists bills (
    id uuid primary key default uuid_generate_v4(),
    bill_id text unique not null,
    user_id uuid not null references users(id),
    subtotal numeric(10, 2) not null,
    discount numeric(10, 2) default 0,
    discount_code text default null,
    tax numeric(10, 2) not null,
    tax_rate numeric(5, 2) default 18,
    total numeric(10, 2) not null,
    payment_status text default 'pending' check (payment_status in ('pending', 'completed', 'failed')),
    payment_method text default 'upi' check (payment_method in ('cash', 'card', 'upi', 'wallet')),
    created_at timestamptz default now()
);

-- =============================================
-- BILL ITEMS TABLE
-- =============================================
create table if not exists bill_items (
    id uuid primary key default uuid_generate_v4(),
    bill_id uuid not null references bills(id) on delete cascade,
    product_id uuid references products(id),
    name text not null,
    quantity integer not null,
    price numeric(10, 2) not null,
    subtotal numeric(10, 2) not null,
    is_returned boolean default false,
    returned_quantity integer default 0,
    return_date timestamptz default null,
    return_reason text default null
);

-- =============================================
-- SALES TABLE
-- =============================================
create table if not exists sales (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id),
    product_name text not null,
    quantity integer not null,
    revenue numeric(10, 2) not null,
    date timestamptz default now()
);

-- =============================================
-- DISCOUNTS TABLE
-- =============================================
create table if not exists discounts (
    id uuid primary key default uuid_generate_v4(),
    code text unique not null,
    description text default '',
    type text default 'percentage' check (type in ('percentage', 'fixed')),
    value numeric(10, 2) not null,
    min_purchase numeric(10, 2) default 0,
    max_discount numeric(10, 2) default null,
    valid_from timestamptz default now(),
    valid_until timestamptz not null,
    usage_limit integer default null,
    used_count integer default 0,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- =============================================
-- HELPER FUNCTION: increment_stock (for returns)
-- =============================================
create or replace function increment_stock(pid uuid, qty integer)
returns void as $$
begin
    update products set stock = stock + qty where id = pid;
end;
$$ language plpgsql;

-- =============================================
-- SEED: Demo Users (passwords are 'admin123' and 'user123')
-- NOTE: These are bcrypt hashes. You can change passwords after login.
-- =============================================
insert into users (name, email, mobile_number, password_hash, role) values
('Admin User', 'admin@scanmart.com', '9999999999', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO', 'admin'),
('John Doe', 'user@scanmart.com', '8888888888', '$2a$10$Ks3yD0.E7GdAFoJ4Pj8aEeeK7J23WQAKNBJfVvNiXi53SBXUVXlji', 'user')
on conflict (email) do nothing;

-- =============================================
-- SEED: Sample Products
-- =============================================
insert into products (name, description, price, category, stock, qr_code, image) values
('Fresh Milk', 'Farm fresh whole milk 1L', 65, 'Dairy', 50, 'SM-MILK-001', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300'),
('Cheese Slices', 'Processed cheese slices pack', 120, 'Dairy', 30, 'SM-CHEESE-002', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300'),
('Orange Juice', 'Fresh squeezed orange juice 1L', 85, 'Beverages', 40, 'SM-OJ-003', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300'),
('Cola Drink', 'Refreshing cola 2L bottle', 95, 'Beverages', 60, 'SM-COLA-004', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300'),
('Potato Chips', 'Crispy salted chips 200g', 45, 'Snacks', 80, 'SM-CHIPS-005', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300'),
('Chocolate Bar', 'Dark chocolate 100g', 75, 'Snacks', 100, 'SM-CHOCO-006', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300'),
('Basmati Rice', 'Premium basmati rice 5kg', 450, 'Groceries', 25, 'SM-RICE-007', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'),
('Cooking Oil', 'Sunflower cooking oil 1L', 180, 'Groceries', 35, 'SM-OIL-008', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'),
('Fresh Apples', 'Red apples 1kg', 150, 'Fruits', 45, 'SM-APPLE-009', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300'),
('Bananas', 'Fresh bananas 1 dozen', 60, 'Fruits', 55, 'SM-BANANA-010', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300'),
('White Bread', 'Sliced white bread loaf', 40, 'Bakery', 20, 'SM-BREAD-011', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300'),
('Butter Cookies', 'Danish butter cookies 400g', 220, 'Bakery', 15, 'SM-COOKIE-012', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300'),
('Shampoo', 'Anti-dandruff shampoo 400ml', 280, 'Personal Care', 30, 'SM-SHAMPOO-013', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300'),
('Toothpaste', 'Mint toothpaste 150g', 95, 'Personal Care', 40, 'SM-TOOTH-014', 'https://images.unsplash.com/photo-1628359355624-855c87991fa8?w=300'),
('Dish Soap', 'Liquid dish soap 750ml', 110, 'Household', 35, 'SM-DISH-015', 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=300')
on conflict (qr_code) do nothing;
