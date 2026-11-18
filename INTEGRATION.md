# Tatito 2.0 integration

The React dashboard in Tatito-Financial-Services uses browser demo state. This repository already hosts a separate React Router application, Express API, SQL migration runner and PostgreSQL repositories. Both frontends keep their existing routes. The dashboard opens the selected workflow on the full-stack origin, where the user signs in. Browser demo roles and tokens are never forwarded between origins.

## Run the reviewed workflows

Use Node 24, npm ci and a dedicated sandbox PostgreSQL database. Set DATABASE_URL and a randomly generated JWT_SECRET in the server environment. Run npm run migrate, then npm run dev. On Vercel set the same server environment variables and configure the build to include database/migrations and database/schema.sql with the function. Seed migration 003 installs demonstration identities and financial records. Use an isolated sandbox database for this branch. Rotate the previous deployment signing key when rolling out this change.

In the dashboard repository set VITE_TATITO_SERVICES_ORIGIN to the full-stack deployment origin before building. For local development run the full-stack server with PORT=3001 and set the dashboard origin to http://localhost:3001.

| Workflow | Implemented in this branch | External dependency |
|---|---|---|
| Collections | Authenticated hosted checkout requests, list, ownership checks, integer paise, retry keys, status refresh, verified test receipts, and an atomic credit ledger unique per paid reference | Razorpay Test Mode Payment Links API. Set RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET on the server. Only test-mode keys accepted. With no key or database, creation is disabled. |
| Manual finances | Income, spending, monthly category limits, savings targets, equal and custom group splits and settlement tracking, backed by PostgreSQL | No banking or account aggregator connection |
| Support | Account-owned tickets, threaded replies, staff status updates and PostgreSQL history through the existing customer and admin screens | In-app only |
| Credit profile | Unavailable score, ratios and repayment performance if unverified | Authorized bureau and consent for real data |
| Legacy payments | Simulated BBPS responses always labelled demo; lookups of prior requests check the owner | No BBPS or UPI money movement |

The collection reference ties the provider link to a local record. A lost provider response leaves the collection pending. Refresh queries the provider by reference or provider link ID. The server checks currency, amount, reference and paid amount before recording a credit. Confirmed collections contribute only to the test-collection total. Provider cancellations and expiry are reconciled by refresh. A checkout completed outside an open session requires refresh. Refunds, webhook delivery and automatic settlement reconciliation are outstanding for this adapter.

## Remaining blueprint work

1. Migrate the remaining shared demo store into per-account repositories for beneficiaries, QR requests, rewards, mandates, merchants, insurance, travel and gold. Introduce merchant membership checks and transaction-scoped refund approval. Some pre-existing admin views still read fixture data. Treat these routes as demonstrations.
2. Complete a provider-reconciled wallet and statement across all wallet entry points. Legacy wallet balances, top-ups and withdrawals are simulations. Existing seeded balances are separate from the test-collection ledger.
3. Connect authorized UPI/BBPS, mandates, bureau, insurance, investment, gold and travel partners as applicable. Add consent, webhook validation, deduplication, reversal/refund handling and scheduled reconciliation per provider contract. Do not enable live operations based on the presence of credentials.
4. Complete account-aware search, notification provider delivery, expense reporting and the remaining merchant and admin screens. Test independent user accounts and each staff role against a staging database. Review seeded identities before any production migration.

## Checks

Run npm run lint, npm run build and npm test. Run npm run test:collections for adapter checks. For the PostgreSQL and HTTP workflow suite, set TATITO_COLLECTIONS_TEST_DB to a fresh local database whose name ends in _test and run npm run test:collections. The suite runs migrations, seeds test records and substitutes the provider network response. It can run without gateway credentials. A successful test does not verify a provider account.

Provider reference: https://razorpay.com/docs/api/payments/payment-links/
