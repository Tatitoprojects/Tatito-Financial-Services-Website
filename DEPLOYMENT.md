# Tatito Financial Services — Deployment & Operations Guide

## Architecture Overview
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (`src/`)
- **Backend**: Node.js + Express (`server.ts`, `backend/`), REST APIs (`/api/*`), WebSocket server (`/ws/notifications`), and Server-Sent Events (`/api/live/stream`)
- **Database**: PostgreSQL 16 (`database/migrations/*.sql`) with development sandbox persistence (`DATA_STORE_MODE=demo`)
- **API Documentation**: Interactive Swagger UI at `/api/docs` and OpenAPI 3.0 specification at `/api/openapi.json`

---

## 1. Local Development
```bash
cp .env.example .env
npm install
npm run dev
```
- Application & API run on `http://localhost:3000`
- Swagger API Docs: `http://localhost:3000/api/docs`
- WebSocket Notifications: `ws://localhost:3000/ws/notifications`

### Run Automated Test Suite
```bash
npm test
```

### Run PostgreSQL Migrations (when using PostgreSQL)
```bash
npm run migrate
```

---

## 2. Docker & Docker Compose (Full Stack: App + PostgreSQL + Redis)
```bash
docker compose up --build -d
```
- App: `http://localhost:3000`
- PostgreSQL: `localhost:5432` (auto-applies `database/migrations/*.sql`)
- Redis: `localhost:6379`

---

## 3. Vercel Deployment
1. Push repository to GitHub/GitLab/Bitbucket and import into Vercel.
2. Vercel executes `npm run build`, outputting:
   - Static SPA assets in `dist/`
   - Serverless Express handler in `api/index.js`
3. Set environment variables in Vercel Project Settings:
   - `JWT_SECRET` (32+ char secret)
   - `DATABASE_URL` (optional PostgreSQL connection string) or `DATA_STORE_MODE=demo`
   - `SMS_PROVIDER_KEY`, `WEBHOOK_SECRET` (for live integrations)
4. Note: Serverless Vercel routes handle all REST APIs and SSE streams; persistent stateful `ws` WebSockets require Docker, Node.js (`npm start`), Render, or Railway.

---

## 4. Render / Railway (Node.js + WebSockets)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: `3000` (or platform `PORT`)
- **Health Check Path**: `/api/health`
