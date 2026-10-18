# CrediBorder AI — Autonomous Cross-Border Student Financial Assistant

**2026 8th FinTechathon (Shenzhen International FinTech Competition — WeBank FinTech College Students Challenge)**  
**Track:** International Track — **Topic C: Cross-Border & Student Finance Assistant** *(with Sepolia Testnet Smart-Escrow Challenge Bonus)*  
**Team Name:** Retro Engineers  
**Team Members:** Sheikh Jayed Ahmed Noyon (Lead, CSE), Fahmiduzzaman (CSE), & Shadman Sakib (EEE)  
**Institution:** Sylhet Engineering College (SEC), Sylhet, Bangladesh  
**GitHub Repository:** [https://github.com/MRjayed1/crediborder-ai](https://github.com/MRjayed1/crediborder-ai)

---

## 1. Executive Summary & Real-World Problem Solved

When international students from emerging markets (such as **Sylhet, Bangladesh**) arrive at overseas universities (such as in the **United Kingdom**), currency conversion is only the surface friction. Students face three severe, unsolved structural traps:
1. **The "Credit Ghost" Zero-Reset:** Even with 24+ months of verifiable domestic banking (**Dutch-Bangla Bank**) and mobile-money (**bKash**) history in `BDT`, students arrive in the UK with a **zero credit file**, leading to rejected apartment leases or demands for 6–12 months of upfront rent.
2. **The 28-Day UKVI Visa Maintenance Floor Trap:** Under official UKVI Student Visa regulations (effective 11 November 2025 / 2026), students in London must hold a strict minimum liquid balance (**£1,529.00/month** in London, **£1,171.00/month** outside London) continuously for **28 consecutive days**. A single unexpected debit that drops the account balance below the required floor invalidates the 28-day compliance window and resets the compliance clock to Day 1.
3. **Cross-Border Housing & Tuition Wire Scams:** International students are heavily targeted by spoofed off-campus landlord lease invoices, advance-fee rental scams, unauthorized P2P FX intermediaries, and adversarial **prompt-injection attacks** hidden inside invoice documents.

**CrediBorder AI** is an autonomous financial agent built with **React 18 (Vite + Tailwind CSS + Lucide Icons)**, **Node.js (Express)**, **Supabase (PostgreSQL)**, and an **Ethereum Sepolia Testnet Smart-Escrow module (`ethers.js` + secp256k1 EIP-712)** that actively solves all three traps under a strict **3-Tier Security & Compliance Firewall**.

---

## 2. System Architecture & 3-Engine Design

| Engine | Core Autonomous Capability | Permission Tier |
| :--- | :--- | :--- |
| **Engine 1: Cross-Border Financial Readiness Passport** | Ingests 24-month `BDT` bank/bKash cashflows to compute an explainable **Financial Readiness Score (742–751 / 850)** and runs an autonomous micro-bill credit-builder loop that auto-settles balances 48h before statement close to lock utilization at **6.8% (<8% optimal threshold: £19 broadband + £15 SIM = £34 on a £500 limit)**. | **Tier 1** (Read-Only Attestation) & **Tier 2** (Micro-Loop $\le £100$) |
| **Engine 2: 28-Day UKVI Visa-Solvency Shield** | Continuously forecasts cashflows against the official **£1,529.00 UKVI 28-day rolling floor**. When an upcoming £265 debit threatens to drop the balance to £1,485 (£44 shortfall on Day 25/28), the agent autonomously sweeps **£94.00 (£44 shortfall + £50 safety buffer = 14,651 BDT)** within its Tier-2 £100 cap so the visa floor is never breached and post-debit balance stays at **£1,579.00**. | **Tier 2** (Bounded Auto-Swap $\le £100$ between verified self-wallets) |
| **Engine 3: Adversarial Scam Firewall & Sepolia Escrow** | Audits uploaded tuition/housing invoices for **prompt-injection payloads** (`Ignore previous instructions...`), advance-fee rent anomalies (>40% below £750 median), and checks beneficiary IBANs against an official registry before staging multi-corridor transfers (`BDT -> GBP`) with cryptographic **Sepolia Testnet (`Chain ID: 11155111`)** secp256k1 EIP-712 attestation signatures and bound 2FA OTP confirmation. | **Tier 3** (Mandatory Human-in-the-Loop OTP + Hard Fraud Block) |

---

## 3. Repository Structure

```text
crediborder-ai/
├── .gitignore                       # Clean Git exclusion (node_modules, .env secrets, logs)
├── ANTIGRAVITY_CURSOR_PROMPT.md     # Master Architecture & Security Refactoring Specification
├── README.md                        # Deliverable 04: Deployment & Verification Documentation
├── database/
│   └── supabase_schema.sql          # Full PostgreSQL DDL + £1,529 UKVI Seed Data for Supabase
├── backend/
│   ├── .env.example                 # Free Groq / Gemini API + Supabase + Sepolia RPC template
│   ├── package.json                 # Node.js + Express + Supabase + Ethers v6 dependencies
│   ├── src/
│   │   ├── server.js                # Express REST API, OTP Router & EIP-712 Verification endpoint
│   │   ├── agentEngine.js           # 3-Engine State Machine, 3-Tier Gate & Prompt-Injection Firewall
│   │   └── sepoliaEscrow.js         # Sepolia (Chain ID 11155111) secp256k1 EIP-712 Attestation Module
│   └── tests/
│       └── runTests.js              # Automated verification test suite (12 hardened test suites)
├── frontend/
│   ├── index.html                   # Vite entry point
│   ├── package.json                 # React 18 + Vite + Tailwind CSS + Lucide React icons
│   ├── vite.config.js               # Dev proxy (/api -> localhost:4000) & allowed tunnel hosts
│   └── src/
│       ├── main.jsx                 # React DOM mount
│       └── App.jsx                  # 5-Page Dashboard, UKVI Calculator, 2FA Modal & Proof Log Viewer
└── evidence/
    └── sandbox_execution_logs.json  # Deliverable 06: Simulated-Account & EIP-712 Operation Evidence
```

---

## 4. REST API Endpoint Specification

The backend server exposes a comprehensive RESTful API on `http://localhost:4000`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns service status, SEC team roster, LLM configuration, and Sepolia mode |
| `GET` | `/api/state` | Returns the entire sandbox state (profiles, wallets, visa history, audit logs) |
| `POST` | `/api/reset` | Resets sandbox state back to pristine demo baseline |
| `GET` | `/api/fx/quotes` | Compares live fees and BDT totals across SWIFT, Card, and Hybrid Escrow |
| `POST` | `/api/visa/configure-target` | Recalculates UKVI living cost target (£1,529 London / £1,171 Outside, 1–9 months) |
| `POST` | `/api/agent/scenario` | Executes pre-configured judge demo scenarios (Step 1, Step 2, Step 3) |
| `POST` | `/api/agent/audit-transfer` | Evaluates custom invoice text, recipient IBAN, and amount against 3-tier firewall |
| `POST` | `/api/payments/request-otp` | Dispatches dynamic 6-digit 2FA OTP to registered Gmail or UK mobile SMS |
| `POST` | `/api/payments/confirm-otp` | Validates transaction-bound OTP, settles payment, and releases EIP-712 escrow |
| `POST` | `/api/attestation/verify` | Cryptographically verifies any attestation record using secp256k1 ECDSA |

---

## 5. Step-by-Step Setup in Antigravity IDE, Supabase & Free LLM API

### Step 1: Set Up Supabase Database (2 Minutes)
1. Log in to [Supabase](https://supabase.com) and create a new free project named `crediborder-ai`.
2. Open the **SQL Editor** in the left sidebar, paste the entire contents of `database/supabase_schema.sql`, and click **Run**.
3. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

### Step 2: Get Your Free LLM API Token (Zero Credit Card Required)
- **Option A — Groq Cloud (Recommended for ultra-fast tool calling):** Visit [console.groq.com/keys](https://console.groq.com/keys), sign in with Google/GitHub (no credit card or wallet required), and create an API key for `llama-3.3-70b-versatile`.
- **Option B — Google AI Studio:** Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and generate a free `gemini-2.5-flash` key.
- *(Note: The backend also includes a built-in **Deterministic Autonomous State Machine Fallback**, so all 3 demo scenarios and unit tests run with zero latency even offline!)*

### Step 3: Run Backend & Automated Test Suite
```bash
cd backend
cp .env.example .env
# Paste your free GROQ_API_KEY and SUPABASE_URL / SUPABASE_ANON_KEY in .env
npm install

# Run the automated verification test cases (Deliverable 04 requirement)
npm test

# Start the Express backend server on http://localhost:4000
npm run dev
```

### Step 4: Run React + Vite Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

---

## 6. Verification Test Cases (`npm test`)

Running `npm test` inside `/backend` executes `tests/runTests.js`, verifying 12 hardened test suites (**100% Pass**):
1. **`[TEST 1]` Server-Side Ownership Derivation:** Unknown IBAN with client-spoofed `isInternalTransfer: true` is intercepted and blocked as `BLOCKED_UNVERIFIED_COUNTERPARTY`.
2. **`[TEST 2]` Positive Finite Amount Validation:** Rejects negative (`-£50`), zero (`£0`), `NaN`, `null`, and string amounts with explicit `INVALID_AMOUNT`.
3. **`[TEST 3]` Tier-3 External Beneficiary Rule:** Any payment to a verified third-party beneficiary (even `£50 < £100`) is escalated to Tier 3 (`AWAITING_HITL_OTP`) with an accurate explanation rather than claiming `£50 > £100`.
4. **`[TEST 4]` Cumulative £100/Day Tier-2 Auto-Pilot Cap:** The first `£60` auto-executes; a second `£60` (`£120/day` total) is escalated to Tier 3 (`AWAITING_HITL_OTP`).
5. **`[TEST 5]` Clean Invoice in Scenario 3:** Clean invoice dynamically outputs `AWAITING_HITL_OTP` without false positive fraud blocks.
6. **`[TEST 6]` Adversarial Prompt-Injection & Fake IBAN Block:** Blocks prompt-injection payload (`Ignore previous instructions...`) with Risk Score 100/100 and `BLOCKED_FRAUD`.
7. **`[TEST 7]` Dynamic UKVI £1,529 Visa Shield Math:** Forecasts `£265` debit, computes `£44` shortfall + `£50` buffer = `£94` sweep, and keeps post-debit balance protected at `£1,579.00` on Day 26/28.
8. **`[TEST 8]` End-to-End Staging, Bound 2FA OTP & Idempotency:** Stages `£1,500` tuition, settles upon valid OTP, debits BDT reserve, and blocks replay attacks.
9. **`[TEST 9]` Cryptographic EIP-712 Signature Integrity:** Real secp256k1 ECDSA cryptographic signature over structured EIP-712 payload passes verification; tampered payloads fail.
10. **`[TEST 10]` 3-Member SEC Roster & London/Outside-London Caps:** Validates all 3 SEC team members and verified UKVI living cost caps (`£13,761` London / `£10,539` Outside).
11. **`[TEST 11]` Market Rent Anomaly Detection:** Rent listing priced >40% below student median (`£300` vs `£750`) with unverified counterparty is blocked with `BLOCKED_PRICE_ANOMALY`.
12. **`[TEST 12]` Dynamic 2FA OTP Dispatch via Gmail/Phone & Settlement:** Rotates dynamic 6-digit OTP codes and confirms settlement via registered channel (`+44 7700 900812` / `noyon.cse@gmail.com`).
