# 🤖 DairyERP Portal Architecture & AI Agentic Coding Standard (AGENTIC.md)

Welcome, AI coding agent! This repository hosts the public-facing edge portal and Progressive Web App (PWA) for the Dairy Herd ERP system.

---

## 🏛️ Ecosystem Topology

1. **`dairy-farm-portal` (This Repository - Cloudflare Edge & PWA):**
   - **Runtime:** Cloudflare Pages + Cloudflare Pages Functions (V8 Edge Workers) + Cloudflare D1 SQL.
   - **Frontend:** Single-Page Vanilla ES6+ Web App (`portal.html` & `index.html`), Tailwind CSS, WebCrypto API.
   - **PWA Engine:** Service Worker (`sw.js`) with build-time cache busting (`scripts/stamp-sw.js`) and transparent offline sync outbox.

2. **`dairy-farm` (Private Backend & Microservice):**
   - **Runtime:** Python 3.11 / FastAPI container running on Google Cloud Run (`europe-west3`, Frankfurt).
   - **Role:** High-performance binary parser for legacy Uniform-Agri Firebird (`.FDB`) databases.

---

## 📁 Repository Structure & Collocation

```
├── functions/
│   └── api/
│       └── [[route]].js       # ⚡ Cloudflare Pages Functions (D1 queries, auth, zootech calculations)
├── test/
│   ├── zootech.test.js        # 🧪 Pure zootechnical domain unit tests (DIM, ECI, gestation, quarantine)
│   └── security.test.js       # 🔐 WebCrypto JWT signing & PBKDF2 salt hashing tests
├── scripts/
│   └── stamp-sw.js            # 🏷️ Automatic build-time version stamp for sw.js (git hash + timestamp)
├── icons/
│   ├── icon-192.png           # 📱 PWA home screen icon (192x192)
│   └── icon-512.png           # 📱 PWA splash icon (512x512)
├── manifest.json              # 📄 Web App Manifest for mobile installation
├── sw.js                      # ⚙️ Service Worker (Cache-First shell, Stale-While-Revalidate API)
├── portal.html                # 🖥️ Main authenticated application SPA
├── index.html                 # 🌐 Public entrance & mirrored application SPA
├── schema_d1.sql              # 🗄️ Cloudflare D1 SQLite database schema
├── package.json               # 📦 Scripts (test, build:sw, build, deploy)
└── AGENTIC.md                 # 🤖 This file
```

---

## 🔒 Sacred Rules for AI Agents (Vibe-Coding Guardrails)

### 1. 🚫 Zero Stubs, Fake Data, or Deceptive UI
- **Real operations only**: Never insert dummy promotional teasers, simulated push notifications, or mocked data endpoints in production branches.
- **Auditable offline state**: When operating in the barn without internet, the UI must explicitly reflect offline storage status (`🟡 Офлайн-режим`, `💾 Збережено локально`) and notify the user transparently upon network recovery.

### 2. 🧬 Zootechnical Integrity
Any edits to livestock formulas in `functions/api/[[route]].js` or `test/zootech.test.js` must strictly obey standard veterinary biology:
- **Gestation Period**: Standard 280 days (Expected Calving Date = Insemination Date + 280).
- **Dry-Off Period**: Standard 60 days before expected calving (Gestation day 220+).
- **Days in Milk (DIM)**: Calculated strictly from `last_calving_date` up to today.
- **Quarantine Priority**: Active antibiotic milk withholding strictly overrides any reproductive status.

### 3. 🔐 Hermetic Security & WebCrypto
- Use native Edge `crypto.subtle` for PBKDF2 key derivation and HMAC-SHA256 JWT tokens.
- Never hardcode secrets. Always read from `context.env.JWT_SECRET` and `context.env.PARSER_SECRET_TOKEN`.

### 4. 🔄 Cache Busting & Service Worker Lifecycle
- Never manually hardcode version strings in `sw.js`.
- Always run `npm run build` which triggers `node scripts/stamp-sw.js` to stamp `CACHE_VERSION = 'dairy-erp-v<git-sha>-<timestamp>'`.

### 5. 📉 Consumption Plan & Index Guardrails (Cloudflare D1 / Rows Read Quota)
Cloudflare D1 charges by **Rows Read** (free tier: 5M rows/day). A single unindexed full-table scan can exhaust the entire daily quota in minutes:
- **Mandatory Indexing for New Filters & Sorts**: Whenever adding a new filter (`WHERE column = ?`) or sorting (`ORDER BY column`), you **MUST** create a corresponding index in `schema_d1.sql` (e.g. `CREATE INDEX IF NOT EXISTS idx_animals_farm_status ON animals(farm_id, current_status);`).
- **Composite Farm Scoping**: All queries are multi-tenant; always prefix indexes with `farm_id` so rows are scoped immediately.
- **Enforce Strict `LIMIT`**: Never execute unpaged `SELECT *` queries. Always supply sensible defaults (`LIMIT 50 OFFSET ?`).
- **Leverage Client SW Cache**: Never bypass the Service Worker's `Stale-While-Revalidate` cache for read-only catalog endpoints (`/api/animals`, `/api/dashboard/stats`).

---

## 🧪 Verification Protocol

Before pushing changes, run:
```bash
npm test
npm run build
```
Expected output:
1. All unit and security tests pass (`pass 21, fail 0`).
2. `[PWA Build] Updated sw.js CACHE_VERSION...`
3. `✨ Compiled Worker successfully`.
