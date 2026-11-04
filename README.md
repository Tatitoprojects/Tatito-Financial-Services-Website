# Tatito Financial Services

A complete single-page website for a financial services brand — recharges, bills, loan repayments,
loans, SIPs, mutual funds, trading, blog and an admin CMS. Built with React, TypeScript and Vite.

This is a rebuild of the original single-file HTML prototype as a maintainable project, with the
same content and flows plus a cleaner UI and working forms.

## Features

- **Marketing pages** — home, services (18 products in 6 categories), loans, SIP, mutual funds,
  trading/demat, blog, about, contact.
- **EMI calculator** — loan type, amount and tenure sliders with monthly EMI and total payable.
- **SIP calculator** — monthly amount, years and expected return with invested vs projected value.
- **User accounts** — register and login (mobile or email), stored in the browser for the demo.
- **Login-gated actions** — "Use this", "Apply now" and "Invest" ask guests to sign in first.
- **Search** — across services, loans, mutual funds and blog posts.
- **Notifications** — announcements published from the admin panel.
- **Admin CMS** at `#/admin` — edit site settings (name, tagline, logo, brand colour, contact
  details, admin password, about text) and manage services, loans, funds, blog posts,
  notifications, contact messages and users.
- **Dark mode** — follows the operating system theme.
- **Responsive** — mobile navigation, fluid grids and safe-area support.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3001
```

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

## Demo credentials

- Admin panel (`#/admin`): password `admin123` (change it in Site settings).
- There are no seeded user accounts; create one from `#/register`.

## Data model

All content lives in `src/lib/seed.ts` and is persisted to `localStorage` under
`tatito_site_v2` when edited in the admin panel. The session lives under `tatito_session_v1`.

Clear browser storage to reset the site to its seed data.

## Project structure

```
src/
  App.tsx                 hash router and routes
  styles.css              design tokens, layout and components
  components/
    Layout.tsx            header, navigation, search, footer
    ServiceCard.tsx       reusable product card
  lib/
    seed.ts               typed demo content
    store.tsx             app store, persistence, session, toast
    format.ts             currency, dates, password helper
    useRequestAction.ts   login-gated demo action
  pages/                  one component per route, plus the admin CMS
```

## Going live: what still needs a backend

This build is intentionally front-end only. Before real customers use it:

1. **Authentication** — replace the localStorage accounts with server-side auth (hashed passwords,
   sessions, OTP). Never ship the demo password helper to production.
2. **Payments and partner APIs** — recharge, BBPS billers, loan origination, AMFI NAV feed and the
   broker/demat integration each need their own partner agreements and credentials.
3. **Data storage** — move site content, users and contact messages to a database.
4. **Compliance** — KYC, grievance redressal, rate disclosures and the disclaimers on mutual fund
   and loan pages must be reviewed for the licences you actually hold.

The copy on the site already marks services as planned and dependent on partner and regulatory
approvals; keep those disclosures accurate as services go live.
