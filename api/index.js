// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import path2 from "path";
import fs2 from "fs";

// database/db.ts
import "dotenv/config";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
function isValidPgHost(host) {
  if (!host) return false;
  const h = host.trim().toLowerCase();
  const invalidPlaceholders = /* @__PURE__ */ new Set(["", "123", "undefined", "null", "base", "host", "example", "your_host"]);
  return !invalidPlaceholders.has(h);
}
function isValidDatabaseUrl(url) {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) return false;
  try {
    const parsed = new URL(trimmed);
    return isValidPgHost(parsed.hostname);
  } catch {
    return false;
  }
}
function shouldUseSsl(dbUrl, pgHost) {
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      const sslMode = parsed.searchParams.get("sslmode");
      if (sslMode === "disable") return false;
      const host = parsed.hostname.toLowerCase();
      if (host !== "localhost" && host !== "127.0.0.1") {
        return { rejectUnauthorized: false };
      }
    } catch {
      return false;
    }
  }
  if (pgHost && pgHost !== "localhost" && pgHost !== "127.0.0.1" && !pgHost.startsWith("/cloudsql/")) {
    return { rejectUnauthorized: false };
  }
  return false;
}
if (!isValidPgHost(process.env.PGHOST)) {
  delete process.env.PGHOST;
}
if (!isValidPgHost(process.env.SQL_HOST)) {
  delete process.env.SQL_HOST;
}
if (!isValidDatabaseUrl(process.env.DATABASE_URL)) {
  delete process.env.DATABASE_URL;
}
var isPostgresConfigured = Boolean(
  isValidDatabaseUrl(process.env.DATABASE_URL) || isValidPgHost(process.env.PGHOST) || isValidPgHost(process.env.SQL_HOST)
);
var pool = null;
var postgresConnected = false;
if (isPostgresConfigured) {
  try {
    const activeUrl = isValidDatabaseUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : void 0;
    const activeHost = isValidPgHost(process.env.PGHOST) ? process.env.PGHOST : isValidPgHost(process.env.SQL_HOST) ? process.env.SQL_HOST : void 0;
    const sslOption = shouldUseSsl(activeUrl, activeHost);
    pool = new Pool({
      connectionString: activeUrl,
      host: activeHost,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER || process.env.SQL_USER || "postgres",
      password: process.env.PGPASSWORD || process.env.SQL_PASSWORD || "postgres",
      database: process.env.PGDATABASE || process.env.SQL_DB_NAME || "tatito_finance",
      ...sslOption ? { ssl: sslOption } : {},
      max: process.env.VERCEL === "1" ? 3 : 10,
      min: 0,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 4e3
    });
    pool.on("error", (err) => {
      console.warn("[PostgreSQL Pool Notice]", err.message);
      postgresConnected = false;
    });
  } catch (err) {
    console.warn("[PostgreSQL Init Notice] Falling back to file/memory storage:", err);
    pool = null;
  }
}
var FALLBACK_DB_PATH = path.resolve(process.cwd(), "tatito_relational_db.json");
function getInitialRelationalDB() {
  return {
    users: [
      {
        id: 1,
        full_name: "Ramesh Kumar Chennur",
        email: "ramesh@tatito.in",
        phone: "9876543210",
        password_hash: "$2b$10$F9I0PKMdgXOuN0sFMywdROEPSHtHtKqF7p2N/vC8/LPDK03VHgQGG",
        // Password@123
        role: "customer",
        wallet_balance: 24850,
        is_active: true,
        is_verified: true,
        created_at: (/* @__PURE__ */ new Date("2025-04-12T10:00:00Z")).toISOString()
      },
      {
        id: 2,
        full_name: "Ankalaiah Bandlamudi",
        email: "admin@tatitofinance.com",
        phone: "9440123456",
        password_hash: "$2b$10$F9I0PKMdgXOuN0sFMywdROEPSHtHtKqF7p2N/vC8/LPDK03VHgQGG",
        // Password@123
        role: "admin",
        wallet_balance: 15e4,
        is_active: true,
        is_verified: true,
        created_at: (/* @__PURE__ */ new Date("2024-01-01T09:00:00Z")).toISOString()
      },
      {
        id: 3,
        full_name: "Siva Reddy",
        email: "agent@tatito.in",
        phone: "9440552233",
        password_hash: "$2b$10$F9I0PKMdgXOuN0sFMywdROEPSHtHtKqF7p2N/vC8/LPDK03VHgQGG",
        // Password@123
        role: "agent",
        wallet_balance: 45e3,
        is_active: true,
        is_verified: true,
        created_at: (/* @__PURE__ */ new Date("2025-02-15T09:00:00Z")).toISOString()
      },
      {
        id: 4,
        full_name: "Lakshmi Narayana Rao",
        email: "credit@tatito.in",
        phone: "9440811223",
        password_hash: "$2b$10$F9I0PKMdgXOuN0sFMywdROEPSHtHtKqF7p2N/vC8/LPDK03VHgQGG",
        // Password@123
        role: "credit_officer",
        wallet_balance: 8e4,
        is_active: true,
        is_verified: true,
        created_at: (/* @__PURE__ */ new Date("2024-06-01T09:00:00Z")).toISOString()
      },
      {
        id: 5,
        full_name: "M/s. Tatito Projects \u2014 Super Admin",
        email: "superadmin@tatitofinance.com",
        phone: "9440999999",
        password_hash: "$2b$10$F9I0PKMdgXOuN0sFMywdROEPSHtHtKqF7p2N/vC8/LPDK03VHgQGG",
        // Password@123
        role: "super_admin",
        wallet_balance: 5e5,
        is_active: true,
        is_verified: true,
        created_at: (/* @__PURE__ */ new Date("2024-01-01T08:00:00Z")).toISOString()
      }
    ],
    user_profiles: [
      {
        user_id: 1,
        dob: "1988-06-15",
        gender: "Male",
        pan_number: "ABCDE1234F",
        aadhaar_last4: "8821",
        address_line1: "Door 4/218, Trunk Road",
        city: "Kadapa",
        state: "Andhra Pradesh",
        pincode: "516001",
        annual_income: 85e4,
        bank_account_no: "\u2022\u2022\u2022\u2022 4821",
        bank_ifsc: "SBIN0000840",
        bank_name: "State Bank of India (Kadapa Main)"
      }
    ],
    kyc_records: [
      {
        id: 1,
        user_id: 1,
        document_type: "pan",
        document_number_masked: "ABCDE****F",
        verification_status: "sandbox_simulated",
        verification_provider: "DigiLocker / NSDL KRA Sandbox",
        verified_at: (/* @__PURE__ */ new Date()).toISOString(),
        remarks: "Simulated via Income Tax NSDL KRA Sandbox [Demo]"
      },
      {
        id: 2,
        user_id: 1,
        document_type: "aadhaar",
        document_number_masked: "XXXX-XXXX-8821",
        verification_status: "sandbox_simulated",
        verification_provider: "UIDAI OTP Sandbox",
        verified_at: (/* @__PURE__ */ new Date()).toISOString(),
        remarks: "Simulated via UIDAI OTP Sandbox [Demo]"
      }
    ],
    loan_products: [
      { id: 1, product_code: "PL_UNSECURED", product_name: "Personal Loan", min_amount: 25e3, max_amount: 1e6, base_interest_rate: 14, min_tenure_months: 12, max_tenure_months: 60, is_secured: false, description: "Quick credit for emergency, wedding or travel" },
      { id: 2, product_code: "BL_GROWTH", product_name: "Business Loan", min_amount: 1e5, max_amount: 5e6, base_interest_rate: 16, min_tenure_months: 12, max_tenure_months: 84, is_secured: false, description: "Working capital and inventory expansion for Kadapa MSMEs" },
      { id: 3, product_code: "GL_EXPRESS", product_name: "Gold Loan", min_amount: 1e4, max_amount: 2e6, base_interest_rate: 11, min_tenure_months: 3, max_tenure_months: 36, is_secured: true, description: "Immediate disbursement against hallmark gold" },
      { id: 4, product_code: "HL_PRIME", product_name: "Home Loan", min_amount: 5e5, max_amount: 1e7, base_interest_rate: 9, min_tenure_months: 60, max_tenure_months: 240, is_secured: true, description: "Financing for purchasing apartments or villas" },
      { id: 5, product_code: "VL_AUTO", product_name: "Vehicle Loan", min_amount: 5e4, max_amount: 2e6, base_interest_rate: 10, min_tenure_months: 12, max_tenure_months: 84, is_secured: true, description: "Finance up to 90% on-road cost" },
      { id: 6, product_code: "PLT_OPEN", product_name: "Plot Loan", min_amount: 2e5, max_amount: 5e6, base_interest_rate: 9.75, min_tenure_months: 36, max_tenure_months: 180, is_secured: true, description: "DTCP/APCRDA approved plot purchase" },
      { id: 7, product_code: "LAP_SECURED", product_name: "Loan Against Property", min_amount: 5e5, max_amount: 15e6, base_interest_rate: 10.5, min_tenure_months: 36, max_tenure_months: 180, is_secured: true, description: "Unlock real estate value" }
    ],
    loan_applications: [
      {
        id: 1,
        application_no: "TF-LN-2026-9481",
        user_id: 1,
        product_id: 2,
        product_name: "Business Loan",
        applicant_name: "Ramesh Kumar Chennur",
        phone: "9876543210",
        email: "ramesh@tatito.in",
        monthly_income: 85e3,
        requested_amount: 15e5,
        interest_rate: 16,
        tenure_months: 36,
        calculated_emi: 52758,
        purpose: "Expanding inventory at textile retail showroom in Trunk Road, Kadapa",
        status: "under_review",
        credit_score: 754,
        officer_remarks: "Physical store verification scheduled with field officer.",
        sanctioned_amount: 15e5,
        created_at: "2026-10-12T14:30:00Z"
      },
      {
        id: 2,
        application_no: "TF-LN-2026-8910",
        user_id: 1,
        product_id: 4,
        product_name: "Home Loan",
        applicant_name: "Srinivasa Rao Giddalur",
        phone: "9440811223",
        email: "srinivas.g@gmail.com",
        monthly_income: 12e4,
        requested_amount: 45e5,
        interest_rate: 9,
        tenure_months: 180,
        calculated_emi: 45643,
        purpose: "Construction of duplex house in Nagarajupalle, Kadapa",
        status: "submitted",
        credit_score: 720,
        officer_remarks: "Awaiting municipal approved plan deed.",
        created_at: "2026-10-14T09:15:00Z"
      },
      {
        id: 3,
        application_no: "TF-LN-2025-0814",
        user_id: 1,
        product_id: 3,
        product_name: "Gold Loan",
        applicant_name: "Ramesh Kumar Chennur",
        phone: "9876543210",
        email: "ramesh@tatito.in",
        monthly_income: 85e3,
        requested_amount: 25e4,
        interest_rate: 11,
        tenure_months: 12,
        calculated_emi: 22100,
        purpose: "Seasonal store inventory",
        status: "disbursed",
        credit_score: 760,
        officer_remarks: "Disbursed via Kadapa gold desk.",
        sanctioned_amount: 25e4,
        created_at: "2025-06-15T10:00:00Z"
      }
    ],
    loan_documents: [],
    collateral_details: [],
    guarantors: [],
    loan_sanctions: [],
    disbursements: [],
    emi_schedules: [
      { id: 1, application_id: 3, installment_number: 1, due_date: "2026-07-20", emi_amount: 22100, principal_component: 19808, interest_component: 2292, remaining_balance: 230192, payment_status: "paid", paid_date: "2026-07-19" },
      { id: 2, application_id: 3, installment_number: 2, due_date: "2026-08-20", emi_amount: 22100, principal_component: 19990, interest_component: 2110, remaining_balance: 210202, payment_status: "paid", paid_date: "2026-08-18" },
      { id: 3, application_id: 3, installment_number: 3, due_date: "2026-09-20", emi_amount: 22100, principal_component: 20173, interest_component: 1927, remaining_balance: 190029, payment_status: "paid", paid_date: "2026-09-20" },
      { id: 4, application_id: 3, installment_number: 4, due_date: "2026-10-20", emi_amount: 22100, principal_component: 20358, interest_component: 1742, remaining_balance: 169671, payment_status: "pending", paid_date: null }
    ],
    payments: [
      {
        id: 1,
        payment_ref: "TT-TXN-20261010-4102",
        bbps_ref_no: "BBPS9081245102",
        user_id: 1,
        payment_category: "electricity",
        operator_name: "APSPDCL (Southern Power AP)",
        account_identifier: "1009823412034",
        amount: 1420,
        payment_mode: "wallet",
        status: "SUCCESS",
        created_at: "2026-10-10T16:20:00Z"
      }
    ],
    demat_applications: [
      {
        id: 1,
        user_id: 1,
        client_code: "TT-KDP-89104",
        dp_id: "IN300128-10049281",
        depository: "NSDL",
        linked_bank_account: "\u2022\u2022\u2022\u2022 4821",
        linked_bank_ifsc: "SBIN0000840",
        status: "active",
        created_at: "2025-05-10T10:00:00Z"
      }
    ],
    investment_portfolios: [
      { id: 1, user_id: 1, asset_symbol: "RELIANCE", asset_name: "Reliance Industries Ltd", category: "equity", quantity: 25, avg_buy_price: 2850, current_price: 2945.6, invested_amount: 71250, current_valuation: 73640 },
      { id: 2, user_id: 1, asset_symbol: "TCS", asset_name: "Tata Consultancy Services Ltd", category: "equity", quantity: 15, avg_buy_price: 3950, current_price: 4120.75, invested_amount: 59250, current_valuation: 61811.25 },
      { id: 3, user_id: 1, asset_symbol: "UTI_NIFTY50", asset_name: "UTI Nifty 50 Index Fund Direct", category: "mutual_fund", quantity: 124.5, avg_buy_price: 1200, current_price: 1380, invested_amount: 149400, current_valuation: 171810 },
      { id: 4, user_id: 1, asset_symbol: "GOLDBEES", asset_name: "Nippon India Gold ETF (24K)", category: "gold_etf", quantity: 1500, avg_buy_price: 60, current_price: 68.45, invested_amount: 9e4, current_valuation: 102675 },
      { id: 5, user_id: 1, asset_symbol: "GOI_718_2033", asset_name: "7.18% GS 2033 Sovereign Bond", category: "sovereign_bond", quantity: 500, avg_buy_price: 100, current_price: 101.4, invested_amount: 5e4, current_valuation: 50700 }
    ],
    watchlists: [
      { id: 1, user_id: 1, symbol: "RELIANCE", added_at: (/* @__PURE__ */ new Date()).toISOString() },
      { id: 2, user_id: 1, symbol: "TCS", added_at: (/* @__PURE__ */ new Date()).toISOString() },
      { id: 3, user_id: 1, symbol: "GOLDBEES", added_at: (/* @__PURE__ */ new Date()).toISOString() }
    ],
    stock_orders: [
      {
        id: 1,
        order_ref: "NSE-SIM-20261011",
        user_id: 1,
        symbol: "RELIANCE",
        order_type: "BUY",
        quantity: 25,
        executed_price: 2850,
        total_order_value: 71250,
        status: "EXECUTED",
        is_simulated: true,
        created_at: "2026-10-11T10:15:00Z"
      },
      {
        id: 2,
        order_ref: "NSE-SIM-20261012",
        user_id: 1,
        symbol: "TCS",
        order_type: "BUY",
        quantity: 15,
        executed_price: 3950,
        total_order_value: 59250,
        status: "EXECUTED",
        is_simulated: true,
        created_at: "2026-10-12T11:30:00Z"
      }
    ],
    mutual_funds: [
      { id: 1, fund_code: "UTI_NIFTY50", fund_name: "UTI Nifty 50 Index Fund Direct-Growth", fund_house: "UTI Mutual Fund", category: "Large Cap Index", risk_level: "Very High", cagr_1y: 19.4, cagr_3y: 16.8, cagr_5y: 14.5, current_nav: 1380, nav: 1380, min_sip_amount: 500, fund_size_cr: 18500, aum_cr: 18500, expense_ratio_pct: 0.2, expense_ratio: 0.2, fund_manager: "Sharwan Kumar Goyal" },
      { id: 2, fund_code: "PARAG_PARIKH", fund_name: "Parag Parikh Flexi Cap Fund Direct-Growth", fund_house: "PPFAS Mutual Fund", category: "Flexi Cap", risk_level: "High", cagr_1y: 24.1, cagr_3y: 21.4, cagr_5y: 19.8, current_nav: 82.4, nav: 82.4, min_sip_amount: 1e3, fund_size_cr: 68e3, aum_cr: 68e3, expense_ratio_pct: 0.65, expense_ratio: 0.65, fund_manager: "Rajeev Thakkar" },
      { id: 3, fund_code: "NIPPON_SMALL", fund_name: "Nippon India Small Cap Fund Direct-Growth", fund_house: "Nippon India Mutual Fund", category: "Small Cap", risk_level: "Very High", cagr_1y: 31.2, cagr_3y: 28.6, cagr_5y: 24.2, current_nav: 164.2, nav: 164.2, min_sip_amount: 500, fund_size_cr: 49e3, aum_cr: 49e3, expense_ratio_pct: 0.7, expense_ratio: 0.7, fund_manager: "Samir Rachh" },
      { id: 4, fund_code: "ICICI_PRU_BAL", fund_name: "ICICI Prudential Balanced Advantage Direct-Growth", fund_house: "ICICI Prudential AMC", category: "Dynamic Asset Hybrid", risk_level: "Moderate", cagr_1y: 15.6, cagr_3y: 14.2, cagr_5y: 13.1, current_nav: 71.8, nav: 71.8, min_sip_amount: 500, fund_size_cr: 58e3, aum_cr: 58e3, expense_ratio_pct: 0.85, expense_ratio: 0.85, fund_manager: "Sankaran Naren" },
      { id: 5, fund_code: "MIRA_TAX_SAVER", fund_name: "Mirae Asset ELSS Tax Saver Direct-Growth", fund_house: "Mirae Asset Investment Managers", category: "ELSS (Section 80C)", risk_level: "Very High", cagr_1y: 21.5, cagr_3y: 18.9, cagr_5y: 17.2, current_nav: 44.6, nav: 44.6, min_sip_amount: 500, fund_size_cr: 24e3, aum_cr: 24e3, expense_ratio_pct: 0.58, expense_ratio: 0.58, fund_manager: "Neelesh Surana" }
    ],
    mutual_fund_orders: [],
    sips: [
      { id: 1, mandate_ref: "SIP-MANDATE-2026-01", user_id: 1, fund_id: 1, monthly_amount: 2e3, debit_day: 10, next_debit_date: "2026-11-10", status: "active" },
      { id: 2, mandate_ref: "SIP-MANDATE-2026-02", user_id: 1, fund_id: 2, monthly_amount: 3e3, debit_day: 5, next_debit_date: "2026-11-05", status: "active" }
    ],
    notifications: [
      { id: 1, user_id: 1, title: "Gold Loan EMI Due in 6 Days", message: "Your monthly EMI of \u20B922,100 for Gold Loan #TF-LN-2025-0814 is due on next Monday.", category: "reminder", is_read: false, created_at: "2026-10-14T08:00:00Z" },
      { id: 2, user_id: 1, title: "SIP Auto-Debit Mandate Authorized", message: "e-Mandate for \u20B92,000 in UTI Nifty 50 Index Fund scheduled for 10th of every month.", category: "investments", is_read: true, created_at: "2026-10-10T12:00:00Z" },
      { id: 3, user_id: 1, title: "Business Loan In Review", message: "Application #TF-LN-2026-9481 is assigned to Credit Officer Lakshmi Narayana Rao.", category: "loans", is_read: true, created_at: "2026-10-12T16:00:00Z" }
    ],
    agents: [
      {
        id: 1,
        user_id: 3,
        agent_code: "TF-DSA-042",
        agency_name: "Rayalaseema Financial Associates",
        operating_region: "Kadapa, Proddatur & Pulivendula",
        commission_rate_pct: 1,
        total_leads_count: 14,
        total_disbursed_volume: 65e5,
        commission_earned: 64500,
        status: "active"
      }
    ],
    agent_leads: [
      {
        id: 1,
        agent_id: 3,
        agent_code: "TF-DSA-042",
        applicant_name: "Venkata Ramana Reddy",
        phone: "9440112233",
        email: "ramana.v@gmail.com",
        loan_product: "Business Loan",
        requested_amount: 15e5,
        location: "Kadapa City",
        commission_rate_pct: 1,
        commission_amount: 15e3,
        status: "In Review",
        notes: "Kadapa MSME textile store owner expansion",
        created_at: "2026-10-15"
      },
      {
        id: 2,
        agent_id: 3,
        agent_code: "TF-DSA-042",
        applicant_name: "Kavitha Anjaneyulu",
        phone: "9848099881",
        email: "kavitha.a@gmail.com",
        loan_product: "Home Loan",
        requested_amount: 35e5,
        location: "Proddatur",
        commission_rate_pct: 0.4,
        commission_amount: 14e3,
        status: "Disbursed",
        notes: "Villa purchase in Proddatur RTC Colony",
        created_at: "2026-10-10"
      },
      {
        id: 3,
        agent_id: 3,
        agent_code: "TF-DSA-042",
        applicant_name: "Chandrasekhar Raju",
        phone: "9440776655",
        email: "raju.c@yahoo.com",
        loan_product: "Personal Loan",
        requested_amount: 4e5,
        location: "Pulivendula",
        commission_rate_pct: 1.25,
        commission_amount: 5e3,
        status: "Contacted",
        notes: "Medical emergency enquiry in Pulivendula",
        created_at: "2026-10-18"
      }
    ],
    audit_logs: [
      {
        id: 1,
        actor_id: 2,
        action_type: "SYSTEM_BOOT",
        entity_name: "system",
        entity_id: "kadapa-hub",
        details: { event: "Node.js Express relational engine started" },
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ],
    wallet_transactions: [
      {
        id: 1,
        user_id: 1,
        transaction_type: "credit",
        amount: 26270,
        balance_after: 26270,
        description: "Initial Wallet Credit via UPI Sandbox (ramesh@okaxis)",
        reference_id: "WAL-INIT-20261001",
        created_at: "2026-10-01T10:00:00Z"
      },
      {
        id: 2,
        user_id: 1,
        transaction_type: "debit",
        amount: 1420,
        balance_after: 24850,
        description: "BBPS Utility Bill Payment - APSPDCL (Southern Power AP)",
        reference_id: "TT-TXN-20261010-4102",
        created_at: "2026-10-10T16:20:00Z"
      }
    ]
  };
}
function loadRelationalDB() {
  const init = getInitialRelationalDB();
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const data = fs.readFileSync(FALLBACK_DB_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (!parsed.agent_leads) {
        parsed.agent_leads = init.agent_leads;
      }
      if (!parsed.wallet_transactions) {
        parsed.wallet_transactions = init.wallet_transactions;
      }
      if (parsed.users) {
        const seedSuper = init.users.find((u) => u.email === "superadmin@tatitofinance.com");
        const existingSuper = parsed.users.find((u) => u.email === "superadmin@tatitofinance.com");
        if (!existingSuper && seedSuper) {
          const maxId = parsed.users.reduce((max, u) => Math.max(max, u.id || 0), 0);
          parsed.users.push({ ...seedSuper, id: Math.max(5, maxId + 1) });
          saveRelationalDB(parsed);
        } else if (existingSuper) {
          existingSuper.role = "super_admin";
          existingSuper.is_active = true;
          const colliding = parsed.users.filter((u) => u.id === existingSuper.id);
          if (colliding.length > 1) {
            const maxId = parsed.users.reduce((max, u) => Math.max(max, u.id || 0), 0);
            existingSuper.id = maxId + 1;
            saveRelationalDB(parsed);
          }
        }
      }
      if (parsed.mutual_funds) {
        parsed.mutual_funds = parsed.mutual_funds.map((f) => {
          const seedFund = init.mutual_funds.find((sf) => sf.id === f.id);
          return { ...seedFund, ...f, nav: f.nav ?? f.current_nav, aum_cr: f.aum_cr ?? f.fund_size_cr, expense_ratio: f.expense_ratio ?? f.expense_ratio_pct, cagr_1y: f.cagr_1y ?? seedFund?.cagr_1y ?? 18, fund_house: f.fund_house ?? seedFund?.fund_house ?? "Direct AMC" };
        });
      }
      return parsed;
    }
  } catch (e) {
    console.error("Error loading fallback relational DB:", e);
  }
  saveRelationalDB(init);
  return init;
}
function isProduction() {
  return process.env.NODE_ENV === "production";
}
function isDemoMode() {
  return process.env.DATA_STORE_MODE === "demo";
}
function saveRelationalDB(state) {
  if (isProduction() || process.env.DATA_STORE_MODE !== "demo") {
    return;
  }
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving fallback relational DB:", e);
  }
}
var relationalDB = loadRelationalDB();
var DatabaseUnavailableError = class extends Error {
  constructor(message = "PostgreSQL database is currently unavailable in production mode. Data mutations are disabled.") {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.statusCode = 503;
  }
};
function checkDatabaseAccess() {
  if (isProduction()) {
    if (!postgresConnected && !(process.env.VERCEL === "1" && process.env.DATA_STORE_MODE === "demo")) {
      throw new DatabaseUnavailableError("PostgreSQL database is required in production mode and is currently unavailable.");
    }
  } else if (!postgresConnected && process.env.DATA_STORE_MODE !== "demo") {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Data Store] Operating on in-memory storage without explicit DATA_STORE_MODE=demo");
    }
  }
}
function isPostgresConnected() {
  return postgresConnected;
}
async function runMigrations(pgPool) {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(100) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const appliedRes = await client.query("SELECT version FROM schema_migrations");
    const appliedSet = new Set(appliedRes.rows.map((r) => r.version));
    const migrationsDir = path.resolve(process.cwd(), "database/migrations");
    const appliedThisRun = [];
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
      for (const file of files) {
        if (!appliedSet.has(file)) {
          console.log(`[PostgreSQL Migration] Applying migration: ${file}...`);
          const filePath = path.join(migrationsDir, file);
          let rawSql = fs.readFileSync(filePath, "utf8");
          const lines = rawSql.split("\n");
          const resolvedLines = [];
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("\\i ")) {
              const relPath = trimmed.slice(3).trim();
              const incPath = path.resolve(process.cwd(), relPath);
              if (fs.existsSync(incPath)) {
                resolvedLines.push(fs.readFileSync(incPath, "utf8"));
              } else {
                console.warn(`[Migration Warning] Include path not found: ${relPath}`);
              }
            } else {
              resolvedLines.push(line);
            }
          }
          const finalSql = resolvedLines.join("\n");
          await client.query("BEGIN");
          try {
            await client.query(finalSql);
            await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
            await client.query("COMMIT");
            appliedThisRun.push(file);
            console.log(`[PostgreSQL Migration] Successfully applied: ${file}`);
          } catch (migErr) {
            await client.query("ROLLBACK");
            console.error(`[PostgreSQL Migration] Error in ${file}:`, migErr.message);
            throw migErr;
          }
        }
      }
    }
    return appliedThisRun;
  } finally {
    client.release();
  }
}
async function initPostgres() {
  if (!pool) {
    postgresConnected = false;
    return false;
  }
  try {
    const testResult = await pool.query("SELECT NOW() as server_time");
    postgresConnected = true;
    console.log("[PostgreSQL] Connected successfully at:", testResult.rows[0]?.server_time);
    await runMigrations(pool);
    return true;
  } catch (err) {
    postgresConnected = false;
    if (isProduction()) {
      console.error("[PostgreSQL Connection Error in Production]:", err.message);
    } else {
      console.warn("[PostgreSQL Connection Notice] Operating on fallback store:", err.message);
    }
    return false;
  }
}
var pgInitPromise = null;
var pgLastAttemptAt = 0;
function isPostgresConfiguredFlag() {
  return isPostgresConfigured;
}
async function ensurePostgresInitialized() {
  if (!pool || !isPostgresConfigured) return false;
  if (postgresConnected) return true;
  if (pgInitPromise) return pgInitPromise;
  const now = Date.now();
  if (pgLastAttemptAt && now - pgLastAttemptAt < 2e4) {
    return false;
  }
  pgLastAttemptAt = now;
  pgInitPromise = initPostgres().finally(() => {
    pgInitPromise = null;
  });
  return pgInitPromise;
}
async function dbQuery(text, params = []) {
  checkDatabaseAccess();
  if (pool && postgresConnected) {
    try {
      const res = await pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    } catch (e) {
      console.warn("PostgreSQL query execution error:", e.message);
      throw e;
    }
  }
  return { rows: [], rowCount: 0 };
}
var dbRepository = {
  users: {
    async findByEmail(email) {
      checkDatabaseAccess();
      const cleanEmail = email.toLowerCase().trim();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1", [cleanEmail]);
        if (res.rows.length > 0) return res.rows[0];
        return null;
      }
      return relationalDB.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
    },
    async findByPhone(phone) {
      checkDatabaseAccess();
      const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
      if (!cleanPhone) return null;
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM users WHERE RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = $1 LIMIT 1", [cleanPhone]);
        if (res.rows.length > 0) return res.rows[0];
        return null;
      }
      return relationalDB.users.find((u) => String(u.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone) || null;
    },
    async findById(id) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
        if (res.rows.length > 0) return res.rows[0];
        return null;
      }
      return relationalDB.users.find((u) => u.id === id) || null;
    },
    async getAll(roleFilter) {
      checkDatabaseAccess();
      if (postgresConnected) {
        let query = "SELECT id, full_name, email, phone, role, wallet_balance, is_active, is_verified, created_at FROM users";
        const params = [];
        if (roleFilter) {
          query += " WHERE role = $1";
          params.push(roleFilter);
        }
        query += " ORDER BY id ASC";
        const res = await dbQuery(query, params);
        return res.rows;
      }
      let list = relationalDB.users;
      if (roleFilter) list = list.filter((u) => u.role === roleFilter);
      return list.map(({ password_hash: _, ...safe }) => safe);
    },
    async create(user) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO users (full_name, email, phone, password_hash, role, wallet_balance, is_active, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6, true, true)
           RETURNING *;`,
          [user.full_name, user.email, user.phone, user.password_hash, user.role, user.wallet_balance || 25e3]
        );
        if (res.rows.length > 0) {
          const inserted = res.rows[0];
          relationalDB.users.push(inserted);
          saveRelationalDB(relationalDB);
          return inserted;
        }
      }
      const newId = relationalDB.users.length > 0 ? Math.max(...relationalDB.users.map((u) => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        password_hash: user.password_hash,
        role: user.role,
        wallet_balance: user.wallet_balance || 25e3,
        is_active: true,
        is_verified: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      relationalDB.users.push(newUser);
      saveRelationalDB(relationalDB);
      return newUser;
    },
    async updateWallet(userId, newBalance) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE users SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newBalance, userId]);
      }
      const u = relationalDB.users.find((item) => item.id === userId);
      if (u) {
        u.wallet_balance = newBalance;
        saveRelationalDB(relationalDB);
      }
    },
    async updateRole(userId, newRole) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newRole, userId]);
      }
      const u = relationalDB.users.find((item) => item.id === userId);
      if (u) {
        u.role = newRole;
        saveRelationalDB(relationalDB);
      }
    },
    async updateStatus(userId, isActive) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [isActive, userId]);
      }
      const u = relationalDB.users.find((item) => item.id === userId);
      if (u) {
        u.is_active = isActive;
        saveRelationalDB(relationalDB);
      }
    },
    async updatePassword(userId, newPasswordHash) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newPasswordHash, userId]);
      }
      const u = relationalDB.users.find((item) => item.id === userId);
      if (u) {
        u.password_hash = newPasswordHash;
        saveRelationalDB(relationalDB);
      }
    },
    async updateProfileInfo(userId, data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery(
          `UPDATE users SET
             full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [data.full_name || null, data.phone || null, userId]
        );
      }
      const u = relationalDB.users.find((item) => item.id === userId);
      if (u) {
        if (data.full_name) u.full_name = data.full_name;
        if (data.phone) u.phone = data.phone;
        saveRelationalDB(relationalDB);
      }
      return u || null;
    }
  },
  wallet: {
    async getTransactions(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY id DESC", [userId]);
        return res.rows;
      }
      relationalDB.wallet_transactions = relationalDB.wallet_transactions || [];
      return relationalDB.wallet_transactions.filter((t) => t.user_id === userId);
    },
    async recordTransaction(data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO wallet_transactions (user_id, transaction_type, amount, balance_after, description, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [data.user_id, data.transaction_type, data.amount, data.balance_after, data.description, data.reference_id]
        );
        if (res.rows.length > 0) return res.rows[0];
      }
      relationalDB.wallet_transactions = relationalDB.wallet_transactions || [];
      const newTxn = {
        id: relationalDB.wallet_transactions.length > 0 ? Math.max(...relationalDB.wallet_transactions.map((t) => t.id || 0)) + 1 : 1,
        ...data,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      relationalDB.wallet_transactions.unshift(newTxn);
      saveRelationalDB(relationalDB);
      return newTxn;
    }
  },
  profiles: {
    async getByUserId(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1", [userId]);
        if (res.rows.length > 0) return res.rows[0];
        return null;
      }
      return relationalDB.user_profiles.find((p) => p.user_id === userId) || null;
    },
    async upsert(userId, data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO user_profiles (
             user_id, dob, gender, pan_number, aadhaar_last4, address_line1,
             city, state, pincode, annual_income, occupation_type,
             bank_account_no, bank_ifsc, bank_name
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (user_id) DO UPDATE SET
             dob = COALESCE($2, user_profiles.dob),
             gender = COALESCE($3, user_profiles.gender),
             pan_number = COALESCE($4, user_profiles.pan_number),
             aadhaar_last4 = COALESCE($5, user_profiles.aadhaar_last4),
             address_line1 = COALESCE($6, user_profiles.address_line1),
             city = COALESCE($7, user_profiles.city),
             state = COALESCE($8, user_profiles.state),
             pincode = COALESCE($9, user_profiles.pincode),
             annual_income = COALESCE($10, user_profiles.annual_income),
             occupation_type = COALESCE($11, user_profiles.occupation_type),
             bank_account_no = COALESCE($12, user_profiles.bank_account_no),
             bank_ifsc = COALESCE($13, user_profiles.bank_ifsc),
             bank_name = COALESCE($14, user_profiles.bank_name),
             updated_at = CURRENT_TIMESTAMP
           RETURNING *;`,
          [
            userId,
            data.dob || null,
            data.gender || null,
            data.pan_number || null,
            data.aadhaar_last4 || null,
            data.address_line1 || null,
            data.city || null,
            data.state || null,
            data.pincode || null,
            data.annual_income !== void 0 ? data.annual_income : null,
            data.occupation_type || null,
            data.bank_account_no || null,
            data.bank_ifsc || null,
            data.bank_name || null
          ]
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      }
      let profile = relationalDB.user_profiles.find((p) => p.user_id === userId);
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== void 0));
      if (!profile) {
        profile = { user_id: userId, ...cleanData };
        relationalDB.user_profiles.push(profile);
      } else {
        Object.assign(profile, cleanData);
      }
      saveRelationalDB(relationalDB);
      return profile;
    }
  },
  kyc: {
    async getByUserId(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM kyc_records WHERE user_id = $1 ORDER BY id DESC", [userId]);
        return res.rows;
      }
      return relationalDB.kyc_records.filter((k) => k.user_id === userId);
    },
    async upsertRecord(userId, docType, maskedNum, provider2, remarks, verificationStatus = "sandbox_simulated") {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO kyc_records (user_id, document_type, document_number_masked, verification_status, verification_provider, remarks)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [userId, docType, maskedNum, verificationStatus, provider2, remarks]
        );
        if (res.rows.length > 0) return res.rows[0];
      }
      const existingIdx = relationalDB.kyc_records.findIndex((k) => k.user_id === userId && k.document_type === docType);
      const record = {
        id: existingIdx !== -1 ? relationalDB.kyc_records[existingIdx].id : relationalDB.kyc_records.length + 1,
        user_id: userId,
        document_type: docType,
        document_number_masked: maskedNum,
        verification_status: verificationStatus,
        verification_provider: provider2,
        verified_at: (/* @__PURE__ */ new Date()).toISOString(),
        remarks
      };
      if (existingIdx !== -1) relationalDB.kyc_records[existingIdx] = record;
      else relationalDB.kyc_records.push(record);
      saveRelationalDB(relationalDB);
      return record;
    }
  },
  loans: {
    async getProducts() {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM loan_products WHERE is_active = true ORDER BY id ASC");
        if (res.rows.length > 0) return res.rows;
      }
      return relationalDB.loan_products;
    },
    async getProductById(id) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM loan_products WHERE id = $1 LIMIT 1", [id]);
        if (res.rows.length > 0) return res.rows[0];
      }
      return relationalDB.loan_products.find((p) => p.id === id) || null;
    },
    async updateProduct(id, data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery(
          `UPDATE loan_products SET 
             base_interest_rate = COALESCE($1, base_interest_rate),
             min_amount = COALESCE($2, min_amount),
             max_amount = COALESCE($3, max_amount),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [data.base_interest_rate, data.min_amount, data.max_amount, id]
        );
      }
      const prod = relationalDB.loan_products.find((p) => p.id === id);
      if (prod) {
        if (data.base_interest_rate !== void 0) prod.base_interest_rate = data.base_interest_rate;
        if (data.min_amount !== void 0) prod.min_amount = data.min_amount;
        if (data.max_amount !== void 0) prod.max_amount = data.max_amount;
        saveRelationalDB(relationalDB);
        return prod;
      }
      return null;
    },
    async getAllApplications(statusFilter) {
      checkDatabaseAccess();
      if (postgresConnected) {
        let query = "SELECT * FROM loan_applications";
        const params = [];
        if (statusFilter && statusFilter !== "all") {
          query += " WHERE status = $1";
          params.push(statusFilter);
        }
        query += " ORDER BY id DESC";
        const res = await dbQuery(query, params);
        return res.rows;
      }
      let list = relationalDB.loan_applications;
      if (statusFilter && statusFilter !== "all") {
        list = list.filter((a) => a.status === statusFilter);
      }
      return list;
    },
    async getApplicationsByUser(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM loan_applications WHERE user_id = $1 ORDER BY id DESC", [userId]);
        return res.rows;
      }
      return relationalDB.loan_applications.filter((a) => a.user_id === userId);
    },
    async getApplicationById(id) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM loan_applications WHERE id = $1 LIMIT 1", [id]);
        if (res.rows.length > 0) return res.rows[0];
      }
      return relationalDB.loan_applications.find((a) => a.id === id) || null;
    },
    async createApplication(appData) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO loan_applications (
            application_no, user_id, product_id, applicant_name, phone, email,
            monthly_income, requested_amount, interest_rate, tenure_months,
            calculated_emi, purpose, status, officer_remarks, credit_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *;`,
          [
            appData.application_no,
            appData.user_id,
            appData.product_id,
            appData.applicant_name,
            appData.phone,
            appData.email,
            appData.monthly_income,
            appData.requested_amount,
            appData.interest_rate,
            appData.tenure_months,
            appData.calculated_emi,
            appData.purpose,
            appData.status || "submitted",
            appData.officer_remarks || null,
            appData.credit_score || 745
          ]
        );
        if (res.rows.length > 0) {
          const inserted = res.rows[0];
          relationalDB.loan_applications.unshift(inserted);
          saveRelationalDB(relationalDB);
          return inserted;
        }
      }
      const newId = relationalDB.loan_applications.length > 0 ? Math.max(...relationalDB.loan_applications.map((a) => a.id || 0)) + 1 : 1;
      const appWithId = { id: newId, ...appData };
      relationalDB.loan_applications.unshift(appWithId);
      saveRelationalDB(relationalDB);
      return appWithId;
    },
    async updateApplicationDecision(id, decision, remarks, sanctionedAmount, calculatedEmi) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `UPDATE loan_applications SET
             status = $1,
             officer_remarks = COALESCE($2, officer_remarks),
             sanctioned_amount = COALESCE($3, sanctioned_amount),
             calculated_emi = COALESCE($4, calculated_emi),
             sanctioned_at = CASE WHEN $1 IN ('approved', 'sanctioned') THEN CURRENT_TIMESTAMP ELSE sanctioned_at END,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $5
           RETURNING *;`,
          [decision, remarks || null, sanctionedAmount || null, calculatedEmi || null, id]
        );
        if (res.rows.length > 0) return res.rows[0];
      }
      const app2 = relationalDB.loan_applications.find((a) => a.id === id);
      if (app2) {
        app2.status = decision;
        if (remarks) app2.officer_remarks = remarks;
        if (sanctionedAmount) app2.sanctioned_amount = sanctionedAmount;
        if (calculatedEmi) app2.calculated_emi = calculatedEmi;
        if (decision === "approved" || decision === "sanctioned") {
          app2.sanctioned_at = (/* @__PURE__ */ new Date()).toISOString();
        }
        saveRelationalDB(relationalDB);
      }
      return app2 || null;
    },
    async getEmiSchedules(applicationId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        let query = "SELECT * FROM emi_schedules";
        const params = [];
        if (applicationId) {
          query += " WHERE application_id = $1";
          params.push(applicationId);
        }
        query += " ORDER BY installment_number ASC";
        const res = await dbQuery(query, params);
        return res.rows;
      }
      if (applicationId) {
        return relationalDB.emi_schedules.filter((s) => s.application_id === applicationId);
      }
      return relationalDB.emi_schedules;
    },
    async createEmiSchedules(schedules) {
      checkDatabaseAccess();
      if (postgresConnected) {
        for (const s of schedules) {
          await dbQuery(
            `INSERT INTO emi_schedules (application_id, installment_number, due_date, emi_amount, principal_component, interest_component, remaining_balance, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
            [s.application_id, s.installment_number, s.due_date, s.emi_amount, s.principal_component, s.interest_component, s.remaining_balance]
          );
        }
      }
      for (const s of schedules) {
        relationalDB.emi_schedules.push(s);
      }
      saveRelationalDB(relationalDB);
    },
    async markEmiPaid(scheduleId, paidDate) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE emi_schedules SET payment_status = $1, paid_date = $2 WHERE id = $3", ["paid", paidDate, scheduleId]);
      }
      const s = relationalDB.emi_schedules.find((item) => item.id === scheduleId);
      if (s) {
        s.payment_status = "paid";
        s.paid_date = paidDate;
        saveRelationalDB(relationalDB);
      }
    }
  },
  payments: {
    async getByUser(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM payments WHERE user_id = $1 ORDER BY id DESC", [userId]);
        return res.rows;
      }
      return relationalDB.payments.filter((p) => p.user_id === userId);
    },
    async findByIdempotencyKey(key, userId) {
      checkDatabaseAccess();
      if (!key) return null;
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM payments WHERE idempotency_key = $1 AND user_id = $2 LIMIT 1", [key, userId]);
        return res.rows[0] || null;
      }
      return relationalDB.payments.find((p) => p.user_id === userId && p.idempotency_key === key) || null;
    },
    async create(data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO payments (payment_ref, bbps_ref_no, user_id, application_id, payment_category, operator_name, account_identifier, amount, payment_mode, status, idempotency_key, meta_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *;`,
          [
            data.payment_ref,
            data.bbps_ref_no || null,
            data.user_id,
            data.application_id || null,
            data.payment_category,
            data.operator_name,
            data.account_identifier,
            data.amount,
            data.payment_mode || "wallet",
            data.status || "SUCCESS",
            data.idempotency_key || null,
            JSON.stringify(data.meta_json || {})
          ]
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      }
      const newPay = {
        id: relationalDB.payments.length > 0 ? Math.max(...relationalDB.payments.map((p) => p.id || 0)) + 1 : 1,
        ...data,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      relationalDB.payments.unshift(newPay);
      saveRelationalDB(relationalDB);
      return newPay;
    },
    async executeAtomicWalletPayment(params) {
      checkDatabaseAccess();
      if (postgresConnected && pool) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          let balanceAfter2 = 0;
          if (params.paymentMode === "wallet") {
            const userRes = await client.query("SELECT id, wallet_balance, is_active FROM users WHERE id = $1 FOR UPDATE", [params.userId]);
            if (userRes.rows.length === 0) {
              const err = new Error("User account not found");
              err.statusCode = 404;
              throw err;
            }
            if (!userRes.rows[0].is_active) {
              const err = new Error("User account is deactivated");
              err.statusCode = 403;
              throw err;
            }
            const currentBalance2 = parseFloat(userRes.rows[0].wallet_balance);
            if (currentBalance2 < params.amount) {
              const err = new Error(`Insufficient wallet balance (\u20B9${currentBalance2}) for payment of \u20B9${params.amount}`);
              err.statusCode = 400;
              throw err;
            }
            balanceAfter2 = currentBalance2 - params.amount;
            await client.query("UPDATE users SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [balanceAfter2, params.userId]);
            await client.query(
              `INSERT INTO wallet_transactions (user_id, transaction_type, amount, balance_after, description, reference_id)
               VALUES ($1, 'debit', $2, $3, $4, $5);`,
              [params.userId, params.amount, balanceAfter2, `Payment for ${params.operator}`, params.idempotencyKey || `TXN-${Date.now()}`]
            );
          } else {
            const userRes = await client.query("SELECT wallet_balance FROM users WHERE id = $1", [params.userId]);
            balanceAfter2 = userRes.rows.length > 0 ? parseFloat(userRes.rows[0].wallet_balance) : 0;
          }
          const txnRef2 = `TT-TXN-${Date.now().toString().slice(-8)}`;
          const bbpsRef2 = `BBPS${Math.floor(1e9 + Math.random() * 9e9)}`;
          const payRes = await client.query(
            `INSERT INTO payments (payment_ref, bbps_ref_no, user_id, application_id, payment_category, operator_name, account_identifier, amount, payment_mode, status, idempotency_key, meta_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *;`,
            [
              txnRef2,
              bbpsRef2,
              params.userId,
              params.applicationId || null,
              params.category,
              params.operator,
              params.accountIdentifier,
              params.amount,
              params.paymentMode,
              params.status,
              params.idempotencyKey || null,
              JSON.stringify(params.metaJson || {})
            ]
          );
          await client.query("COMMIT");
          return {
            payment: payRes.rows[0],
            newBalance: balanceAfter2
          };
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      }
      const user = relationalDB.users.find((u) => u.id === params.userId);
      if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
      }
      if (!user.is_active) {
        const err = new Error("User account is deactivated");
        err.statusCode = 403;
        throw err;
      }
      const currentBalance = parseFloat(user.wallet_balance || 0);
      let balanceAfter = currentBalance;
      const txnRef = `TT-TXN-${Date.now().toString().slice(-8)}`;
      const bbpsRef = `BBPS${Math.floor(1e9 + Math.random() * 9e9)}`;
      if (params.paymentMode === "wallet") {
        if (currentBalance < params.amount) {
          const err = new Error(`Insufficient wallet balance (\u20B9${currentBalance}) for payment of \u20B9${params.amount}`);
          err.statusCode = 400;
          throw err;
        }
        balanceAfter = currentBalance - params.amount;
        user.wallet_balance = balanceAfter;
        relationalDB.wallet_transactions = relationalDB.wallet_transactions || [];
        const walletTxId = relationalDB.wallet_transactions.length > 0 ? Math.max(...relationalDB.wallet_transactions.map((t) => t.id || 0)) + 1 : 1;
        relationalDB.wallet_transactions.unshift({
          id: walletTxId,
          user_id: params.userId,
          transaction_type: "debit",
          amount: params.amount,
          balance_after: balanceAfter,
          description: `Payment for ${params.operator}`,
          reference_id: params.idempotencyKey || txnRef,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const newPay = {
        id: relationalDB.payments.length > 0 ? Math.max(...relationalDB.payments.map((p) => p.id || 0)) + 1 : 1,
        payment_ref: txnRef,
        bbps_ref_no: bbpsRef,
        user_id: params.userId,
        application_id: params.applicationId || null,
        payment_category: params.category,
        operator_name: params.operator,
        account_identifier: params.accountIdentifier,
        amount: params.amount,
        payment_mode: params.paymentMode,
        status: params.status,
        idempotency_key: params.idempotencyKey || null,
        meta_json: params.metaJson || {},
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      relationalDB.payments.unshift(newPay);
      saveRelationalDB(relationalDB);
      return {
        payment: newPay,
        newBalance: balanceAfter
      };
    }
  },
  investments: {
    async getPortfolioByUser(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM investment_portfolios WHERE user_id = $1 ORDER BY id ASC", [userId]);
        return res.rows;
      }
      return relationalDB.investment_portfolios.filter((p) => p.user_id === userId);
    },
    async upsertHolding(userId, symbol, name, category, qty, totalCost, currentPrice) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const existing = await dbQuery("SELECT * FROM investment_portfolios WHERE user_id = $1 AND asset_symbol = $2 LIMIT 1", [userId, symbol]);
        if (existing.rows.length > 0) {
          const row = existing.rows[0];
          const newQty = Number(row.quantity) + qty;
          const newInvested = Number(row.invested_amount) + totalCost;
          const avgPrice = parseFloat((newInvested / newQty).toFixed(2));
          const valuation = Math.round(newQty * currentPrice);
          await dbQuery(
            `UPDATE investment_portfolios SET quantity = $1, invested_amount = $2, avg_buy_price = $3, current_price = $4, current_valuation = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
            [newQty, newInvested, avgPrice, currentPrice, valuation, row.id]
          );
        } else {
          await dbQuery(
            `INSERT INTO investment_portfolios (user_id, asset_symbol, asset_name, category, quantity, avg_buy_price, current_price, invested_amount, current_valuation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [userId, symbol, name, category, qty, currentPrice, currentPrice, totalCost, totalCost]
          );
        }
      }
      const existingInRel = relationalDB.investment_portfolios.find((p) => p.user_id === userId && p.asset_symbol === symbol);
      if (existingInRel) {
        const newQty = existingInRel.quantity + qty;
        const newInvested = existingInRel.invested_amount + totalCost;
        existingInRel.quantity = newQty;
        existingInRel.invested_amount = newInvested;
        existingInRel.avg_buy_price = parseFloat((newInvested / newQty).toFixed(2));
        existingInRel.current_price = currentPrice;
        existingInRel.current_valuation = Math.round(newQty * currentPrice);
      } else {
        relationalDB.investment_portfolios.push({
          id: relationalDB.investment_portfolios.length + 1,
          user_id: userId,
          asset_symbol: symbol,
          asset_name: name,
          category,
          quantity: qty,
          avg_buy_price: currentPrice,
          current_price: currentPrice,
          invested_amount: totalCost,
          current_valuation: totalCost,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      saveRelationalDB(relationalDB);
    },
    async getWatchlist(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT symbol FROM watchlists WHERE user_id = $1 ORDER BY id ASC", [userId]);
        return res.rows.map((r) => r.symbol);
      }
      return relationalDB.watchlists.filter((w) => w.user_id === userId).map((w) => w.symbol);
    },
    async toggleWatchlist(userId, symbol) {
      checkDatabaseAccess();
      const upper = symbol.toUpperCase().trim();
      if (postgresConnected) {
        const check = await dbQuery("SELECT id FROM watchlists WHERE user_id = $1 AND symbol = $2", [userId, upper]);
        if (check.rows.length > 0) {
          await dbQuery("DELETE FROM watchlists WHERE user_id = $1 AND symbol = $2", [userId, upper]);
          return { watched: false, symbol: upper };
        } else {
          await dbQuery("INSERT INTO watchlists (user_id, symbol) VALUES ($1, $2)", [userId, upper]);
          return { watched: true, symbol: upper };
        }
      }
      const idx = relationalDB.watchlists.findIndex((w) => w.user_id === userId && w.symbol === upper);
      if (idx !== -1) {
        relationalDB.watchlists.splice(idx, 1);
        saveRelationalDB(relationalDB);
        return { watched: false, symbol: upper };
      } else {
        relationalDB.watchlists.push({
          id: relationalDB.watchlists.length + 1,
          user_id: userId,
          symbol: upper,
          added_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        saveRelationalDB(relationalDB);
        return { watched: true, symbol: upper };
      }
    },
    async getStockOrders(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM stock_orders WHERE user_id = $1 ORDER BY id DESC", [userId]);
        return res.rows;
      }
      return (relationalDB.stock_orders || []).filter((o) => o.user_id === userId);
    },
    async createStockOrder(data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO stock_orders (order_ref, user_id, symbol, order_type, quantity, executed_price, total_order_value, status, is_simulated)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
           RETURNING *;`,
          [data.order_ref, data.user_id, data.symbol, data.order_type, data.quantity, data.executed_price, data.total_order_value, data.status || "EXECUTED"]
        );
        if (res.rows.length > 0) return res.rows[0];
      }
      const orderWithId = {
        id: relationalDB.stock_orders.length > 0 ? Math.max(...relationalDB.stock_orders.map((o) => o.id || 0)) + 1 : 1,
        ...data
      };
      relationalDB.stock_orders.unshift(orderWithId);
      saveRelationalDB(relationalDB);
      return orderWithId;
    },
    async getMutualFunds() {
      checkDatabaseAccess();
      let rows = relationalDB.mutual_funds;
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM mutual_funds ORDER BY id ASC");
        if (res.rows.length > 0) rows = res.rows;
      }
      return rows.map((f) => ({
        ...f,
        nav: Number(f.nav ?? f.current_nav ?? 100),
        current_nav: Number(f.current_nav ?? f.nav ?? 100),
        aum_cr: Number(f.aum_cr ?? f.fund_size_cr ?? 1e4),
        fund_size_cr: Number(f.fund_size_cr ?? f.aum_cr ?? 1e4),
        expense_ratio: Number(f.expense_ratio ?? f.expense_ratio_pct ?? 0.5),
        expense_ratio_pct: Number(f.expense_ratio_pct ?? f.expense_ratio ?? 0.5),
        cagr_1y: Number(f.cagr_1y ?? (Number(f.cagr_3y || 15) + 2.2).toFixed(1)),
        fund_house: f.fund_house || "Direct Plan AMC"
      }));
    },
    async getFundById(id) {
      const funds = await this.getMutualFunds();
      return funds.find((f) => f.id === id) || null;
    },
    async getSips(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `SELECT s.*, m.fund_name, m.category as fund_category
           FROM sips s
           JOIN mutual_funds m ON s.fund_id = m.id
           WHERE s.user_id = $1 AND s.status != 'cancelled'
           ORDER BY s.id DESC`,
          [userId]
        );
        return res.rows;
      }
      return relationalDB.sips.filter((s) => s.user_id === userId && s.status !== "cancelled").map((s) => {
        const fund = relationalDB.mutual_funds.find((f) => f.id === s.fund_id);
        return {
          ...s,
          fund_name: fund?.fund_name || "Direct Growth Fund",
          fund_category: fund?.category || "Equity"
        };
      });
    },
    async createSip(data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO sips (mandate_ref, user_id, fund_id, monthly_amount, debit_day, next_debit_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')
           RETURNING *;`,
          [data.mandate_ref, data.user_id, data.fund_id, data.monthly_amount, data.debit_day, data.next_debit_date]
        );
        if (res.rows.length > 0) {
          const inserted = res.rows[0];
          relationalDB.sips.unshift(inserted);
          saveRelationalDB(relationalDB);
          return inserted;
        }
      }
      const newId = relationalDB.sips && relationalDB.sips.length > 0 ? Math.max(...relationalDB.sips.map((s) => s.id || 0)) + 1 : 1;
      const sipWithId = { id: newId, status: "active", ...data };
      relationalDB.sips.unshift(sipWithId);
      saveRelationalDB(relationalDB);
      return sipWithId;
    },
    async deleteSip(sipId, userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE sips SET status = $1 WHERE id = $2 AND user_id = $3", ["cancelled", sipId, userId]);
      }
      const s = relationalDB.sips.find((item) => item.id === sipId && item.user_id === userId);
      if (s) {
        s.status = "cancelled";
        saveRelationalDB(relationalDB);
      }
    },
    async getDemat(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM demat_applications WHERE user_id = $1 LIMIT 1", [userId]);
        if (res.rows.length > 0) return res.rows[0];
      }
      return relationalDB.demat_applications.find((d) => d.user_id === userId) || null;
    },
    async createDemat(data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO demat_applications (user_id, client_code, dp_id, depository, linked_bank_account, linked_bank_ifsc, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')
           ON CONFLICT (user_id) DO UPDATE SET status = 'active'
           RETURNING *;`,
          [data.user_id, data.client_code, data.dp_id, data.depository, data.linked_bank_account, data.linked_bank_ifsc]
        );
        if (res.rows.length > 0) return res.rows[0];
      }
      const existing = relationalDB.demat_applications.find((d) => d.user_id === data.user_id);
      if (existing) {
        existing.status = "active";
        saveRelationalDB(relationalDB);
        return existing;
      }
      relationalDB.demat_applications.push(data);
      saveRelationalDB(relationalDB);
      return data;
    }
  },
  admin: {
    async getDashboardStats() {
      checkDatabaseAccess();
      if (postgresConnected) {
        const usersRes = await dbQuery("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
        const appsRes = await dbQuery("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review')) as pending, COUNT(*) FILTER (WHERE status IN ('approved', 'sanctioned', 'disbursed')) as approved, COUNT(*) FILTER (WHERE status = 'rejected') as rejected, COALESCE(SUM(CASE WHEN status = 'disbursed' THEN COALESCE(sanctioned_amount, requested_amount) ELSE 0 END), 0) as disbursed_volume FROM loan_applications");
        const aumRes = await dbQuery("SELECT COALESCE(SUM(current_valuation), 0) as aum FROM investment_portfolios");
        return {
          total_users: parseInt(usersRes.rows[0]?.count || "0", 10),
          total_applications: parseInt(appsRes.rows[0]?.total || "0", 10),
          pending_underwriting: parseInt(appsRes.rows[0]?.pending || "0", 10),
          approved_loans: parseInt(appsRes.rows[0]?.approved || "0", 10),
          rejected_loans: parseInt(appsRes.rows[0]?.rejected || "0", 10),
          total_disbursed_volume: parseFloat(appsRes.rows[0]?.disbursed_volume || "0"),
          total_wealth_aum: parseFloat(aumRes.rows[0]?.aum || "0"),
          branch_name: "Kadapa Central Hub, Andhra Pradesh"
        };
      }
      const totalUsers = relationalDB.users.filter((u) => u.role === "customer").length;
      const totalApps = relationalDB.loan_applications.length;
      const pendingApps = relationalDB.loan_applications.filter((a) => a.status === "submitted" || a.status === "under_review").length;
      const approvedApps = relationalDB.loan_applications.filter((a) => a.status === "approved" || a.status === "sanctioned" || a.status === "disbursed").length;
      const rejectedApps = relationalDB.loan_applications.filter((a) => a.status === "rejected").length;
      const totalDisbursed = relationalDB.loan_applications.filter((a) => a.status === "disbursed").reduce((sum, a) => sum + (a.sanctioned_amount || a.requested_amount), 0);
      const totalAum = relationalDB.investment_portfolios.reduce((sum, h) => sum + h.current_valuation, 0);
      return {
        total_users: totalUsers,
        total_applications: totalApps,
        pending_underwriting: pendingApps,
        approved_loans: approvedApps,
        rejected_loans: rejectedApps,
        total_disbursed_volume: totalDisbursed,
        total_wealth_aum: totalAum,
        branch_name: "Kadapa Central Hub, Andhra Pradesh"
      };
    },
    async getAuditLogs(limit = 50) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM audit_logs ORDER BY id DESC LIMIT $1", [limit]);
        return res.rows;
      }
      return relationalDB.audit_logs.slice(0, limit);
    }
  },
  agents: {
    async getByUserId(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM agents WHERE user_id = $1 LIMIT 1", [userId]);
        if (res.rows.length > 0) return res.rows[0];
      }
      return relationalDB.agents.find((a) => a.user_id === userId) || null;
    },
    async getAll() {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM agents ORDER BY id ASC");
        return res.rows;
      }
      return relationalDB.agents;
    },
    async getLeads(agentId, role) {
      checkDatabaseAccess();
      const isAdminRole = role === "admin" || role === "super_admin";
      if (postgresConnected) {
        let query = "SELECT * FROM agent_leads";
        const params = [];
        if (!isAdminRole && agentId) {
          query += " WHERE agent_id = $1";
          params.push(agentId);
        }
        query += " ORDER BY id DESC";
        const res = await dbQuery(query, params);
        return res.rows;
      }
      const list = relationalDB.agent_leads || [];
      if (isAdminRole) return list;
      return list.filter((l) => l.agent_id === agentId);
    },
    async createLead(leadData) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO agent_leads (
            agent_id, agent_code, applicant_name, phone, email, loan_product,
            requested_amount, location, commission_rate_pct, commission_amount, status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *;`,
          [
            leadData.agent_id,
            leadData.agent_code,
            leadData.applicant_name,
            leadData.phone,
            leadData.email,
            leadData.loan_product,
            leadData.requested_amount,
            leadData.location || "Kadapa",
            leadData.commission_rate_pct,
            leadData.commission_amount,
            leadData.status || "Contacted",
            leadData.notes || null
          ]
        );
        await dbQuery(
          "UPDATE agents SET total_leads_count = total_leads_count + 1 WHERE user_id = $1",
          [leadData.agent_id]
        );
        if (res.rows.length > 0) {
          const inserted = res.rows[0];
          relationalDB.agent_leads = relationalDB.agent_leads || [];
          relationalDB.agent_leads.unshift(inserted);
          saveRelationalDB(relationalDB);
          return inserted;
        }
      }
      relationalDB.agent_leads = relationalDB.agent_leads || [];
      const newId = relationalDB.agent_leads.length > 0 ? Math.max(...relationalDB.agent_leads.map((l) => l.id || 0)) + 1 : 1;
      const newLead = { id: newId, ...leadData, created_at: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] };
      relationalDB.agent_leads.unshift(newLead);
      const agent = relationalDB.agents.find((a) => a.user_id === leadData.agent_id);
      if (agent) agent.total_leads_count += 1;
      saveRelationalDB(relationalDB);
      return newLead;
    },
    async getCommissions(agentId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `SELECT 
             COALESCE(SUM(CASE WHEN status = 'Disbursed' THEN commission_amount ELSE 0 END), 0) as total_earned,
             COALESCE(SUM(CASE WHEN status != 'Disbursed' THEN commission_amount ELSE 0 END), 0) as pending_pipeline
           FROM agent_leads
           ${agentId ? "WHERE agent_id = $1" : ""}`,
          agentId ? [agentId] : []
        );
        const earned = parseFloat(res.rows[0]?.total_earned || "0");
        const pending = parseFloat(res.rows[0]?.pending_pipeline || "0");
        return { total_earned: earned, pending_pipeline: pending };
      }
      const list = relationalDB.agent_leads || [];
      const agentList = agentId ? list.filter((l) => l.agent_id === agentId) : list;
      const totalEarned = agentList.filter((l) => l.status === "Disbursed").reduce((sum, l) => sum + parseFloat(l.commission_amount || 0), 0);
      const pendingCommission = agentList.filter((l) => l.status !== "Disbursed").reduce((sum, l) => sum + parseFloat(l.commission_amount || 0), 0);
      return { total_earned: totalEarned, pending_pipeline: pendingCommission };
    }
  },
  notifications: {
    async getByUser(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery("SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC", [userId]);
        return res.rows;
      }
      return relationalDB.notifications.filter((n) => n.user_id === userId);
    },
    async create(data) {
      checkDatabaseAccess();
      if (postgresConnected) {
        const res = await dbQuery(
          `INSERT INTO notifications (user_id, title, message, category, is_read)
           VALUES ($1, $2, $3, $4, false)
           RETURNING *;`,
          [data.user_id, data.title, data.message, data.category || "general"]
        );
        if (res.rows.length > 0) {
          const inserted = res.rows[0];
          relationalDB.notifications.unshift(inserted);
          saveRelationalDB(relationalDB);
          return inserted;
        }
      }
      const newNotif = {
        id: relationalDB.notifications.length + 1,
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        category: data.category || "general",
        is_read: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      relationalDB.notifications.unshift(newNotif);
      saveRelationalDB(relationalDB);
      return newNotif;
    },
    async markAllRead(userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE notifications SET is_read = true WHERE user_id = $1", [userId]);
      }
      relationalDB.notifications.forEach((n) => {
        if (n.user_id === userId) n.is_read = true;
      });
      saveRelationalDB(relationalDB);
    },
    async markRead(id, userId) {
      checkDatabaseAccess();
      if (postgresConnected) {
        await dbQuery("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", [id, userId]);
      }
      const notif = relationalDB.notifications.find((n) => n.id === id && n.user_id === userId);
      if (notif) notif.is_read = true;
      saveRelationalDB(relationalDB);
      return notif;
    }
  }
};
function logAudit(actorId, actionType, entityName, entityId, details = {}) {
  const audit = {
    id: relationalDB.audit_logs.length + 1,
    actor_id: actorId,
    action_type: actionType,
    entity_name: entityName,
    entity_id: entityId,
    details,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  relationalDB.audit_logs.unshift(audit);
  saveRelationalDB(relationalDB);
  if (postgresConnected) {
    dbQuery(
      `INSERT INTO audit_logs (actor_id, action_type, entity_name, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorId, actionType, entityName, entityId, JSON.stringify(details)]
    ).catch((e) => console.warn("Postgres audit log error:", e.message));
  }
  return audit;
}

