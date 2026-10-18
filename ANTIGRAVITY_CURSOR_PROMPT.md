# Antigravity / Cursor IDE Master Upgrade Prompt — CrediBorder AI

Copy and paste the prompt below directly into **Antigravity IDE** or **Cursor Composer (`Ctrl+I` / `Cmd+I`)** to apply all architectural, security-gate, UKVI calculation, and UI upgrades across your project:

---

```markdown
You are a Senior Full-Stack FinTech & Security Engineer helping Team Retro Engineers (Sheikh Jayed Ahmed Noyon, Fahmiduzzaman, and Shadman Sakib — Sylhet Engineering College, Bangladesh) finalize **CrediBorder AI: Autonomous Cross-Border Student Financial Assistant** for the 2026 8th FinTechathon (International Track — Topic C).

Please refactor and harden our codebase (`backend/src/sepoliaEscrow.js`, `backend/src/agentEngine.js`, `backend/src/server.js`, `backend/tests/runTests.js`, `frontend/src/App.jsx`, `database/supabase_schema.sql`, and `evidence/sandbox_execution_logs.json`) to implement the following exact specifications without adding unnecessary external dependencies:

### 1. Security & 3-Tier Permission Gate Hardening (`backend/src/agentEngine.js`)
Fix all 5 permission-gate vulnerabilities so the 30% Security & Compliance rubric is 100% bulletproof:
1. **Server-Side Ownership Derivation:** Never trust a client-supplied `isInternalTransfer` boolean. Derive `isOwnAccount = SELF_OWNED_ACCOUNTS.has(cleanIban)` strictly on the server (`GB29-NWBK-6016-1331-9268-19`, `DBBL-SYLHET-104-882910-4`).
2. **Positive Finite Amount Validation:** Reject `amountGbp <= 0`, `NaN`, `null`, booleans, or non-finite values with an explicit `INVALID_AMOUNT` error (`HTTP 400`).
3. **Cumulative £100/Day Tier-2 Auto-Pilot Cap:** Track `daily_tier2_auto_spend_gbp` on `studentProfile`. Only auto-execute Tier-2 internal transfers if `isOwnAccount === true`, `amountGbp <= 100`, AND `(daily_tier2_auto_spend_gbp + amountGbp) <= 100`. If repeated small transfers (e.g., £60 + £60 = £120) exceed £100/day, escalate to Tier 3 (`AWAITING_HITL_OTP`) with a clear explanation.
4. **4-Way Decision Taxonomy & Accurate Explanations:**
   - `BLOCKED_FRAUD` (Tier 3): Prompt-injection regex match or known scam IBAN (`GB00-FAKE...`).
   - `BLOCKED_UNVERIFIED_COUNTERPARTY` (Tier 3): External IBAN not in `VERIFIED_EXTERNAL_BENEFICIARIES` (`GB82-BARC-2000-0055-7799-11`, `GB19-LOYD-3096-2601-8842-00`).
   - `AUTO_EXECUTED` (Tier 2): Verified own account within single and cumulative £100/day cap.
   - `AWAITING_HITL_OTP` (Tier 3): Any payment to a verified external beneficiary (even if £50, explaining that all external third-party payments require Tier-3 OTP rather than falsely claiming `£50 > £100`), or internal transfers exceeding the £100 cap.
5. **Dynamic Scenario 3 Status:** Ensure `SCENARIO_3_ADVERSARIAL_SCAM_BLOCK` derives its `status` and `summary` from the actual `tierResult.decision` rather than hardcoding `BLOCKED_BY_SECURITY_FIREWALL` when given clean inputs.

### 2. End-to-End Payment Staging & Bound 2FA OTP Confirmation (`agentEngine.js` & `server.js`)
1. Implement `stageOrExecuteTransfer()` which:
   - Immediately updates wallet balances (`GBP` and `BDT`) and increments `daily_tier2_auto_spend_gbp` when `decision === 'AUTO_EXECUTED'`.
   - Creates a transaction-bound `pendingApprovals[approvalId]` object (`{ approvalId, recipientIban, recipientName, amountGbp, sourceBdt, savedGbpVsSwift, expiresAt, attemptsRemaining: 3, status: 'PENDING_OTP' }`) when `decision === 'AWAITING_HITL_OTP'`.
2. Add `confirmStagedTransferOtp()` and expose `POST /api/payments/confirm-otp` in `server.js`:
   - Enforce idempotency (`DUPLICATE_EXECUTION_BLOCKED` if already `EXECUTED`), expiry checks, 3-attempt lockout, and parameter-binding verification (`PARAMETER_TAMPERING_DETECTED` if `expectedAmountGbp` or `expectedRecipientIban` changed after staging).
   - On valid demo OTP (`202688`), deduct `sourceBdt` from `wallets.BDT.balance`, record the completed escrow transaction, and append a `COMPLETED_HITL_OTP` audit log.

### 3. Official UKVI £1,529/mo Floor, Formula-Driven Visa Shield & FX Quotes (`agentEngine.js`)
1. Update the UKVI maintenance requirement to the official rates effective 11 November 2025: **£1,529.00/month in London** and **£1,171.00/month outside London** (with `calculateUkviTarget()` supporting 1 to 9 months). Default the demo vault to a 1-month London visa-extension window (**£1,529.00 floor**, **£1,750.00 current balance**, **£221.00 available buffer**, Day 25 of 28 derived from `visaDailyHistory`).
2. In `SCENARIO_2_VISA_FLOOR_SHIELD`, replace hardcoded balances with formula math:
   - Scheduled debit = `£265.00` -> Projected unshielded balance = `£1,750.00 - £265.00 = £1,485.00` (`£44.00` shortfall below `£1,529.00`).
   - Top-up = `Shortfall (£44.00) + Safety Buffer (£50.00) = £94.00` (`14,651 BDT`), keeping post-debit balance at `£1,579.00` and advancing derived compliance to Day 26 of 28.
3. Reframe "UK Equivalency Credit Score" to **"CrediBorder Financial Readiness Score (Experimental)"** and keep credit-builder utilization math internally consistent at **6.8%** (`£19 broadband + £15 SIM = £34.00` on a `£500.00` virtual limit).
4. Add `calculateCorridorQuotes(amountGbp, midMarketRate)` (`GET /api/fx/quotes`) to compute live BDT totals, fees, and savings across SWIFT (`2.8% + £22`), Retail Card (`1.9% + £8`), and CrediBorder Hybrid Escrow (`0.25% + £2.50`).

### 4. Genuine Cryptographic EIP-712 / secp256k1 Attestation (`backend/src/sepoliaEscrow.js`)
- Replace the raw SHA-256 hash & fake Etherscan link with a real `secp256k1` ECDSA cryptographic signature over the structured EIP-712 domain (`chainId: 11155111`) and message payload, plus a `verifyEscrowAttestation()` verification function.
- Label the mode honestly as `OFFCHAIN_EIP712_SANDBOX_ATTESTATION` unless `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` are configured in `.env`.

### 5. Clean 5-Page React UI with OTP Modal & Progressive Disclosure (`frontend/src/App.jsx`)
- Keep the 5-page sidebar layout (`1. Home Overview`, `2. Financial Passport`, `3. 28-Day Visa Shield`, `4. Payments & Scam Shield`, `5. Activity & Proof Logs`) with an offline fallback state so the UI never hangs on `"Loading..."`.
- Separate Engine 1 (Financial Passport on Page 2) from Engine 3 (Corridor Quotes & Payment Staging on Page 4).
- Add the interactive **Tier-3 2FA OTP Confirmation Modal** so staged payments can be confirmed end-to-end.
- Put technical math breakdowns, EIP-712 digests, and signatures inside expandable `<details>` ("View Details") drawers so cards stay clean and scannable.
- Update the team roster everywhere to list all 3 members: **Sheikh Jayed Ahmed Noyon (Lead, CSE)**, **Fahmiduzzaman (CSE)**, and **Shadman Sakib (EEE)**.

### 6. Automated 10-Test Verification Suite (`backend/tests/runTests.js`)
- Expand `runTests.js` to 10 tests verifying spoofed internal flags, negative/NaN amounts, £50 external reason strings, cumulative £100/day Tier-2 cap (`£60 + £60`), clean vs. malicious invoices, dynamic £1,529 UKVI math, bound OTP confirmation + replay blocking, cryptographic signature verification, and 3-member roster consistency. Run `npm test` to confirm all 10 pass.
```
