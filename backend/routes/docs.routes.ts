import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Tatito Financial Services — Digital Payments & Lending Super-App API',
    version: '2.1.0',
    description:
      'Production-structured TypeScript Express & PostgreSQL API covering Authentication, OTP Sandbox, UPI/QR Payments, 15+ BBPS Utility Categories, Escrow Wallet, Loans & Underwriting, Investments/Stocks/SIPs, Rewards, Merchant Outlets, Support & Admin Monitoring. Sandbox endpoints clearly flag is_simulated=true and never collect UPI PINs or banking passwords.',
    contact: {
      name: 'M/s. Tatito Projects — Kadapa Hub',
      email: 'support@tatitoprojects.com'
    }
  },
  servers: [{ url: '/api', description: 'Active API Base' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  paths: {
    '/health': { get: { tags: ['System'], summary: 'Health & database connectivity status', responses: { '200': { description: 'Healthy' } } } },
    '/auth/register': { post: { tags: ['Auth'], summary: 'Register customer account (bcrypt)', responses: { '201': { description: 'Created' } } } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Password login returning JWT', responses: { '200': { description: 'OK' } } } },
    '/auth/request-otp': { post: { tags: ['Auth'], summary: 'Request mobile OTP (Sandbox in dev)', responses: { '200': { description: 'Dispatched' } } } },
    '/auth/login-otp': { post: { tags: ['Auth'], summary: 'Login or onboard with verified mobile OTP', responses: { '200': { description: 'OK' } } } },
    '/auth/change-password': { post: { tags: ['Auth'], security: [{ BearerAuth: [] }], summary: 'Change password with current verification', responses: { '200': { description: 'Updated' } } } },
    '/auth/sessions': { get: { tags: ['Auth'], security: [{ BearerAuth: [] }], summary: 'List active device sessions', responses: { '200': { description: 'OK' } } } },
    '/auth/login-history': { get: { tags: ['Auth'], security: [{ BearerAuth: [] }], summary: 'View login attempt history', responses: { '200': { description: 'OK' } } } },
    '/users/profile': {
      get: { tags: ['Profile & Settings'], security: [{ BearerAuth: [] }], summary: 'Fetch user profile & KYC', responses: { '200': { description: 'OK' } } },
      put: { tags: ['Profile & Settings'], security: [{ BearerAuth: [] }], summary: 'Update profile fields', responses: { '200': { description: 'Updated' } } }
    },
    '/users/settings': {
      get: { tags: ['Profile & Settings'], security: [{ BearerAuth: [] }], summary: 'Fetch language, alert & biometric preferences', responses: { '200': { description: 'OK' } } },
      put: { tags: ['Profile & Settings'], security: [{ BearerAuth: [] }], summary: 'Update security & notification settings', responses: { '200': { description: 'Updated' } } }
    },
    '/wallet': { get: { tags: ['Wallet'], security: [{ BearerAuth: [] }], summary: 'Get wallet balance, limits & ledger', responses: { '200': { description: 'OK' } } } },
    '/wallet/add-money': { post: { tags: ['Wallet'], security: [{ BearerAuth: [] }], summary: 'Add money via sandbox channel', responses: { '201': { description: 'Credited' } } } },
    '/wallet/withdraw': { post: { tags: ['Wallet'], security: [{ BearerAuth: [] }], summary: 'Withdraw to linked bank (sandbox)', responses: { '200': { description: 'Initiated' } } } },
    '/payments/bills/fetch': { post: { tags: ['BBPS Bills'], summary: 'Fetch utility bill across 15 categories', responses: { '200': { description: 'Bill details' } } } },
    '/payments/bills/pay': { post: { tags: ['BBPS Bills'], security: [{ BearerAuth: [] }], summary: 'Atomic wallet BBPS bill settlement', responses: { '200': { description: 'Paid' } } } },
    '/superapp/upi/overview': { get: { tags: ['UPI & QR'], security: [{ BearerAuth: [] }], summary: 'UPI VPA, linked banks, requests & txns', responses: { '200': { description: 'OK' } } } },
    '/superapp/upi/send': { post: { tags: ['UPI & QR'], security: [{ BearerAuth: [] }], summary: 'Send UPI money / self transfer / QR pay', responses: { '201': { description: 'Settled' } } } },
    '/superapp/upi/bank-accounts': { post: { tags: ['UPI & QR'], security: [{ BearerAuth: [] }], summary: 'Link bank account (sandbox)', responses: { '201': { description: 'Linked' } } } },
    '/superapp/beneficiaries': {
      get: { tags: ['UPI & QR'], security: [{ BearerAuth: [] }], summary: 'List saved beneficiaries', responses: { '200': { description: 'OK' } } },
      post: { tags: ['UPI & QR'], security: [{ BearerAuth: [] }], summary: 'Save a new beneficiary', responses: { '201': { description: 'Created' } } }
    },
    '/superapp/rewards/scratch/{id}': { post: { tags: ['Rewards'], security: [{ BearerAuth: [] }], summary: 'Scratch reward card & credit bonus', responses: { '200': { description: 'Revealed' } } } },
    '/superapp/rewards/apply-coupon': { post: { tags: ['Rewards'], security: [{ BearerAuth: [] }], summary: 'Apply promotional coupon code', responses: { '200': { description: 'Applied' } } } },
    '/superapp/merchants/outlets': { post: { tags: ['Merchant'], security: [{ BearerAuth: [] }], summary: 'Create store outlet & VPA QR', responses: { '201': { description: 'Created' } } } },
    '/superapp/support/tickets/{id}/reply': { post: { tags: ['Support'], security: [{ BearerAuth: [] }], summary: 'Post reply message on support ticket', responses: { '201': { description: 'Posted' } } } },
    '/loans/products': { get: { tags: ['Loans'], summary: 'List 7 loan products', responses: { '200': { description: 'OK' } } } },
    '/loans/apply': { post: { tags: ['Loans'], security: [{ BearerAuth: [] }], summary: 'Submit loan application', responses: { '201': { description: 'Submitted' } } } },
    '/investments/stocks': { get: { tags: ['Wealth'], summary: 'Live/fallback NSE stock quotes', responses: { '200': { description: 'OK' } } } },
    '/admin/payments-monitor': { get: { tags: ['Admin'], security: [{ BearerAuth: [] }], summary: 'Monitor all payments & refunds', responses: { '200': { description: 'OK' } } } },
    '/admin/risk-alerts': { get: { tags: ['Admin'], security: [{ BearerAuth: [] }], summary: 'Fraud & risk monitoring feed', responses: { '200': { description: 'OK' } } } }
  }
};

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

router.get('/docs', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tatito Financial Services — API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    .topbar-custom { background: #0d5c4b; color: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
    .topbar-custom a { color: #f6c453; text-decoration: none; font-weight: 600; font-size: 13px; }
  </style>
</head>
<body>
  <div class="topbar-custom">
    <div><strong>Tatito Financial Services</strong> — OpenAPI 3.0 Reference</div>
    <a href="/api/openapi.json" target="_blank">Download openapi.json →</a>
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

export default router;