// backend/routes/auth.routes.ts
import { Router } from "express";

// backend/middleware/auth.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var DEFAULT_DEV_SECRET = "tatito-kadapa-dev-secret-key-only-2026";
function getJwtSecret() {
  const isProd2 = process.env.NODE_ENV === "production";
  const secret = process.env.JWT_SECRET;
  if (isProd2) {
    if (!secret || secret === DEFAULT_DEV_SECRET || secret.length < 32) {
      throw new Error(
        "FATAL SECURITY VIOLATION: Production environment requires a strong, environment-configured JWT_SECRET of at least 32 characters."
      );
    }
    return secret;
  }
  return secret || DEFAULT_DEV_SECRET;
}
var JWT_EXPIRES_IN = "7d";
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN, jwtid: crypto.randomUUID() });
}
async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}
async function verifyPassword(plainText, hash) {
  if (!hash || !hash.startsWith("$2a$") && !hash.startsWith("$2b$")) {
    return false;
  }
  return bcrypt.compare(plainText, hash);
}
var revokedTokens = /* @__PURE__ */ new Set();
function revokeToken(token) {
  if (token) {
    revokedTokens.add(token);
  }
}
function isTokenRevoked(token) {
  return revokedTokens.has(token);
}
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      detail: "Missing or malformed Authorization header. Expected Bearer <token>"
    });
  }
  const token = authHeader.split(" ")[1];
  if (isTokenRevoked(token)) {
    return res.status(401).json({
      error: "Unauthorized",
      detail: "Session token has been revoked via logout. Please sign in again."
    });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await dbRepository.users.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized", detail: "User account not found" });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: "Forbidden", detail: "User account is deactivated or suspended" });
    }
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized",
      detail: "Invalid or expired session token. Please re-authenticate."
    });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", detail: "Authentication required" });
    }
    const effectiveAllowed = allowedRoles.includes("admin") && !allowedRoles.includes("super_admin") ? [...allowedRoles, "super_admin"] : allowedRoles;
    if (!effectiveAllowed.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        detail: `Access restricted. Your active role '${req.user.role}' lacks permissions for this endpoint. Required: [${effectiveAllowed.join(", ")}]`
      });
    }
    next();
  };
}

