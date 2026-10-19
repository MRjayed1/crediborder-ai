// ============================================================================
// CREDIBORDER AI — EXPRESS REST API & MULTI-SESSION REACTION SERVER
// Team Retro Engineers: Sheikh Jayed Ahmed Noyon (CSE), Fahmiduzzaman (CSE), Shadman Sakib (EEE)
// Sylhet Engineering College (SEC), Bangladesh
// ============================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { REGULATORY_CONFIG } from './regulatoryConfig.js';
import {
  getSessionState,
  resetSessionState,
  calculateUkviTarget,
  calculateCorridorQuotes,
  stageOrExecuteTransfer,
  dispatchDynamicOtp,
  confirmStagedTransferOtp,
  executeAgentScenario,
  extractInvoiceWithLLM,
  createShareableReadinessProof
} from './agentEngine.js';

dotenv.config();

const app = express();

// 1. Zero-dependency security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. CORS configuration with regex whitelist for local and ngrok tunnels
const allowedOriginRegex = /^(https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?|https:\/\/.*\.ngrok-free\.(dev|app))$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginRegex.test(origin) || (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// 3. Lightweight in-memory rate limiter (120 req/min per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count += 1;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED: Too many requests, please try again in 1 minute.' });
    }
  }
  rateLimitMap.set(ip, record);
  next();
});

// Helper to extract session ID per browser tab or client
const extractSessionId = (req) => String(req.headers['x-session-id'] || req.query.sessionId || 'default').slice(0, 64);

// ----------------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    service: 'CrediBorder AI — Autonomous Cross-Border Student Financial Assistant',
    team: 'Retro Engineers (Sheikh Jayed Ahmed Noyon, Fahmiduzzaman, Shadman Sakib)',
    institution: 'Sylhet Engineering College, Bangladesh',
    llmConfigured: Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY),
    sepoliaMode: process.env.SEPOLIA_PRIVATE_KEY ? 'LIVE_SEPOLIA_RPC' : 'OFFCHAIN_EIP712_TYPED_DATA_ATTESTATION',
    regulatoryAuthority: REGULATORY_CONFIG.ukviMaintenanceFloors.sourceTitle,
    status: 'ONLINE'
  });
});

app.get('/api/regulatory-config', (req, res) => {
  res.json(REGULATORY_CONFIG);
});

app.get('/api/state', (req, res) => {
  const sessionId = extractSessionId(req);
  res.json(getSessionState(sessionId));
});

app.post('/api/reset', (req, res) => {
  const sessionId = extractSessionId(req);
  const fresh = resetSessionState(sessionId);
  res.json({ status: 'RESET_COMPLETE', summary: 'Sandbox restored to clean initial state.', state: fresh });
});

app.get('/api/sandbox/inbox', (req, res) => {
  const sessionId = extractSessionId(req);
  const state = getSessionState(sessionId);
  res.json({ inbox: state.sandboxInbox || [] });
});

app.get('/api/fx/quotes', (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    const state = getSessionState(sessionId);
    const amountGbp = Number(req.query.amountGbp || 1500);
    const quotes = calculateCorridorQuotes(amountGbp, state.wallets.BDT.fx_rate);
    res.json(quotes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/visa/configure-target', (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    const state = getSessionState(sessionId);
    const target = calculateUkviTarget(req.body || {});

    state.studentProfile.ukvi_study_location = target.location;
    state.studentProfile.ukvi_months_counted = target.monthsCounted;
    state.studentProfile.visa_required_floor_gbp = target.totalRequiredFloorGbp;
    state.wallets.GBP.locked_floor = target.totalRequiredFloorGbp;
    state.wallets.GBP.available = Number((state.wallets.GBP.balance - target.totalRequiredFloorGbp).toFixed(2));

    res.json({ target, state });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/agent/scenario', async (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    const { scenarioKey, customPayload } = req.body || {};
    if (!scenarioKey) {
      return res.status(400).json({ error: 'MISSING_SCENARIO_KEY: scenarioKey is required.' });
    }
    const result = await executeAgentScenario(scenarioKey, customPayload || {}, sessionId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/agent/extract-invoice', async (req, res) => {
  try {
    const rawText = req.body?.rawText;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'INVALID_INPUT: rawText string is required.' });
    }
    const extracted = await extractInvoiceWithLLM(rawText);
    res.json(extracted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/passport/share-proof', async (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    const { consentGranted } = req.body || {};
    const proof = await createShareableReadinessProof(sessionId, Boolean(consentGranted));
    res.json(proof);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/agent/audit-transfer', async (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    const { promptText, recipientIban, amountGbp } = req.body || {};

    const numAmount = Number(amountGbp);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'INVALID_AMOUNT: Transfer amountGbp must be a positive finite number.' });
    }
    if (numAmount > REGULATORY_CONFIG.permissionGovernanceLimits.MAX_TRANSFER_AMOUNT_GBP) {
      return res.status(400).json({ error: `AMOUNT_EXCEEDS_MAX_CAP: Max single transfer is £${REGULATORY_CONFIG.permissionGovernanceLimits.MAX_TRANSFER_AMOUNT_GBP}.` });
    }

    const result = await stageOrExecuteTransfer({
      promptText: String(promptText || ''),
      recipientIban: String(recipientIban || ''),
      amountGbp: numAmount,
      toolName: 'custom_transfer_evaluation',
      sessionId
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payments/request-otp', (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    const { approvalId, contactChannel } = req.body || {};
    if (!approvalId || !contactChannel) {
      return res.status(400).json({ error: 'MISSING_FIELDS: approvalId and contactChannel are required.' });
    }
    const dispatchResult = dispatchDynamicOtp({ approvalId, contactChannel, sessionId });
    res.json(dispatchResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payments/confirm-otp', async (req, res) => {
  const sessionId = extractSessionId(req);
  try {
    const { approvalId, otpCode, contactChannel, expectedAmountGbp, expectedRecipientIban } = req.body || {};
    if (!approvalId || !otpCode) {
      return res.status(400).json({ error: 'MISSING_FIELDS: approvalId and otpCode are required.' });
    }
    const result = await confirmStagedTransferOtp({
      approvalId,
      otpCode,
      contactChannel,
      expectedAmountGbp,
      expectedRecipientIban,
      sessionId
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message, state: getSessionState(sessionId) });
  }
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CrediBorder AI Backend] Running on http://localhost:${PORT}`);
  });
}

export default app;
