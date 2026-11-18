// Shared Super-App 2.0 + Security & Admin state store
// Persists in-process across superapp, auth, users, and admin routes with full Kadapa demo parity.

export interface SupportMessageItem {
  id: string;
  sender_role: 'customer' | 'agent' | 'system';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface UserSessionRecord {
  id: string;
  user_id: number;
  device: string;
  ip: string;
  channel: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
}

export interface LoginHistoryRecord {
  id: string;
  user_id: number;
  email_or_phone: string;
  channel: string;
  device: string;
  ip: string;
  status: 'SUCCESS' | 'FAILED';
  created_at: string;
}

export interface UserSecuritySettings {
  preferred_language: 'English' | 'Telugu' | 'Hindi';
  push_alerts: boolean;
  email_alerts: boolean;
  sms_alerts: boolean;
  biometric_lock_enabled: boolean;
  mask_balances_by_default: boolean;
  upi_pin_mode: string;
  deletion_requested: boolean;
}

export const superStore = {
  linkedAccounts: [
    {
      id: 'acc-1',
      bank_name: 'State Bank of India (Kadapa Main)',
      masked_account: '•••• •••• 4821',
      ifsc: 'SBIN0000830',
      upi_vpa: 'ramesh@tatitoupi',
      account_type: 'Savings Account',
      is_primary: true,
      balance_check_mode: 'SANDBOX_SIMULATED',
      simulated_bank_balance: 68450
    },
    {
      id: 'acc-2',
      bank_name: 'Union Bank of India (Trunk Road AP)',
      masked_account: '•••• •••• 9104',
      ifsc: 'UBIN0802411',
      upi_vpa: 'ramesh.ub@tatitoupi',
      account_type: 'Savings Account',
      is_primary: false,
      balance_check_mode: 'SANDBOX_SIMULATED',
      simulated_bank_balance: 32100
    }
  ],
  beneficiaries: [
    {
      id: 'ben-1',
      name: 'Suresh Kumar Reddy',
      vpa: 'suresh.reddy@tatitoupi',
      mobile: '9848011223',
      bank_masked: 'HDFC •••• 3412',
      nickname: 'Business Supplier'
    },
    {
      id: 'ben-2',
      name: 'Lakshmi Narayana Rao',
      vpa: 'lakshmi.rao@tatitoupi',
      mobile: '9440811223',
      bank_masked: 'SBI •••• 7740',
      nickname: 'Family'
    },
    {
      id: 'ben-3',
      name: 'Kiran Naidu',
      vpa: 'kiran.naidu@tatitoupi',
      mobile: '9849022334',
      bank_masked: 'ICICI •••• 5509',
      nickname: 'Transit Split'
    }
  ],
  upiTransactions: [
    {
      id: 'upi-101',
      transaction_ref: 'UPI-DEMO-98412041',
      direction: 'send',
      counterparty_name: 'Sri Venkateswara Provision Store',
      counterparty_vpa: 'svstore.kdp@tatitoupi',
      amount: 640,
      payment_mode: 'UPI_QR_SANDBOX',
      status: 'DEMO_SUCCESS',
      refund_status: 'NONE',
      note: 'Monthly grocery supplies',
      is_simulated: true,
      created_at: '2026-11-09T14:20:00.000Z'
    },
    {
      id: 'upi-102',
      transaction_ref: 'UPI-DEMO-98411902',
      direction: 'receive',
      counterparty_name: 'Suresh Kumar Reddy',
      counterparty_vpa: 'suresh.reddy@tatitoupi',
      amount: 2500,
      payment_mode: 'UPI_P2P_SANDBOX',
      status: 'DEMO_SUCCESS',
      refund_status: 'NONE',
      note: 'Shared dinner & fuel split settlement',
      is_simulated: true,
      created_at: '2026-11-08T09:15:00.000Z'
    },
    {
      id: 'upi-103',
      transaction_ref: 'UPI-DEMO-98411588',
      direction: 'self_transfer',
      counterparty_name: 'Self Transfer (SBI ••4821 → UBI ••9104)',
      counterparty_vpa: 'ramesh.ub@tatitoupi',
      amount: 5000,
      payment_mode: 'UPI_SELF_SANDBOX',
      status: 'DEMO_SUCCESS',
      refund_status: 'NONE',
      note: 'Savings reserve transfer',
      is_simulated: true,
      created_at: '2026-11-05T17:40:00.000Z'
    }
  ],
  paymentRequests: [
    {
      id: 'req-1',
      payer_name: 'Kiran Naidu',
      payer_vpa: 'kiran.naidu@tatitoupi',
      amount: 1200,
      note: 'Tirupati bus ticket share',
      status: 'PENDING',
      created_at: '2026-11-10T11:00:00.000Z'
    }
  ],
  qrCodes: [
    {
      id: 'qr-static-customer',
      qr_type: 'customer_static',
      vpa: 'ramesh@tatitoupi',
      payee_name: 'Ramesh Kumar',
      amount: null as number | null,
      reference_code: 'QR-CUST-KDP-89104',
      payload_uri: 'upi://pay?pa=ramesh@tatitoupi&pn=Ramesh%20Kumar&cu=INR'
    }
  ],
  rewards: {
    points: 1450,
    lifetimeCashback: 540,
    referralCode: 'TATITO-KDP-2026',
    scratchCards: [
      {
        id: 'sc-1',
        code: 'SCRATCH-AP-101',
        title: 'APSPDCL Bill Payment Bonus',
        reward_type: 'cashback',
        reward_value: 45,
        is_scratched: false,
        expires_at: '2026-12-31'
      },
      {
        id: 'sc-2',
        code: 'SCRATCH-UPI-102',
        title: 'UPI Scan & Pay Lucky Card',
        reward_type: 'points',
        reward_value: 200,
        is_scratched: false,
        expires_at: '2026-12-20'
      },
      {
        id: 'sc-3',
        code: 'SCRATCH-SIP-103',
        title: 'Wealth SIP Milestone Scratch Card',
        reward_type: 'cashback',
        reward_value: 75,
        is_scratched: true,
        expires_at: '2026-11-30'
      }
    ],
    coupons: [
      {
        id: 'cpn-1',
        code: 'POWER50',
        title: 'Flat ₹50 Cashback on Electricity & Water Bills',
        discount_amount: 50,
        min_spend: 800,
        valid_until: '2026-12-31',
        applied: false
      },
      {
        id: 'cpn-2',
        code: 'TATITOGOLD',
        title: '₹100 Bonus Gold Credit on ₹2,000+ 24K Gold Purchase',
        discount_amount: 100,
        min_spend: 2000,
        valid_until: '2027-01-31',
        applied: false
      },
      {
        id: 'cpn-3',
        code: 'FASTAG25',
        title: 'Flat ₹25 Cashback on NHAI FASTag Recharge',
        discount_amount: 25,
        min_spend: 500,
        valid_until: '2026-12-31',
        applied: false
      }
    ],
    history: [
      { id: 'rw-1', type: 'cashback', title: 'APSPDCL Electricity Bill Cashback', points: 100, cashback: 50, status: 'CREDITED_DEMO', expiry: '2026-12-31', date: '2026-11-08' },
      { id: 'rw-2', type: 'points_earned', title: 'On-Time Personal Loan EMI Bonus', points: 350, cashback: 0, status: 'CREDITED_DEMO', expiry: '2027-03-31', date: '2026-11-04' },
      { id: 'rw-3', type: 'referral', title: 'Referral Bonus — Lakshmi Narayana Joined', points: 250, cashback: 100, status: 'CREDITED_DEMO', expiry: 'No Expiry', date: '2026-10-29' }
    ],
    campaigns: [
      {
        id: 'cmp-1',
        code: 'POWER50',
        title: 'Flat ₹50 Cashback on Electricity Bills',
        category: 'Bills & Utilities',
        rule: 'Min bill ₹800 on APSPDCL/TSSPDCL via Tatito Wallet or UPI Sandbox',
        max_cashback: 50,
        min_txn: 800,
        valid_until: '2026-12-31',
        terms: 'Applicable once per calendar month in sandbox mode. Subject to partner settlement.'
      },
      {
        id: 'cmp-2',
        code: 'SIPBOOST',
        title: '500 Reward Points on First Direct Mutual Fund SIP',
        category: 'Wealth & SIP',
        rule: 'Start a monthly SIP of ₹1,000+ in any Index or Flexi-Cap fund',
        max_cashback: 100,
        min_txn: 1000,
        valid_until: '2027-01-31',
        terms: 'Points redeemable at 10 points = ₹1 sandbox wallet credit.'
      },
      {
        id: 'cmp-3',
        code: 'GOLDEXPRESS',
        title: 'Zero Processing Fee Voucher on Hallmark Gold Loan',
        category: 'Loans',
        rule: 'Redeem 500 points for 100% processing fee waiver at Kadapa Branch',
        max_cashback: 1500,
        min_txn: 50000,
        valid_until: '2026-12-15',
        terms: 'Valid on physical gold verification at Trunk Road, Kadapa branch.'
      }
    ],
    vouchers: [
      { id: 'vch-1', brand: 'APSRTC Bus Pass Voucher', value: 150, points_cost: 600, code: 'TATITO-BUS-150', expiry: '2026-12-31' },
      { id: 'vch-2', brand: 'Tatito Loan Processing Fee Waiver', value: 500, points_cost: 1000, code: 'TATITO-LOAN-500', expiry: '2027-01-31' },
      { id: 'vch-3', brand: 'Instant Wallet Cashback ₹100', value: 100, points_cost: 800, code: 'WALLET-CASH-100', expiry: 'Immediate' }
    ],
    referrals: [
      { id: 'ref-1', name: 'Lakshmi Narayana Rao', mobile: '98480•••12', status: 'KYC Completed (Demo)', reward: '250 pts + ₹100', date: '2026-10-29' },
      { id: 'ref-2', name: 'Venkata Subbaiah', mobile: '94402•••89', status: 'Registered', reward: '250 pts pending first txn', date: '2026-11-06' }
    ]
  },
  mandates: [
    {
      id: 'mnd-1',
      mandate_ref: 'UMN-TATITO-882101',
      biller_or_payee: 'Tatito Personal Loan EMI (TLN-KDP-2026-001)',
      category: 'Loan EMI',
      amount: 22100,
      frequency: 'Monthly',
      next_trigger_date: '2026-11-20',
      status: 'ACTIVE',
      consent_verified: true
    },
    {
      id: 'mnd-2',
      mandate_ref: 'UMN-TATITO-882102',
      biller_or_payee: 'Nifty 50 Index Direct Plan — SIP',
      category: 'Mutual Fund SIP',
      amount: 5000,
      frequency: 'Monthly',
      next_trigger_date: '2026-11-15',
      status: 'ACTIVE',
      consent_verified: true
    },
    {
      id: 'mnd-3',
      mandate_ref: 'UMN-TATITO-882103',
      biller_or_payee: 'APSPDCL Southern Power Electricity',
      category: 'Utility Bill',
      amount: 1450,
      frequency: 'Monthly',
      next_trigger_date: '2026-11-18',
      status: 'ACTIVE',
      consent_verified: true
    },
    {
      id: 'mnd-4',
      mandate_ref: 'UMN-TATITO-882104',
      biller_or_payee: 'ACT Fibernet Broadband 150 Mbps',
      category: 'Subscription / Broadband',
      amount: 825,
      frequency: 'Monthly',
      next_trigger_date: '2026-11-25',
      status: 'PAUSED',
      consent_verified: true
    }
  ],
  expenses: {
    monthlyIncome: 85000,
    items: [
      { id: 'exp-1', title: 'Personal Loan Monthly EMI', category: 'Loan EMIs', amount: 22100, date: '2026-11-05', mode: 'Wallet Auto-Debit' },
      { id: 'exp-2', title: 'Nifty 50 & Flexi-Cap SIPs', category: 'Investments & SIP', amount: 10000, date: '2026-11-05', mode: 'UPI AutoPay' },
      { id: 'exp-3', title: 'Groceries & Household Provision', category: 'Food & Groceries', amount: 8400, date: '2026-11-07', mode: 'UPI Scan & Pay' },
      { id: 'exp-4', title: 'APSPDCL Electricity & Indane Gas', category: 'Utilities & Bills', amount: 2390, date: '2026-11-08', mode: 'BBPS Bill Desk' },
      { id: 'exp-5', title: 'Fuel & APSRTC Highway Transit', category: 'Travel & Fuel', amount: 4200, date: '2026-11-09', mode: 'FASTag & UPI' }
    ],
    budgets: [
      { category: 'Loan EMIs', limit: 25000, spent: 22100 },
      { category: 'Investments & SIP', limit: 15000, spent: 10000 },
      { category: 'Food & Groceries', limit: 12000, spent: 8400 },
      { category: 'Utilities & Bills', limit: 4500, spent: 2390 },
      { category: 'Travel & Fuel', limit: 6000, spent: 4200 }
    ],
    savingsGoals: [
      { id: 'goal-1', name: 'Family Emergency Reserve (6 Months)', target: 300000, current: 185000, deadline: '2027-06-30' },
      { id: 'goal-2', name: '24K Digital Gold Festival Accumulation', target: 100000, current: 42500, deadline: '2027-01-15' }
    ],
    groups: [
      {
        id: 'grp-1',
        name: 'Tirupati & Horsley Hills Weekend Trip',
        members: ['Ramesh Kumar', 'Suresh Reddy', 'Kiran Naidu', 'Anil Varma'],
        expenses: [
          {
            id: 'gexp-1',
            title: 'Tempo Traveller & Toll FASTag',
            total_amount: 4800,
            paid_by: 'Ramesh Kumar',
            split_type: 'EQUAL',
            per_person: 1200,
            status: 'OPEN',
            created_at: '2026-11-09'
          },
          {
            id: 'gexp-2',
            title: 'Hill Resort Dinner & Stay',
            total_amount: 6400,
            paid_by: 'Suresh Reddy',
            split_type: 'EQUAL',
            per_person: 1600,
            status: 'SETTLED',
            created_at: '2026-11-10'
          }
        ]
      }
    ]
  },
  insuranceProducts: [
    {
      id: 'ins-1',
      product_code: 'INS-HEALTH-CARE',
      category: 'Health insurance',
      plan_name: 'Tatito Family Floater Health Shield',
      partner_insurer: 'Star Health & Allied Insurance (Partner Sandbox)',
      sum_insured: 1000000,
      annual_premium: 9450,
      coverage_highlights: 'Cashless treatment at 140+ network hospitals across AP & Telangana · Zero room rent cap · Annual health checkup'
    },
    {
      id: 'ins-2',
      product_code: 'INS-LIFE-TERM',
      category: 'Life insurance',
      plan_name: 'Pure Term Life Protection Plan',
      partner_insurer: 'HDFC Life / LIC Partner Sandbox',
      sum_insured: 10000000,
      annual_premium: 11200,
      coverage_highlights: '₹1 Crore life cover till age 65 · Critical illness rider option · Tax benefit under Sec 80C'
    },
    {
      id: 'ins-3',
      product_code: 'INS-MOTOR-COMP',
      category: 'Motor insurance',
      plan_name: 'Zero-Dep Car & Two-Wheeler Cover',
      partner_insurer: 'ICICI Lombard General Insurance Sandbox',
      sum_insured: 650000,
      annual_premium: 4850,
      coverage_highlights: 'Instant policy issuance · Roadside assistance across NH-40 · Zero depreciation bumper-to-bumper'
    },
    {
      id: 'ins-4',
      product_code: 'INS-TRAVEL-SAFE',
      category: 'Travel insurance',
      plan_name: 'Domestic & International Trip Guard',
      partner_insurer: 'Bajaj Allianz General Sandbox',
      sum_insured: 500000,
      annual_premium: 499,
      coverage_highlights: 'Flight/train delay cover · Baggage loss protection · Emergency medical evacuation'
    },
    {
      id: 'ins-5',
      product_code: 'INS-ACCIDENT-PA',
      category: 'Personal accident',
      plan_name: '24x7 Personal Accident & Disability Cover',
      partner_insurer: 'New India Assurance Sandbox',
      sum_insured: 2500000,
      annual_premium: 1250,
      coverage_highlights: 'Accidental hospitalisation · Temporary total disability weekly payout · Worldwide coverage'
    }
  ],
  insurancePolicies: [
    {
      id: 'pol-1',
      policy_ref: 'POL-DEMO-KDP-7712',
      product_code: 'INS-HEALTH-CARE',
      plan_name: 'Tatito Family Floater Health Shield',
      insured_name: 'Ramesh Kumar & Family',
      sum_insured: 1000000,
      annual_premium: 9450,
      renewal_date: '2027-08-14',
      status: 'SANDBOX_ACTIVE'
    }
  ],
  goldVault: {
    liveRatePerGram24K: 7680,
    gramsHeld: 5.5338,
    monthlySipAmount: 2000,
    transactions: [
      {
        id: 'gld-1',
        reference_no: 'GOLD-DEMO-44019',
        tx_type: 'BUY',
        grams: 3.2552,
        rate_per_gram: 7680,
        total_amount: 25000,
        is_simulated: true,
        created_at: '2026-10-15T10:30:00.000Z'
      },
      {
        id: 'gld-2',
        reference_no: 'GOLD-DEMO-44108',
        tx_type: 'SIP',
        grams: 2.2786,
        rate_per_gram: 7680,
        total_amount: 17500,
        is_simulated: true,
        created_at: '2026-11-01T09:00:00.000Z'
      }
    ]
  },
  travelRoutes: [
    { id: 'trv-1', mode: 'Bus', operator: 'APSRTC Amaravati AC Sleeper', origin: 'Kadapa', destination: 'Hyderabad', departure: '21:30', fare: 890 },
    { id: 'trv-2', mode: 'Bus', operator: 'APSRTC Indra AC', origin: 'Kadapa', destination: 'Vijayawada', departure: '22:00', fare: 760 },
    { id: 'trv-3', mode: 'Train', operator: '12797 Venkatadri Express (3A)', origin: 'Kadapa (HX)', destination: 'Kacheguda (KCG)', departure: '20:10', fare: 940 },
    { id: 'trv-4', mode: 'Flight', operator: 'IndiGo 6E-7214', origin: 'Kadapa (CDP)', destination: 'Chennai (MAA)', departure: '11:45', fare: 2850 },
    { id: 'trv-5', mode: 'Flight', operator: 'IndiGo 6E-7192', origin: 'Kadapa (CDP)', destination: 'Bengaluru (BLR)', departure: '14:20', fare: 2690 },
    { id: 'trv-6', mode: 'Hotel', operator: 'Haritha Grand Executive Stay', origin: 'Tirupati / Kadapa', destination: '2 Nights Deluxe AC', departure: 'Check-in 12:00', fare: 3400 }
  ],
  travelBookings: [
    {
      id: 'tbk-1',
      pnr_reference: 'PNR-DEMO-88412',
      mode: 'Bus',
      operator_name: 'APSRTC Amaravati AC Sleeper',
      origin: 'Kadapa',
      destination: 'Hyderabad',
      travel_date: '2026-11-22',
      passengers: 2,
      fare_amount: 1780,
      status: 'CONFIRMED_DEMO',
      created_at: '2026-11-09T18:00:00.000Z'
    }
  ],
  merchantProfile: {
    merchant_id: 'MERCH-KDP-1001',
    business_name: 'Rayalaseema Agro & Retail Mart',
    category: 'Retail & Kirana Supermarket',
    merchant_vpa: 'rayalaseemamart@tatitoupi',
    gstin: '37AABCR9102F1Z8',
    settlement_bank: 'State Bank of India •••• 4821 (T+0 Instant Sandbox)',
    kyc_status: 'SANDBOX_VERIFIED',
    today_sales: 18450,
    month_sales: 342800,
    pending_settlement: 0
  },
  merchantOutlets: [
    {
      id: 'out-1',
      outlet_code: 'KDP-TRUNK-01',
      outlet_name: 'Trunk Road Flagship Counter',
      city: 'Kadapa',
      outlet_vpa: 'rayalaseemamart.01@tatitoupi',
      qr_reference: 'MQR-OUT-101',
      today_sales: 12150,
      is_active: true
    },
    {
      id: 'out-2',
      outlet_code: 'PDTR-MAIN-02',
      outlet_name: 'Proddatur Wholesale Counter',
      city: 'Proddatur',
      outlet_vpa: 'rayalaseemamart.02@tatitoupi',
      qr_reference: 'MQR-OUT-102',
      today_sales: 6300,
      is_active: true
    }
  ],
  merchantTransactions: [
    { id: 'mtx-1', transaction_ref: 'MQR-990124', outlet_code: 'KDP-TRUNK-01', customer_name: 'Subba Reddy', customer_vpa: 'subba@upi', amount: 1450, settlement_status: 'SETTLED_SANDBOX', refund_requested: false, created_at: '2026-11-11T09:10:00.000Z' },
    { id: 'mtx-2', transaction_ref: 'MQR-990125', outlet_code: 'PDTR-MAIN-02', customer_name: 'Padmavathi Devi', customer_vpa: 'padma@upi', amount: 890, settlement_status: 'SETTLED_SANDBOX', refund_requested: false, created_at: '2026-11-11T10:25:00.000Z' },
    { id: 'mtx-3', transaction_ref: 'MQR-990126', outlet_code: 'KDP-TRUNK-01', customer_name: 'Harish Babu', customer_vpa: 'harish@upi', amount: 3200, settlement_status: 'SETTLED_SANDBOX', refund_requested: true, created_at: '2026-11-10T19:45:00.000Z' }
  ],
  supportTickets: [
    {
      id: 'tkt-1',
      ticket_no: 'TKT-KDP-5041',
      category: 'Payment Complaint',
      subject: 'BBPS Electricity bill receipt confirmation check',
      description: 'Paid APSPDCL bill of ₹1,420 via wallet; requesting duplicate PDF voucher.',
      transaction_ref: 'DEMO-BBPS-48291041',
      status: 'RESOLVED',
      resolution_note: 'Verified in sandbox ledger. Duplicate receipt attached to your account.',
      created_at: '2026-11-07T11:30:00.000Z',
      messages: [
        {
          id: 'msg-1',
          sender_role: 'customer',
          sender_name: 'Ramesh Kumar Chennur',
          message: 'Paid APSPDCL bill of ₹1,420 via wallet; requesting duplicate voucher.',
          created_at: '2026-11-07T11:30:00.000Z'
        },
        {
          id: 'msg-2',
          sender_role: 'agent',
          sender_name: 'Kadapa Branch Grievance Desk',
          message: 'Verified BBPS settlement ref BBPS9081245102. Receipt is now available in History & Refunds.',
          created_at: '2026-11-07T12:15:00.000Z'
        }
      ] as SupportMessageItem[]
    }
  ],
  supportFaqs: [
    {
      id: 'faq-1',
      q: 'Does Tatito ever ask for or store my UPI PIN or banking password?',
      a: 'No. Tatito never collects, logs, or stores your UPI PIN, netbanking password, OTP, or card CVV. Production UPI PIN validation occurs strictly inside the NPCI Common Library / PSP SDK.'
    },
    {
      id: 'faq-2',
      q: 'What happens if money is debited for a pending or failed BBPS bill?',
      a: 'Any failed transaction auto-reverses within T+1 working day in live PSP clearing. In this sandbox environment, simulated declines never deduct your wallet balance.'
    },
    {
      id: 'faq-3',
      q: 'How do I pause or cancel a recurring UPI AutoPay mandate?',
      a: 'Go to Payments Hub → UPI AutoPay and use the Pause or Cancel icon next to any mandate. No automatic debit runs without active mandate consent.'
    },
    {
      id: 'faq-4',
      q: 'Are Digital Gold holdings backed by physical gold in this demo?',
      a: 'No. While 24K reference rates sync live when network feeds are active, vault gram balances shown here are sandbox simulations requiring an authorized MMTC-PAMP or SafeGold partnership in production.'
    }
  ],
  sessionsByUser: new Map<number, UserSessionRecord[]>(),
  loginHistoryByUser: new Map<number, LoginHistoryRecord[]>(),
  securitySettingsByUser: new Map<number, UserSecuritySettings>()
};

export function getUserSettings(userId: number): UserSecuritySettings {
  if (!superStore.securitySettingsByUser.has(userId)) {
    superStore.securitySettingsByUser.set(userId, {
      preferred_language: 'English',
      push_alerts: true,
      email_alerts: true,
      sms_alerts: true,
      biometric_lock_enabled: false,
      mask_balances_by_default: false,
      upi_pin_mode: 'NPCI_PSP_SDK_ONLY (Never Stored)',
      deletion_requested: false
    });
  }
  return superStore.securitySettingsByUser.get(userId)!;
}

export function recordUserSessionAndHistory(params: {
  userId: number;
  emailOrPhone: string;
  channel: string;
  ip?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
}) {
  const deviceLabel = parseDeviceLabel(params.userAgent);
  const now = new Date().toISOString();

  const hist = superStore.loginHistoryByUser.get(params.userId) || [];
  hist.unshift({
    id: `lgh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: params.userId,
    email_or_phone: params.emailOrPhone,
    channel: params.channel,
    device: deviceLabel,
    ip: params.ip || '127.0.0.1',
    status: params.status,
    created_at: now
  });
  superStore.loginHistoryByUser.set(params.userId, hist.slice(0, 25));

  if (params.status === 'SUCCESS') {
    const sessions = superStore.sessionsByUser.get(params.userId) || [];
    const sess: UserSessionRecord = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: params.userId,
      device: deviceLabel,
      ip: params.ip || '127.0.0.1',
      channel: params.channel,
      is_active: true,
      last_active_at: now,
      created_at: now
    };
    sessions.unshift(sess);
    superStore.sessionsByUser.set(params.userId, sessions.slice(0, 12));
  }
}

function parseDeviceLabel(ua?: string): string {
  if (!ua) return 'Tatito Web Browser';
  if (ua.includes('Android')) return 'Android Mobile Browser';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Safari / Mobile';
  if (ua.includes('Chrome')) return 'Desktop Chrome Web';
  if (ua.includes('Firefox')) return 'Desktop Firefox Web';
  if (ua.includes('node') || ua.includes('undici')) return 'API / Automated Client';
  return 'Web Session';
}