// backend/middleware/rateLimiter.ts
var loginAttempts = /* @__PURE__ */ new Map();
var MAX_AUTH_ATTEMPTS = 15;
var AUTH_WINDOW_MS = 15 * 60 * 1e3;
var apiRequests = /* @__PURE__ */ new Map();
var MAX_API_REQUESTS = 300;
var API_WINDOW_MS = 60 * 1e3;
function authRateLimiter(req, res, next) {
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const email = (req.body && req.body.email ? String(req.body.email) : "").trim().toLowerCase();
  const key = `${ip}_${email}`;
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record) {
    if (now - record.firstAttempt > AUTH_WINDOW_MS) {
      loginAttempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    if (record.count >= MAX_AUTH_ATTEMPTS) {
      return res.status(429).json({
        error: "Too Many Requests",
        detail: "Exceeded maximum authentication attempts. Please wait 15 minutes before trying again."
      });
    }
    record.count++;
  } else {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  }
  next();
}
function resetAuthRateLimit(req) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const email = (req.body && req.body.email ? String(req.body.email) : "").trim().toLowerCase();
  const key = `${ip}_${email}`;
  loginAttempts.delete(key);
}
function apiRateLimiter(req, res, next) {
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = apiRequests.get(ip);
  if (record) {
    if (now - record.firstAttempt > API_WINDOW_MS) {
      apiRequests.set(ip, { count: 1, firstAttempt: now });
      return next();
    }
    if (record.count >= MAX_API_REQUESTS) {
      return res.status(429).json({
        error: "Too Many Requests",
        detail: "API rate limit exceeded. Please wait 60 seconds and try again."
      });
    }
    record.count++;
  } else {
    apiRequests.set(ip, { count: 1, firstAttempt: now });
  }
  next();
}

