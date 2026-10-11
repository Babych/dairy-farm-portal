# 🥛 DairyERP Cloud — Modern Herd Management Platform

Public portal & overview of the Next-Generation Dairy Herd Management & Telemetry System.

## 🌐 Live Portal Access
Access the live production cloud portal and API:
👉 **[https://dairy-farm-portal.pages.dev](https://dairy-farm-portal.pages.dev)**

- **Architecture:** Cloudflare Pages + Cloudflare D1 Global Edge (EEUR/FRA)
- **High-Performance Parser Microservice:** Google Cloud Run (`europe-west3`, Frankfurt)
- **Support & Admin Contact:** `memory1024@gmail.com`

---

## 🌟 Overview
DairyERP Cloud is a modern, high-performance web platform designed to replace legacy 20-year-old desktop farm software (such as Uniform-Agri / Delphi / Firebird stacks).

### Key Features:
- 🔄 **One-Click Ingestion & Parser-as-a-Service:** Direct migration tool from legacy Uniform-Agri farm backups (`.zip` / `.fdb`) via stateless Google Cloud Run Firebird converter microservice (`POST /api/convert/uniform`) in **~1.5s**.
- 📊 **Veterinary KPI & ECI Reproduction Analytics:** Real-time Calving Interval trends, ECI conception charts, days in milk (DIM), and automated conception tracking.
- 🧪 **Automated Drug Withholding Tracking (Каренція):** Real-time monitoring of active milk and slaughter withdrawal periods for treated cows.
- 👥 **Multi-Farm Scoping & Account Binding:** Multiple farm databases per user, instant farm switching, and automated ownership binding.
- 🔐 **Zero Trust Security:** Mutual secret key verification (`X-Parser-Secret`), Google One Tap OAuth 2.0, and JWT session protection with role-based access control.

---

## 🏗️ Architecture
```
[ User Browser / Mobile PWA ]
              ↓ (HTTPS)
[ Cloudflare Pages SPA (portal.html) ]
              ↕ (Edge Functions API)
[ Cloudflare D1 Relational DB (EEUR) ]
              ↑ (Stateless JSON Stream via X-Parser-Secret)
[ Google Cloud Run Parser Microservice (Frankfurt / europe-west3) ]
              ↑ (Upload .FDB / .ZIP)
[ Uniform-Agri Legacy Farm Backup ]
```

---

## 🧪 Testing & Verification
The system is continuously verified using two automated test suites:
1. **Edge & D1 Test (`test_health_check.js`):**
   - Asserts system availability & farm stats (`/api/system/status`, `/api/dashboard/stats`).
   - Asserts Cloudflare Pages Functions router & D1 query integrity.
2. **Parser Integration Test (`test_parser_integration.js`):**
   - Asserts Cloud Run `/health` status (HTTP 200).
   - Asserts 403 Forbidden security rejection for unauthorized requests.
   - Asserts end-to-end binary parsing of real Firebird backups within 2 seconds.

---

## 📄 License
Proprietary & Confidential. All rights reserved.
