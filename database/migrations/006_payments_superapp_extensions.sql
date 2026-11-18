-- ============================================================================
-- Migration 006: Tatito Super-App 2.0 Extended Relational Entities
-- Covers Bank Accounts, UPI Accounts, Beneficiaries, Merchant Outlets,
-- Payment Attempts, Refunds, Bills/Recharges, Scratch Cards, Coupons,
-- User Sessions, Security Settings, Support Chat Messages & Admin RBAC.
-- Strictly avoids storing plaintext passwords, UPI PINs, OTPs, or CVVs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(140) NOT NULL,
  account_masked VARCHAR(32) NOT NULL,
  ifsc_code VARCHAR(16) NOT NULL,
  account_type VARCHAR(32) DEFAULT 'Savings Account',
  is_primary BOOLEAN DEFAULT false,
  sandbox_balance NUMERIC(14, 2) DEFAULT 0,
  verification_mode VARCHAR(32) DEFAULT 'SANDBOX_SIMULATED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upi_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
  upi_vpa VARCHAR(120) UNIQUE NOT NULL,
  handle VARCHAR(40) DEFAULT '@tatitoupi',
  is_primary BOOLEAN DEFAULT true,
  upi_pin_configured_via_npci BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beneficiary_name VARCHAR(120) NOT NULL,
  upi_vpa VARCHAR(120),
  mobile_number VARCHAR(20),
  bank_account_masked VARCHAR(32),
  ifsc_code VARCHAR(16),
  nickname VARCHAR(80),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_outlets (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
  outlet_code VARCHAR(40) UNIQUE NOT NULL,
  outlet_name VARCHAR(160) NOT NULL,
  city VARCHAR(80) NOT NULL,
  outlet_vpa VARCHAR(120) NOT NULL,
  qr_reference VARCHAR(64) NOT NULL,
  today_sales NUMERIC(14, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_ref VARCHAR(64) NOT NULL,
  channel VARCHAR(40) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  attempt_status VARCHAR(32) NOT NULL, -- 'DEMO_SUCCESS', 'PENDING', 'FAILED'
  failure_reason VARCHAR(200),
  is_simulated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_ref VARCHAR(64) NOT NULL,
  refund_ref VARCHAR(64) UNIQUE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  refund_status VARCHAR(32) DEFAULT 'REFUND_INITIATED_DEMO',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_ref VARCHAR(64) UNIQUE NOT NULL,
  category VARCHAR(48) NOT NULL,
  operator_name VARCHAR(140) NOT NULL,
  consumer_identifier VARCHAR(80) NOT NULL,
  bill_amount NUMERIC(14, 2) NOT NULL,
  due_date VARCHAR(40),
  bbps_ref VARCHAR(64),
  status VARCHAR(32) DEFAULT 'DEMO_SUCCESS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recharges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recharge_ref VARCHAR(64) UNIQUE NOT NULL,
  recharge_type VARCHAR(32) NOT NULL, -- 'mobile_prepaid', 'dth', 'fastag'
  operator_name VARCHAR(120) NOT NULL,
  subscriber_id VARCHAR(64) NOT NULL,
  plan_amount NUMERIC(10, 2) NOT NULL,
  validity_days INTEGER,
  status VARCHAR(32) DEFAULT 'DEMO_SUCCESS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scratch_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_code VARCHAR(40) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  reward_type VARCHAR(32) DEFAULT 'cashback', -- 'cashback', 'points'
  reward_value NUMERIC(10, 2) NOT NULL,
  is_scratched BOOLEAN DEFAULT false,
  expires_at VARCHAR(40),
  scratched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  coupon_code VARCHAR(40) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  min_spend NUMERIC(10, 2) DEFAULT 0,
  valid_until VARCHAR(40) NOT NULL,
  terms TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(64) UNIQUE NOT NULL,
  device_label VARCHAR(160) NOT NULL,
  ip_address VARCHAR(64),
  login_channel VARCHAR(32) DEFAULT 'PASSWORD',
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_language VARCHAR(24) DEFAULT 'English',
  push_alerts BOOLEAN DEFAULT true,
  email_alerts BOOLEAN DEFAULT true,
  sms_alerts BOOLEAN DEFAULT true,
  biometric_lock_enabled BOOLEAN DEFAULT false,
  mask_balances_by_default BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_role VARCHAR(32) NOT NULL, -- 'customer', 'agent', 'system'
  sender_name VARCHAR(120) NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  role_code VARCHAR(40) UNIQUE NOT NULL,
  role_name VARCHAR(80) NOT NULL,
  permissions_json TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_role_id INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL,
  branch_code VARCHAR(32) DEFAULT 'KDP-MAIN-01',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
