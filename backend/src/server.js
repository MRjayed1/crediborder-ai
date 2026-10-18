// ============================================================================
// CREDIBORDER AI — EXPRESS REST API & DETERMINISTIC + AI INVOICE SERVER
// Team Retro Engineers: Sheikh Jayed Ahmed Noyon (CSE), Fahmiduzzaman (CSE), Shadman Sakib (EEE)
// ============================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  sandboxState,
  resetSandboxState,
  calculateUkviTarget,
  calculateCorridorQuotes,
  stageOrExecuteTransfer,
  dispatchDynamicOtp,
  confirmStagedTransferOtp,
  executeAgentScenario
} from './agentEngine.js';
import { verifyEscrowAttestation } from './sepoliaEscrow.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    service: 'CrediBorder AI — Autonomous Cross-Border Student Financial Assistant',
    team: 'Retro Engineers (Sheikh Jayed Ahmed Noyon, Fahmiduzzaman, Shadman Sakib)',
    institution: 'Sylhet Engineering College, Bangladesh',
    llmConfigured: Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY),
    sepoliaMode: process.env.SEPOLIA_PRIVATE_KEY ? 'LIVE_SEPOLIA_RPC' : 'OFFCHAIN_EIP712_SANDBOX_ATTESTATION',
    status: 'ONLINE'
  });
});

app.get('/api/state', (req, res) => {
  res.json(sandboxState);
});

app.post('/api/reset', (req, res) => {
  const fresh = resetSandboxState();
  res.json({ status: 'RESET_COMPLETE', summary: 'Sandbox restored to clean initial state.', state: fresh });
});

app.get('/api/fx/quotes', (req, res) => {
  try {
    const amountGbp = Number(req.query.amountGbp || 1500);
    const quotes = calculateCorridorQuotes(amountGbp, sandboxState.wallets.BDT.fx_rate);
    res.json(quotes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/visa/configure-target', (req, res) => {
  try {
    const target = calculateUkviTarget(req.body || {});
    sandboxState.studentProfile.ukvi_study_location = target.location;
    sandboxState.studentProfile.ukvi_months_counted = target.monthsCounted;
    sandboxState.studentProfile.visa_required_floor_gbp = target.totalRequiredFloorGbp;
    sandboxState.wallets.GBP.locked_floor = target.totalRequiredFloorGbp;
    sandboxState.wallets.GBP.available = Number(
      (sandboxState.wallets.GBP.balance - target.totalRequiredFloorGbp).toFixed(2)
    );
    res.json({ target, state: sandboxState });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/agent/scenario', async (req, res) => {
  try {
    const { scenarioKey, customPayload } = req.body;
    const result = await executeAgentScenario(scenarioKey, customPayload || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/agent/audit-transfer', async (req, res) => {
  try {
    const { promptText, recipientIban, amountGbp } = req.body;
    const result = await stageOrExecuteTransfer({
      promptText,
      recipientIban,
      amountGbp,
      toolName: 'custom_transfer_evaluation'
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payments/request-otp', (req, res) => {
  try {
    const { approvalId, contactChannel } = req.body;
    const dispatchResult = dispatchDynamicOtp({ approvalId, contactChannel });
    res.json(dispatchResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payments/confirm-otp', async (req, res) => {
  try {
    const { approvalId, otpCode, contactChannel, expectedAmountGbp, expectedRecipientIban } = req.body;
    const result = await confirmStagedTransferOtp({
      approvalId,
      otpCode,
      contactChannel,
      expectedAmountGbp,
      expectedRecipientIban
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message, state: sandboxState });
  }
});

app.post('/api/attestation/verify', (req, res) => {
  try {
    const { attestation } = req.body;
    const isValid = verifyEscrowAttestation(attestation);
    res.json({
      valid: isValid,
      algorithm: attestation?.signerAlgorithm || 'secp256k1-ECDSA-SHA256 (EIP-712 Structured Payload)',
      attestationDigest: attestation?.attestationDigest || attestation?.sepolia_attestation_hash || attestation?.txHash,
      timestamp: attestation?.timestamp || new Date().toISOString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message, valid: false });
  }
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CrediBorder AI Backend] Running on http://localhost:${PORT}`);
  });
}

export default app;
