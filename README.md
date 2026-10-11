# 🥛 DairyERP Cloud — Modern Herd Management Platform

Public portal & overview of the Next-Generation Dairy Herd Management & Telemetry System.

## 🌐 Live Production Access
- 👉 **Live Portal:** [https://dairy-farm-portal.pages.dev](https://dairy-farm-portal.pages.dev)
- **Edge Runtime:** Cloudflare Pages + Cloudflare D1 Global Edge (EEUR/Frankfurt)
- **Converter Microservice:** Google Cloud Run (`europe-west3`, Frankfurt am Main)
- **Primary Maintainer:** `memory1024@gmail.com`

---

## 🌟 Key Capabilities
- ⚡ **Zero-Friction Ingestion:** Automated binary converter for legacy Uniform-Agri backups (`.zip` / `.fdb`) via Cloud Run stateless microservice in **~1.5 seconds**.
- 📈 **Veterinary & Reproductive KPIs:** Real-time Calving Interval trends, ECI conception curves, Days in Milk (DIM), and automated heat detection alerts.
- 💊 **Antibiotic Withholding Watch (Каренція):** Automatic biological countdown timers for milk and slaughter quarantine periods.
- 🏢 **Multi-Tenant Herd Scoping:** Complete tenant isolation per user/farm, dynamic passport editing, and instantaneous farm context switching.
- 🔒 **Zero-Trust Security & WebCrypto:** Cryptographic password salting with **PBKDF2 (SHA-256)** and session signing via **HMAC-SHA256**. Zero plaintext credentials or hardcoded keys in repository.

---

## 🏗️ Architecture & Feature Collocation
Structured with clean feature collocation and PWA offline support:

```
├── functions/api/     # Cloudflare Pages Functions (V8 Edge Workers)
│   ├── [[route]].js   # Lean Edge router & context dispatcher
│   ├── animals.js     # Herd inventory, filtering, card view & animal history
│   ├── farms.js       # Multi-farm switching, CRUD, and farm passport updates
│   ├── dashboard.js   # Statistics, event journal, medication actions & alerts
│   ├── auth.js        # Google One-Tap OAuth, first-run setup & session issuance
│   ├── system.js      # System health & parser microservice forwarder
│   ├── zootech.js     # Pure mathematical engine (DIM, gestation, dry-off, quarantine)
│   └── crypto.js      # Native WebCrypto implementation (PBKDF2 & HMAC-SHA256)
├── portal.html        # Main authenticated SPA interface
├── sw.js              # Service Worker (PWA offline caching & outbox sync)
├── manifest.json      # Mobile Web App Manifest
├── schema_d1.sql      # Cloudflare D1 SQLite relational schema
└── AGENTIC.md         # AI Agentic engineering rules & guardrails
```

---

## 🧪 Testing & CI/CD Pipeline
Continuous integration runs on **Node.js 24 native GitHub Actions (`v7`)**:

1. **Unit Testing:**
   ```bash
   npm test
   ```
   Runs 21 pure zootechnical and WebCrypto security tests via the native Node.js test runner (`node:test`) in **~150ms**.

2. **PWA & Edge Bundle Build:**
   ```bash
   npm run build
   ```
   Stamps automated Service Worker cache version (`scripts/stamp-sw.js`) and validates Pages Functions compilation.

3. **Cloudflare Deployment Secrets (GitHub Actions):**
   Add these under **Settings > Secrets and variables > Actions > Repository secrets**:
   - `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Pages edit permissions.
   - `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare Account ID (`da9d897a45e91c7e95572db2423e01fa`).

---

## 📄 License
Proprietary & Confidential. All rights reserved.