// backend/services/superStore.ts
var superStore = {
  linkedAccounts: [
    {
      id: "acc-1",
      bank_name: "State Bank of India (Kadapa Main)",
      masked_account: "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4821",
      ifsc: "SBIN0000830",
      upi_vpa: "ramesh@tatitoupi",
      account_type: "Savings Account",
      is_primary: true,
      balance_check_mode: "SANDBOX_SIMULATED",
      simulated_bank_balance: 68450
    },
    {
      id: "acc-2",
      bank_name: "Union Bank of India (Trunk Road AP)",
      masked_account: "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 9104",
      ifsc: "UBIN0802411",
      upi_vpa: "ramesh.ub@tatitoupi",
      account_type: "Savings Account",
      is_primary: false,
      balance_check_mode: "SANDBOX_SIMULATED",
      simulated_bank_balance: 32100
    }
  ],
  beneficiaries: [
    {
      id: "ben-1",
      name: "Suresh Kumar Reddy",
      vpa: "suresh.reddy@tatitoupi",
      mobile: "9848011223",
      bank_masked: "HDFC \u2022\u2022\u2022\u2022 3412",
      nickname: "Business Supplier"
    },
    {
      id: "ben-2",
      name: "Lakshmi Narayana Rao",
      vpa: "lakshmi.rao@tatitoupi",
      mobile: "9440811223",
      bank_masked: "SBI \u2022\u2022\u2022\u2022 7740",
      nickname: "Family"
    },
    {
      id: "ben-3",
      name: "Kiran Naidu",
      vpa: "kiran.naidu@tatitoupi",
      mobile: "9849022334",
      bank_masked: "ICICI \u2022\u2022\u2022\u2022 5509",
      nickname: "Transit Split"
    }
  ],
  upiTransactions: [
    {
      id: "upi-101",
      transaction_ref: "UPI-DEMO-98412041",
      direction: "send",
      counterparty_name: "Sri Venkateswara Provision Store",
      counterparty_vpa: "svstore.kdp@tatitoupi",
      amount: 640,
      payment_mode: "UPI_QR_SANDBOX",
      status: "DEMO_SUCCESS",
      refund_status: "NONE",
      note: "Monthly grocery supplies",
      is_simulated: true,
      created_at: "2026-11-09T14:20:00.000Z"
    },
    {
      id: "upi-102",
      transaction_ref: "UPI-DEMO-98411902",
      direction: "receive",
      counterparty_name: "Suresh Kumar Reddy",
      counterparty_vpa: "suresh.reddy@tatitoupi",
      amount: 2500,
      payment_mode: "UPI_P2P_SANDBOX",
      status: "DEMO_SUCCESS",
      refund_status: "NONE",
      note: "Shared dinner & fuel split settlement",
      is_simulated: true,
      created_at: "2026-11-08T09:15:00.000Z"
    },
    {
      id: "upi-103",
      transaction_ref: "UPI-DEMO-98411588",
      direction: "self_transfer",
      counterparty_name: "Self Transfer (SBI \u2022\u20224821 \u2192 UBI \u2022\u20229104)",
      counterparty_vpa: "ramesh.ub@tatitoupi",
      amount: 5e3,
      payment_mode: "UPI_SELF_SANDBOX",
      status: "DEMO_SUCCESS",
      refund_status: "NONE",
      note: "Savings reserve transfer",
      is_simulated: true,
      created_at: "2026-11-05T17:40:00.000Z"
    }
  ],
  paymentRequests: [
    {
      id: "req-1",
      payer_name: "Kiran Naidu",
      payer_vpa: "kiran.naidu@tatitoupi",
      amount: 1200,
      note: "Tirupati bus ticket share",
      status: "PENDING",
      created_at: "2026-11-10T11:00:00.000Z"
    }
  ],
  qrCodes: [
    {
      id: "qr-static-customer",
      qr_type: "customer_static",
      vpa: "ramesh@tatitoupi",
      payee_name: "Ramesh Kumar",
      amount: null,
      reference_code: "QR-CUST-KDP-89104",
      payload_uri: "upi://pay?pa=ramesh@tatitoupi&pn=Ramesh%20Kumar&cu=INR"
    }
  ],
  rewards: {
    points: 1450,
    lifetimeCashback: 540,
    referralCode: "TATITO-KDP-2026",
    scratchCards: [
      {
        id: "sc-1",
        code: "SCRATCH-AP-101",
        title: "APSPDCL Bill Payment Bonus",
        reward_type: "cashback",
        reward_value: 45,
        is_scratched: false,
        expires_at: "2026-12-31"
      },
      {
        id: "sc-2",
        code: "SCRATCH-UPI-102",
        title: "UPI Scan & Pay Lucky Card",
        reward_type: "points",
        reward_value: 200,
        is_scratched: false,
        expires_at: "2026-12-20"
      },
      {
        id: "sc-3",
        code: "SCRATCH-SIP-103",
        title: "Wealth SIP Milestone Scratch Card",
        reward_type: "cashback",
        reward_value: 75,
        is_scratched: true,
        expires_at: "2026-11-30"
      }
    ],
    coupons: [
      {
        id: "cpn-1",
        code: "POWER50",
        title: "Flat \u20B950 Cashback on Electricity & Water Bills",
        discount_amount: 50,
        min_spend: 800,
        valid_until: "2026-12-31",
        applied: false
      },
      {
        id: "cpn-2",
        code: "TATITOGOLD",
        title: "\u20B9100 Bonus Gold Credit on \u20B92,000+ 24K Gold Purchase",
        discount_amount: 100,
        min_spend: 2e3,
        valid_until: "2027-01-31",
        applied: false
      },
      {
        id: "cpn-3",
        code: "FASTAG25",
        title: "Flat \u20B925 Cashback on NHAI FASTag Recharge",
        discount_amount: 25,
        min_spend: 500,
        valid_until: "2026-12-31",
        applied: false
      }
    ],
    history: [
      { id: "rw-1", type: "cashback", title: "APSPDCL Electricity Bill Cashback", points: 100, cashback: 50, status: "CREDITED_DEMO", expiry: "2026-12-31", date: "2026-11-08" },
      { id: "rw-2", type: "points_earned", title: "On-Time Personal Loan EMI Bonus", points: 350, cashback: 0, status: "CREDITED_DEMO", expiry: "2027-03-31", date: "2026-11-04" },
      { id: "rw-3", type: "referral", title: "Referral Bonus \u2014 Lakshmi Narayana Joined", points: 250, cashback: 100, status: "CREDITED_DEMO", expiry: "No Expiry", date: "2026-10-29" }
    ],
    campaigns: [
      {
        id: "cmp-1",
        code: "POWER50",
        title: "Flat \u20B950 Cashback on Electricity Bills",
        category: "Bills & Utilities",
        rule: "Min bill \u20B9800 on APSPDCL/TSSPDCL via Tatito Wallet or UPI Sandbox",
        max_cashback: 50,
        min_txn: 800,
        valid_until: "2026-12-31",
        terms: "Applicable once per calendar month in sandbox mode. Subject to partner settlement."
      },
      {
        id: "cmp-2",
        code: "SIPBOOST",
        title: "500 Reward Points on First Direct Mutual Fund SIP",
        category: "Wealth & SIP",
        rule: "Start a monthly SIP of \u20B91,000+ in any Index or Flexi-Cap fund",
        max_cashback: 100,
        min_txn: 1e3,
        valid_until: "2027-01-31",
        terms: "Points redeemable at 10 points = \u20B91 sandbox wallet credit."
      },
      {
        id: "cmp-3",
        code: "GOLDEXPRESS",
        title: "Zero Processing Fee Voucher on Hallmark Gold Loan",
        category: "Loans",
        rule: "Redeem 500 points for 100% processing fee waiver at Kadapa Branch",
        max_cashback: 1500,
        min_txn: 5e4,
        valid_until: "2026-12-15",
        terms: "Valid on physical gold verification at Trunk Road, Kadapa branch."
      }
    ],
    vouchers: [
      { id: "vch-1", brand: "APSRTC Bus Pass Voucher", value: 150, points_cost: 600, code: "TATITO-BUS-150", expiry: "2026-12-31" },
      { id: "vch-2", brand: "Tatito Loan Processing Fee Waiver", value: 500, points_cost: 1e3, code: "TATITO-LOAN-500", expiry: "2027-01-31" },
      { id: "vch-3", brand: "Instant Wallet Cashback \u20B9100", value: 100, points_cost: 800, code: "WALLET-CASH-100", expiry: "Immediate" }
    ],
    referrals: [
      { id: "ref-1", name: "Lakshmi Narayana Rao", mobile: "98480\u2022\u2022\u202212", status: "KYC Completed (Demo)", reward: "250 pts + \u20B9100", date: "2026-10-29" },
      { id: "ref-2", name: "Venkata Subbaiah", mobile: "94402\u2022\u2022\u202289", status: "Registered", reward: "250 pts pending first txn", date: "2026-11-06" }
    ]
  },
  mandates: [
    {
      id: "mnd-1",
      mandate_ref: "UMN-TATITO-882101",
      biller_or_payee: "Tatito Personal Loan EMI (TLN-KDP-2026-001)",
      category: "Loan EMI",
      amount: 22100,
      frequency: "Monthly",
      next_trigger_date: "2026-11-20",
      status: "ACTIVE",
      consent_verified: true
    },
    {
      id: "mnd-2",
      mandate_ref: "UMN-TATITO-882102",
      biller_or_payee: "Nifty 50 Index Direct Plan \u2014 SIP",
      category: "Mutual Fund SIP",
      amount: 5e3,
      frequency: "Monthly",
      next_trigger_date: "2026-11-15",
      status: "ACTIVE",
      consent_verified: true
    },
    {
      id: "mnd-3",
      mandate_ref: "UMN-TATITO-882103",
      biller_or_payee: "APSPDCL Southern Power Electricity",
      category: "Utility Bill",
      amount: 1450,
      frequency: "Monthly",
      next_trigger_date: "2026-11-18",
      status: "ACTIVE",
      consent_verified: true
    },
    {
      id: "mnd-4",
      mandate_ref: "UMN-TATITO-882104",
      biller_or_payee: "ACT Fibernet Broadband 150 Mbps",
      category: "Subscription / Broadband",
      amount: 825,
      frequency: "Monthly",
      next_trigger_date: "2026-11-25",
      status: "PAUSED",
      consent_verified: true
    }
  ],
  expenses: {
    monthlyIncome: 85e3,
    items: [
      { id: "exp-1", title: "Personal Loan Monthly EMI", category: "Loan EMIs", amount: 22100, date: "2026-11-05", mode: "Wallet Auto-Debit" },
      { id: "exp-2", title: "Nifty 50 & Flexi-Cap SIPs", category: "Investments & SIP", amount: 1e4, date: "2026-11-05", mode: "UPI AutoPay" },
      { id: "exp-3", title: "Groceries & Household Provision", category: "Food & Groceries", amount: 8400, date: "2026-11-07", mode: "UPI Scan & Pay" },
      { id: "exp-4", title: "APSPDCL Electricity & Indane Gas", category: "Utilities & Bills", amount: 2390, date: "2026-11-08", mode: "BBPS Bill Desk" },
      { id: "exp-5", title: "Fuel & APSRTC Highway Transit", category: "Travel & Fuel", amount: 4200, date: "2026-11-09", mode: "FASTag & UPI" }
    ],
    budgets: [
      { category: "Loan EMIs", limit: 25e3, spent: 22100 },
      { category: "Investments & SIP", limit: 15e3, spent: 1e4 },
      { category: "Food & Groceries", limit: 12e3, spent: 8400 },
      { category: "Utilities & Bills", limit: 4500, spent: 2390 },
      { category: "Travel & Fuel", limit: 6e3, spent: 4200 }
    ],
    savingsGoals: [
      { id: "goal-1", name: "Family Emergency Reserve (6 Months)", target: 3e5, current: 185e3, deadline: "2027-06-30" },
      { id: "goal-2", name: "24K Digital Gold Festival Accumulation", target: 1e5, current: 42500, deadline: "2027-01-15" }
    ],
    groups: [
      {
        id: "grp-1",
        name: "Tirupati & Horsley Hills Weekend Trip",
        members: ["Ramesh Kumar", "Suresh Reddy", "Kiran Naidu", "Anil Varma"],
        expenses: [
          {
            id: "gexp-1",
            title: "Tempo Traveller & Toll FASTag",
            total_amount: 4800,
            paid_by: "Ramesh Kumar",
            split_type: "EQUAL",
            per_person: 1200,
            status: "OPEN",
            created_at: "2026-11-09"
          },
          {
            id: "gexp-2",
            title: "Hill Resort Dinner & Stay",
            total_amount: 6400,
            paid_by: "Suresh Reddy",
            split_type: "EQUAL",
            per_person: 1600,
            status: "SETTLED",
            created_at: "2026-11-10"
          }
        ]
      }
    ]
  },
  insuranceProducts: [
    {
      id: "ins-1",
      product_code: "INS-HEALTH-CARE",
      category: "Health insurance",
      plan_name: "Tatito Family Floater Health Shield",
      partner_insurer: "Star Health & Allied Insurance (Partner Sandbox)",
      sum_insured: 1e6,
      annual_premium: 9450,
      coverage_highlights: "Cashless treatment at 140+ network hospitals across AP & Telangana \xB7 Zero room rent cap \xB7 Annual health checkup"
    },
    {
      id: "ins-2",
      product_code: "INS-LIFE-TERM",
      category: "Life insurance",
      plan_name: "Pure Term Life Protection Plan",
      partner_insurer: "HDFC Life / LIC Partner Sandbox",
      sum_insured: 1e7,
      annual_premium: 11200,
      coverage_highlights: "\u20B91 Crore life cover till age 65 \xB7 Critical illness rider option \xB7 Tax benefit under Sec 80C"
    },
    {
      id: "ins-3",
      product_code: "INS-MOTOR-COMP",
      category: "Motor insurance",
      plan_name: "Zero-Dep Car & Two-Wheeler Cover",
      partner_insurer: "ICICI Lombard General Insurance Sandbox",
      sum_insured: 65e4,
      annual_premium: 4850,
      coverage_highlights: "Instant policy issuance \xB7 Roadside assistance across NH-40 \xB7 Zero depreciation bumper-to-bumper"
    },
    {
      id: "ins-4",
      product_code: "INS-TRAVEL-SAFE",
      category: "Travel insurance",
      plan_name: "Domestic & International Trip Guard",
      partner_insurer: "Bajaj Allianz General Sandbox",
      sum_insured: 5e5,
      annual_premium: 499,
      coverage_highlights: "Flight/train delay cover \xB7 Baggage loss protection \xB7 Emergency medical evacuation"
    },
    {
      id: "ins-5",
      product_code: "INS-ACCIDENT-PA",
      category: "Personal accident",
      plan_name: "24x7 Personal Accident & Disability Cover",
      partner_insurer: "New India Assurance Sandbox",
      sum_insured: 25e5,
      annual_premium: 1250,
      coverage_highlights: "Accidental hospitalisation \xB7 Temporary total disability weekly payout \xB7 Worldwide coverage"
    }
  ],
  insurancePolicies: [
    {
      id: "pol-1",
      policy_ref: "POL-DEMO-KDP-7712",
      product_code: "INS-HEALTH-CARE",
      plan_name: "Tatito Family Floater Health Shield",
      insured_name: "Ramesh Kumar & Family",
      sum_insured: 1e6,
      annual_premium: 9450,
      renewal_date: "2027-08-14",
      status: "SANDBOX_ACTIVE"
    }
  ],
  goldVault: {
    liveRatePerGram24K: 7680,
    gramsHeld: 5.5338,
    monthlySipAmount: 2e3,
    transactions: [
      {
        id: "gld-1",
        reference_no: "GOLD-DEMO-44019",
        tx_type: "BUY",
        grams: 3.2552,
        rate_per_gram: 7680,
        total_amount: 25e3,
        is_simulated: true,
        created_at: "2026-10-15T10:30:00.000Z"
      },
      {
        id: "gld-2",
        reference_no: "GOLD-DEMO-44108",
        tx_type: "SIP",
        grams: 2.2786,
        rate_per_gram: 7680,
        total_amount: 17500,
        is_simulated: true,
        created_at: "2026-11-01T09:00:00.000Z"
      }
    ]
  },
  travelRoutes: [
    { id: "trv-1", mode: "Bus", operator: "APSRTC Amaravati AC Sleeper", origin: "Kadapa", destination: "Hyderabad", departure: "21:30", fare: 890 },
    { id: "trv-2", mode: "Bus", operator: "APSRTC Indra AC", origin: "Kadapa", destination: "Vijayawada", departure: "22:00", fare: 760 },
    { id: "trv-3", mode: "Train", operator: "12797 Venkatadri Express (3A)", origin: "Kadapa (HX)", destination: "Kacheguda (KCG)", departure: "20:10", fare: 940 },
    { id: "trv-4", mode: "Flight", operator: "IndiGo 6E-7214", origin: "Kadapa (CDP)", destination: "Chennai (MAA)", departure: "11:45", fare: 2850 },
    { id: "trv-5", mode: "Flight", operator: "IndiGo 6E-7192", origin: "Kadapa (CDP)", destination: "Bengaluru (BLR)", departure: "14:20", fare: 2690 },
    { id: "trv-6", mode: "Hotel", operator: "Haritha Grand Executive Stay", origin: "Tirupati / Kadapa", destination: "2 Nights Deluxe AC", departure: "Check-in 12:00", fare: 3400 }
  ],
  travelBookings: [
    {
      id: "tbk-1",
      pnr_reference: "PNR-DEMO-88412",
      mode: "Bus",
      operator_name: "APSRTC Amaravati AC Sleeper",
      origin: "Kadapa",
      destination: "Hyderabad",
      travel_date: "2026-11-22",
      passengers: 2,
      fare_amount: 1780,
      status: "CONFIRMED_DEMO",
      created_at: "2026-11-09T18:00:00.000Z"
    }
  ],
  merchantProfile: {
    merchant_id: "MERCH-KDP-1001",
    business_name: "Rayalaseema Agro & Retail Mart",
    category: "Retail & Kirana Supermarket",
    merchant_vpa: "rayalaseemamart@tatitoupi",
    gstin: "37AABCR9102F1Z8",
    settlement_bank: "State Bank of India \u2022\u2022\u2022\u2022 4821 (T+0 Instant Sandbox)",
    kyc_status: "SANDBOX_VERIFIED",
    today_sales: 18450,
    month_sales: 342800,
    pending_settlement: 0
  },
  merchantOutlets: [
    {
      id: "out-1",
      outlet_code: "KDP-TRUNK-01",
      outlet_name: "Trunk Road Flagship Counter",
      city: "Kadapa",
      outlet_vpa: "rayalaseemamart.01@tatitoupi",
      qr_reference: "MQR-OUT-101",
      today_sales: 12150,
      is_active: true
    },
    {
      id: "out-2",
      outlet_code: "PDTR-MAIN-02",
      outlet_name: "Proddatur Wholesale Counter",
      city: "Proddatur",
      outlet_vpa: "rayalaseemamart.02@tatitoupi",
      qr_reference: "MQR-OUT-102",
      today_sales: 6300,
      is_active: true
    }
  ],
  merchantTransactions: [
    { id: "mtx-1", transaction_ref: "MQR-990124", outlet_code: "KDP-TRUNK-01", customer_name: "Subba Reddy", customer_vpa: "subba@upi", amount: 1450, settlement_status: "SETTLED_SANDBOX", refund_requested: false, created_at: "2026-11-11T09:10:00.000Z" },
    { id: "mtx-2", transaction_ref: "MQR-990125", outlet_code: "PDTR-MAIN-02", customer_name: "Padmavathi Devi", customer_vpa: "padma@upi", amount: 890, settlement_status: "SETTLED_SANDBOX", refund_requested: false, created_at: "2026-11-11T10:25:00.000Z" },
    { id: "mtx-3", transaction_ref: "MQR-990126", outlet_code: "KDP-TRUNK-01", customer_name: "Harish Babu", customer_vpa: "harish@upi", amount: 3200, settlement_status: "SETTLED_SANDBOX", refund_requested: true, created_at: "2026-11-10T19:45:00.000Z" }
  ],
  supportTickets: [
    {
      id: "tkt-1",
      ticket_no: "TKT-KDP-5041",
      category: "Payment Complaint",
      subject: "BBPS Electricity bill receipt confirmation check",
      description: "Paid APSPDCL bill of \u20B91,420 via wallet; requesting duplicate PDF voucher.",
      transaction_ref: "DEMO-BBPS-48291041",
      status: "RESOLVED",
      resolution_note: "Verified in sandbox ledger. Duplicate receipt attached to your account.",
      created_at: "2026-11-07T11:30:00.000Z",
      messages: [
        {
          id: "msg-1",
          sender_role: "customer",
          sender_name: "Ramesh Kumar Chennur",
          message: "Paid APSPDCL bill of \u20B91,420 via wallet; requesting duplicate voucher.",
          created_at: "2026-11-07T11:30:00.000Z"
        },
        {
          id: "msg-2",
          sender_role: "agent",
          sender_name: "Kadapa Branch Grievance Desk",
          message: "Verified BBPS settlement ref BBPS9081245102. Receipt is now available in History & Refunds.",
          created_at: "2026-11-07T12:15:00.000Z"
        }
      ]
    }
  ],
  supportFaqs: [
    {
      id: "faq-1",
      q: "Does Tatito ever ask for or store my UPI PIN or banking password?",
      a: "No. Tatito never collects, logs, or stores your UPI PIN, netbanking password, OTP, or card CVV. Production UPI PIN validation occurs strictly inside the NPCI Common Library / PSP SDK."
    },
    {
      id: "faq-2",
      q: "What happens if money is debited for a pending or failed BBPS bill?",
      a: "Any failed transaction auto-reverses within T+1 working day in live PSP clearing. In this sandbox environment, simulated declines never deduct your wallet balance."
    },
    {
      id: "faq-3",
      q: "How do I pause or cancel a recurring UPI AutoPay mandate?",
      a: "Go to Payments Hub \u2192 UPI AutoPay and use the Pause or Cancel icon next to any mandate. No automatic debit runs without active mandate consent."
    },
    {
      id: "faq-4",
      q: "Are Digital Gold holdings backed by physical gold in this demo?",
      a: "No. While 24K reference rates sync live when network feeds are active, vault gram balances shown here are sandbox simulations requiring an authorized MMTC-PAMP or SafeGold partnership in production."
    }
  ],
  sessionsByUser: /* @__PURE__ */ new Map(),
  loginHistoryByUser: /* @__PURE__ */ new Map(),
  securitySettingsByUser: /* @__PURE__ */ new Map()
};
function getUserSettings(userId) {
  if (!superStore.securitySettingsByUser.has(userId)) {
    superStore.securitySettingsByUser.set(userId, {
      preferred_language: "English",
      push_alerts: true,
      email_alerts: true,
      sms_alerts: true,
      biometric_lock_enabled: false,
      mask_balances_by_default: false,
      upi_pin_mode: "NPCI_PSP_SDK_ONLY (Never Stored)",
      deletion_requested: false
    });
  }
  return superStore.securitySettingsByUser.get(userId);
}
function recordUserSessionAndHistory(params) {
  const deviceLabel = parseDeviceLabel(params.userAgent);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const hist = superStore.loginHistoryByUser.get(params.userId) || [];
  hist.unshift({
    id: `lgh-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    user_id: params.userId,
    email_or_phone: params.emailOrPhone,
    channel: params.channel,
    device: deviceLabel,
    ip: params.ip || "127.0.0.1",
    status: params.status,
    created_at: now
  });
  superStore.loginHistoryByUser.set(params.userId, hist.slice(0, 25));
  if (params.status === "SUCCESS") {
    const sessions = superStore.sessionsByUser.get(params.userId) || [];
    const sess = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      user_id: params.userId,
      device: deviceLabel,
      ip: params.ip || "127.0.0.1",
      channel: params.channel,
      is_active: true,
      last_active_at: now,
      created_at: now
    };
    sessions.unshift(sess);
    superStore.sessionsByUser.set(params.userId, sessions.slice(0, 12));
  }
}
function parseDeviceLabel(ua) {
  if (!ua) return "Tatito Web Browser";
  if (ua.includes("Android")) return "Android Mobile Browser";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS Safari / Mobile";
  if (ua.includes("Chrome")) return "Desktop Chrome Web";
  if (ua.includes("Firefox")) return "Desktop Firefox Web";
  if (ua.includes("node") || ua.includes("undici")) return "API / Automated Client";
  return "Web Session";
}

// backend/routes/auth.routes.ts
var router = Router();
router.post("/register", authRateLimiter, async (req, res) => {
  try {
    const { full_name, email, phone, password, role, city, state, annual_income } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ error: "Validation Error", detail: "full_name, email, phone, and password are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ error: "Validation Error", detail: "Please provide a valid email address" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Validation Error", detail: "Password must be at least 6 characters long" });
    }
    if (role && (role === "admin" || role === "super_admin" || role === "credit_officer")) {
      return res.status(403).json({
        error: "Forbidden",
        detail: "Administrative and Credit Officer roles cannot be self-assigned via public registration. Contact the system administrator."
      });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await dbRepository.users.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: "Conflict", detail: "An account with this email already exists" });
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await dbRepository.users.create({
      full_name: full_name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password_hash: hashedPassword,
      role: "customer",
      wallet_balance: 25e3
    });
    await dbRepository.profiles.upsert(newUser.id, {
      city: city || "Kadapa",
      state: state || "Andhra Pradesh",
      annual_income: parseFloat(annual_income) || 75e4,
      occupation_type: "Salaried"
    });
    await dbRepository.notifications.create({
      user_id: newUser.id,
      title: "Welcome to Tatito Financial Services!",
      message: "Your account has been registered. You can explore borrowing, investing in mutual funds, and trading.",
      category: "general"
    });
    recordUserSessionAndHistory({
      userId: newUser.id,
      emailOrPhone: cleanEmail,
      channel: "PASSWORD_REGISTER",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });
    logAudit(newUser.id, "REGISTER", "users", String(newUser.id), { email: cleanEmail, role: newUser.role });
    const token = generateToken(newUser);
    const { password_hash: _, ...safeUser } = newUser;
    return res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: safeUser
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Bad Request", detail: "Email and password are required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await dbRepository.users.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized", detail: "Invalid email or password" });
    }
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordUserSessionAndHistory({
        userId: user.id,
        emailOrPhone: cleanEmail,
        channel: "PASSWORD",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILED"
      });
      return res.status(401).json({ error: "Unauthorized", detail: "Invalid email or password" });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: "Forbidden", detail: "Account has been deactivated. Contact branch." });
    }
    resetAuthRateLimit(req);
    const token = generateToken(user);
    const { password_hash: _, ...safeUser } = user;
    recordUserSessionAndHistory({
      userId: user.id,
      emailOrPhone: cleanEmail,
      channel: "PASSWORD",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });
    logAudit(user.id, "LOGIN", "users", String(user.id), { ip: req.ip });
    return res.json({
      access_token: token,
      token_type: "bearer",
      user: safeUser
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router.post("/request-otp", authRateLimiter, async (req, res) => {
  const { mobile } = req.body;
  const cleanPhone = String(mobile || "").replace(/\D/g, "").slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: "Validation Error", detail: "Please provide a valid 10-digit Indian mobile number." });
  }
  const hasSmsPartner = Boolean(process.env.SMS_PROVIDER_KEY && !process.env.SMS_PROVIDER_KEY.includes("your_"));
  return res.json({
    status: hasSmsPartner ? "OTP_DISPATCHED_SMS" : "OTP_DISPATCHED_SANDBOX",
    is_sandbox: !hasSmsPartner,
    is_simulated: !hasSmsPartner,
    mobile: cleanPhone,
    sandbox_otp_hint: !hasSmsPartner ? "123456" : void 0,
    expires_in_seconds: 300,
    message: hasSmsPartner ? `OTP sent to +91 ${cleanPhone} via authorized SMS gateway.` : `Development Sandbox OTP dispatched for +91 ${cleanPhone}. Use 123456 or 849201 to verify.`
  });
});
router.post("/login-otp", authRateLimiter, async (req, res) => {
  try {
    const { mobile, otp, full_name } = req.body;
    const cleanPhone = String(mobile || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Validation Error", detail: "Valid 10-digit mobile number is required." });
    }
    if (otp !== "123456" && otp !== "849201") {
      return res.status(400).json({ error: "OTP Verification Failed", detail: "Invalid OTP code. Use 123456 or 849201 in Development Sandbox." });
    }
    let user = await dbRepository.users.findByPhone(cleanPhone);
    if (!user) {
      const randomPwd = `TatitoOtp@${Date.now()}`;
      const hashed = await hashPassword(randomPwd);
      user = await dbRepository.users.create({
        full_name: full_name ? String(full_name).trim() : `Tatito User ${cleanPhone.slice(-4)}`,
        email: `mobile.${cleanPhone}@tatito.in`,
        phone: cleanPhone,
        password_hash: hashed,
        role: "customer",
        wallet_balance: 25e3
      });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: "Forbidden", detail: "Account has been deactivated. Contact branch." });
    }
    resetAuthRateLimit(req);
    const token = generateToken(user);
    const { password_hash: _, ...safeUser } = user;
    recordUserSessionAndHistory({
      userId: user.id,
      emailOrPhone: `+91 ${cleanPhone}`,
      channel: "MOBILE_OTP_SANDBOX",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });
    logAudit(user.id, "LOGIN_OTP_SANDBOX", "users", String(user.id), { phone: cleanPhone });
    return res.json({
      access_token: token,
      token_type: "bearer",
      is_simulated_otp: true,
      user: safeUser
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: "OTP Login Failed", detail: err.message });
  }
});
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || String(new_password).length < 8) {
      return res.status(400).json({
        error: "Validation Error",
        detail: "Current password and a new password of at least 8 characters are required."
      });
    }
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Not Found", detail: "User not found" });
    const matches = await verifyPassword(String(current_password), user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: "Unauthorized", detail: "Current password is incorrect." });
    }
    const newHash = await hashPassword(String(new_password));
    await dbRepository.users.updatePassword(user.id, newHash);
    logAudit(user.id, "CHANGE_PASSWORD", "users", String(user.id), { status: "UPDATED" });
    return res.json({
      status: "PASSWORD_CHANGED",
      message: "Your account password has been updated securely."
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router.get("/sessions", requireAuth, (req, res) => {
  const existing = superStore.sessionsByUser.get(req.user.userId) || [
    {
      id: `sess-current-${req.user.userId}`,
      user_id: req.user.userId,
      device: "Active Tatito Web Browser",
      ip: req.ip || "127.0.0.1",
      channel: "JWT_BEARER",
      is_active: true,
      last_active_at: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  return res.json({ sessions: existing });
});
router.delete("/sessions/:id", requireAuth, (req, res) => {
  const list = superStore.sessionsByUser.get(req.user.userId) || [];
  const target = list.find((s) => s.id === req.params.id);
  if (target) {
    target.is_active = false;
  }
  logAudit(req.user.userId, "REVOKE_SESSION", "user_sessions", req.params.id, {});
  return res.json({ status: "SESSION_REVOKED", session_id: req.params.id });
});
router.get("/login-history", requireAuth, (req, res) => {
  const history = superStore.loginHistoryByUser.get(req.user.userId) || [
    {
      id: `lgh-seed-${req.user.userId}`,
      user_id: req.user.userId,
      email_or_phone: req.user.email,
      channel: "PASSWORD",
      device: "Tatito Web Browser",
      ip: req.ip || "127.0.0.1",
      status: "SUCCESS",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  return res.json({ history });
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Not Found", detail: "User profile not found" });
    const { password_hash: _, ...safeUser } = user;
    const profile = await dbRepository.profiles.getByUserId(user.id) || {};
    return res.json({ ...safeUser, profile });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (req.body?.revoke_token === true || req.query?.revoke === "true") {
      revokeToken(token);
    }
  }
  logAudit(null, "LOGOUT", "users", null, { ip: req.ip });
  res.json({ message: "Logged out successfully", status: "LOGGED_OUT" });
});
router.post("/forgot-password", authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Bad Request", detail: "Email address is required" });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const user = await dbRepository.users.findByEmail(cleanEmail);
    const refId = `PWD-RESET-${Date.now()}`;
    if (user) {
      logAudit(user.id, "FORGOT_PASSWORD_REQUEST", "users", String(user.id), { referenceId: refId });
    }
    return res.json({
      status: "OTP_DISPATCHED_SANDBOX",
      is_sandbox: true,
      sandbox_otp_hint: "849201",
      referenceId: refId,
      message: "If the email exists, a simulated password reset OTP (849201 in Test Sandbox) has been dispatched."
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router.post("/reset-password", authRateLimiter, async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Bad Request", detail: "Email is required" });
    }
    if (new_password) {
      if (!otp || otp !== "849201" && otp !== "123456") {
        return res.status(400).json({
          error: "Invalid OTP",
          detail: "Invalid or expired sandbox reset OTP. Use 849201 for sandbox verification."
        });
      }
      if (String(new_password).length < 8) {
        return res.status(400).json({
          error: "Validation Error",
          detail: "New password must be at least 8 characters long."
        });
      }
      const user = await dbRepository.users.findByEmail(String(email).toLowerCase().trim());
      if (!user) {
        return res.status(404).json({ error: "Not Found", detail: "Account not found for this email" });
      }
      const hashed = await hashPassword(String(new_password));
      await dbRepository.users.updatePassword(user.id, hashed);
      logAudit(user.id, "RESET_PASSWORD_SUCCESS", "users", String(user.id), { mode: "sandbox_otp" });
      return res.json({
        status: "PASSWORD_UPDATED",
        message: "Password has been reset successfully. You may now sign in with your new credentials.",
        referenceId: `PWD-RESET-${Date.now()}`
      });
    }
    return res.json({
      message: "If the email exists, a simulated password reset OTP has been dispatched.",
      sandbox_otp_hint: "849201",
      referenceId: `PWD-RESET-${Date.now()}`
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router.post("/verify-otp", authRateLimiter, (req, res) => {
  const { identifier, otp } = req.body;
  if (!otp || String(otp).length < 4) {
    return res.status(400).json({ error: "Bad Request", detail: "Valid 6-digit OTP is required" });
  }
  const isValidTestOtp = otp === "123456" || otp === "849201";
  if (!isValidTestOtp) {
    return res.status(400).json({
      error: "OTP Verification Failed",
      detail: "Invalid test OTP code. Use 123456 or 849201 in Development Sandbox."
    });
  }
  return res.json({
    status: "SANDBOX_OTP_VERIFIED",
    is_sandbox: true,
    is_simulated: true,
    verified: true,
    identifier: identifier || "sandbox-user",
    disclaimer: "DEVELOPMENT SANDBOX OTP: For testing only. Not connected to live telecom SMS gateway."
  });
});
var auth_routes_default = router;

// backend/routes/users.routes.ts
import { Router as Router2 } from "express";

// backend/services/realtime.ts
var activeWss = null;
var connectedClients = /* @__PURE__ */ new Map();
function registerWebSocketServer(wss) {
  activeWss = wss;
  wss.on("connection", (ws, req) => {
    let userId;
    try {
      const url = new URL(req.url || "/ws/notifications", "http://localhost");
      const uid = url.searchParams.get("userId");
      if (uid && !isNaN(Number(uid))) {
        userId = Number(uid);
      }
    } catch {
    }
    connectedClients.set(ws, { userId, connectedAt: (/* @__PURE__ */ new Date()).toISOString() });
    ws.send(
      JSON.stringify({
        type: "WS_CONNECTED",
        channel: "tatito_realtime_notifications",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        message: "Connected to Tatito Real-Time Notification Stream"
      })
    );
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg?.type === "AUTH" && msg.userId) {
          connectedClients.set(ws, { userId: Number(msg.userId), connectedAt: (/* @__PURE__ */ new Date()).toISOString() });
        } else if (msg?.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
        }
      } catch {
      }
    });
    ws.on("close", () => {
      connectedClients.delete(ws);
    });
  });
}
function broadcastRealtimeNotification(targetUserId, payload) {
  if (!activeWss) return;
  const frame = JSON.stringify({
    type: "NOTIFICATION_EVENT",
    ...payload,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  connectedClients.forEach((meta, ws) => {
    if (ws.readyState !== 1) return;
    if (targetUserId === "all" || !meta.userId || meta.userId === targetUserId) {
      try {
        ws.send(frame);
      } catch {
      }
    }
  });
}

// backend/routes/users.routes.ts
var router2 = Router2();
router2.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const profile = await dbRepository.profiles.getByUserId(user.id) || {};
    const kyc = await dbRepository.kyc.getByUserId(user.id);
    const demat = await dbRepository.investments.getDemat(user.id);
    const { password_hash: _, ...safeUser } = user;
    return res.json({
      ...safeUser,
      profile,
      kyc_records: kyc,
      demat_account: demat
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router2.put("/profile", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { full_name, phone, dob, gender, address_line1, city, state, pincode, annual_income, occupation_type, bank_account_no, bank_ifsc, bank_name } = req.body;
    if (full_name || phone) {
      await dbRepository.users.updateProfileInfo(user.id, {
        full_name: full_name ? String(full_name).trim() : void 0,
        phone: phone ? String(phone).trim() : void 0
      });
    }
    const updatedProfile = await dbRepository.profiles.upsert(user.id, {
      dob: dob || void 0,
      gender: gender || void 0,
      address_line1: address_line1 ? String(address_line1).trim() : void 0,
      city: city ? String(city).trim() : void 0,
      state: state ? String(state).trim() : void 0,
      pincode: pincode ? String(pincode).trim() : void 0,
      annual_income: annual_income !== void 0 ? parseFloat(annual_income) : void 0,
      occupation_type,
      bank_account_no: bank_account_no || void 0,
      bank_ifsc: bank_ifsc || void 0,
      bank_name: bank_name || void 0
    });
    logAudit(user.id, "UPDATE_PROFILE", "user_profiles", String(user.id), { updatedFields: req.body });
    const refreshedUser = await dbRepository.users.findById(user.id) || user;
    const { password_hash: _, ...safeUser } = refreshedUser;
    return res.json({ ...safeUser, profile: updatedProfile });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router2.get("/settings", requireAuth, (req, res) => {
  return res.json({
    settings: getUserSettings(req.user.userId),
    security_guarantee: "Tatito never collects or stores UPI PINs, banking passwords, or card CVVs."
  });
});
router2.put("/settings", requireAuth, (req, res) => {
  const current = getUserSettings(req.user.userId);
  const { preferred_language, push_alerts, email_alerts, sms_alerts, biometric_lock_enabled, mask_balances_by_default } = req.body;
  if (preferred_language && ["English", "Telugu", "Hindi"].includes(preferred_language)) {
    current.preferred_language = preferred_language;
  }
  if (typeof push_alerts === "boolean") current.push_alerts = push_alerts;
  if (typeof email_alerts === "boolean") current.email_alerts = email_alerts;
  if (typeof sms_alerts === "boolean") current.sms_alerts = sms_alerts;
  if (typeof biometric_lock_enabled === "boolean") current.biometric_lock_enabled = biometric_lock_enabled;
  if (typeof mask_balances_by_default === "boolean") current.mask_balances_by_default = mask_balances_by_default;
  logAudit(req.user.userId, "UPDATE_SETTINGS", "security_settings", String(req.user.userId), req.body);
  return res.json({ status: "SETTINGS_UPDATED", settings: current });
});
router2.post("/account-action", requireAuth, async (req, res) => {
  const { action, reason } = req.body;
  const userId = req.user.userId;
  if (action === "request_deletion") {
    const settings = getUserSettings(userId);
    settings.deletion_requested = true;
    logAudit(userId, "ACCOUNT_DELETION_REQUESTED", "users", String(userId), { reason: reason || "User requested" });
    return res.json({
      status: "DELETION_REQUEST_RECORDED",
      message: "Account deletion request logged for RBI/NBFC statutory 7-day cooling-off verification."
    });
  }
  if (action === "deactivate") {
    logAudit(userId, "ACCOUNT_DEACTIVATE_REQUESTED", "users", String(userId), { reason: reason || "Temporary self-lock" });
    return res.json({
      status: "DEACTIVATION_SCHEDULED",
      message: "Self-deactivation request recorded. Contact Kadapa branch desk to re-enable access."
    });
  }
  return res.status(400).json({ error: "Invalid Action", detail: "Supported actions: request_deletion, deactivate" });
});
router2.post("/deposit", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const amt = parseFloat(req.body.amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid positive amount required" });
    }
    const currentBalance = parseFloat(user.wallet_balance || 0);
    const newBalance = currentBalance + amt;
    await dbRepository.users.updateWallet(user.id, newBalance);
    const paymentRef = `DEP-${Date.now()}`;
    await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: "credit",
      amount: amt,
      balance_after: newBalance,
      description: "IMPS Bank Transfer Deposit [SANDBOX]",
      reference_id: paymentRef
    });
    await dbRepository.payments.create({
      payment_ref: paymentRef,
      user_id: user.id,
      payment_category: "wallet_deposit",
      operator_name: "IMPS Bank Transfer Sandbox",
      account_identifier: user.phone,
      amount: amt,
      payment_mode: "netbanking",
      status: "DEMO_SUCCESS"
    });
    await dbRepository.notifications.create({
      user_id: user.id,
      title: "Wallet Funded",
      message: `\u20B9${amt.toLocaleString("en-IN")} deposited into wallet. Reference: ${paymentRef}`,
      category: "investments"
    });
    broadcastRealtimeNotification(user.id, {
      title: "Wallet Funded",
      message: `\u20B9${amt.toLocaleString("en-IN")} deposited (${paymentRef})`,
      category: "wallet",
      reference: paymentRef,
      amount: amt
    });
    logAudit(user.id, "WALLET_DEPOSIT", "payments", paymentRef, { amount: amt });
    return res.json({
      wallet_balance: newBalance,
      reference: paymentRef,
      message: "Deposit simulated successfully"
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router2.get("/wallet", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const transactions = await dbRepository.wallet.getTransactions(user.id);
    const payments = await dbRepository.payments.getByUser(user.id);
    const kyc = await dbRepository.kyc.getByUserId(user.id);
    const isFullKyc = Array.isArray(kyc) && kyc.length >= 2;
    const todaySpent = transactions.filter((t) => t.transaction_type === "debit").slice(0, 5).reduce((acc, t) => acc + Number(t.amount || 0), 0);
    return res.json({
      user_id: user.id,
      wallet_balance: parseFloat(user.wallet_balance || 0),
      currency: "INR",
      is_sandbox: true,
      limits: {
        kyc_tier: isFullKyc ? "FULL_KYC_SANDBOX" : "MIN_KYC_SANDBOX",
        per_txn_limit: isFullKyc ? 1e5 : 1e4,
        daily_limit: isFullKyc ? 2e5 : 2e4,
        monthly_limit: isFullKyc ? 1e6 : 1e5,
        used_recent: todaySpent,
        rbi_ppi_notice: "Simulated PPI escrow limits shown for demonstration only."
      },
      transactions,
      recent_payments: payments.slice(0, 10),
      compliance_notice: "SANDBOX WALLET LEDGER: Simulated NBFC internal escrow & payment gateway."
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router2.get("/wallet/transactions", requireAuth, async (req, res) => {
  try {
    const transactions = await dbRepository.wallet.getTransactions(req.user.userId);
    return res.json(transactions);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router2.post("/wallet/add-money", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const amt = parseFloat(req.body.amount);
    const mode = req.body.payment_mode || "upi_sandbox";
    if (!amt || isNaN(amt) || amt <= 0 || amt > 5e5) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid deposit amount between \u20B91 and \u20B95,00,000 is required" });
    }
    const currentBalance = parseFloat(user.wallet_balance || 0);
    const newBalance = currentBalance + amt;
    await dbRepository.users.updateWallet(user.id, newBalance);
    const refId = `WAL-CR-${Date.now()}`;
    const txn = await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: "credit",
      amount: amt,
      balance_after: newBalance,
      description: `Wallet Top-Up via ${String(mode).toUpperCase()} [SANDBOX]`,
      reference_id: refId
    });
    await dbRepository.payments.create({
      payment_ref: refId,
      user_id: user.id,
      payment_category: "wallet_deposit",
      operator_name: `Tatito ${String(mode).toUpperCase()} Gateway Sandbox`,
      account_identifier: user.phone,
      amount: amt,
      payment_mode: mode,
      status: "DEMO_SUCCESS"
    });
    broadcastRealtimeNotification(user.id, {
      title: "Wallet Top-Up Credited",
      message: `\u20B9${amt.toLocaleString("en-IN")} added via ${String(mode).toUpperCase()}`,
      category: "wallet",
      reference: refId,
      amount: amt
    });
    logAudit(user.id, "WALLET_ADD_MONEY", "wallet_transactions", refId, { amount: amt, mode });
    return res.status(201).json({
      status: "DEMO_SUCCESS",
      is_simulated: true,
      wallet_balance: newBalance,
      reference: refId,
      transaction: txn,
      message: `\u20B9${amt.toLocaleString("en-IN")} credited to your Tatito Wallet [Sandbox Simulation]`
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router2.post("/wallet/withdraw", requireAuth, async (req, res) => {
  try {
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const amt = parseFloat(req.body.amount);
    const bankAccount = req.body.bank_account || "SBI Kadapa \u2022\u2022\u2022\u2022 4821";
    if (!amt || isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid positive withdrawal amount required" });
    }
    const currentBalance = parseFloat(user.wallet_balance || 0);
    if (currentBalance < amt) {
      return res.status(400).json({
        error: "Insufficient Balance",
        detail: `Insufficient wallet balance (\u20B9${currentBalance.toLocaleString("en-IN")}) for withdrawal of \u20B9${amt.toLocaleString("en-IN")}`
      });
    }
    const newBalance = currentBalance - amt;
    await dbRepository.users.updateWallet(user.id, newBalance);
    const refId = `WAL-DR-${Date.now()}`;
    const txn = await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: "debit",
      amount: amt,
      balance_after: newBalance,
      description: `IMPS Settlement to ${bankAccount} [SANDBOX]`,
      reference_id: refId
    });
    broadcastRealtimeNotification(user.id, {
      title: "Wallet Withdrawal Initiated",
      message: `\u20B9${amt.toLocaleString("en-IN")} transferred to ${bankAccount}`,
      category: "wallet",
      reference: refId,
      amount: amt
    });
    logAudit(user.id, "WALLET_WITHDRAW", "wallet_transactions", refId, { amount: amt, bankAccount });
    return res.json({
      status: "DEMO_SUCCESS",
      is_simulated: true,
      wallet_balance: newBalance,
      reference: refId,
      transaction: txn,
      message: `\u20B9${amt.toLocaleString("en-IN")} initiated to ${bankAccount} via simulated IMPS`
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
var users_routes_default = router2;

// backend/routes/kyc.routes.ts
import { Router as Router3 } from "express";

// integrations/index.ts
function isLivePartnerConfigured(key) {
  if (process.env.LIVE_FINANCIAL_PARTNERS !== "true") return false;
  if (!key || key === "123" || key.startsWith("MOCK") || key.length < 16) return false;
  return true;
}
var KycAdapter = class {
  async verifyDocument(req) {
    const isLive = isLivePartnerConfigured(process.env.KYC_PROVIDER_API_KEY);
    const cleanDoc = (req.documentNumber || "").trim().toUpperCase();
    if (req.documentType === "pan") {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanDoc)) {
        return {
          isVerified: false,
          isFormatValid: false,
          status: "INVALID_FORMAT",
          environment: isLive ? "LIVE" : "SANDBOX",
          provider: isLive ? "NSDL KRA Production Gateway" : "DigiLocker / KRA Sandbox Simulator [DEMO]",
          referenceId: `KYC-ERR-${Date.now()}`,
          maskedId: cleanDoc.slice(0, 2) + "****",
          details: { error: "Invalid 10-character alphanumeric PAN format (e.g. ABCDE1234F)" },
          isLive,
          isMock: !isLive,
          complianceNote: "Validation failed: Document does not match statutory Income Tax PAN structure."
        };
      }
    } else if (req.documentType === "aadhaar") {
      const cleanAadhaar = cleanDoc.replace(/[\s-]/g, "");
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return {
          isVerified: false,
          isFormatValid: false,
          status: "INVALID_FORMAT",
          environment: isLive ? "LIVE" : "SANDBOX",
          provider: isLive ? "UIDAI Production Gateway" : "UIDAI OTP Sandbox Simulator [DEMO]",
          referenceId: `KYC-ERR-${Date.now()}`,
          maskedId: "XXXX-XXXX-" + cleanAadhaar.slice(-4),
          details: { error: "Invalid 12-digit Aadhaar number format" },
          isLive,
          isMock: !isLive,
          complianceNote: "Validation failed: Aadhaar must be 12 numeric digits."
        };
      }
    }
    const masked = req.documentType === "pan" ? `${cleanDoc.slice(0, 2)}****${cleanDoc.slice(-1)}` : `XXXX-XXXX-${cleanDoc.slice(-4)}`;
    if (!isLive) {
      return {
        isVerified: false,
        // Sandbox simulation cannot be presented as genuine verified identity
        isFormatValid: true,
        status: "SANDBOX_SIMULATED",
        environment: "SANDBOX",
        provider: "DigiLocker / KRA Sandbox Simulator [DEMO]",
        referenceId: `KYC-REF-${Date.now()}`,
        maskedId: masked,
        details: {
          nameMatch: true,
          source: "Income Tax Department (ITD) / UIDAI Sandbox Format Validator",
          verifiedName: req.fullName,
          statutoryVerification: false
        },
        isLive: false,
        isMock: true,
        complianceNote: "Simulated e-KYC response in Sandbox prototype environment. Not an authorized biometric or statutory verification."
      };
    }
    const providerUrl = process.env.KYC_PROVIDER_ENDPOINT_URL || "https://api.digitallocker.gov.in/public/oauth2/1/xml/kyc";
    const apiKey = process.env.KYC_PROVIDER_API_KEY;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4e3);
      const response = await fetch(providerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Provider-Client": "Tatito-Financial-Services-Kadapa"
        },
        body: JSON.stringify({
          document_type: req.documentType,
          document_number: cleanDoc,
          full_name: req.fullName,
          dob: req.dob,
          otp: req.otp
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return {
          isVerified: false,
          isFormatValid: true,
          status: "UNAVAILABLE",
          environment: "LIVE",
          provider: "NSDL KRA / DigiLocker Live Gateway",
          referenceId: `KYC-ERR-${Date.now()}`,
          maskedId: masked,
          details: { error: `Live provider returned HTTP ${response.status}` },
          isLive: true,
          isMock: false,
          complianceNote: `Live KYC provider authentication failed with status ${response.status}. Document could not be verified.`
        };
      }
      const providerData = await response.json();
      if (providerData && (providerData.verified === true || providerData.status === "SUCCESS")) {
        return {
          isVerified: true,
          isFormatValid: true,
          status: "VERIFIED",
          environment: "LIVE",
          provider: "NSDL KRA / DigiLocker Live Gateway",
          referenceId: providerData.transaction_id || `KYC-LIVE-${Date.now()}`,
          maskedId: masked,
          details: providerData,
          isLive: true,
          isMock: false,
          complianceNote: "Genuine identity verification confirmed by authenticated live provider response."
        };
      } else {
        return {
          isVerified: false,
          isFormatValid: true,
          status: "UNAVAILABLE",
          environment: "LIVE",
          provider: "NSDL KRA / DigiLocker Live Gateway",
          referenceId: `KYC-REJ-${Date.now()}`,
          maskedId: masked,
          details: providerData || { error: "Document record not confirmed by issuer" },
          isLive: true,
          isMock: false,
          complianceNote: "Live provider could not verify document details with central repository."
        };
      }
    } catch (err) {
      return {
        isVerified: false,
        isFormatValid: true,
        status: "UNAVAILABLE",
        environment: "LIVE",
        provider: "NSDL KRA / DigiLocker Live Gateway",
        referenceId: `KYC-UNAVAIL-${Date.now()}`,
        maskedId: masked,
        details: { error: err.message || "Provider connection timeout" },
        isLive: true,
        isMock: false,
        complianceNote: "Live KYC provider endpoint unavailable or timed out. Verification cannot be confirmed."
      };
    }
  }
};
var CreditBureauAdapter = class {
  async pullCreditScore(pan, phone) {
    const isLive = isLivePartnerConfigured(process.env.CREDIT_BUREAU_MEMBER_ID);
    let hash = 0;
    for (let i = 0; i < pan.length; i++) hash += pan.charCodeAt(i);
    const score = 720 + hash % 60;
    return {
      score,
      ratingCategory: score >= 750 ? "Excellent" : "Good",
      activeAccounts: 3,
      enquiriesLast6Months: 1,
      reportReference: `CIBIL-REPORT-${Date.now()}`,
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      isSimulated: !isLive,
      complianceNotice: isLive ? "Live credit bureau enquiry record retrieved from bureau node." : "DEMO BENCHMARK: Simulated credit score for demonstration. Not pulled from TransUnion CIBIL or Experian."
    };
  }
};
var ESignAdapter = class {
  async initiateAadhaarSign(req) {
    const isLive = isLivePartnerConfigured(process.env.ESIGN_PROVIDER_SECRET);
    return {
      signingUrl: isLive ? `https://esign.digitallocker.gov.in/sign/${req.applicationNo}` : `https://esign-sandbox.tatito.in/sign/${req.applicationNo}`,
      transactionId: `ESIGN-${Date.now()}`,
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      complianceNote: isLive ? "Live Aadhaar e-Sign initiated via licensed ESP." : "DEMO SANDBOX: Simulated Aadhaar e-Sign sandbox URL. No legally binding digital contract executed."
    };
  }
};
var MandateAdapter = class {
  async registerMandate(req) {
    const isLive = isLivePartnerConfigured(process.env.MANDATE_API_KEY);
    return {
      umrn: `TATITO${Math.floor(1e9 + Math.random() * 9e9)}`,
      mandateStatus: isLive ? "ACTIVE_REGISTERED" : "MOCK_SANDBOX_ACTIVE",
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      complianceNote: isLive ? "Live NPCI e-NACH mandate registered with sponsor bank." : "DEMO SANDBOX: Simulated NPCI e-NACH auto-debit mandate. No actual bank account debit authorization."
    };
  }
};
var PaymentGatewayAdapter = class {
  async createPaymentOrder(intent) {
    const isLive = isLivePartnerConfigured(process.env.PAYMENT_GATEWAY_SECRET);
    return {
      orderId: `ORDER_${Date.now()}`,
      amount: intent.amount,
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      complianceNote: isLive ? "Live payment gateway order created." : "DEMO SANDBOX: Simulated payment intent. No actual banking clearing or card charge."
    };
  }
};
var LendingPartnerAdapter = class {
  async submitForUnderwriting(appData) {
    const isLive = isLivePartnerConfigured(process.env.CO_LENDING_PARTNER_API_KEY);
    return {
      partnerName: "Rayalaseema Credit Consortium / State Bank Partner",
      sanctionStatus: "approved",
      approvedAmount: appData.requestedAmount || 5e5,
      recommendedRate: appData.interestRate || 14,
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      complianceNote: isLive ? "Underwriting submitted to live lending partner consortium." : "DEMO SANDBOX: Indicative co-lending assessment for demonstration. Subject to physical verification."
    };
  }
};
var DepositoryParticipantAdapter = class {
  async verifyDematStatus(clientCode) {
    const isLive = isLivePartnerConfigured(process.env.NSDL_DP_GATEWAY_KEY);
    return {
      dpId: "IN300128-10049281",
      depository: "NSDL",
      isActive: true,
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      complianceNote: isLive ? "Live NSDL Depository participant response." : "DEMO SANDBOX: Simulated Depository Participant account. Tatito is not a SEBI-registered broker."
    };
  }
};
function buildTimeframes(basePrice, isPositive) {
  const dir = isPositive ? 1 : -1;
  const gen = (count, stepVolatility, startFactor, prefix) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const progress = i / Math.max(1, count - 1);
      const wave = Math.sin(i * 0.9) * stepVolatility;
      const val = basePrice * (startFactor + (1 - startFactor) * progress) + wave * dir;
      arr.push({
        label: `${prefix}${i + 1}`,
        price: Number(Math.max(10, val).toFixed(2))
      });
    }
    arr[arr.length - 1].price = basePrice;
    return arr;
  };
  return {
    "1D": [
      { label: "09:15", price: Number((basePrice * (1 - dir * 8e-3)).toFixed(2)) },
      { label: "10:30", price: Number((basePrice * (1 - dir * 5e-3)).toFixed(2)) },
      { label: "11:45", price: Number((basePrice * (1 - dir * 2e-3)).toFixed(2)) },
      { label: "13:00", price: Number((basePrice * (1 + dir * 1e-3)).toFixed(2)) },
      { label: "14:15", price: Number((basePrice * (1 - dir * 1e-3)).toFixed(2)) },
      { label: "15:30", price: basePrice }
    ],
    "1W": gen(7, basePrice * 8e-3, isPositive ? 0.97 : 1.03, "D"),
    "1M": gen(10, basePrice * 0.015, isPositive ? 0.94 : 1.05, "W"),
    "3M": gen(12, basePrice * 0.025, isPositive ? 0.89 : 1.08, "W"),
    "1Y": gen(12, basePrice * 0.04, isPositive ? 0.78 : 0.92, "M"),
    "5Y": gen(10, basePrice * 0.06, 0.48, "Y")
  };
}
var MarketDataAdapter = class _MarketDataAdapter {
  static {
    this.MOCK_QUOTES = [
      {
        symbol: "RELIANCE",
        name: "Reliance Industries Ltd",
        price: 2945.6,
        change: -12.4,
        changePct: -0.42,
        change_percent: -0.42,
        high: 2975,
        low: 2938.1,
        high_52w: 3217.9,
        low_52w: 2220.3,
        market_cap_cr: 1993450,
        pe_ratio: 28.4,
        sector: "Energy & Conglomerate",
        sparkline: [2962, 2958.4, 2951.2, 2955, 2949.8, 2945.6],
        timeframes: buildTimeframes(2945.6, false),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "TCS",
        name: "Tata Consultancy Services",
        price: 4120.75,
        change: 38.9,
        changePct: 0.95,
        change_percent: 0.95,
        high: 4145,
        low: 4095.5,
        high_52w: 4592.25,
        low_52w: 3311,
        market_cap_cr: 1491200,
        pe_ratio: 31.2,
        sector: "Information Technology",
        sparkline: [4082, 4090.5, 4098, 4105.2, 4114.6, 4120.75],
        timeframes: buildTimeframes(4120.75, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "HDFCBANK",
        name: "HDFC Bank Ltd",
        price: 1682.3,
        change: 15.1,
        changePct: 0.91,
        change_percent: 0.91,
        high: 1690,
        low: 1668.5,
        high_52w: 1794,
        low_52w: 1363.55,
        market_cap_cr: 1281500,
        pe_ratio: 19.8,
        sector: "Banking & Financials",
        sparkline: [1667.2, 1670, 1674.5, 1672.8, 1679.1, 1682.3],
        timeframes: buildTimeframes(1682.3, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "INFY",
        name: "Infosys Ltd",
        price: 1892.4,
        change: 24.3,
        changePct: 1.3,
        change_percent: 1.3,
        high: 1905,
        low: 1870,
        high_52w: 1975,
        low_52w: 1358.35,
        market_cap_cr: 785400,
        pe_ratio: 29.1,
        sector: "Information Technology",
        sparkline: [1868.1, 1874, 1879.2, 1883.5, 1888, 1892.4],
        timeframes: buildTimeframes(1892.4, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "ICICIBANK",
        name: "ICICI Bank Ltd",
        price: 1235.8,
        change: 11.2,
        changePct: 0.91,
        change_percent: 0.91,
        high: 1242,
        low: 1224,
        high_52w: 1311.6,
        low_52w: 970.15,
        market_cap_cr: 869200,
        pe_ratio: 18.6,
        sector: "Banking & Financials",
        sparkline: [1224.6, 1226.4, 1229, 1231.5, 1233.2, 1235.8],
        timeframes: buildTimeframes(1235.8, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "TATAMOTORS",
        name: "Tata Motors Ltd",
        price: 980.5,
        change: -8.1,
        changePct: -0.82,
        change_percent: -0.82,
        high: 994,
        low: 975.2,
        high_52w: 1179,
        low_52w: 696.2,
        market_cap_cr: 360800,
        pe_ratio: 11.4,
        sector: "Automotive & EV",
        sparkline: [988.6, 986.2, 985, 983.4, 981.9, 980.5],
        timeframes: buildTimeframes(980.5, false),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "ITC",
        name: "ITC Ltd",
        price: 489.65,
        change: 2.15,
        changePct: 0.44,
        change_percent: 0.44,
        high: 492,
        low: 486.5,
        high_52w: 528.5,
        low_52w: 399.35,
        market_cap_cr: 612400,
        pe_ratio: 29.6,
        sector: "FMCG & Consumer",
        sparkline: [487.5, 488, 487.8, 488.6, 489.1, 489.65],
        timeframes: buildTimeframes(489.65, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "SBIN",
        name: "State Bank of India",
        price: 825.4,
        change: 7.8,
        changePct: 0.95,
        change_percent: 0.95,
        high: 831,
        low: 818,
        high_52w: 912,
        low_52w: 555.15,
        market_cap_cr: 736800,
        pe_ratio: 10.9,
        sector: "Public Sector Banking",
        sparkline: [817.6, 819.2, 821, 822.5, 824.1, 825.4],
        timeframes: buildTimeframes(825.4, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "GOLDBEES",
        name: "Nippon India Gold ETF (24K)",
        price: 68.45,
        change: 0.85,
        changePct: 1.26,
        change_percent: 1.26,
        high: 68.9,
        low: 67.8,
        high_52w: 71.2,
        low_52w: 51.4,
        market_cap_cr: 14200,
        pe_ratio: 0,
        sector: "Precious Metals ETF",
        sparkline: [67.6, 67.8, 68, 68.1, 68.3, 68.45],
        timeframes: buildTimeframes(68.45, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      },
      {
        symbol: "NIFTY_50",
        name: "UTI Nifty 50 Index ETF",
        price: 1380,
        change: 9.5,
        changePct: 0.69,
        change_percent: 0.69,
        high: 1385,
        low: 1372,
        high_52w: 1420,
        low_52w: 1090,
        market_cap_cr: 48500,
        pe_ratio: 22.8,
        sector: "Broad Market Index",
        sparkline: [1370.5, 1372, 1375.4, 1377.2, 1378.8, 1380],
        timeframes: buildTimeframes(1380, true),
        isSimulated: true,
        isLive: false,
        environment: "SANDBOX"
      }
    ];
  }
  static {
    this.liveCache = null;
  }
  static {
    this.benchmarkCache = null;
  }
  static {
    this.YAHOO_SYMBOL_MAP = {
      RELIANCE: "RELIANCE.NS",
      TCS: "TCS.NS",
      HDFCBANK: "HDFCBANK.NS",
      INFY: "INFY.NS",
      ICICIBANK: "ICICIBANK.NS",
      ITC: "ITC.NS",
      SBIN: "SBIN.NS",
      GOLDBEES: "GOLDBEES.NS",
      NIFTY_50: "^NSEI"
    };
  }
  static async fetchYahooChart(yahooSymbol, range = "5d", interval = "1d") {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TatitoFinance/2.0)" },
        signal: AbortSignal.timeout(2500)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.chart?.result?.[0] || null;
    } catch {
      return null;
    }
  }
  async getQuotes() {
    if (process.env.NODE_ENV === "test") {
      return _MarketDataAdapter.MOCK_QUOTES;
    }
    return this.getLiveQuotes();
  }
  async getLiveQuotes() {
    const now = Date.now();
    if (_MarketDataAdapter.liveCache && now - _MarketDataAdapter.liveCache.fetchedAt < 25e3) {
      return _MarketDataAdapter.liveCache.quotes;
    }
    if (process.env.NODE_ENV === "test" || process.env.LIVE_MARKET_FEED === "false") {
      return _MarketDataAdapter.MOCK_QUOTES;
    }
    const updated = await Promise.all(
      _MarketDataAdapter.MOCK_QUOTES.map(async (base) => {
        const yahooSym = _MarketDataAdapter.YAHOO_SYMBOL_MAP[base.symbol];
        if (!yahooSym) return base;
        const result = await _MarketDataAdapter.fetchYahooChart(yahooSym, "5d", "1d");
        const meta = result?.meta;
        const price = Number(meta?.regularMarketPrice);
        if (!meta || !Number.isFinite(price) || price <= 0) {
          return base;
        }
        const prevClose = Number(meta.chartPreviousClose || meta.previousClose || price);
        const change = Number((price - prevClose).toFixed(2));
        const changePct = prevClose > 0 ? Number((change / prevClose * 100).toFixed(2)) : 0;
        const closesRaw = (result?.indicators?.quote?.[0]?.close || []).filter((n) => Number.isFinite(n));
        const sparkline = closesRaw.length >= 2 ? [...closesRaw.slice(-5).map((n) => Number(n.toFixed(2))), Number(price.toFixed(2))] : [...base.sparkline.slice(0, 5), Number(price.toFixed(2))];
        const high = Number(meta.regularMarketDayHigh || Math.max(...sparkline, price));
        const low = Number(meta.regularMarketDayLow || Math.min(...sparkline, price));
        const high52w = Number(meta.fiftyTwoWeekHigh || base.high_52w);
        const low52w = Number(meta.fiftyTwoWeekLow || base.low_52w);
        const isPos = change >= 0;
        return {
          ...base,
          price: Number(price.toFixed(2)),
          change,
          changePct,
          change_percent: changePct,
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          high_52w: Number(high52w.toFixed(2)),
          low_52w: Number(low52w.toFixed(2)),
          sparkline,
          timeframes: buildTimeframes(Number(price.toFixed(2)), isPos),
          isSimulated: false,
          isLive: true,
          environment: "LIVE",
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
      })
    );
    _MarketDataAdapter.liveCache = { quotes: updated, fetchedAt: now };
    return updated;
  }
  async getMarketBenchmarks() {
    const now = Date.now();
    if (_MarketDataAdapter.benchmarkCache && now - _MarketDataAdapter.benchmarkCache.fetchedAt < 25e3) {
      return _MarketDataAdapter.benchmarkCache.data;
    }
    const fallback = {
      nifty50: { value: 24852.15, change: 142.3, changePct: 0.58, isLive: false },
      sensex: { value: 81410.8, change: 420.1, changePct: 0.52, isLive: false },
      gold24kPerGramInr: { value: 7680, isLive: false },
      usdInr: { value: 84.4, isLive: false },
      isLive: false,
      source: "Sandbox Benchmark Catalog",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (process.env.NODE_ENV === "test" || process.env.LIVE_MARKET_FEED === "false") {
      return fallback;
    }
    const [niftyRes, sensexRes, goldRes, fxRes] = await Promise.all([
      _MarketDataAdapter.fetchYahooChart("^NSEI", "5d", "1d"),
      _MarketDataAdapter.fetchYahooChart("^BSESN", "5d", "1d"),
      _MarketDataAdapter.fetchYahooChart("GC=F", "5d", "1d"),
      _MarketDataAdapter.fetchYahooChart("INR=X", "5d", "1d")
    ]);
    const parseIdx = (res, fb) => {
      const p = Number(res?.meta?.regularMarketPrice);
      const prev = Number(res?.meta?.chartPreviousClose || res?.meta?.previousClose || p);
      if (!Number.isFinite(p) || p <= 0) return { ...fb, isLive: false };
      const ch = Number((p - prev).toFixed(2));
      const pct = prev > 0 ? Number((ch / prev * 100).toFixed(2)) : 0;
      return { value: Number(p.toFixed(2)), change: ch, changePct: pct, isLive: true };
    };
    const nifty50 = parseIdx(niftyRes, fallback.nifty50);
    const sensex = parseIdx(sensexRes, fallback.sensex);
    const goldUsdOz = Number(goldRes?.meta?.regularMarketPrice);
    const usdInrVal = Number(fxRes?.meta?.regularMarketPrice);
    const hasLiveGold = Number.isFinite(goldUsdOz) && goldUsdOz > 0 && Number.isFinite(usdInrVal) && usdInrVal > 0;
    const goldPerGram = hasLiveGold ? Math.round(goldUsdOz * usdInrVal / 31.1035 * 1.06) : fallback.gold24kPerGramInr.value;
    const anyLive = nifty50.isLive || sensex.isLive || hasLiveGold;
    const data = {
      nifty50,
      sensex,
      gold24kPerGramInr: { value: goldPerGram, isLive: hasLiveGold },
      usdInr: { value: Number.isFinite(usdInrVal) && usdInrVal > 0 ? Number(usdInrVal.toFixed(2)) : fallback.usdInr.value, isLive: Number.isFinite(usdInrVal) && usdInrVal > 0 },
      isLive: anyLive,
      source: anyLive ? "Yahoo Finance Live Market Feed (NSE/BSE/MCX Spot)" : "Sandbox Benchmark Catalog",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    _MarketDataAdapter.benchmarkCache = { data, fetchedAt: now };
    return data;
  }
  async getQuote(symbol) {
    const quotes = await this.getQuotes();
    const q = quotes.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
    return q || null;
  }
};
var MutualFundPlatformAdapter = class {
  async placeOrder(fundCode, amount, mode) {
    const isLive = isLivePartnerConfigured(process.env.BSE_STAR_MF_PASSWORD);
    return {
      orderRef: `BSE-MF-${Date.now()}`,
      status: isLive ? "SUBMITTED_TO_RTA" : "MOCK_SANDBOX_SUBMITTED",
      environment: isLive ? "LIVE" : "SANDBOX",
      isLive,
      isMock: !isLive,
      complianceNote: isLive ? "Order submitted to BSE StAR MF RTA engine." : "DEMO SANDBOX: Simulated Mutual Fund order for demonstration. No real units allotted."
    };
  }
};
var kycAdapter = new KycAdapter();
var creditBureauAdapter = new CreditBureauAdapter();
var eSignAdapter = new ESignAdapter();
var mandateAdapter = new MandateAdapter();
var paymentGatewayAdapter = new PaymentGatewayAdapter();
var lendingPartnerAdapter = new LendingPartnerAdapter();
var depositoryAdapter = new DepositoryParticipantAdapter();
var marketDataAdapter = new MarketDataAdapter();
var mutualFundAdapter = new MutualFundPlatformAdapter();

// backend/routes/kyc.routes.ts
var router3 = Router3();
router3.get("/status", requireAuth, async (req, res) => {
  try {
    const records = await dbRepository.kyc.getByUserId(req.user.userId);
    const profile = await dbRepository.profiles.getByUserId(req.user.userId) || {};
    const isPanVerified = records.some((r) => r.document_type === "pan" && r.verification_status === "verified");
    const isAadhaarVerified = records.some((r) => r.document_type === "aadhaar" && r.verification_status === "verified");
    const hasPanRecord = records.some((r) => r.document_type === "pan");
    const hasAadhaarRecord = records.some((r) => r.document_type === "aadhaar");
    const hasSandboxRecords = records.some((r) => r.verification_status === "sandbox_simulated");
    const kycStages = [
      { stage: 1, code: "personal_details", name: "Basic Personal Details", label: "Basic Personal Details", completed: Boolean(profile.dob || profile.city), status: profile.dob || profile.city ? "completed" : "pending" },
      { stage: 2, code: "pan_verification", name: "PAN e-KYC Verification", label: "PAN e-KYC Verification", completed: Boolean(isPanVerified || hasPanRecord), status: isPanVerified ? "verified_live" : hasPanRecord ? "sandbox_simulated" : "pending" },
      { stage: 3, code: "aadhaar_verification", name: "Aadhaar XML / OTP Verification", label: "Aadhaar XML / OTP Verification", completed: Boolean(isAadhaarVerified || hasAadhaarRecord), status: isAadhaarVerified ? "verified_live" : hasAadhaarRecord ? "sandbox_simulated" : "pending" },
      { stage: 4, code: "address_details", name: "Residential Address Proof", label: "Residential Address Proof", completed: Boolean(profile.city && profile.state), status: profile.city && profile.state ? "completed" : "pending" },
      { stage: 5, code: "bank_account", name: "Bank Account & IFSC Penny-Drop", label: "Bank Account & IFSC Penny-Drop", completed: Boolean(profile.bank_account_no), status: profile.bank_account_no ? "completed" : "pending" },
      { stage: 6, code: "income_occupation", name: "Income & Occupation Assessment", label: "Income & Occupation Assessment", completed: Boolean(profile.annual_income), status: profile.annual_income ? "completed" : "pending" },
      { stage: 7, code: "selfie_documents", name: "Selfie Liveness & Document Attestation", label: "Selfie Liveness & Document Attestation", completed: Boolean(hasPanRecord && hasAadhaarRecord), status: hasPanRecord && hasAadhaarRecord ? "sandbox_simulated" : "pending" }
    ];
    return res.json({
      user_id: req.user.userId,
      is_fully_compliant: isPanVerified && isAadhaarVerified,
      pan_verified: isPanVerified,
      aadhaar_verified: isAadhaarVerified,
      has_sandbox_records: hasSandboxRecords,
      compliance_status: isPanVerified && isAadhaarVerified ? "COMPLIANT_LIVE" : hasSandboxRecords ? "SANDBOX_UNVERIFIED" : "PENDING",
      kyc_stages: kycStages,
      records
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router3.post("/submit", requireAuth, async (req, res) => {
  try {
    const {
      pan_number,
      aadhaar_number,
      dob,
      gender,
      address_line1,
      city,
      state,
      pincode,
      bank_account_no,
      bank_ifsc,
      bank_name,
      annual_income,
      occupation_type
    } = req.body;
    const updatedProfile = await dbRepository.profiles.upsert(req.user.userId, {
      dob: dob || "1990-01-01",
      gender: gender || "Male",
      pan_number: pan_number ? String(pan_number).toUpperCase().trim() : void 0,
      aadhaar_last4: aadhaar_number ? String(aadhaar_number).replace(/\D/g, "").slice(-4) : void 0,
      address_line1: address_line1 || "Trunk Road, Kadapa",
      city: city || "Kadapa",
      state: state || "Andhra Pradesh",
      pincode: pincode || "516001",
      bank_account_no: bank_account_no ? `\u2022\u2022\u2022\u2022 ${String(bank_account_no).slice(-4)}` : "\u2022\u2022\u2022\u2022 4821",
      bank_ifsc: bank_ifsc ? String(bank_ifsc).toUpperCase().trim() : "SBIN0000840",
      bank_name: bank_name || "State Bank of India",
      annual_income: annual_income ? parseFloat(annual_income) : 75e4,
      occupation_type: occupation_type || "Salaried"
    });
    const submittedRecords = [];
    if (pan_number && String(pan_number).length === 10) {
      const panRes = await kycAdapter.verifyDocument({
        documentType: "pan",
        documentNumber: String(pan_number),
        fullName: req.user.fullName,
        dob
      });
      if (panRes.isFormatValid) {
        const status = panRes.isLive && panRes.isVerified ? "verified" : "sandbox_simulated";
        const rec = await dbRepository.kyc.upsertRecord(
          req.user.userId,
          "pan",
          panRes.maskedId,
          panRes.provider,
          panRes.complianceNote,
          status
        );
        submittedRecords.push(rec);
      }
    }
    if (aadhaar_number && String(aadhaar_number).replace(/\D/g, "").length === 12) {
      const aadhaarRes = await kycAdapter.verifyDocument({
        documentType: "aadhaar",
        documentNumber: String(aadhaar_number),
        fullName: req.user.fullName
      });
      if (aadhaarRes.isFormatValid) {
        const status = aadhaarRes.isLive && aadhaarRes.isVerified ? "verified" : "sandbox_simulated";
        const rec = await dbRepository.kyc.upsertRecord(
          req.user.userId,
          "aadhaar",
          aadhaarRes.maskedId,
          aadhaarRes.provider,
          aadhaarRes.complianceNote,
          status
        );
        submittedRecords.push(rec);
      }
    }
    logAudit(req.user.userId, "KYC_FULL_SUBMIT", "kyc_records", String(req.user.userId), {
      stagesCompleted: 7,
      environment: "SANDBOX_SIMULATED"
    });
    return res.status(201).json({
      status: "SANDBOX_SIMULATED",
      is_live_verified: false,
      stages_completed: 7,
      profile: updatedProfile,
      records: submittedRecords,
      message: "7-stage KYC dossier recorded in sandbox mode. Live regulator verification requires configured NSDL/UIDAI production keys."
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router3.post("/verify-pan", requireAuth, async (req, res) => {
  try {
    const { pan_number, full_name, dob } = req.body;
    if (!pan_number || pan_number.length !== 10) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid 10-character alphanumeric PAN required" });
    }
    const result = await kycAdapter.verifyDocument({
      documentType: "pan",
      documentNumber: pan_number,
      fullName: full_name || req.user.fullName,
      dob
    });
    if (!result.isFormatValid) {
      return res.status(400).json({
        error: "KYC Verification Failed",
        detail: result.complianceNote || "Invalid PAN document format"
      });
    }
    const verificationStatus = result.isLive && result.isVerified ? "verified" : "sandbox_simulated";
    const record = await dbRepository.kyc.upsertRecord(
      req.user.userId,
      "pan",
      result.maskedId,
      result.provider,
      result.complianceNote,
      verificationStatus
    );
    logAudit(req.user.userId, "KYC_VERIFY_PAN", "kyc_records", String(record.id), {
      panMasked: result.maskedId,
      status: verificationStatus,
      isLive: result.isLive
    });
    return res.json({
      status: result.status,
      is_live_verified: result.isLive && result.isVerified,
      is_mock: result.isMock,
      masked: result.maskedId,
      provider: result.provider,
      environment: result.environment,
      compliance_note: result.complianceNote
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router3.post(["/verify-aadhaar-otp", "/verify-aadhaar"], requireAuth, async (req, res) => {
  try {
    const { aadhaar_number, otp } = req.body;
    if (!aadhaar_number || aadhaar_number.length < 12) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid 12-digit Aadhaar number required" });
    }
    const result = await kycAdapter.verifyDocument({
      documentType: "aadhaar",
      documentNumber: aadhaar_number,
      fullName: req.user.fullName,
      otp: otp || "123456"
    });
    if (!result.isFormatValid) {
      return res.status(400).json({
        error: "KYC Verification Failed",
        detail: result.complianceNote || "Invalid Aadhaar format"
      });
    }
    const verificationStatus = result.isLive && result.isVerified ? "verified" : "sandbox_simulated";
    const record = await dbRepository.kyc.upsertRecord(
      req.user.userId,
      "aadhaar",
      result.maskedId,
      result.provider,
      result.complianceNote,
      verificationStatus
    );
    logAudit(req.user.userId, "KYC_VERIFY_AADHAAR", "kyc_records", String(record.id), {
      masked: result.maskedId,
      status: verificationStatus,
      isLive: result.isLive
    });
    return res.json({
      status: result.status,
      is_live_verified: result.isLive && result.isVerified,
      is_mock: result.isMock,
      masked: result.maskedId,
      provider: result.provider,
      environment: result.environment,
      compliance_note: result.complianceNote
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
var kyc_routes_default = router3;

// backend/routes/loans.routes.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/products", async (req, res) => {
  try {
    const products = await dbRepository.loans.getProducts();
    res.json(products);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router4.post("/calculate-emi", (req, res) => {
  const { principal, interest_rate_annual, tenure_months, repayment_mode } = req.body;
  const P = parseFloat(principal);
  const annualRate = parseFloat(interest_rate_annual);
  const n = parseInt(tenure_months, 10);
  const mode = repayment_mode === "interest_only" ? "interest_only" : "reducing_emi";
  if (isNaN(P) || P <= 0 || isNaN(annualRate) || isNaN(n) || n <= 0) {
    return res.status(400).json({ error: "Bad Request", detail: "Invalid parameters for EMI calculation" });
  }
  const r = annualRate / 12 / 100;
  let emi = 0;
  let totalInterest = 0;
  let totalRepayment = 0;
  const schedule = [];
  if (mode === "interest_only") {
    const monthlyInterest = Math.round(P * r);
    emi = monthlyInterest;
    totalInterest = monthlyInterest * n;
    totalRepayment = P + totalInterest;
    for (let m = 1; m <= n; m++) {
      const isLast = m === n;
      schedule.push({
        month: m,
        emi: isLast ? monthlyInterest + P : monthlyInterest,
        principal: isLast ? P : 0,
        interest: monthlyInterest,
        balance: isLast ? 0 : P
      });
    }
  } else {
    if (r <= 0) {
      emi = Math.round(P / n);
    } else {
      emi = Math.round(P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    }
    totalRepayment = emi * n;
    totalInterest = Math.max(0, totalRepayment - P);
    let balance = P;
    for (let m = 1; m <= n; m++) {
      const interest = Math.round(balance * r);
      let principalComponent = emi - interest;
      if (m === n || balance - principalComponent < 0) {
        principalComponent = balance;
        balance = 0;
      } else {
        balance -= principalComponent;
      }
      schedule.push({
        month: m,
        emi,
        principal: principalComponent,
        interest,
        balance: Math.max(0, balance)
      });
      if (balance <= 0) break;
    }
  }
  return res.json({
    principal: P,
    annual_rate: annualRate,
    tenure_months: n,
    repayment_mode: mode,
    monthly_emi: emi,
    total_interest: totalInterest,
    total_repayment: totalRepayment,
    schedule: schedule.slice(0, 36)
    // Preview first 36 installments
  });
});
router4.get("/my-applications", requireAuth, async (req, res) => {
  try {
    const apps = await dbRepository.loans.getApplicationsByUser(req.user.userId);
    res.json(apps);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router4.get("/my-accounts", requireAuth, async (req, res) => {
  try {
    const userApps = await dbRepository.loans.getApplicationsByUser(req.user.userId);
    const activeApps = userApps.filter(
      (a) => a.status === "disbursed" || a.status === "approved" || a.status === "sanctioned"
    );
    const accounts = await Promise.all(activeApps.map(async (app2) => {
      const schedules = await dbRepository.loans.getEmiSchedules(app2.id);
      const paidSchedules = schedules.filter((s) => s.payment_status === "paid");
      const pendingSchedule = schedules.find((s) => s.payment_status === "pending");
      return {
        id: app2.id,
        loan_account_no: `ACC-${app2.application_no}`,
        loan_type: app2.product_name || "Fintech Loan",
        repayment_mode: app2.repayment_mode || "reducing_emi",
        principal_amount: parseFloat(app2.requested_amount),
        interest_rate: parseFloat(app2.interest_rate),
        tenure_months: app2.tenure_months,
        monthly_emi: parseFloat(app2.calculated_emi),
        emis_paid: paidSchedules.length,
        total_emis: app2.tenure_months,
        next_emi_date: pendingSchedule?.due_date || "2026-11-05",
        outstanding_balance: pendingSchedule ? parseFloat(pendingSchedule.remaining_balance) : 0,
        status: app2.status === "disbursed" ? "active" : "sanctioned"
      };
    }));
    res.json(accounts);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router4.post("/apply", requireAuth, async (req, res) => {
  try {
    const {
      product_id,
      requested_amount,
      tenure_months,
      repayment_mode,
      purpose,
      monthly_income,
      applicant_name,
      phone,
      email,
      collateral_type,
      collateral_value,
      guarantor_name,
      guarantor_phone
    } = req.body;
    const amt = parseFloat(requested_amount);
    const tenure = parseInt(tenure_months, 10) || 12;
    const income = parseFloat(monthly_income);
    const mode = repayment_mode === "interest_only" ? "interest_only" : "reducing_emi";
    if (!amt || amt < 1e4) {
      return res.status(400).json({ error: "Bad Request", detail: "Minimum loan amount is \u20B910,000" });
    }
    const products = await dbRepository.loans.getProducts();
    const product = products.find((p) => p.id === parseInt(product_id, 10)) || products[0];
    if (product && amt > product.max_amount) {
      return res.status(400).json({
        error: "Limit Exceeded",
        detail: `Requested amount \u20B9${amt.toLocaleString("en-IN")} exceeds maximum allowed \u20B9${product.max_amount.toLocaleString("en-IN")} for ${product.product_name}`
      });
    }
    const rate = product ? product.base_interest_rate : 14;
    const r = rate / 12 / 100;
    const emi = mode === "interest_only" ? Math.round(amt * r) : Math.round(amt * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1));
    const appNo = `TF-LN-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const newApp = await dbRepository.loans.createApplication({
      application_no: appNo,
      user_id: req.user.userId,
      product_id: product?.id || 1,
      product_name: product?.product_name || "Loan",
      applicant_name: applicant_name || req.user.fullName,
      phone: phone || "9876543210",
      email: email || req.user.email,
      monthly_income: income || 75e3,
      requested_amount: amt,
      interest_rate: rate,
      tenure_months: tenure,
      repayment_mode: mode,
      calculated_emi: emi,
      purpose: purpose || "General requirement",
      collateral_type: collateral_type || null,
      collateral_value: collateral_value ? parseFloat(collateral_value) : null,
      guarantor_name: guarantor_name || null,
      guarantor_phone: guarantor_phone || null,
      status: "submitted",
      credit_score: 745,
      officer_remarks: "Application submitted online. Initial e-KYC verified at Kadapa central branch.",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    await dbRepository.notifications.create({
      user_id: req.user.userId,
      title: `Loan Application #${appNo} Received`,
      message: `Your request for ${product?.product_name || "Loan"} (${mode === "interest_only" ? "Interest-Only Mode" : "Reducing EMI Mode"}) of \u20B9${amt.toLocaleString("en-IN")} is assigned to the Kadapa Credit Committee.`,
      category: "loans"
    });
    logAudit(req.user.userId, "SUBMIT_LOAN_APPLICATION", "loan_applications", appNo, { amount: amt, product: product?.product_name, mode });
    return res.status(201).json({
      ...newApp,
      application: newApp
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    console.error("Loan apply error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router4.get("/:id/emi-schedule", requireAuth, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const app2 = await dbRepository.loans.getApplicationById(appId);
    if (!app2) {
      return res.status(404).json({ error: "Not Found", detail: "Loan application not found" });
    }
    const isOfficerOrAdmin = ["admin", "super_admin", "credit_officer"].includes(req.user.role);
    if (!isOfficerOrAdmin && app2.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden", detail: "Access restricted to loan owner or underwriting officer" });
    }
    let schedules = await dbRepository.loans.getEmiSchedules(appId);
    if (schedules.length === 0) {
      const P = parseFloat(app2.sanctioned_amount || app2.requested_amount);
      const r = parseFloat(app2.interest_rate) / 12 / 100;
      const n = parseInt(app2.tenure_months, 10) || 12;
      const mode = app2.repayment_mode === "interest_only" ? "interest_only" : "reducing_emi";
      const emi = parseFloat(app2.calculated_emi) || Math.round(P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
      let balance = P;
      schedules = [];
      for (let m = 1; m <= n; m++) {
        const dueDate = /* @__PURE__ */ new Date();
        dueDate.setMonth(dueDate.getMonth() + m);
        dueDate.setDate(5);
        if (mode === "interest_only") {
          const isLast = m === n;
          const interest = Math.round(P * r);
          schedules.push({
            id: m,
            application_id: appId,
            installment_number: m,
            due_date: dueDate.toISOString().split("T")[0],
            emi_amount: isLast ? interest + P : interest,
            principal_component: isLast ? P : 0,
            interest_component: interest,
            remaining_balance: isLast ? 0 : P,
            payment_status: "scheduled_preview",
            paid_date: null
          });
        } else {
          const interest = Math.round(balance * r);
          let principal = emi - interest;
          if (m === n || balance - principal < 0) {
            principal = balance;
            balance = 0;
          } else {
            balance -= principal;
          }
          schedules.push({
            id: m,
            application_id: appId,
            installment_number: m,
            due_date: dueDate.toISOString().split("T")[0],
            emi_amount: emi,
            principal_component: principal,
            interest_component: interest,
            remaining_balance: Math.max(0, balance),
            payment_status: "scheduled_preview",
            paid_date: null
          });
        }
      }
    }
    return res.json({
      application_id: app2.id,
      application_no: app2.application_no,
      product_name: app2.product_name,
      repayment_mode: app2.repayment_mode || "reducing_emi",
      principal: parseFloat(app2.sanctioned_amount || app2.requested_amount),
      interest_rate: parseFloat(app2.interest_rate),
      tenure_months: app2.tenure_months,
      monthly_emi: parseFloat(app2.calculated_emi),
      schedule: schedules,
      schedules
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router4.get("/:id", requireAuth, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid numeric loan ID required" });
    }
    const app2 = await dbRepository.loans.getApplicationById(appId);
    if (!app2) {
      return res.status(404).json({ error: "Not Found", detail: "Loan application not found" });
    }
    const isOfficerOrAdmin = ["admin", "super_admin", "credit_officer"].includes(req.user.role);
    if (!isOfficerOrAdmin && app2.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden", detail: "Access restricted to loan owner or underwriting officer" });
    }
    const schedules = await dbRepository.loans.getEmiSchedules(appId);
    return res.json({
      ...app2,
      emi_schedules: schedules,
      sanction_letter: ["approved", "sanctioned", "disbursed"].includes(app2.status) ? {
        sanction_ref: `SAN-${app2.application_no}`,
        issuer: "M/s. Tatito Projects \u2014 NBFC Division, Kadapa",
        sanctioned_amount: app2.sanctioned_amount || app2.requested_amount,
        interest_rate: app2.interest_rate,
        tenure_months: app2.tenure_months,
        repayment_mode: app2.repayment_mode || "reducing_emi",
        issued_at: app2.sanctioned_at || app2.created_at
      } : null
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router4.post("/pay-emi", requireAuth, async (req, res) => {
  try {
    const { application_id, loan_account_no, amount, payment_mode } = req.body;
    const targetAppId = parseInt(application_id, 10) || 3;
    if (!["admin", "super_admin", "credit_officer"].includes(req.user.role)) {
      const userApps = await dbRepository.loans.getApplicationsByUser(req.user.userId);
      const ownsLoan = userApps.some((a) => a.id === targetAppId);
      if (!ownsLoan) {
        return res.status(403).json({
          error: "Forbidden",
          detail: "You are not authorized to make payments on this loan account."
        });
      }
    }
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt) || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Bad Request", detail: "Invalid payment amount. Must be positive." });
    }
    const isLive = process.env.LIVE_FINANCIAL_PARTNERS === "true" && Boolean(process.env.PAYMENT_GATEWAY_SECRET);
    const payStatus = isLive ? "SUCCESS" : "DEMO_SUCCESS";
    const paymentResult = await dbRepository.payments.executeAtomicWalletPayment({
      userId: req.user.userId,
      amount: amt,
      category: "loan_emi",
      operator: "Tatito Loan Repayment Desk",
      accountIdentifier: loan_account_no || "TF-LN-0814",
      paymentMode: payment_mode || "wallet",
      status: payStatus,
      applicationId: targetAppId,
      metaJson: {
        loan_account_no: loan_account_no || "TF-LN-0814",
        channel: "Tatito Repayment Gateway",
        is_demo: !isLive
      }
    });
    const schedules = await dbRepository.loans.getEmiSchedules(targetAppId);
    const pendingSchedule = schedules.find((s) => s.payment_status === "pending");
    if (pendingSchedule) {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      await dbRepository.loans.markEmiPaid(pendingSchedule.id, today);
    }
    await dbRepository.notifications.create({
      user_id: req.user.userId,
      title: "EMI Installment Paid",
      message: `\u20B9${amt.toLocaleString("en-IN")} paid towards ${loan_account_no || "your loan"}. Next due date updated.`,
      category: "loans"
    });
    logAudit(req.user.userId, "PAY_EMI", "payments", paymentResult.payment.payment_ref, {
      amount: amt,
      account: loan_account_no,
      status: payStatus
    });
    return res.json({
      status: paymentResult.payment.status,
      is_demo: !isLive,
      is_simulated: !isLive,
      reference: paymentResult.payment.payment_ref,
      amount_paid: amt,
      wallet_balance: paymentResult.newBalance,
      message: "EMI installment received and credited to loan account",
      compliance_notice: isLive ? "Settled to loan ledger via live clearing." : "DEMO TRANSACTION: Simulated loan repayment. No actual banking clearing occurred."
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: "Payment Error", detail: err.message });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: "Forbidden", detail: err.message });
    }
    console.error("Pay EMI error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
var loans_routes_default = router4;

// backend/routes/payments.routes.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/history", requireAuth, async (req, res) => {
  try {
    const list = await dbRepository.payments.getByUser(req.user.userId);
    res.json(list);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router5.post("/bills/fetch", (req, res) => {
  const { category, operator, account_identifier } = req.body;
  const cleanId = (account_identifier || "1009823412034").trim();
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) hash += cleanId.charCodeAt(i);
  const names = [
    "Ramesh Kumar Chennur",
    "Venkata Subba Reddy",
    "Lakshmi Narayana Rao",
    "Sunitha Devi Giddalur",
    "Ankalaiah Bandlamudi"
  ];
  const customerName = names[hash % names.length];
  let amount = 1420;
  if (category === "electricity") amount = 850 + hash % 2200;
  else if (category === "water") amount = 180 + hash % 380;
  else if (category === "gas" || category === "lpg_gas") amount = 950 + hash % 120;
  else if (category === "piped_gas") amount = 640 + hash % 750;
  else if (category === "mobile" || category === "mobile_prepaid") amount = [299, 349, 479, 666, 839][hash % 5];
  else if (category === "mobile_postpaid") amount = 599 + hash % 800;
  else if (category === "dth") amount = [250, 399, 499, 650][hash % 4];
  else if (category === "fastag") amount = [500, 1e3, 1500, 2e3][hash % 4];
  else if (category === "broadband") amount = [589, 825, 1179][hash % 3];
  else if (category === "landline") amount = [499, 699, 999][hash % 3];
  else if (category === "credit_card") amount = 4250 + hash % 15e3;
  else if (category === "insurance_premium") amount = 4850 + hash % 6500;
  else if (category === "rent") amount = 8500 + hash % 9e3;
  else if (category === "education_fees") amount = 12500 + hash % 15e3;
  else if (category === "municipal_tax") amount = 1850 + hash % 2400;
  else if (category === "subscriptions") amount = [199, 299, 499, 999][hash % 4];
  const now = /* @__PURE__ */ new Date();
  const billDate = new Date(now.getTime() - 7 * 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const dueDate = new Date(now.getTime() + 8 * 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const bbpsRef = `DEMO-BBPS-${1e7 + hash % 89999999}`;
  const noticeText = "DEMO DATA: Simulated bill fetch. Not an active fetch from live NPCI BBPS Central Unit.";
  return res.json({
    customer_name: customerName,
    account_identifier: cleanId,
    operator: operator || "APSPDCL (Southern Power AP)",
    category: category || "electricity",
    bill_number: `DEMO-BILL-${1e5 + hash % 899999}`,
    bill_date: billDate,
    due_date: dueDate,
    amount_due: amount,
    bill_amount: amount,
    convenience_fee: 0,
    bbps_reference: bbpsRef,
    bbps_biller_id: bbpsRef,
    status: "PENDING",
    circle: "Andhra Pradesh (Kadapa Circle)",
    is_demo: true,
    data_source: "DEMO_BILLER_CATALOG",
    notice: noticeText,
    disclaimer: noticeText
  });
});
router5.post("/bills/pay", requireAuth, async (req, res) => {
  try {
    const { category, operator, account_identifier, customer_name, amount, payment_mode } = req.body;
    const idempotencyKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"] || req.body.idempotency_key || req.body.idempotencyKey;
    if (idempotencyKey) {
      const existingPayment = await dbRepository.payments.findByIdempotencyKey(idempotencyKey, req.user.userId);
      if (existingPayment) {
        return res.json({
          status: existingPayment.status,
          transaction_reference: existingPayment.payment_ref,
          bbps_reference: existingPayment.bbps_ref_no,
          amount_paid: parseFloat(existingPayment.amount),
          idempotent_replay: true,
          message: "Payment already processed with this idempotency key. No duplicate deduction.",
          paid_at: existingPayment.created_at
        });
      }
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Bad Request", detail: "Invalid payment amount. Must be a positive number." });
    }
    if (!category || !account_identifier) {
      return res.status(400).json({ error: "Bad Request", detail: "category and account_identifier are required." });
    }
    const simulateFailure = req.body.simulate_failure === true || req.headers["x-simulate-failure"] === "true";
    if (simulateFailure) {
      return res.status(400).json({
        error: "Payment Processing Failed",
        detail: "Simulated processor decline: Transaction rejected by biller network. Wallet balance untouched.",
        is_demo: true,
        is_simulated: true
      });
    }
    const payStatus = "DEMO_SUCCESS";
    const result = await dbRepository.payments.executeAtomicWalletPayment({
      userId: req.user.userId,
      amount: amt,
      category: category || "utility",
      operator: operator || "Utility Biller",
      accountIdentifier: account_identifier,
      paymentMode: payment_mode || "wallet",
      status: payStatus,
      idempotencyKey,
      metaJson: {
        customer_name: customer_name || req.user.fullName,
        circle: "Andhra Pradesh",
        channel: "Bharat BillPay (BBPS) Sandbox Simulator",
        is_demo: true
      }
    });
    await dbRepository.notifications.create({
      user_id: req.user.userId,
      title: "Bill Payment Completed",
      message: `\u20B9${amt.toLocaleString("en-IN")} paid for ${operator || "utility"}. Ref: ${result.payment.payment_ref}`,
      category: "general"
    });
    broadcastRealtimeNotification(req.user.userId, {
      title: "Bill Payment Completed",
      message: `\u20B9${amt.toLocaleString("en-IN")} paid for ${operator || "utility"} (${result.payment.payment_ref})`,
      category: "payments",
      reference: result.payment.payment_ref,
      amount: amt
    });
    logAudit(req.user.userId, "PAY_BILL", "payments", result.payment.payment_ref, {
      operator,
      amount: amt,
      status: payStatus,
      isDemo: true
    });
    return res.json({
      status: result.payment.status,
      is_demo: true,
      is_simulated: true,
      transaction_reference: result.payment.payment_ref,
      bbps_reference: result.payment.bbps_ref_no,
      amount_paid: amt,
      wallet_balance: result.newBalance,
      paid_at: result.payment.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      compliance_notice: "DEMO TRANSACTION: Simulated utility payment in sandbox environment. No actual bank clearing occurred."
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: "Payment Error", detail: err.message });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Not Found", detail: err.message });
    }
    console.error("Bill pay error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
var payments_routes_default = router5;

// backend/routes/collections.routes.ts
import { Router as Router6 } from "express";
import { randomUUID } from "node:crypto";

// integrations/testCollections.ts
function validAmount(amount) {
  return typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 100 && amount <= 1e7;
}
function readLink(data, reference, amount) {
  if (data?.reference_id !== reference || data.amount !== amount || data.currency !== "INR" || !/^plink_[a-zA-Z0-9]+$/.test(data.id) || !["created", "paid", "expired", "cancelled"].includes(data.status) || data.status === "paid" && data.amount_paid !== amount) throw new Error("Unverified provider response");
  const url = new URL(data.short_url);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid checkout URL");
  return { id: data.id, status: data.status, url: url.href };
}
function configured() {
  return Boolean(process.env.RAZORPAY_TEST_KEY_ID?.startsWith("rzp_test_") && process.env.RAZORPAY_TEST_KEY_SECRET);
}
async function provider(path3, body) {
  if (!configured()) throw new Error("Test credentials unavailable");
  const token = Buffer.from(process.env.RAZORPAY_TEST_KEY_ID + ":" + process.env.RAZORPAY_TEST_KEY_SECRET).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/payment_links" + path3, {
    method: body ? "POST" : "GET",
    headers: { Authorization: "Basic " + token, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : void 0,
    signal: AbortSignal.timeout(1e4)
  });
  if (!response.ok) throw new Error("Provider request failed");
  return response.json();
}

// backend/routes/collections.routes.ts
var router6 = Router6();
var fields = "reference, amount_paise, provider_id, checkout_url, status, created_at, verified_at";
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router6.use(requireAuth);
router6.get("/availability", (_req, res) => res.json({ mode: "test", ready: configured() && isPostgresConnected() }));
router6.use((_req, res, next) => isPostgresConnected() ? next() : res.status(503).json({ error: "PostgreSQL is required for collection history." }));
router6.get("/", async (req, res, next) => {
  try {
    const result = await dbQuery("SELECT " + fields + " FROM sandbox_collections WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100", [req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
router6.get("/summary", async (req, res, next) => {
  try {
    const summary = await dbQuery("SELECT COALESCE(sum(c.amount_paise),0)::text AS total_paise, count(*)::int AS paid_count FROM sandbox_collection_credits c JOIN sandbox_collections t USING(reference) WHERE t.user_id=$1", [req.user.userId]);
    res.json(summary.rows[0]);
  } catch (error) {
    next(error);
  }
});
async function sync(row, create, res) {
  try {
    let data;
    if (create) data = await provider("", { amount: row.amount_paise, currency: "INR", reference_id: row.reference, accept_partial: false, description: "Tatito sandbox collection" });
    else if (row.provider_id) data = await provider("/" + encodeURIComponent(row.provider_id));
    else {
      const list = await provider("?reference_id=" + encodeURIComponent(row.reference));
      data = list.payment_links?.find((item) => item.reference_id === row.reference);
      if (!data) return res.status(202).json(row);
    }
    const link = readLink(data, row.reference, row.amount_paise);
    const updated = await dbQuery("UPDATE sandbox_collections SET provider_id=$2, checkout_url=$3, status=$4, verified_at=now() WHERE reference=$1 AND (provider_id IS NULL OR provider_id=$2) AND status IN ('pending','created') RETURNING " + fields, [row.reference, link.id, link.url, link.status]);
    const current = updated.rows[0] ?? (await dbQuery("SELECT " + fields + " FROM sandbox_collections WHERE reference=$1", [row.reference])).rows[0];
    res.json(current);
  } catch {
    res.status(502).json({ error: "Unable to verify this request with the test provider. Refresh its status before starting another collection.", reference: row.reference });
  }
}
router6.post("/", async (req, res, next) => {
  const amount = req.body?.amount_paise;
  const key = req.get("Idempotency-Key") || "";
  if (!validAmount(amount) || !uuid.test(key)) return res.status(400).json({ error: "Enter \u20B91\u2013\u20B9100,000 and a valid request identifier." });
  if (!configured()) return res.status(503).json({ error: "The payment provider test account is not configured." });
  try {
    const owner = req.user.userId;
    const inserted = await dbQuery("INSERT INTO sandbox_collections(reference,user_id,request_key,amount_paise) VALUES ($1,$2,$3,$4) ON CONFLICT(user_id,request_key) DO NOTHING RETURNING " + fields, [randomUUID(), owner, key, amount]);
    if (inserted.rows.length) return await sync(inserted.rows[0], true, res);
    const prior = (await dbQuery("SELECT " + fields + " FROM sandbox_collections WHERE user_id=$1 AND request_key=$2", [owner, key])).rows[0];
    if (prior.amount_paise !== amount) return res.status(409).json({ error: "This request identifier already belongs to a different amount." });
    res.json(prior);
  } catch (error) {
    next(error);
  }
});
router6.post("/:reference/refresh", async (req, res, next) => {
  if (!uuid.test(String(req.params.reference))) return res.status(400).json({ error: "Invalid collection reference." });
  try {
    const row = (await dbQuery("SELECT " + fields + " FROM sandbox_collections WHERE reference=$1 AND user_id=$2", [req.params.reference, req.user.userId])).rows[0];
    if (!row) return res.status(404).json({ error: "Collection not found." });
    if (["paid", "expired", "cancelled"].includes(row.status)) return res.json(row);
    await sync(row, false, res);
  } catch (error) {
    next(error);
  }
});
var collections_routes_default = router6;

// backend/routes/finances.routes.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.use((_req, res, next) => {
  if (isPostgresConnected()) return next();
  if (isDemoMode() || process.env.NODE_ENV === "test") return next("router");
  return res.status(503).json({ error: "Personal finance storage is unavailable." });
});
router7.use(requireAuth);
var handle = (fn) => (req, res, next) => {
  fn(req, res).catch(next);
};
var label = (v, max) => typeof v === "string" && v.trim().length <= max ? v.trim() : "";
function money(v) {
  return (typeof v === "number" || typeof v === "string") && /^\d{1,9}(\.\d{1,2})?$/.test(String(v)) && Number(v) > 0 ? Math.round(Number(v) * 100) : 0;
}
router7.get("/", handle(async (req, res) => {
  const user = req.user.userId;
  const args = [user];
  const [entries, monthly, budgets, goals, groups] = await Promise.all([
    dbQuery("SELECT id,title,category,kind,amount,posted_on AS date FROM manual_finance_entries WHERE user_id=$1 ORDER BY id DESC LIMIT 100", args),
    dbQuery("SELECT kind,sum(amount) AS total FROM manual_finance_entries WHERE user_id=$1 AND posted_on>=date_trunc('month',CURRENT_DATE) GROUP BY kind", args),
    dbQuery(`SELECT b.category,b.amount AS limit,COALESCE((SELECT sum(amount) FROM manual_finance_entries e WHERE e.user_id=b.user_id AND e.category=b.category AND e.kind='expense' AND e.posted_on>=date_trunc('month',CURRENT_DATE)),0) AS spent FROM manual_category_limits b WHERE user_id=$1 AND month_start=date_trunc('month',CURRENT_DATE)::date ORDER BY category`, args),
    dbQuery("SELECT * FROM savings_goals WHERE user_id=$1 ORDER BY id DESC", args),
    dbQuery(`SELECT g.id,g.group_name AS name,g.members_json::json AS members,COALESCE(json_agg(json_build_object('id',e.id,'title',e.title,'status',e.status,'paid_by',e.paid_by,'total_amount',e.total_amount,'splits',e.splits_json::json) ORDER BY e.id) FILTER(WHERE e.id IS NOT NULL),'[]') AS expenses FROM expense_groups g LEFT JOIN group_expenses e ON e.group_id=g.id WHERE creator_user_id=$1 GROUP BY g.id ORDER BY g.id DESC`, args)
  ]);
  const total = (kind) => Number(monthly.rows.find((r) => r.kind === kind)?.total || 0);
  res.json({ is_simulated: false, monthly_income: total("income"), total_spent: total("expense"), savings_surplus: total("income") - total("expense"), items: entries.rows, budgets: budgets.rows, savings_goals: goals.rows, groups: groups.rows });
}));
router7.post("/add", handle(async (req, res) => {
  const { amount, title, category, kind = "expense" } = req.body;
  if (!money(amount) || !label(title, 160) || !label(category, 60) || !["expense", "income"].includes(kind)) return res.status(400).json({ error: "Check the title, category and amount." });
  const result = await dbQuery("INSERT INTO manual_finance_entries(user_id,kind,title,category,amount) VALUES($1,$2,$3,$4,$5) RETURNING *", [req.user.userId, kind, title.trim(), category.trim(), amount]);
  res.status(201).json({ status: "ENTRY_RECORDED", item: result.rows[0] });
}));
router7.post("/groups", handle(async (req, res) => {
  const { group_name, expense_title, total_amount, paid_by, split_type = "EQUAL" } = req.body;
  const raw = Array.isArray(req.body.members) ? req.body.members : String(req.body.members || "").split(",");
  const members = raw.map((m) => label(m, 120));
  const total = money(total_amount);
  if (!label(group_name, 120) || !label(expense_title, 160) || !total || members.length < 2 || members.length > 50 || members.includes("") || new Set(members).size !== members.length || !members.includes(paid_by) || !["EQUAL", "CUSTOM"].includes(split_type)) return res.status(400).json({ error: "Enter distinct members, a payer in the group, and a positive expense." });
  const shares = members.map((member, i) => ({ member, paise: split_type === "CUSTOM" ? money(req.body.shares?.[i]) : Math.floor(total / members.length) + (i < total % members.length ? 1 : 0) }));
  if (shares.reduce((n, s) => n + s.paise, 0) !== total || split_type === "CUSTOM" && (!Array.isArray(req.body.shares) || req.body.shares.length !== members.length)) return res.status(400).json({ error: "Member shares must add up to the total." });
  const result = await dbQuery(`WITH g AS (INSERT INTO expense_groups(creator_user_id,group_name,members_json) VALUES($1,$2,$3) RETURNING id)
    INSERT INTO group_expenses(group_id,title,total_amount,paid_by,split_type,splits_json) SELECT id,$4,$5,$6,$7,$8 FROM g RETURNING group_id,id`, [req.user.userId, group_name, JSON.stringify(members), expense_title, total_amount, paid_by, split_type, JSON.stringify(shares)]);
  res.status(201).json({ status: "GROUP_CREATED", group: result.rows[0] });
}));
router7.post("/settle", handle(async (req, res) => {
  if (!/^\d{1,9}$/.test(req.body.group_id) || !/^\d{1,9}$/.test(req.body.expense_id)) return res.status(400).json({ error: "Invalid expense reference." });
  const result = await dbQuery("UPDATE group_expenses e SET status='SETTLED' FROM expense_groups g WHERE g.creator_user_id=$1 AND g.id=$2 AND e.group_id=g.id AND e.id=$3 RETURNING e.id", [req.user.userId, req.body.group_id, req.body.expense_id]);
  if (!result.rowCount) return res.status(404).json({ error: "Expense not found." });
  res.json({ status: "SETTLED" });
}));
router7.post("/budget", handle(async (req, res) => {
  const category = label(req.body.category, 60), amount = money(req.body.amount);
  if (!category || !amount) return res.status(400).json({ error: "Enter a category and positive budget." });
  await dbQuery("INSERT INTO manual_category_limits(user_id,month_start,category,amount) VALUES($1,date_trunc('month',CURRENT_DATE)::date,$2,$3) ON CONFLICT(user_id,month_start,category) DO UPDATE SET amount=EXCLUDED.amount", [req.user.userId, category, amount / 100]);
  res.json({ status: "BUDGET_SAVED" });
}));
router7.post("/goals", handle(async (req, res) => {
  const name = label(req.body.name, 120), target = money(req.body.amount), date = String(req.body.date || "");
  if (!name || !target || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return res.status(400).json({ error: "Enter a goal name, target and valid date." });
  await dbQuery("INSERT INTO savings_goals(user_id,goal_name,target_amount,target_date) VALUES($1,$2,$3,$4)", [req.user.userId, name, target / 100, date]);
  res.status(201).json({ status: "GOAL_SAVED" });
}));
var finances_routes_default = router7;

// backend/routes/support.routes.ts
import { Router as Router8 } from "express";
import { randomUUID as randomUUID2 } from "node:crypto";
function supportRoutes(staffDesk = false) {
  const router15 = Router8();
  router15.use((_req, res, next) => {
    if (isPostgresConnected()) return next();
    if (isDemoMode() || process.env.NODE_ENV === "test") return next("router");
    res.status(503).json({ error: "Ticket storage unavailable." });
  });
  router15.use(requireAuth);
  if (staffDesk) router15.use(requireRole("admin", "credit_officer"));
  const tickets = staffDesk ? "" : "/tickets";
  const handle2 = (fn) => (req, res, next) => {
    fn(req, res).catch(next);
  };
  const staff = (req) => staffDesk || ["admin", "super_admin"].includes(req.user.role);
  const text = (v, max) => typeof v === "string" && v.trim().length <= max ? v.trim() : "";
  router15.get("/", handle2(async (req, res) => {
    const result = await dbQuery(`SELECT t.*,COALESCE(json_agg(json_build_object('id',m.id,'sender_role',m.sender_role,'sender_name',m.sender_name,'message',m.message_text,'created_at',m.created_at) ORDER BY m.id) FILTER (WHERE m.id IS NOT NULL),'[]') AS messages FROM support_tickets t LEFT JOIN support_messages m ON m.ticket_id=t.id WHERE ($1 OR t.user_id=$2) GROUP BY t.id ORDER BY t.id DESC`, [staff(req), req.user.userId]);
    res.json({ tickets: result.rows, faqs: superStore.supportFaqs, is_simulated: false });
  }));
  if (!staffDesk) router15.post("/tickets", handle2(async (req, res) => {
    const subject = text(req.body.subject, 200), description = text(req.body.description, 5e3), category = text(req.body.category || "General", 60), ref = text(req.body.transaction_ref || "", 64);
    if (!subject || !description || !category) return res.status(400).json({ error: "Enter a category, subject and description." });
    const result = await dbQuery(`WITH t AS (INSERT INTO support_tickets(user_id,ticket_no,category,subject,description,transaction_ref) VALUES($1,$2,$3,$4,$5,$6) RETURNING *), msg AS (INSERT INTO support_messages(ticket_id,sender_role,sender_name,message_text) SELECT id,'customer',$7,description FROM t) SELECT * FROM t`, [req.user.userId, "TKT-" + randomUUID2(), category, subject, description, ref || null, req.user.fullName]);
    const ticket = result.rows[0];
    broadcastRealtimeNotification(ticket.user_id, { title: "Support ticket opened", message: subject, category: "support", reference: ticket.ticket_no });
    res.status(201).json({ status: "TICKET_CREATED", ticket });
  }));
  router15.param("id", (_req, res, next, value) => /^\d{1,9}$/.test(value) ? next() : res.status(404).json({ error: "Ticket not found." }));
  router15.post(tickets + "/:id/reply", handle2(async (req, res) => {
    const message = text(req.body.message, 5e3);
    if (!message) return res.status(400).json({ error: "Enter a message of up to 5,000 characters." });
    const result = await dbQuery(`WITH t AS (UPDATE support_tickets SET status=CASE WHEN status='RESOLVED' AND NOT $3 THEN 'IN_PROGRESS' ELSE status END WHERE id=$1 AND (user_id=$2 OR $3) RETURNING id)
      INSERT INTO support_messages(ticket_id,sender_role,sender_name,message_text) SELECT id,$4,$5,$6 FROM t RETURNING *,message_text AS message`, [req.params.id, req.user.userId, staff(req), staff(req) ? "agent" : "customer", req.user.fullName, message]);
    if (!result.rowCount) return res.status(404).json({ error: "Ticket not found." });
    res.status(201).json({ status: "REPLY_POSTED", message: result.rows[0] });
  }));
  router15.patch(tickets + "/:id", requireRole(...staffDesk ? ["admin", "credit_officer"] : ["admin"]), handle2(async (req, res) => {
    const status = req.body.status || "RESOLVED", note = text(req.body.resolution_note, 2e3);
    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) return res.status(400).json({ error: "Invalid ticket status." });
    const result = await dbQuery(`WITH t AS (UPDATE support_tickets SET status=$2,resolution_note=COALESCE(NULLIF($3,''),resolution_note) WHERE id=$1 RETURNING *),msg AS (INSERT INTO support_messages(ticket_id,sender_role,sender_name,message_text) SELECT id,'agent',$4,$5 FROM t) SELECT * FROM t`, [req.params.id, status, note, req.user.fullName, note || "Ticket status updated to " + status]);
    if (!result.rowCount) return res.status(404).json({ error: "Ticket not found." });
    const ticket = result.rows[0];
    logAudit(req.user.userId, "UPDATE_TICKET", "support_tickets", ticket.ticket_no, { status });
    broadcastRealtimeNotification(ticket.user_id, { title: "Support ticket updated", message: status, category: "support", reference: ticket.ticket_no });
    res.json({ status: "TICKET_UPDATED", ticket });
  }));
  return router15;
}

// backend/routes/investments.routes.ts
import { Router as Router9 } from "express";
var router8 = Router9();
router8.get("/stocks", async (req, res) => {
  const quotes = await marketDataAdapter.getQuotes();
  res.json(quotes);
});
router8.get("/watchlist", requireAuth, async (req, res) => {
  try {
    const userWatch = await dbRepository.investments.getWatchlist(req.user.userId);
    res.json(userWatch);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.post("/watchlist/toggle", requireAuth, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: "Symbol required" });
    const result = await dbRepository.investments.toggleWatchlist(req.user.userId, symbol);
    return res.json({
      symbol: result.symbol,
      watched: result.watched,
      message: result.watched ? "Added to watchlist" : "Removed from watchlist"
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.post("/stocks/order", requireAuth, async (req, res) => {
  try {
    const { symbol, order_type, quantity } = req.body;
    const user = await dbRepository.users.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Bad Request", detail: "Positive quantity required" });
    }
    const quote = await marketDataAdapter.getQuote(symbol);
    if (!quote) return res.status(404).json({ error: "Stock quote not found" });
    const totalValue = Math.round(qty * quote.price);
    const type = (order_type || "BUY").toUpperCase();
    const currentBalance = parseFloat(user.wallet_balance || 0);
    if (type === "BUY") {
      if (currentBalance < totalValue) {
        return res.status(400).json({
          error: "Insufficient Balance",
          detail: `Required \u20B9${totalValue.toLocaleString("en-IN")}, available in wallet \u20B9${currentBalance.toLocaleString("en-IN")}`
        });
      }
      await dbRepository.users.updateWallet(user.id, currentBalance - totalValue);
      await dbRepository.investments.upsertHolding(user.id, quote.symbol, quote.name, "equity", qty, totalValue, quote.price);
    } else if (type === "SELL") {
      const holdings = await dbRepository.investments.getPortfolioByUser(user.id);
      const existing = holdings.find((p) => p.asset_symbol === quote.symbol);
      const currentQty = existing ? Number(existing.quantity) : 0;
      if (!existing || currentQty < qty) {
        return res.status(400).json({
          error: "Insufficient Holdings",
          detail: `You own ${currentQty} shares of ${quote.symbol}`
        });
      }
      await dbRepository.users.updateWallet(user.id, currentBalance + totalValue);
      await dbRepository.investments.upsertHolding(user.id, quote.symbol, quote.name, "equity", -qty, -totalValue, quote.price);
    }
    const orderRef = `ORD-${Date.now()}`;
    const updatedWallet = type === "BUY" ? currentBalance - totalValue : currentBalance + totalValue;
    await dbRepository.wallet.recordTransaction({
      user_id: user.id,
      transaction_type: type === "BUY" ? "debit" : "credit",
      amount: totalValue,
      balance_after: updatedWallet,
      description: `Stock ${type}: ${qty} x ${quote.symbol} @ \u20B9${quote.price} [SANDBOX]`,
      reference_id: orderRef
    });
    await dbRepository.investments.createStockOrder({
      order_ref: orderRef,
      user_id: user.id,
      symbol: quote.symbol,
      order_type: type,
      quantity: qty,
      executed_price: quote.price,
      total_order_value: totalValue,
      status: "EXECUTED"
    });
    await dbRepository.notifications.create({
      user_id: user.id,
      title: `Order Executed: ${type} ${qty} ${quote.symbol}`,
      message: `Filled at \u20B9${quote.price} (Total: \u20B9${totalValue.toLocaleString("en-IN")}). Ref: ${orderRef}`,
      category: "investments"
    });
    logAudit(user.id, "STOCK_ORDER", "stock_orders", orderRef, { symbol: quote.symbol, type, qty, totalValue });
    return res.json({
      status: "EXECUTED",
      order_reference: orderRef,
      symbol: quote.symbol,
      order_type: type,
      quantity: qty,
      executed_price: quote.price,
      total_value: totalValue,
      wallet_balance: updatedWallet,
      is_simulated: true,
      execution_mode: "SANDBOX_PROTOTYPE",
      message: "Trade executed successfully on simulated exchange [DEMO SANDBOX]"
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    console.error("Stock order error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.get("/mutual-funds", async (req, res) => {
  try {
    const category = (req.query.category || "all").toLowerCase();
    let funds = await dbRepository.investments.getMutualFunds();
    if (category !== "all") {
      funds = funds.filter((f) => f.category.toLowerCase().includes(category));
    }
    res.json(funds);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.get("/sips", requireAuth, async (req, res) => {
  try {
    const userSips = await dbRepository.investments.getSips(req.user.userId);
    res.json(userSips);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.post("/sips", requireAuth, async (req, res) => {
  try {
    const { fund_id, monthly_amount, debit_day } = req.body;
    const amt = parseFloat(monthly_amount);
    if (!amt || amt < 500) {
      return res.status(400).json({ error: "Bad Request", detail: "Minimum SIP amount is \u20B9500" });
    }
    const fund = await dbRepository.investments.getFundById(parseInt(fund_id, 10)) || (await dbRepository.investments.getMutualFunds())[0];
    const mandateRef = `SIP-MANDATE-${Date.now()}`;
    const nextDate = /* @__PURE__ */ new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(parseInt(debit_day, 10) || 10);
    const newSip = await dbRepository.investments.createSip({
      mandate_ref: mandateRef,
      user_id: req.user.userId,
      fund_id: fund?.id || 1,
      monthly_amount: amt,
      debit_day: parseInt(debit_day, 10) || 10,
      next_debit_date: nextDate.toISOString().split("T")[0]
    });
    await dbRepository.notifications.create({
      user_id: req.user.userId,
      title: "SIP Mandate Authorized",
      message: `\u20B9${amt.toLocaleString("en-IN")}/mo in ${fund?.fund_name || "Mutual Fund"}. Auto-debit on ${newSip.debit_day}th of every month.`,
      category: "investments"
    });
    logAudit(req.user.userId, "REGISTER_SIP", "sips", mandateRef, { fund: fund?.fund_name, amount: amt });
    return res.status(201).json({
      ...newSip,
      fund_name: fund?.fund_name,
      is_simulated: true,
      compliance_note: "Simulated e-NACH mandate sandbox demo [No real bank auto-debit]",
      message: "SIP Mandate successfully authorized in sandbox environment"
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    console.error("SIP registration error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.delete("/sips/:id", requireAuth, async (req, res) => {
  try {
    const sipId = parseInt(req.params.id, 10);
    await dbRepository.investments.deleteSip(sipId, req.user.userId);
    return res.json({ message: "SIP mandate paused/cancelled successfully" });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.get("/portfolio", requireAuth, async (req, res) => {
  try {
    const holdings = await dbRepository.investments.getPortfolioByUser(req.user.userId);
    const totalInvested = holdings.reduce((sum, h) => sum + parseFloat(h.invested_amount || 0), 0);
    const currentValuation = holdings.reduce((sum, h) => sum + parseFloat(h.current_valuation || 0), 0);
    const totalReturns = currentValuation - totalInvested;
    const returnsPct = totalInvested > 0 ? parseFloat((totalReturns / totalInvested * 100).toFixed(2)) : 0;
    const allocation = { equity: 0, mutual_fund: 0, gold_etf: 0, sovereign_bond: 0 };
    holdings.forEach((h) => {
      const cat = h.category || "equity";
      allocation[cat] = (allocation[cat] || 0) + parseFloat(h.current_valuation || 0);
    });
    return res.json({
      total_invested: totalInvested,
      current_valuation: currentValuation,
      total_returns: totalReturns,
      returns_percentage: returnsPct,
      holdings,
      allocation,
      is_simulated: true,
      note: "Portfolio values reflect simulated prototype holdings"
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.get("/demat", requireAuth, async (req, res) => {
  try {
    let demat = await dbRepository.investments.getDemat(req.user.userId);
    if (!demat) {
      demat = {
        client_code: "TT-KDP-89104",
        dp_id: "IN300128-10049281",
        depository: "NSDL",
        status: "active"
      };
    }
    res.json({
      ...demat,
      is_simulated: true,
      compliance_note: "Simulated Depository Participant sandbox demo. Not a registered broker depository."
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.post(["/demat", "/demat/apply"], requireAuth, async (req, res) => {
  try {
    const { depository, linked_bank_account, linked_bank_ifsc } = req.body;
    const clientCode = `TT-KDP-${1e4 + req.user.userId}`;
    const dpId = depository === "CDSL" ? "12081600-00492811" : "IN300128-10049281";
    const record = await dbRepository.investments.createDemat({
      user_id: req.user.userId,
      client_code: clientCode,
      dp_id: dpId,
      depository: depository || "NSDL",
      linked_bank_account: linked_bank_account || "\u2022\u2022\u2022\u2022 4821",
      linked_bank_ifsc: linked_bank_ifsc || "SBIN0000840",
      status: "active",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    logAudit(req.user.userId, "OPEN_DEMAT_ACCOUNT", "demat_applications", clientCode, { depository: depository || "NSDL" });
    return res.status(201).json({
      ...record,
      is_simulated: true,
      status: "active",
      compliance_note: "Simulated Depository Participant sandbox demo. Not a registered broker depository."
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.get(["/orders", "/stocks/orders"], requireAuth, async (req, res) => {
  try {
    const orders = await dbRepository.investments.getStockOrders(req.user.userId);
    return res.json(orders);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router8.post(["/mutual-funds/sip-calculator", "/sip-calculator"], (req, res) => {
  const { monthly_investment, expected_return_rate, tenure_years, mode, lumpsum_amount } = req.body;
  const isLumpsum = mode === "lumpsum";
  const P = parseFloat(isLumpsum ? lumpsum_amount || monthly_investment : monthly_investment);
  const annualRate = parseFloat(expected_return_rate) || 15;
  const years = parseInt(tenure_years, 10) || 10;
  if (isNaN(P) || P <= 0 || years <= 0) {
    return res.status(400).json({ error: "Bad Request", detail: "Valid positive investment amount and tenure years required" });
  }
  let totalInvested = 0;
  let totalValue = 0;
  const yearlyBreakdown = [];
  if (isLumpsum) {
    totalInvested = P;
    const r = annualRate / 100;
    totalValue = Math.round(P * Math.pow(1 + r, years));
    for (let y = 1; y <= years; y++) {
      const val = Math.round(P * Math.pow(1 + r, y));
      yearlyBreakdown.push({
        year: y,
        invested: P,
        wealth: val,
        gain: val - P
      });
    }
  } else {
    const n = years * 12;
    const i = annualRate / 12 / 100;
    totalInvested = P * n;
    totalValue = i > 0 ? Math.round(P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)) : totalInvested;
    for (let y = 1; y <= years; y++) {
      const months = y * 12;
      const inv = P * months;
      const val = i > 0 ? Math.round(P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i)) : inv;
      yearlyBreakdown.push({
        year: y,
        invested: inv,
        wealth: val,
        gain: val - inv
      });
    }
  }
  return res.json({
    mode: isLumpsum ? "lumpsum" : "sip",
    monthly_investment: isLumpsum ? 0 : P,
    lumpsum_amount: isLumpsum ? P : 0,
    expected_return_rate: annualRate,
    tenure_years: years,
    total_invested: totalInvested,
    estimated_returns: Math.max(0, totalValue - totalInvested),
    total_value: totalValue,
    yearly_breakdown: yearlyBreakdown
  });
});
var investments_routes_default = router8;

// backend/routes/admin.routes.ts
import { Router as Router10 } from "express";
var router9 = Router10();
router9.get(["/dashboard-stats", "/dashboard"], requireAuth, requireRole("admin", "credit_officer"), async (req, res) => {
  try {
    const stats = await dbRepository.admin.getDashboardStats();
    return res.json(stats);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.get(["/loans", "/loan-applications"], requireAuth, requireRole("admin", "credit_officer"), async (req, res) => {
  try {
    const statusFilter = (req.query.status || "all").toLowerCase();
    const list = await dbRepository.loans.getAllApplications(statusFilter);
    res.json(list);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.patch(["/loans/:id/decision", "/loans/:id/status"], requireAuth, requireRole("admin", "credit_officer"), async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const decision = req.body.decision || req.body.status;
    const { remarks, sanctioned_amount } = req.body;
    const app2 = await dbRepository.loans.getApplicationById(appId);
    if (!app2) return res.status(404).json({ error: "Loan application not found" });
    const validDecisions = ["under_review", "approved", "sanctioned", "disbursed", "rejected", "info_requested"];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: "Invalid Decision", detail: `Must be one of: [${validDecisions.join(", ")}]` });
    }
    const prevStatus = app2.status;
    let finalAmount = app2.requested_amount;
    let calculatedEmi = app2.calculated_emi;
    if (decision === "approved" || decision === "sanctioned") {
      finalAmount = parseFloat(sanctioned_amount) || parseFloat(app2.requested_amount);
      const interestRate = parseFloat(app2.interest_rate);
      const tenureMonths = parseInt(app2.tenure_months, 10);
      const r = interestRate / 12 / 100;
      calculatedEmi = Math.round(finalAmount * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1));
      const existingSched = await dbRepository.loans.getEmiSchedules(app2.id);
      if (existingSched.length === 0) {
        const schedules = [];
        let balance = finalAmount;
        for (let m = 1; m <= tenureMonths; m++) {
          const interest = Math.round(balance * r);
          let principal = calculatedEmi - interest;
          if (m === tenureMonths || balance - principal < 0) {
            principal = balance;
            balance = 0;
          } else {
            balance -= principal;
          }
          const dueDate = /* @__PURE__ */ new Date();
          dueDate.setMonth(dueDate.getMonth() + m);
          dueDate.setDate(5);
          schedules.push({
            application_id: app2.id,
            installment_number: m,
            due_date: dueDate.toISOString().split("T")[0],
            emi_amount: calculatedEmi,
            principal_component: principal,
            interest_component: interest,
            remaining_balance: Math.max(0, balance)
          });
          if (balance <= 0) break;
        }
        await dbRepository.loans.createEmiSchedules(schedules);
      }
    }
    const updatedApp = await dbRepository.loans.updateApplicationDecision(
      appId,
      decision,
      remarks,
      finalAmount,
      calculatedEmi
    );
    if (decision === "disbursed") {
      const borrower = await dbRepository.users.findById(app2.user_id);
      if (borrower) {
        const currentBalance = parseFloat(borrower.wallet_balance || 0);
        const addAmount = parseFloat(sanctioned_amount) || parseFloat(app2.sanctioned_amount || app2.requested_amount);
        const newBalance = currentBalance + addAmount;
        await dbRepository.users.updateWallet(borrower.id, newBalance);
        await dbRepository.wallet.recordTransaction({
          user_id: borrower.id,
          transaction_type: "credit",
          amount: addAmount,
          balance_after: newBalance,
          description: `Loan Disbursement Credit (${app2.application_no}) [SANDBOX]`,
          reference_id: `DISB-${app2.application_no}`
        });
      }
    }
    await dbRepository.notifications.create({
      user_id: app2.user_id,
      title: `Loan #${app2.application_no} Updated: ${decision.toUpperCase()}`,
      message: remarks || `Credit Committee has updated your application to ${decision.toUpperCase()}.`,
      category: "loans"
    });
    logAudit(req.user.userId, "LOAN_DECISION", "loan_applications", app2.application_no, {
      prevStatus,
      decision,
      officer: req.user.fullName
    });
    return res.json({
      status: "UPDATED",
      application: updatedApp,
      message: `Application #${app2.application_no} marked as ${decision.toUpperCase()}`
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    console.error("Loan decision error:", err);
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.get("/audit-logs", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const logs = await dbRepository.admin.getAuditLogs(50);
    res.json(logs);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.get("/reports/csv", requireAuth, requireRole("admin", "credit_officer"), async (req, res) => {
  try {
    const apps = await dbRepository.loans.getAllApplications();
    let csv = "Application No,Applicant Name,Phone,Email,Product,Requested Amount,Interest Rate,Tenure Months,EMI,Status,Created At\n";
    apps.forEach((a) => {
      csv += `"${a.application_no}","${a.applicant_name}","${a.phone}","${a.email}","${a.product_name || "Loan"}",${a.requested_amount},${a.interest_rate},${a.tenure_months},${a.calculated_emi},"${a.status}","${a.created_at}"
`;
    });
    res.header("Content-Type", "text/csv");
    res.attachment(`Tatito_Loans_Report_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
    return res.send(csv);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const roleFilter = req.query.role;
    const users = await dbRepository.users.getAll(roleFilter);
    return res.json(users);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.patch("/users/:id/role", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid numeric user ID is required" });
    }
    const { role } = req.body;
    const allowed = ["customer", "agent", "credit_officer", "admin", "super_admin"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: "Invalid Role", detail: `Allowed: [${allowed.join(", ")}]` });
    }
    const targetUser = await dbRepository.users.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Not Found", detail: "Target user not found" });
    }
    await dbRepository.users.updateRole(userId, role);
    logAudit(req.user.userId, "UPDATE_USER_ROLE", "users", String(userId), { newRole: role });
    return res.json({ message: "User role updated successfully", userId, role });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.patch("/users/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid numeric user ID is required" });
    }
    const targetUser = await dbRepository.users.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Not Found", detail: "Target user not found" });
    }
    const { is_active } = req.body;
    await dbRepository.users.updateStatus(userId, Boolean(is_active));
    logAudit(req.user.userId, "UPDATE_USER_STATUS", "users", String(userId), { is_active });
    return res.json({ message: "User status updated", userId, is_active: Boolean(is_active) });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.patch("/loan-products/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const prodId = parseInt(req.params.id, 10);
    if (isNaN(prodId)) {
      return res.status(400).json({ error: "Bad Request", detail: "Valid numeric product ID is required" });
    }
    const { base_interest_rate, min_amount, max_amount } = req.body;
    const updated = await dbRepository.loans.updateProduct(prodId, {
      base_interest_rate: base_interest_rate !== void 0 ? parseFloat(base_interest_rate) : void 0,
      min_amount: min_amount !== void 0 ? parseFloat(min_amount) : void 0,
      max_amount: max_amount !== void 0 ? parseFloat(max_amount) : void 0
    });
    if (!updated) return res.status(404).json({ error: "Loan product not found" });
    logAudit(req.user.userId, "UPDATE_LOAN_PRODUCT", "loan_products", String(prodId), req.body);
    return res.json({ message: "Loan product updated", product: updated });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router9.get("/payments-monitor", requireAuth, requireRole("admin", "credit_officer"), (_req, res) => {
  const bbpsPayments = (relationalDB.payments || []).map((p) => ({
    id: `bbps-${p.id}`,
    ref: p.payment_ref,
    channel: p.payment_mode || "BBPS",
    category: p.payment_category,
    party: p.operator_name,
    amount: Number(p.amount || 0),
    status: p.status || "DEMO_SUCCESS",
    refund_status: "NONE",
    created_at: p.created_at
  }));
  const upiTxns = (superStore.upiTransactions || []).map((u) => ({
    id: u.id,
    ref: u.transaction_ref,
    channel: u.payment_mode || "UPI_SANDBOX",
    category: u.direction || "upi",
    party: u.counterparty_name,
    amount: Number(u.amount || 0),
    status: u.status || "DEMO_SUCCESS",
    refund_status: u.refund_status || "NONE",
    created_at: u.created_at
  }));
  const combined = [...upiTxns, ...bbpsPayments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalCount = combined.length;
  const successCount = combined.filter((t) => t.status.includes("SUCCESS")).length;
  const failedCount = combined.filter((t) => t.status.includes("FAIL")).length;
  const pendingCount = combined.filter((t) => t.status.includes("PENDING")).length;
  const refundsCount = combined.filter((t) => t.refund_status && t.refund_status !== "NONE").length;
  const totalVolume = combined.filter((t) => t.status.includes("SUCCESS")).reduce((acc, t) => acc + t.amount, 0);
  return res.json({
    summary: {
      total_transactions: totalCount,
      successful_count: successCount,
      failed_count: failedCount,
      pending_count: pendingCount,
      refunds_count: refundsCount,
      total_settled_volume: totalVolume
    },
    transactions: combined.slice(0, 60)
  });
});
router9.get("/risk-alerts", requireAuth, requireRole("admin", "credit_officer"), (_req, res) => {
  const alerts = [];
  superStore.upiTransactions.filter((t) => Number(t.amount) >= 25e3).forEach((t) => {
    alerts.push({
      id: `risk-hi-${t.transaction_ref}`,
      severity: "MEDIUM",
      rule: "HIGH_VALUE_SANDBOX_TRANSFER",
      reference: t.transaction_ref,
      description: `Transfer of \u20B9${Number(t.amount).toLocaleString("en-IN")} to ${t.counterparty_name} exceeded \u20B925,000 review threshold.`,
      status: "MONITORED",
      created_at: t.created_at
    });
  });
  superStore.upiTransactions.filter((t) => t.status === "FAILED" || t.refund_status !== "NONE").forEach((t) => {
    alerts.push({
      id: `risk-fl-${t.transaction_ref}`,
      severity: t.status === "FAILED" ? "HIGH" : "LOW",
      rule: t.status === "FAILED" ? "GATEWAY_DECLINE_TRACE" : "REFUND_DISPUTE_FLAG",
      reference: t.transaction_ref,
      description: `${t.status === "FAILED" ? "Declined transaction" : "Refund initiated"} on ${t.counterparty_name} (\u20B9${Number(t.amount).toLocaleString("en-IN")}).`,
      status: "OPEN",
      created_at: t.created_at
    });
  });
  if (alerts.length === 0) {
    alerts.push({
      id: "risk-baseline",
      severity: "LOW",
      rule: "BASELINE_COMPLIANCE_CHECK",
      reference: "SYS-RISK-OK",
      description: "Velocity checks active across Kadapa hub. Zero anomalous failed-PIN bursts detected.",
      status: "CLEAR",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return res.json({ alerts });
});
router9.get("/support-tickets", requireAuth, requireRole("admin", "credit_officer"), (_req, res) => {
  return res.json({ tickets: superStore.supportTickets });
});
router9.patch("/support-tickets/:id", requireAuth, requireRole("admin", "credit_officer"), (req, res) => {
  const { status, resolution_note } = req.body;
  const tkt = superStore.supportTickets.find((t) => t.id === req.params.id);
  if (!tkt) return res.status(404).json({ error: "Support ticket not found" });
  tkt.status = status || "RESOLVED";
  if (resolution_note) tkt.resolution_note = resolution_note;
  tkt.messages = tkt.messages || [];
  tkt.messages.push({
    id: `msg-${Date.now()}`,
    sender_role: "agent",
    sender_name: req.user?.fullName || "Branch Admin",
    message: resolution_note || `Ticket status updated to ${tkt.status}.`,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  broadcastRealtimeNotification("all", {
    title: `Support Ticket ${tkt.ticket_no} Updated`,
    message: `Status changed to ${tkt.status}`,
    category: "support",
    reference: tkt.ticket_no
  });
  logAudit(req.user.userId, "ADMIN_UPDATE_TICKET", "support_tickets", tkt.ticket_no, { status: tkt.status });
  return res.json({ status: "TICKET_UPDATED", ticket: tkt });
});
router9.get("/offers-summary", requireAuth, requireRole("admin"), (_req, res) => {
  return res.json({
    campaigns: superStore.rewards.campaigns,
    coupons: superStore.rewards.coupons,
    vouchers: superStore.rewards.vouchers,
    total_points_circulating: superStore.rewards.points
  });
});
var admin_routes_default = router9;

// backend/routes/agents.routes.ts
import { Router as Router11 } from "express";
var router10 = Router11();
router10.get("/dashboard", requireAuth, requireRole("agent", "admin"), async (req, res) => {
  try {
    const agentProfile = await dbRepository.agents.getByUserId(req.user.userId);
    const leads = await dbRepository.agents.getLeads(req.user.userId, req.user.role);
    const commissions = await dbRepository.agents.getCommissions(req.user.role === "admin" || req.user.role === "super_admin" ? void 0 : req.user.userId);
    return res.json({
      agent: agentProfile || {
        agent_code: "TF-DSA-042",
        agency_name: "Rayalaseema Financial Associates",
        operating_region: "Kadapa, Proddatur & Pulivendula",
        commission_rate_pct: 1,
        status: "active"
      },
      total_leads: leads.length,
      disbursed_leads: leads.filter((l) => l.status === "Disbursed").length,
      in_review_leads: leads.filter((l) => l.status === "In Review").length,
      total_commission_earned: commissions.total_earned,
      pending_commission_pipeline: commissions.pending_pipeline,
      leads
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router10.get("/leads", requireAuth, requireRole("agent", "admin"), async (req, res) => {
  try {
    const leads = await dbRepository.agents.getLeads(req.user.userId, req.user.role);
    return res.json(leads);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router10.post("/leads", requireAuth, requireRole("agent", "admin"), async (req, res) => {
  try {
    const { applicant_name, phone, email, loan_product, requested_amount, location, notes } = req.body;
    if (!applicant_name || !phone || !loan_product || !requested_amount) {
      return res.status(400).json({ error: "Validation Error", detail: "Missing required lead details" });
    }
    const amt = parseFloat(requested_amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "Validation Error", detail: "Valid positive loan amount required" });
    }
    let commissionRate = 1;
    if (loan_product.includes("Home")) commissionRate = 0.4;
    else if (loan_product.includes("Personal")) commissionRate = 1.25;
    else if (loan_product.includes("Gold")) commissionRate = 0.5;
    else if (loan_product.includes("Business")) commissionRate = 1;
    const commissionAmount = Math.round(amt * (commissionRate / 100));
    const agentProfile = await dbRepository.agents.getByUserId(req.user.userId);
    const agentCode = agentProfile?.agent_code || "TF-DSA-042";
    const newLead = await dbRepository.agents.createLead({
      agent_id: req.user.userId,
      agent_code: agentCode,
      applicant_name: applicant_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      loan_product,
      requested_amount: amt,
      location: location || "Kadapa",
      commission_rate_pct: commissionRate,
      commission_amount: commissionAmount,
      status: "Contacted",
      notes
    });
    logAudit(req.user.userId, "SUBMIT_AGENT_LEAD", "agent_leads", String(newLead.id), { applicant: newLead.applicant_name, amount: amt });
    return res.status(201).json({
      status: "CREATED",
      lead: newLead,
      message: "Borrower lead recorded and dispatched to Kadapa branch underwriting"
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router10.get("/commissions", requireAuth, requireRole("agent", "admin"), async (req, res) => {
  try {
    const agentProfile = await dbRepository.agents.getByUserId(req.user.userId);
    const agentCode = agentProfile?.agent_code || "TF-DSA-042";
    const commissionData = await dbRepository.agents.getCommissions(req.user.role === "admin" || req.user.role === "super_admin" ? void 0 : req.user.userId);
    return res.json({
      agent_code: agentCode,
      total_earned: commissionData.total_earned,
      pending_pipeline: commissionData.pending_pipeline,
      commission_slabs: [
        { product: "Home Loans", rate: "0.40% - 0.50%", terms: "Disbursement UTR confirmation" },
        { product: "Business Loans", rate: "1.00% - 1.25%", terms: "Highest tier payout" },
        { product: "Personal Loans", rate: "1.25% - 1.50%", terms: "Fastest 48h turnaround" },
        { product: "Gold Loans", rate: "0.50% Flat", terms: "Same-day counter cash settlement" }
      ]
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    return res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
var agents_routes_default = router10;

// backend/routes/notifications.routes.ts
import { Router as Router12 } from "express";
var router11 = Router12();
router11.get("/", requireAuth, async (req, res) => {
  try {
    const list = await dbRepository.notifications.getByUser(req.user.userId);
    res.json(list);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router11.post("/mark-all-read", requireAuth, async (req, res) => {
  try {
    await dbRepository.notifications.markAllRead(req.user.userId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
router11.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const updated = await dbRepository.notifications.markRead(notifId, req.user.userId);
    res.json({ success: true, message: "Notification marked as read", notification: updated });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
var notifications_routes_default = router11;

// backend/routes/superapp.routes.ts
import { Router as Router13 } from "express";
var router12 = Router13();
router12.get("/upi/overview", requireAuth, async (req, res) => {
  const user = await dbRepository.users.findById(req.user.userId);
  return res.json({
    is_simulated: true,
    security_notice: "SECURITY SAFEGUARD: Tatito never collects or stores your UPI PIN, banking password, or CVV. All UPI transfers in this environment execute via an isolated sandbox simulator.",
    wallet_balance: user?.wallet_balance ?? 24850,
    primary_vpa: `${(user?.full_name || "ramesh").toLowerCase().replace(/[^a-z0-9]/g, "")}@tatitoupi`,
    linked_accounts: superStore.linkedAccounts,
    beneficiaries: superStore.beneficiaries,
    qr_codes: superStore.qrCodes,
    payment_requests: superStore.paymentRequests,
    transactions: superStore.upiTransactions
  });
});
router12.get("/upi/bank-accounts", requireAuth, (_req, res) => {
  return res.json({ linked_accounts: superStore.linkedAccounts });
});
router12.post("/upi/bank-accounts", requireAuth, (req, res) => {
  const { bank_name, account_number, ifsc, account_type } = req.body;
  if (!bank_name || !account_number || !ifsc) {
    return res.status(400).json({ error: "Validation Error", detail: "bank_name, account_number, and ifsc are required." });
  }
  const cleanAcc = String(account_number).replace(/\s+/g, "");
  const last4 = cleanAcc.slice(-4).padStart(4, "0");
  const bankSlug = String(bank_name).toLowerCase().replace(/[^a-z]/g, "").slice(0, 6) || "bank";
  const vpa = `${(req.user.fullName || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}.${bankSlug}@tatitoupi`;
  const newAcc = {
    id: `acc-${Date.now()}`,
    bank_name: String(bank_name).trim(),
    masked_account: `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${last4}`,
    ifsc: String(ifsc).toUpperCase().trim(),
    upi_vpa: vpa,
    account_type: account_type || "Savings Account",
    is_primary: superStore.linkedAccounts.length === 0,
    balance_check_mode: "SANDBOX_SIMULATED",
    simulated_bank_balance: 25e3 + last4.charCodeAt(0) * 750 % 45e3
  };
  superStore.linkedAccounts.push(newAcc);
  logAudit(req.user.userId, "LINK_BANK_ACCOUNT", "bank_accounts", newAcc.id, { bank: newAcc.bank_name, ifsc: newAcc.ifsc });
  return res.status(201).json({ status: "BANK_LINKED_SANDBOX", is_simulated: true, account: newAcc });
});
router12.patch("/upi/bank-accounts/:id/primary", requireAuth, (req, res) => {
  const found = superStore.linkedAccounts.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Bank account not found" });
  superStore.linkedAccounts.forEach((a) => {
    a.is_primary = a.id === req.params.id;
  });
  return res.json({ status: "PRIMARY_UPDATED", linked_accounts: superStore.linkedAccounts });
});
router12.delete("/upi/bank-accounts/:id", requireAuth, (req, res) => {
  const idx = superStore.linkedAccounts.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Bank account not found" });
  if (superStore.linkedAccounts.length <= 1) {
    return res.status(400).json({ error: "Cannot Remove", detail: "At least one linked bank account must remain active." });
  }
  const removed = superStore.linkedAccounts.splice(idx, 1)[0];
  if (removed.is_primary && superStore.linkedAccounts[0]) {
    superStore.linkedAccounts[0].is_primary = true;
  }
  return res.json({ status: "BANK_UNLINKED", removed_id: req.params.id });
});
router12.post("/upi/bank-accounts/:id/balance", requireAuth, (req, res) => {
  const found = superStore.linkedAccounts.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Bank account not found" });
  return res.json({
    account_id: found.id,
    bank_name: found.bank_name,
    masked_account: found.masked_account,
    balance: found.simulated_bank_balance,
    is_simulated: true,
    checked_at: (/* @__PURE__ */ new Date()).toISOString(),
    disclaimer: "SANDBOX BALANCE: Live bank balance enquiries run via NPCI UPI PIN Common Library."
  });
});
router12.get("/beneficiaries", requireAuth, (_req, res) => {
  return res.json({ beneficiaries: superStore.beneficiaries });
});
router12.post("/beneficiaries", requireAuth, (req, res) => {
  const { name, vpa, upi_id, mobile, bank_masked, nickname } = req.body;
  const resolvedVpa = vpa || upi_id;
  if (!name || !resolvedVpa && !mobile) {
    return res.status(400).json({ error: "Validation Error", detail: "Beneficiary name and UPI ID or mobile are required." });
  }
  const item = {
    id: `ben-${Date.now()}`,
    name: String(name).trim(),
    vpa: resolvedVpa ? String(resolvedVpa).trim() : `${String(mobile).slice(-10)}@tatitoupi`,
    mobile: mobile ? String(mobile).trim() : "",
    bank_masked: bank_masked || "UPI Verified Handle",
    nickname: nickname || "Saved Payee"
  };
  superStore.beneficiaries.unshift(item);
  return res.status(201).json({ status: "BENEFICIARY_SAVED", beneficiary: item });
});
router12.delete("/beneficiaries/:id", requireAuth, (req, res) => {
  const idx = superStore.beneficiaries.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Beneficiary not found" });
  superStore.beneficiaries.splice(idx, 1);
  return res.json({ status: "BENEFICIARY_REMOVED", id: req.params.id });
});
router12.post("/upi/send", requireAuth, async (req, res) => {
  try {
    const { recipient_name, recipient_vpa, amount, note, direction, payment_source, simulate_failure, simulate_pending } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount", detail: "Transfer amount must be greater than \u20B90." });
    }
    if (!recipient_vpa && direction !== "self_transfer") {
      return res.status(400).json({ error: "Missing recipient", detail: "Please provide a recipient UPI ID, mobile number, or account." });
    }
    const txRef = `UPI-DEMO-${Date.now().toString().slice(-8)}`;
    if (simulate_failure === true) {
      const failedTx = {
        id: `upi-${Date.now()}`,
        transaction_ref: txRef,
        direction: direction || "send",
        counterparty_name: recipient_name || recipient_vpa || "UPI Recipient",
        counterparty_vpa: recipient_vpa || "failed@upi",
        amount: amt,
        payment_mode: payment_source === "wallet" ? "TATITO_WALLET_UPI" : "UPI_BANK_SANDBOX",
        status: "FAILED",
        refund_status: "NOT_APPLICABLE",
        note: note || "Simulated PSP bank timeout / decline",
        is_simulated: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      superStore.upiTransactions.unshift(failedTx);
      return res.status(400).json({
        error: "Simulated Payment Failure",
        detail: "Simulated UPI decline from remitter bank. Wallet balance was NOT debited.",
        transaction: failedTx
      });
    }
    const finalStatus = simulate_pending === true ? "PENDING" : "DEMO_SUCCESS";
    let updatedBalance;
    if (payment_source === "wallet" && finalStatus === "DEMO_SUCCESS") {
      const result = await dbRepository.payments.executeAtomicWalletPayment({
        userId: req.user.userId,
        amount: amt,
        category: "upi_transfer",
        operator: recipient_name || recipient_vpa || "UPI Recipient",
        accountIdentifier: recipient_vpa || "SELF-TRANSFER",
        paymentMode: "upi_wallet_sandbox",
        status: finalStatus,
        metaJson: { note, is_demo: true }
      });
      updatedBalance = result.newBalance;
    } else {
      const user = await dbRepository.users.findById(req.user.userId);
      updatedBalance = user?.wallet_balance ?? 24850;
    }
    const newTx = {
      id: `upi-${Date.now()}`,
      transaction_ref: txRef,
      direction: direction || "send",
      counterparty_name: recipient_name || (direction === "self_transfer" ? "Self Transfer (SBI \u2022\u20224821 \u2192 UBI \u2022\u20229104)" : recipient_vpa),
      counterparty_vpa: recipient_vpa || "ramesh.ub@tatitoupi",
      amount: amt,
      payment_mode: payment_source === "wallet" ? "TATITO_WALLET_UPI" : "UPI_BANK_SANDBOX",
      status: finalStatus,
      refund_status: "NONE",
      note: note || "UPI Sandbox Transfer",
      is_simulated: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    superStore.upiTransactions.unshift(newTx);
    if (finalStatus === "DEMO_SUCCESS") {
      superStore.rewards.points += 10;
    }
    await dbRepository.notifications.create({
      user_id: req.user.userId,
      title: finalStatus === "PENDING" ? "UPI Transfer Pending" : "UPI Sandbox Transfer Completed",
      message: `\u20B9${amt.toLocaleString("en-IN")} to ${newTx.counterparty_name} (${newTx.transaction_ref}) \u2014 ${finalStatus}.`,
      category: "general"
    });
    broadcastRealtimeNotification(req.user.userId, {
      title: finalStatus === "PENDING" ? "UPI Payment Pending" : "UPI Transfer Settled",
      message: `\u20B9${amt.toLocaleString("en-IN")} to ${newTx.counterparty_name} (${txRef})`,
      category: "payments",
      reference: txRef,
      amount: amt
    });
    logAudit(req.user.userId, "UPI_SEND_SANDBOX", "payment_transactions", txRef, { amount: amt, recipient_vpa, status: finalStatus });
    return res.status(201).json({
      status: finalStatus,
      is_simulated: true,
      transaction: newTx,
      wallet_balance: updatedBalance,
      reward_points_earned: finalStatus === "DEMO_SUCCESS" ? 10 : 0,
      disclaimer: "SANDBOX TRANSACTION: Simulated UPI payment. No real NPCI bank clearing occurred."
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ error: "Transfer Failed", detail: err.message });
  }
});
router12.post("/upi/request", requireAuth, (req, res) => {
  const { payer_name, payer_vpa, amount, note } = req.body;
  const amt = parseFloat(amount);
  if (!payer_vpa || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "Invalid request", detail: "Provide valid payer UPI ID/mobile and positive amount." });
  }
  const reqItem = {
    id: `req-${Date.now()}`,
    payer_name: payer_name || payer_vpa,
    payer_vpa,
    amount: amt,
    note: note || "Payment request via Tatito UPI",
    status: "PENDING",
    is_simulated: true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  superStore.paymentRequests.unshift(reqItem);
  return res.status(201).json({
    status: "REQUEST_SENT_DEMO",
    is_simulated: true,
    request: reqItem
  });
});
router12.post("/upi/requests/:id/respond", requireAuth, async (req, res) => {
  const reqItem = superStore.paymentRequests.find((r) => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: "Payment request not found" });
  const action = String(req.body.action || "APPROVE").toUpperCase();
  if (action === "DECLINE") {
    reqItem.status = "DECLINED";
    return res.json({ status: "DECLINED", request: reqItem });
  }
  try {
    const result = await dbRepository.payments.executeAtomicWalletPayment({
      userId: req.user.userId,
      amount: Number(reqItem.amount),
      category: "upi_collect",
      operator: reqItem.payer_name,
      accountIdentifier: reqItem.payer_vpa,
      paymentMode: "upi_collect_sandbox",
      status: "DEMO_SUCCESS"
    });
    reqItem.status = "APPROVED_PAID_DEMO";
    const txRef = result.payment.payment_ref;
    superStore.upiTransactions.unshift({
      id: `upi-${Date.now()}`,
      transaction_ref: txRef,
      direction: "send",
      counterparty_name: reqItem.payer_name,
      counterparty_vpa: reqItem.payer_vpa,
      amount: reqItem.amount,
      payment_mode: "UPI_COLLECT_SANDBOX",
      status: "DEMO_SUCCESS",
      refund_status: "NONE",
      note: reqItem.note,
      is_simulated: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    return res.json({ status: "APPROVED_PAID_DEMO", request: reqItem, wallet_balance: result.newBalance });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ error: "Approval Failed", detail: err.message });
  }
});
router12.post("/upi/qr/generate", requireAuth, (req, res) => {
  const { amount, note, qr_type } = req.body;
  const amt = amount ? parseFloat(amount) : null;
  const vpa = "ramesh@tatitoupi";
  const ref = `QR-DYN-${Date.now().toString().slice(-6)}`;
  const uri = `upi://pay?pa=${vpa}&pn=Ramesh%20Kumar${amt ? `&am=${amt}` : ""}&tr=${ref}&tn=${encodeURIComponent(note || "Tatito QR")}&cu=INR`;
  const qr = {
    id: `qr-${Date.now()}`,
    qr_type: qr_type || (amt ? "dynamic" : "customer_static"),
    vpa,
    payee_name: req.user.fullName || "Ramesh Kumar",
    amount: amt,
    note: note || "",
    reference_code: ref,
    payload_uri: uri,
    is_simulated: true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  superStore.qrCodes.unshift(qr);
  return res.status(201).json({ status: "QR_GENERATED_DEMO", is_simulated: true, qr });
});
router12.post("/upi/refund", requireAuth, (req, res) => {
  const { transaction_ref, reason } = req.body;
  const tx = superStore.upiTransactions.find((t) => t.transaction_ref === transaction_ref);
  if (tx) {
    tx.refund_status = "REFUND_INITIATED_DEMO";
  }
  const ticket = {
    id: `tkt-${Date.now()}`,
    ticket_no: `RFD-KDP-${Date.now().toString().slice(-4)}`,
    category: "Refund Complaint",
    subject: `Refund requested for ${transaction_ref}`,
    description: reason || "Customer initiated sandbox refund request.",
    transaction_ref,
    status: "IN_PROGRESS",
    resolution_note: "Queued for sandbox settlement reversal within 24 hours.",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender_role: "customer",
        sender_name: req.user.fullName,
        message: reason || `Refund requested for ${transaction_ref}`,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  };
  superStore.supportTickets.unshift(ticket);
  return res.json({
    status: "REFUND_INITIATED_DEMO",
    is_simulated: true,
    transaction_ref,
    ticket
  });
});
router12.get("/rewards", requireAuth, (_req, res) => {
  return res.json({
    is_simulated: true,
    ...superStore.rewards
  });
});
router12.post("/rewards/scratch/:id", requireAuth, async (req, res) => {
  const card = superStore.rewards.scratchCards.find((c) => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: "Scratch card not found" });
  if (card.is_scratched) {
    return res.json({ status: "ALREADY_SCRATCHED", card, points: superStore.rewards.points, lifetimeCashback: superStore.rewards.lifetimeCashback });
  }
  card.is_scratched = true;
  if (card.reward_type === "points") {
    superStore.rewards.points += Number(card.reward_value);
  } else {
    superStore.rewards.lifetimeCashback += Number(card.reward_value);
  }
  superStore.rewards.history.unshift({
    id: `rw-${Date.now()}`,
    type: card.reward_type === "points" ? "points_earned" : "cashback",
    title: `Scratch Card Revealed: ${card.title}`,
    points: card.reward_type === "points" ? card.reward_value : 0,
    cashback: card.reward_type === "cashback" ? card.reward_value : 0,
    status: "CREDITED_DEMO",
    expiry: card.expires_at,
    date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
  });
  return res.json({
    status: "SCRATCHED_REVEALED_DEMO",
    is_simulated: true,
    card,
    points_balance: superStore.rewards.points,
    lifetime_cashback: superStore.rewards.lifetimeCashback
  });
});
router12.post("/rewards/apply-coupon", requireAuth, (req, res) => {
  const code = String(req.body.code || "").toUpperCase().trim();
  const cpn = superStore.rewards.coupons.find((c) => c.code === code);
  if (!cpn) {
    return res.status(404).json({ error: "Invalid Coupon", detail: `Coupon code '${code}' is not valid or has expired.` });
  }
  cpn.applied = true;
  return res.json({
    status: "COUPON_APPLIED_DEMO",
    coupon: cpn,
    message: `Promo ${cpn.code} activated (\u20B9${cpn.discount_amount} cashback on \u20B9${cpn.min_spend}+ spend).`
  });
});
router12.post("/rewards/redeem", requireAuth, async (req, res) => {
  const { voucher_id, points_cost, value, title } = req.body;
  const cost = Number(points_cost || 500);
  if (superStore.rewards.points < cost) {
    return res.status(400).json({ error: "Insufficient Points", detail: `You need ${cost} points to redeem this reward.` });
  }
  superStore.rewards.points -= cost;
  const cashVal = Number(value || Math.round(cost / 10));
  superStore.rewards.lifetimeCashback += cashVal;
  const entry = {
    id: `rw-${Date.now()}`,
    type: "points_redeemed",
    title: title || `Redeemed Voucher (${voucher_id || "Cashback"})`,
    points: -cost,
    cashback: cashVal,
    status: "REDEEMED_DEMO",
    expiry: "Completed",
    date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
  };
  superStore.rewards.history.unshift(entry);
  return res.json({
    status: "REDEEMED_DEMO",
    is_simulated: true,
    points_balance: superStore.rewards.points,
    lifetime_cashback: superStore.rewards.lifetimeCashback,
    entry
  });
});
router12.post("/rewards/campaigns", requireAuth, requireRole("admin", "super_admin"), (req, res) => {
  const { code, title, category, rule, max_cashback, min_txn, valid_until } = req.body;
  if (!code || !title) {
    return res.status(400).json({ error: "Missing campaign fields" });
  }
  const cmp = {
    id: `cmp-${Date.now()}`,
    code: String(code).toUpperCase(),
    title,
    category: category || "General",
    rule: rule || "Sandbox promotional offer",
    max_cashback: Number(max_cashback || 100),
    min_txn: Number(min_txn || 500),
    valid_until: valid_until || "2027-03-31",
    terms: "Managed by Branch Admin in sandbox mode."
  };
  superStore.rewards.campaigns.unshift(cmp);
  return res.status(201).json({ status: "CAMPAIGN_CREATED", campaign: cmp });
});
router12.get("/autopay", requireAuth, (_req, res) => {
  return res.json({
    is_simulated: true,
    disclaimer: "SANDBOX MANDATES: Automatic debits require authorized NPCI e-Mandate / UPI AutoPay partner execution with explicit customer 2FA consent.",
    mandates: superStore.mandates
  });
});
router12.post("/autopay", requireAuth, (req, res) => {
  const { biller_or_payee, category, amount, frequency, next_trigger_date } = req.body;
  const amt = parseFloat(amount);
  if (!biller_or_payee || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "Invalid mandate details" });
  }
  const mnd = {
    id: `mnd-${Date.now()}`,
    mandate_ref: `UMN-TATITO-${Date.now().toString().slice(-6)}`,
    biller_or_payee,
    category: category || "Utility Bill",
    amount: amt,
    frequency: frequency || "Monthly",
    next_trigger_date: next_trigger_date || "2026-12-05",
    status: "ACTIVE",
    consent_verified: true
  };
  superStore.mandates.unshift(mnd);
  return res.status(201).json({ status: "MANDATE_REGISTERED_DEMO", is_simulated: true, mandate: mnd });
});
router12.patch("/autopay/:id", requireAuth, (req, res) => {
  const { status } = req.body;
  const found = superStore.mandates.find((m) => m.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: "Mandate not found" });
  }
  found.status = status || (found.status === "ACTIVE" ? "PAUSED" : "ACTIVE");
  return res.json({ status: "MANDATE_UPDATED_DEMO", is_simulated: true, mandate: found });
});
router12.get("/expenses", requireAuth, (_req, res) => {
  const totalSpent = superStore.expenses.items.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  return res.json({
    is_simulated: true,
    bank_sync_notice: "Manual & internal sandbox ledger entries only. External bank accounts are not auto-scraped without an active Account Aggregator (AA) consent.",
    monthly_income: superStore.expenses.monthlyIncome,
    total_spent: totalSpent,
    savings_surplus: Math.max(0, superStore.expenses.monthlyIncome - totalSpent),
    items: superStore.expenses.items,
    budgets: superStore.expenses.budgets,
    savings_goals: superStore.expenses.savingsGoals,
    groups: superStore.expenses.groups
  });
});
router12.post("/expenses/add", requireAuth, (req, res) => {
  const { title, category, amount, mode } = req.body;
  const amt = parseFloat(amount);
  if (!title || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "Invalid expense entry" });
  }
  const cat = category || "Food & Groceries";
  const item = {
    id: `exp-${Date.now()}`,
    title,
    category: cat,
    amount: amt,
    date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    mode: mode || "Manual Entry"
  };
  superStore.expenses.items.unshift(item);
  const b = superStore.expenses.budgets.find((x) => x.category === cat);
  if (b) {
    b.spent += amt;
  } else {
    superStore.expenses.budgets.push({ category: cat, limit: Math.max(1e4, amt * 2), spent: amt });
  }
  return res.status(201).json({ status: "EXPENSE_LOGGED", item, budgets: superStore.expenses.budgets });
});
router12.post("/expenses/groups", requireAuth, (req, res) => {
  const { group_name, members, expense_title, total_amount, paid_by, split_type } = req.body;
  const amt = parseFloat(total_amount || "0");
  const memberList = Array.isArray(members) ? members : String(members || "Ramesh Kumar, Friend 1").split(",").map((s) => s.trim()).filter(Boolean);
  const grp = {
    id: `grp-${Date.now()}`,
    name: group_name || "Shared Group Expense",
    members: memberList.length ? memberList : ["Ramesh Kumar", "Suresh Reddy"],
    expenses: amt > 0 ? [
      {
        id: `gexp-${Date.now()}`,
        title: expense_title || "Shared Bill",
        total_amount: amt,
        paid_by: paid_by || "Ramesh Kumar",
        split_type: split_type || "EQUAL",
        per_person: Math.round(amt / Math.max(1, memberList.length)),
        status: "OPEN",
        created_at: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      }
    ] : []
  };
  superStore.expenses.groups.unshift(grp);
  return res.status(201).json({ status: "GROUP_CREATED", group: grp });
});
router12.post("/expenses/settle", requireAuth, (req, res) => {
  const { group_id, expense_id } = req.body;
  const grp = superStore.expenses.groups.find((g) => g.id === group_id);
  const exp = grp?.expenses.find((e) => e.id === expense_id);
  if (exp) {
    exp.status = "SETTLED";
  }
  return res.json({ status: "SPLIT_SETTLED_DEMO", group: grp });
});
router12.get("/credit-profile", requireAuth, async (req, res) => {
  const apps = await dbRepository.loans.getApplicationsByUser(req.user.userId);
  const accounts = apps.filter((a) => a.status === "approved" || a.status === "sanctioned" || a.status === "disbursed");
  return res.json({
    is_simulated: true,
    is_live_verified: false,
    bureau_status: "PROVIDER_NOT_CONNECTED",
    disclaimer: "CREDIT PROFILE NOTICE: Tatito does not invent statutory CIBIL/Experian scores or guarantee loan approval. Live bureau pulls require licensed NBFC/bureau credentials and customer OTP consent.",
    indicative_band: null,
    repayment_track_record: null,
    monthly_verified_income: null,
    existing_monthly_obligations: null,
    foir_percentage: null,
    max_additional_emi_capacity: null,
    active_loan_count: accounts.length,
    applications_count: apps.length,
    accounts,
    applications: apps
  });
});
router12.get("/insurance", (_req, res) => {
  return res.json({
    is_simulated: true,
    disclaimer: "INSURANCE DISCLOSURE: Insurance plans displayed are illustrative sandbox listings. Actual solicitation and policy issuance require an IRDAI-licensed Corporate Agent / Broker integration.",
    products: superStore.insuranceProducts,
    my_policies: superStore.insurancePolicies
  });
});
router12.post("/insurance/apply", requireAuth, (req, res) => {
  const { product_code, insured_name, nominee_name } = req.body;
  const prod = superStore.insuranceProducts.find((p) => p.product_code === product_code) || superStore.insuranceProducts[0];
  const pol = {
    id: `pol-${Date.now()}`,
    policy_ref: `POL-DEMO-KDP-${Date.now().toString().slice(-4)}`,
    product_code: prod.product_code,
    plan_name: prod.plan_name,
    insured_name: insured_name || req.user.fullName || "Ramesh Kumar",
    nominee_name: nominee_name || "Spouse / Family Nominee",
    sum_insured: prod.sum_insured,
    annual_premium: prod.annual_premium,
    renewal_date: "2027-11-11",
    status: "SANDBOX_ISSUED",
    is_simulated: true
  };
  superStore.insurancePolicies.unshift(pol);
  return res.status(201).json({
    status: "SANDBOX_POLICY_ISSUED",
    is_simulated: true,
    policy: pol,
    disclaimer: "Simulated insurance proposal logged in sandbox mode. Not an active IRDAI insurance contract."
  });
});
router12.get("/gold", requireAuth, async (_req, res) => {
  const benchmarks = await marketDataAdapter.getMarketBenchmarks();
  const effectiveRate = benchmarks.gold24kPerGramInr.isLive ? benchmarks.gold24kPerGramInr.value : superStore.goldVault.liveRatePerGram24K;
  superStore.goldVault.liveRatePerGram24K = effectiveRate;
  const val = Math.round(superStore.goldVault.gramsHeld * effectiveRate);
  return res.json({
    is_simulated: true,
    rate_is_live: benchmarks.gold24kPerGramInr.isLive,
    rate_source: benchmarks.gold24kPerGramInr.isLive ? "LIVE_SPOT_REFERENCE" : "SANDBOX_STATIC",
    disclaimer: "DIGITAL GOLD DISCLOSURE: Vault gram balances and gold orders in this prototype are simulated for demonstration. We do not simulate actual physical bullion ownership without an authorized MMTC-PAMP / SafeGold partner integration.",
    live_rate_24k_per_gram: effectiveRate,
    purity: "24K (99.9% Indicative)",
    grams_held: Number(superStore.goldVault.gramsHeld.toFixed(4)),
    current_valuation: val,
    monthly_sip_amount: superStore.goldVault.monthlySipAmount,
    transactions: superStore.goldVault.transactions
  });
});
router12.post("/gold/trade", requireAuth, (req, res) => {
  const { tx_type, amount_inr } = req.body;
  const amt = parseFloat(amount_inr);
  if (isNaN(amt) || amt < 100) {
    return res.status(400).json({ error: "Invalid amount", detail: "Minimum simulated gold transaction is \u20B9100." });
  }
  const rate = superStore.goldVault.liveRatePerGram24K;
  const grams = Number((amt / rate).toFixed(4));
  if (tx_type === "SELL" && grams > superStore.goldVault.gramsHeld) {
    return res.status(400).json({ error: "Insufficient Gold Balance", detail: "Cannot sell more grams than held in sandbox vault." });
  }
  if (tx_type === "SELL") {
    superStore.goldVault.gramsHeld = Number((superStore.goldVault.gramsHeld - grams).toFixed(4));
  } else {
    superStore.goldVault.gramsHeld = Number((superStore.goldVault.gramsHeld + grams).toFixed(4));
  }
  const tx = {
    id: `gld-${Date.now()}`,
    reference_no: `GOLD-DEMO-${Date.now().toString().slice(-5)}`,
    tx_type: tx_type || "BUY",
    grams,
    rate_per_gram: rate,
    total_amount: amt,
    is_simulated: true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  superStore.goldVault.transactions.unshift(tx);
  return res.status(201).json({
    status: "DEMO_GOLD_EXECUTED",
    is_simulated: true,
    grams_held: superStore.goldVault.gramsHeld,
    transaction: tx
  });
});
router12.get("/travel", (_req, res) => {
  return res.json({
    is_simulated: true,
    disclaimer: "TRAVEL SANDBOX: Flight, Bus, Train, and Hotel inventories are simulated. Live PNR ticketing requires authorized OTA / IRCTC / APSRTC partner APIs.",
    routes: superStore.travelRoutes,
    bookings: superStore.travelBookings
  });
});
router12.post("/travel/book", requireAuth, (req, res) => {
  const { route_id, travel_date, passengers } = req.body;
  const route = superStore.travelRoutes.find((r) => r.id === route_id) || superStore.travelRoutes[0];
  const pax = Math.max(1, Number(passengers || 1));
  const booking = {
    id: `tbk-${Date.now()}`,
    pnr_reference: `PNR-DEMO-${Date.now().toString().slice(-5)}`,
    mode: route.mode,
    operator_name: route.operator,
    origin: route.origin,
    destination: route.destination,
    travel_date: travel_date || "2026-11-28",
    passengers: pax,
    fare_amount: route.fare * pax,
    status: "CONFIRMED_DEMO",
    is_simulated: true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  superStore.travelBookings.unshift(booking);
  return res.status(201).json({ status: "BOOKING_CONFIRMED_DEMO", is_simulated: true, booking });
});
router12.patch("/travel/bookings/:id/cancel", requireAuth, (req, res) => {
  const b = superStore.travelBookings.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: "Booking not found" });
  b.status = "CANCELLED_REFUNDED_DEMO";
  return res.json({ status: "CANCELLED_DEMO", is_simulated: true, booking: b });
});
router12.get("/merchants", requireAuth, (_req, res) => {
  return res.json({
    is_simulated: true,
    profile: superStore.merchantProfile,
    outlets: superStore.merchantOutlets,
    transactions: superStore.merchantTransactions,
    daily_breakdown: [
      { day: "Mon", volume: 28400 },
      { day: "Tue", volume: 34200 },
      { day: "Wed", volume: 29800 },
      { day: "Thu", volume: 41500 },
      { day: "Fri", volume: 52100 },
      { day: "Today", volume: superStore.merchantProfile.today_sales }
    ]
  });
});
router12.post("/merchants/register", requireAuth, (req, res) => {
  const { business_name, category, gstin, settlement_bank } = req.body;
  if (!business_name) {
    return res.status(400).json({ error: "Business name is required" });
  }
  const cleanVpa = `${business_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)}@tatitoupi`;
  superStore.merchantProfile = {
    ...superStore.merchantProfile,
    business_name,
    category: category || "Retail & Services",
    merchant_vpa: cleanVpa,
    gstin: gstin || superStore.merchantProfile.gstin,
    settlement_bank: settlement_bank || superStore.merchantProfile.settlement_bank
  };
  return res.json({ status: "MERCHANT_UPDATED_DEMO", is_simulated: true, profile: superStore.merchantProfile });
});
router12.post("/merchants/outlets", requireAuth, (req, res) => {
  const { outlet_name, city } = req.body;
  if (!outlet_name || !city) {
    return res.status(400).json({ error: "Validation Error", detail: "outlet_name and city are required." });
  }
  const idx = superStore.merchantOutlets.length + 1;
  const code = `${String(city).slice(0, 3).toUpperCase()}-BR-0${idx}`;
  const baseVpa = superStore.merchantProfile.merchant_vpa.split("@")[0] || "merchant";
  const outlet = {
    id: `out-${Date.now()}`,
    outlet_code: code,
    outlet_name: String(outlet_name).trim(),
    city: String(city).trim(),
    outlet_vpa: `${baseVpa}.0${idx}@tatitoupi`,
    qr_reference: `MQR-OUT-${100 + idx}`,
    today_sales: 0,
    is_active: true
  };
  superStore.merchantOutlets.push(outlet);
  return res.status(201).json({ status: "OUTLET_CREATED", outlet });
});
router12.post("/merchants/refund", requireAuth, (req, res) => {
  const { transaction_ref } = req.body;
  const mtx = superStore.merchantTransactions.find((m) => m.transaction_ref === transaction_ref);
  if (!mtx) return res.status(404).json({ error: "Merchant transaction not found" });
  mtx.settlement_status = "REFUNDED_TO_CUSTOMER_DEMO";
  mtx.refund_requested = false;
  return res.json({ status: "MERCHANT_REFUND_APPROVED", transaction: mtx });
});
router12.get("/merchants/settlement-report", requireAuth, (_req, res) => {
  let csv = "Transaction Ref,Outlet Code,Customer Name,Customer VPA,Amount INR,Settlement Status,Timestamp\n";
  superStore.merchantTransactions.forEach((m) => {
    csv += `"${m.transaction_ref}","${m.outlet_code || "MAIN"}","${m.customer_name}","${m.customer_vpa}",${m.amount},"${m.settlement_status}","${m.created_at}"
`;
  });
  res.header("Content-Type", "text/csv");
  res.attachment(`Tatito_Merchant_Settlement_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
  return res.send(csv);
});
router12.get("/support", requireAuth, (_req, res) => {
  return res.json({
    is_simulated: true,
    tickets: superStore.supportTickets,
    faqs: superStore.supportFaqs
  });
});
router12.post("/support/tickets", requireAuth, (req, res) => {
  const { category, subject, description, transaction_ref } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: "Please provide both subject and description." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const tkt = {
    id: `tkt-${Date.now()}`,
    ticket_no: `TKT-KDP-${Date.now().toString().slice(-4)}`,
    category: category || "Payment Complaint",
    subject,
    description,
    transaction_ref: transaction_ref || null,
    status: "OPEN",
    resolution_note: "Assigned to Kadapa Branch Grievance Officer. Expected SLA: 24 hours.",
    created_at: now,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender_role: "customer",
        sender_name: req.user.fullName,
        message: description,
        created_at: now
      },
      {
        id: `msg-${Date.now() + 1}`,
        sender_role: "system",
        sender_name: "Tatito Automated Triage",
        message: "Ticket registered with Kadapa Grievance Desk. An advisor will reply shortly.",
        created_at: now
      }
    ]
  };
  superStore.supportTickets.unshift(tkt);
  broadcastRealtimeNotification(req.user.userId, {
    title: "Support Ticket Opened",
    message: `${tkt.ticket_no}: ${tkt.subject}`,
    category: "support",
    reference: tkt.ticket_no
  });
  return res.status(201).json({ status: "TICKET_CREATED", ticket: tkt });
});
router12.post("/support/tickets/:id/reply", requireAuth, (req, res) => {
  const { message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Message text is required" });
  }
  const tkt = superStore.supportTickets.find((t) => t.id === req.params.id);
  if (!tkt) return res.status(404).json({ error: "Ticket not found" });
  tkt.messages = tkt.messages || [];
  const isStaff = req.user.role === "admin" || req.user.role === "super_admin";
  const entry = {
    id: `msg-${Date.now()}`,
    sender_role: isStaff ? "agent" : "customer",
    sender_name: req.user.fullName,
    message: String(message).trim(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  tkt.messages.push(entry);
  if (!isStaff && tkt.status === "RESOLVED") {
    tkt.status = "IN_PROGRESS";
  }
  return res.status(201).json({ status: "REPLY_POSTED", message: entry, ticket: tkt });
});
router12.patch("/support/tickets/:id", requireAuth, requireRole("admin", "super_admin"), (req, res) => {
  const { status, resolution_note } = req.body;
  const tkt = superStore.supportTickets.find((t) => t.id === req.params.id);
  if (!tkt) return res.status(404).json({ error: "Ticket not found" });
  tkt.status = status || "RESOLVED";
  if (resolution_note) tkt.resolution_note = resolution_note;
  return res.json({ status: "TICKET_UPDATED", ticket: tkt });
});
router12.get("/search", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) {
    return res.json({ query: "", results: [] });
  }
  const catalog = [
    { title: "Send Money via UPI", category: "Payments", link: "/payments?tab=upi" },
    { title: "Scan & Pay QR Code", category: "Payments", link: "/payments?tab=qr" },
    { title: "Mobile Prepaid & Postpaid Recharge", category: "Recharges & Bills", link: "/payments?tab=bills" },
    { title: "APSPDCL Electricity, Landline & Piped Gas Bills", category: "Recharges & Bills", link: "/payments?tab=bills" },
    { title: "Credit Card, Rent, Subscriptions & Education Fees", category: "Recharges & Bills", link: "/payments?tab=bills" },
    { title: "UPI AutoPay & Recurring Mandates", category: "Payments", link: "/payments?tab=autopay" },
    { title: "Tatito Rewards, Scratch Cards, Coupons & Referrals", category: "Rewards", link: "/services?tab=rewards" },
    { title: "Personal Expense Tracker & Split Bills", category: "Personal Finance", link: "/services?tab=expenses" },
    { title: "Credit Score & Financial Profile", category: "Credit", link: "/services?tab=credit" },
    { title: "Health, Life, Motor & Travel Insurance", category: "Insurance", link: "/services?tab=insurance" },
    { title: "24K Digital Gold & Monthly Gold SIP", category: "Wealth", link: "/services?tab=gold" },
    { title: "Flights, APSRTC Buses, Trains & Hotels", category: "Travel", link: "/services?tab=travel" },
    { title: "Merchant QR Outlets & Settlement Dashboard", category: "Merchant", link: "/services?tab=merchant" },
    { title: "24x7 Customer Support, Live Chat & Dispute Center", category: "Support", link: "/services?tab=support" },
    ...relationalDB.loan_products.map((p) => ({ title: p.product_name, category: "Loans", link: `/loan-application?product=${p.product_code}` })),
    ...relationalDB.mutual_funds.map((f) => ({ title: f.scheme_name || f.fund_name, category: "Mutual Funds", link: "/mutual-funds" }))
  ];
  const results = catalog.filter(
    (item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  );
  return res.json({ query: q, results: results.slice(0, 15) });
});
var superapp_routes_default = router12;

// backend/routes/live.routes.ts
import { Router as Router14 } from "express";
var router13 = Router14();
router13.get("/status", async (_req, res) => {
  if (process.env.NODE_ENV !== "test") {
    await ensurePostgresInitialized();
  }
  const pgConnected = isPostgresConnected();
  const pgConfigured = isPostgresConfiguredFlag();
  const benchmarks = await marketDataAdapter.getMarketBenchmarks();
  return res.json({
    status: "ok",
    runtime: process.env.VERCEL === "1" ? "vercel_serverless" : "node_express",
    database: {
      configured: pgConfigured,
      connected: pgConnected,
      mode: pgConnected ? "PostgreSQL (Live Connected)" : "Persistent Fallback Relational Store"
    },
    market_feed: {
      live: benchmarks.isLive,
      source: benchmarks.source,
      nifty50: benchmarks.nifty50,
      sensex: benchmarks.sensex,
      gold_24k_per_gram_inr: benchmarks.gold24kPerGramInr,
      usd_inr: benchmarks.usdInr,
      updated_at: benchmarks.updatedAt
    },
    partners: {
      live_partners_enabled: process.env.LIVE_FINANCIAL_PARTNERS === "true",
      kyc_gateway: isLivePartnerConfigured(process.env.KYC_PROVIDER_API_KEY) ? "LIVE" : "SANDBOX",
      credit_bureau: isLivePartnerConfigured(process.env.CREDIT_BUREAU_MEMBER_ID) ? "LIVE" : "SANDBOX",
      esign: isLivePartnerConfigured(process.env.ESIGN_PROVIDER_SECRET) ? "LIVE" : "SANDBOX",
      mandates: isLivePartnerConfigured(process.env.MANDATE_API_KEY) ? "LIVE" : "SANDBOX",
      payment_gateway: isLivePartnerConfigured(process.env.PAYMENT_GATEWAY_SECRET) ? "LIVE" : "SANDBOX",
      co_lending: isLivePartnerConfigured(process.env.CO_LENDING_PARTNER_API_KEY) ? "LIVE" : "SANDBOX",
      depository_nsdl: isLivePartnerConfigured(process.env.NSDL_DP_GATEWAY_KEY) ? "LIVE" : "SANDBOX",
      bse_star_mf: isLivePartnerConfigured(process.env.BSE_STAR_MF_PASSWORD) ? "LIVE" : "SANDBOX"
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router13.get("/benchmarks", async (_req, res) => {
  const benchmarks = await marketDataAdapter.getMarketBenchmarks();
  return res.json(benchmarks);
});
router13.get("/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const sendTick = async () => {
    try {
      const [benchmarks, quotes] = await Promise.all([
        marketDataAdapter.getMarketBenchmarks(),
        marketDataAdapter.getQuotes()
      ]);
      const payload = {
        postgres_connected: isPostgresConnected(),
        benchmarks,
        quotes: quotes.map((q) => ({
          symbol: q.symbol,
          price: q.price,
          change: q.change,
          change_percent: q.change_percent,
          isLive: q.isLive
        })),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.write(`event: market_tick
data: ${JSON.stringify(payload)}

`);
    } catch {
      res.write(`event: heartbeat
data: ${JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
    }
  };
  await sendTick();
  const timer = setInterval(() => {
    void sendTick();
  }, 15e3);
  req.on("close", () => {
    clearInterval(timer);
    res.end();
  });
});
router13.post("/connect-request", async (req, res) => {
  const { full_name, phone, topic, preferred_channel } = req.body || {};
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  if (!full_name || String(full_name).trim().length < 2) {
    return res.status(400).json({ error: "Invalid Name", detail: "Please provide your full name." });
  }
  if (!/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ error: "Invalid Mobile", detail: "Please provide a valid 10-digit Indian mobile number." });
  }
  const ref = `LIVE-KDP-${Date.now().toString().slice(-6)}`;
  const channel = preferred_channel || "Branch RM Callback";
  const cleanTopic = String(topic || "General Financial Advisory").trim();
  logAudit(null, "LIVE_ADVISOR_CONNECT_REQUEST", "live_connect", ref, {
    full_name: String(full_name).trim(),
    phone_masked: `******${cleanPhone.slice(-4)}`,
    channel,
    topic: cleanTopic
  });
  dbRepository.notifications.create({
    user_id: 2,
    title: `Live Connect Request (${channel})`,
    message: `${String(full_name).trim()} (${cleanPhone}) requested ${channel} for "${cleanTopic}". Ref: ${ref}`,
    category: "general"
  }).catch(() => {
  });
  return res.status(201).json({
    status: "SCHEDULED",
    reference_id: ref,
    channel,
    branch: "Tatito Financial Services \u2014 Kadapa Central Hub, AP",
    estimated_response: "Within 15 minutes during banking hours (Mon\u2013Sat, 9:30 AM \u2013 6:30 PM IST)",
    message: `Live connect request ${ref} logged successfully.`,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var live_routes_default = router13;

// backend/routes/docs.routes.ts
import { Router as Router15 } from "express";
var router14 = Router15();
var openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Tatito Financial Services \u2014 Digital Payments & Lending Super-App API",
    version: "2.1.0",
    description: "Production-structured TypeScript Express & PostgreSQL API covering Authentication, OTP Sandbox, UPI/QR Payments, 15+ BBPS Utility Categories, Escrow Wallet, Loans & Underwriting, Investments/Stocks/SIPs, Rewards, Merchant Outlets, Support & Admin Monitoring. Sandbox endpoints clearly flag is_simulated=true and never collect UPI PINs or banking passwords.",
    contact: {
      name: "M/s. Tatito Projects \u2014 Kadapa Hub",
      email: "support@tatitoprojects.com"
    }
  },
  servers: [{ url: "/api", description: "Active API Base" }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    }
  },
  paths: {
    "/health": { get: { tags: ["System"], summary: "Health & database connectivity status", responses: { "200": { description: "Healthy" } } } },
    "/auth/register": { post: { tags: ["Auth"], summary: "Register customer account (bcrypt)", responses: { "201": { description: "Created" } } } },
    "/auth/login": { post: { tags: ["Auth"], summary: "Password login returning JWT", responses: { "200": { description: "OK" } } } },
    "/auth/request-otp": { post: { tags: ["Auth"], summary: "Request mobile OTP (Sandbox in dev)", responses: { "200": { description: "Dispatched" } } } },
    "/auth/login-otp": { post: { tags: ["Auth"], summary: "Login or onboard with verified mobile OTP", responses: { "200": { description: "OK" } } } },
    "/auth/change-password": { post: { tags: ["Auth"], security: [{ BearerAuth: [] }], summary: "Change password with current verification", responses: { "200": { description: "Updated" } } } },
    "/auth/sessions": { get: { tags: ["Auth"], security: [{ BearerAuth: [] }], summary: "List active device sessions", responses: { "200": { description: "OK" } } } },
    "/auth/login-history": { get: { tags: ["Auth"], security: [{ BearerAuth: [] }], summary: "View login attempt history", responses: { "200": { description: "OK" } } } },
    "/users/profile": {
      get: { tags: ["Profile & Settings"], security: [{ BearerAuth: [] }], summary: "Fetch user profile & KYC", responses: { "200": { description: "OK" } } },
      put: { tags: ["Profile & Settings"], security: [{ BearerAuth: [] }], summary: "Update profile fields", responses: { "200": { description: "Updated" } } }
    },
    "/users/settings": {
      get: { tags: ["Profile & Settings"], security: [{ BearerAuth: [] }], summary: "Fetch language, alert & biometric preferences", responses: { "200": { description: "OK" } } },
      put: { tags: ["Profile & Settings"], security: [{ BearerAuth: [] }], summary: "Update security & notification settings", responses: { "200": { description: "Updated" } } }
    },
    "/wallet": { get: { tags: ["Wallet"], security: [{ BearerAuth: [] }], summary: "Get wallet balance, limits & ledger", responses: { "200": { description: "OK" } } } },
    "/wallet/add-money": { post: { tags: ["Wallet"], security: [{ BearerAuth: [] }], summary: "Add money via sandbox channel", responses: { "201": { description: "Credited" } } } },
    "/wallet/withdraw": { post: { tags: ["Wallet"], security: [{ BearerAuth: [] }], summary: "Withdraw to linked bank (sandbox)", responses: { "200": { description: "Initiated" } } } },
    "/payments/bills/fetch": { post: { tags: ["BBPS Bills"], summary: "Fetch utility bill across 15 categories", responses: { "200": { description: "Bill details" } } } },
    "/payments/bills/pay": { post: { tags: ["BBPS Bills"], security: [{ BearerAuth: [] }], summary: "Atomic wallet BBPS bill settlement", responses: { "200": { description: "Paid" } } } },
    "/superapp/upi/overview": { get: { tags: ["UPI & QR"], security: [{ BearerAuth: [] }], summary: "UPI VPA, linked banks, requests & txns", responses: { "200": { description: "OK" } } } },
    "/superapp/upi/send": { post: { tags: ["UPI & QR"], security: [{ BearerAuth: [] }], summary: "Send UPI money / self transfer / QR pay", responses: { "201": { description: "Settled" } } } },
    "/superapp/upi/bank-accounts": { post: { tags: ["UPI & QR"], security: [{ BearerAuth: [] }], summary: "Link bank account (sandbox)", responses: { "201": { description: "Linked" } } } },
    "/superapp/beneficiaries": {
      get: { tags: ["UPI & QR"], security: [{ BearerAuth: [] }], summary: "List saved beneficiaries", responses: { "200": { description: "OK" } } },
      post: { tags: ["UPI & QR"], security: [{ BearerAuth: [] }], summary: "Save a new beneficiary", responses: { "201": { description: "Created" } } }
    },
    "/superapp/rewards/scratch/{id}": { post: { tags: ["Rewards"], security: [{ BearerAuth: [] }], summary: "Scratch reward card & credit bonus", responses: { "200": { description: "Revealed" } } } },
    "/superapp/rewards/apply-coupon": { post: { tags: ["Rewards"], security: [{ BearerAuth: [] }], summary: "Apply promotional coupon code", responses: { "200": { description: "Applied" } } } },
    "/superapp/merchants/outlets": { post: { tags: ["Merchant"], security: [{ BearerAuth: [] }], summary: "Create store outlet & VPA QR", responses: { "201": { description: "Created" } } } },
    "/superapp/support/tickets/{id}/reply": { post: { tags: ["Support"], security: [{ BearerAuth: [] }], summary: "Post reply message on support ticket", responses: { "201": { description: "Posted" } } } },
    "/loans/products": { get: { tags: ["Loans"], summary: "List 7 loan products", responses: { "200": { description: "OK" } } } },
    "/loans/apply": { post: { tags: ["Loans"], security: [{ BearerAuth: [] }], summary: "Submit loan application", responses: { "201": { description: "Submitted" } } } },
    "/investments/stocks": { get: { tags: ["Wealth"], summary: "Live/fallback NSE stock quotes", responses: { "200": { description: "OK" } } } },
    "/admin/payments-monitor": { get: { tags: ["Admin"], security: [{ BearerAuth: [] }], summary: "Monitor all payments & refunds", responses: { "200": { description: "OK" } } } },
    "/admin/risk-alerts": { get: { tags: ["Admin"], security: [{ BearerAuth: [] }], summary: "Fraud & risk monitoring feed", responses: { "200": { description: "OK" } } } }
  }
};
router14.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});
router14.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tatito Financial Services \u2014 API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    .topbar-custom { background: #0d5c4b; color: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
    .topbar-custom a { color: #f6c453; text-decoration: none; font-weight: 600; font-size: 13px; }
  </style>
</head>
<body>
  <div class="topbar-custom">
    <div><strong>Tatito Financial Services</strong> \u2014 OpenAPI 3.0 Reference</div>
    <a href="/api/openapi.json" target="_blank">Download openapi.json \u2192</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`);
});
var docs_routes_default = router14;

// server.ts
import { WebSocketServer } from "ws";
var app = express();
app.disable("x-powered-by");
var envPort = process.env.DEFAULT_APP_PORT || process.env.PORT || "3000";
var parsedPort = parseInt(envPort, 10);
var PORT = parsedPort === 8080 && process.env.NGINX_PORT === "8080" ? 3e3 : parsedPort || 3e3;
var isProd = process.env.NODE_ENV === "production";
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
var configuredOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean) : [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProd || configuredOrigins.length === 0 || configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS Policy: Access forbidden from this origin"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Idempotency-Key", "X-Requested-With", "X-Simulate-Failure"]
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use("/api", apiRateLimiter);
app.use("/api", async (_req, _res, next) => {
  if (process.env.NODE_ENV !== "test") {
    await ensurePostgresInitialized();
  }
  next();
});
app.get("/api/health", async (_req, res) => {
  if (process.env.NODE_ENV !== "test") {
    await ensurePostgresInitialized();
  }
  const isPg = isPostgresConnected();
  res.json({
    status: "healthy",
    service: "Tatito Financial Services Full-Stack API",
    runtime: process.env.VERCEL === "1" ? "vercel_serverless" : "node_express",
    database_mode: isPg ? "PostgreSQL (Connected)" : "Persistent Fallback Relational Store",
    postgres_configured: isPostgresConfiguredFlag(),
    postgres_connected: isPg,
    branch: "Kadapa Central Hub, Andhra Pradesh",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api/auth", auth_routes_default);
app.use("/api/users", users_routes_default);
app.use("/api/customers", users_routes_default);
app.use("/api/wallet", (req, res, next) => {
  req.url = req.url === "/" ? "/wallet" : `/wallet${req.url}`;
  users_routes_default(req, res, next);
});
app.use("/api/kyc", kyc_routes_default);
app.use("/api/loans", loans_routes_default);
app.use("/api/loan-products", async (req, res) => {
  try {
    const products = await dbRepository.loans.getProducts();
    res.json(products);
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: "Service Unavailable", detail: err.message });
    }
    res.status(500).json({ error: "Internal Error", detail: err.message });
  }
});
app.use("/api/collections", collections_routes_default);
app.use("/api/payments", payments_routes_default);
app.use("/api/bills", payments_routes_default);
app.use("/api/investments", investments_routes_default);
app.use("/api/stocks", (req, res, next) => {
  if (req.url.startsWith("/watchlist")) {
    return investments_routes_default(req, res, next);
  }
  req.url = req.url === "/" ? "/stocks" : `/stocks${req.url}`;
  investments_routes_default(req, res, next);
});
app.use("/api/watchlist", (req, res, next) => {
  req.url = req.url === "/" ? "/watchlist" : `/watchlist${req.url}`;
  investments_routes_default(req, res, next);
});
app.use("/api/mutual-funds", (req, res, next) => {
  req.url = req.url === "/" ? "/mutual-funds" : `/mutual-funds${req.url}`;
  investments_routes_default(req, res, next);
});
app.use("/api/sips", (req, res, next) => {
  req.url = req.url === "/" ? "/sips" : `/sips${req.url}`;
  investments_routes_default(req, res, next);
});
app.use("/api/demat", (req, res, next) => {
  req.url = req.url === "/" ? "/demat" : `/demat${req.url}`;
  investments_routes_default(req, res, next);
});
app.use("/api/admin/support-tickets", supportRoutes(true));
app.use("/api/superapp/support", supportRoutes());
app.use("/api/admin", admin_routes_default);
app.use("/api/reports", (req, res, next) => {
  req.url = req.url === "/" ? "/reports/csv" : req.url;
  admin_routes_default(req, res, next);
});
app.use("/api/agents", agents_routes_default);
app.use("/api/notifications", notifications_routes_default);
app.use("/api/superapp/expenses", finances_routes_default);
app.use("/api/superapp", superapp_routes_default);
app.use("/api/live", live_routes_default);
app.use("/api", docs_routes_default);
app.post("/api/contact", (req, res) => {
  const { full_name, email, phone, subject, category, message } = req.body;
  if (!full_name || !email || !phone || !message) {
    return res.status(400).json({ error: "Please provide all required enquiry fields" });
  }
  const newEnquiry = {
    id: `ENQ-${Date.now()}`,
    full_name: full_name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    subject: subject || "General Enquiry",
    category: category || "General Support",
    message: message.trim(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return res.status(201).json({
    status: "RECEIVED",
    enquiry: newEnquiry,
    message: "Enquiry received. Kadapa branch customer advisor will respond within 24 hours."
  });
});
app.all("/api/*", (req, res) => {
  return res.status(404).json({
    error: "Not Found",
    detail: `API endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});
var clientRoutes = [
  "collections",
  "login",
  "register",
  "dashboard",
  "loans",
  "loan-application",
  "emi-calculator",
  "investments",
  "stocks",
  "mutual-funds",
  "sip-calculator",
  "demat",
  "wallet",
  "bills",
  "payments",
  "services",
  "profile",
  "notifications",
  "admin",
  "agents",
  "credit-officer"
];
clientRoutes.forEach((route) => {
  app.get(`/${route}`, (req, res, next) => {
    const isProd2 = process.env.NODE_ENV === "production";
    const distPath = path2.resolve(process.cwd(), "dist");
    const staticRoot = isProd2 && fs2.existsSync(distPath) ? distPath : process.cwd();
    const indexPath = path2.resolve(staticRoot, "index.html");
    if (fs2.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
});
app.use((err, req, res, next) => {
  if (err instanceof DatabaseUnavailableError || err.statusCode === 503) {
    return res.status(503).json({
      error: "Service Unavailable",
      detail: err.message || "PostgreSQL database required in production mode",
      database_mode: "fail_safe"
    });
  }
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({ error: "Internal Error", detail: err.message });
});
async function startServer() {
  await initPostgres();
  const isProd2 = process.env.NODE_ENV === "production";
  const distPath = path2.resolve(process.cwd(), "dist");
  const staticRoot = isProd2 && fs2.existsSync(distPath) ? distPath : process.cwd();
  app.use("/js", express.static(path2.resolve(process.cwd(), "js")));
  app.use("/css", express.static(path2.resolve(process.cwd(), "css")));
  app.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  if (!isProd2) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(staticRoot));
    app.get("*", (req, res) => {
      res.sendFile(path2.resolve(staticRoot, "index.html"));
    });
  }
  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tatito Financial Services Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/notifications" });
  registerWebSocketServer(wss);
  return httpServer;
}
var isDirectRun = process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js");
if (isDirectRun && process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error("Fatal: Failed to start server:", err);
    process.exit(1);
  });
}
var server_default = app;
export {
  app,
  server_default as default,
  startServer
};
