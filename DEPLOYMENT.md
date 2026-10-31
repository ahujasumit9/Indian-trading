# INDIA AI TRADER – Production Deployment Guide

## 1. Overview & Architecture
**INDIA AI TRADER** is an institutional-grade, full-stack options intelligence and paper trading platform for **BSE SENSEX** and **NSE NIFTY**.

- **Frontend:** React 19 + TypeScript + Tailwind CSS (Vite Bundler).
- **Backend:** Express REST API with sliding-window rate limiters, webhook secret verification, server-side credential vault, and Gemini 3.8 Flash market intelligence.
- **Persistence:** Local JSON / SQLite storage engine (`data/trader_storage.json`) with automated failover and Supabase PostgreSQL schema (`supabase/migrations/001_init.sql`).
- **Security:** Zero client-side `localStorage` credential persistence; server-isolated broker credentials; cryptographic SHA-256 trade approval ledger; and 30s webhook idempotency duplicate protection.

---

## 2. Vercel Deployment (Frontend / Static Edge)

### Configuration
A pre-configured `vercel.json` is located at the workspace root:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Framework Preset:** `Vite`

### Step-by-Step Vercel Setup
1. Push your Git repository to GitHub / GitLab / Bitbucket.
2. Log into [Vercel](https://vercel.com) and click **"Add New..." -> "Project"**.
3. Import your `india-ai-trader` repository.
4. Set Environment Variables in Project Settings (see Section 4).
5. Click **Deploy**. Vercel will run `npm run build` and publish your app globally on Edge CDN with HTTP security headers (`X-Frame-Options`, `HSTS`, `nosniff`).

---

## 3. Full-Stack / Node.js Host Deployment (Docker / Cloud Run / VPS)

For environments running both the Express API and the Vite frontend simultaneously:
```bash
# 1. Install dependencies
npm install

# 2. Build the production client
npm run build

# 3. Start the production server
npm run start # or: npx tsx server.ts
```

The server automatically serves the built frontend from `/dist` while exposing `/api/*` endpoints on port 3000 (or `process.env.PORT`).

---

## 4. Environment Variables Checklist

Configure the following environment variables in your deployment dashboard or `.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for AI market commentary | `MY_GEMINI_API_KEY` |
| `TRADINGVIEW_WEBHOOK_SECRET` | Shared secret for TradingView webhook validation | `india-ai-trader-secret-2026` |
| `PORT` | Web server listening port | `3000` |
| `NODE_ENV` | Runtime environment | `production` |
| `SUPABASE_URL` | Optional Supabase PostgreSQL database URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Optional Supabase anonymous client key | `eyJhbGci...` |

---

## 5. Security Verification Checklist
- [x] **No Broker API keys or passwords in client `localStorage`**. All broker credentials are held in server memory vault (`/src/server/vault.ts`).
- [x] **Rate Limiter enabled** on all `/api/*` routes (60 requests/minute per client IP).
- [x] **TradingView Webhooks guarded** by secret token and 30-second cryptographic duplicate filter.
- [x] **Trade Execution Safety Gate:** Cryptographic SHA-256 fingerprint generated for every trade; requires explicit user approval confirmation.
- [x] **Broker Integration Authenticity:** Genuine challenger against official Angel One / Sahi endpoints; never presents mock connection as live.
