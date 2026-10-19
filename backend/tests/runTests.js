// ============================================================================
// CREDIBORDER AI — HARDENED 12-TEST AUTOMATED VERIFICATION SUITE
// Team Retro Engineers: Sheikh Jayed Ahmed Noyon, Fahmiduzzaman, Shadman Sakib
// ============================================================================
import assert from 'assert';
import {
  sandboxState,
  resetSandboxState,
  calculateUkviTarget,
  calculateCorridorQuotes,
  scanForPromptInjectionAndFraud,
  evaluatePermissionTier,
  stageOrExecuteTransfer,
  dispatchDynamicOtp,
  confirmStagedTransferOtp,
  executeAgentScenario
} from '../src/agentEngine.js';
import { verifyEscrowAttestation } from '../src/sepoliaEscrow.js';

async function runAllTests() {
  console.log('====================================================================');
  console.log(' CREDIBORDER AI — HARDENED 12-TEST SECURITY & EXECUTION SUITE');
  console.log(' Team: Retro Engineers (Noyon, Fahmiduzzaman, Shadman Sakib) | SEC');
  console.log('====================================================================\n');

  resetSandboxState();

  // TEST 1: Server-side ownership verification blocks spoofed isInternalTransfer: true on unknown IBAN
  console.log('[TEST 1] Rejecting spoofed isInternalTransfer: true on unverified IBAN...');
  const spoofEval = evaluatePermissionTier({
    toolName: 'custom_transfer_evaluation',
    amountGbp: 95,
    recipientIban: 'GB00-UNKNOWN-1234',
    isInternalTransfer: true // Client attempts to spoof internal flag
  });
  assert.strictEqual(spoofEval.tier, 3);
  assert.strictEqual(spoofEval.decision, 'BLOCKED_UNVERIFIED_COUNTERPARTY');
  console.log('  -> PASS: Unknown IBAN with spoofed internal flag blocked as', spoofEval.decision);

  // TEST 2: Reject negative, zero, and NaN transfer amounts
  console.log('\n[TEST 2] Rejecting negative (-£50), zero (£0), and NaN amounts...');
  for (const invalidAmt of [-50, 0, NaN, 'abc', null]) {
    let threw = false;
    try {
      evaluatePermissionTier({
        toolName: 'custom_transfer_evaluation',
        amountGbp: invalidAmt,
        recipientIban: 'GB29-NWBK-6016-1331-9268-19'
      });
    } catch (err) {
      threw = err.message.includes('INVALID_AMOUNT');
    }
    assert.strictEqual(threw, true, `Expected INVALID_AMOUNT error for ${invalidAmt}`);
  }
  console.log('  -> PASS: All negative, zero, and malformed amounts rejected with INVALID_AMOUNT.');

  // TEST 3: £50 external transfer to verified university reaches Tier 3 with accurate explanation
  console.log('\n[TEST 3] Verifying £50 external payment to verified university IBAN...');
  const ext50 = evaluatePermissionTier({
    toolName: 'custom_transfer_evaluation',
    amountGbp: 50,
    recipientIban: 'GB82-BARC-2000-0055-7799-11'
  });
  assert.strictEqual(ext50.tier, 3);
  assert.strictEqual(ext50.decision, 'AWAITING_HITL_OTP');
  assert.ok(!ext50.reason.includes('> £100.00'), 'Must not falsely claim £50 > £100');
  assert.ok(ext50.reason.includes('External payment (£50.00)'), 'Must explain external beneficiary rule');
  console.log('  -> PASS: £50 external payment routed to Tier-3 with accurate reason:', ext50.reason);

  // TEST 4: Cumulative £100/day Tier-2 auto-pilot cap prevents repeated small transfers bypassing limit
  console.log('\n[TEST 4] Verifying cumulative £100/day Tier-2 auto-pilot cap (£60 + £60)...');
  resetSandboxState();
  const first60 = await stageOrExecuteTransfer({
    promptText: 'Internal sweep 1',
    recipientIban: 'GB29-NWBK-6016-1331-9268-19',
    amountGbp: 60
  });
  assert.strictEqual(first60.tierResult.tier, 2);
  assert.strictEqual(first60.tierResult.decision, 'AUTO_EXECUTED');
  assert.strictEqual(sandboxState.studentProfile.daily_tier2_auto_spend_gbp, 60);

  const second60 = await stageOrExecuteTransfer({
    promptText: 'Internal sweep 2',
    recipientIban: 'GB29-NWBK-6016-1331-9268-19',
    amountGbp: 60
  });
  assert.strictEqual(second60.tierResult.tier, 3);
  assert.strictEqual(second60.tierResult.decision, 'AWAITING_HITL_OTP');
  assert.ok(second60.tierResult.reason.includes('Cumulative daily Tier-2 limit reached'));
  console.log('  -> PASS: First £60 AUTO_EXECUTED (Tier 2); second £60 escalated to Tier 3 (AWAITING_HITL_OTP).');

  // TEST 5: Clean invoice passed to SCENARIO_3 does not falsely report fraud blocked
  console.log('\n[TEST 5] Verifying clean invoice in SCENARIO_3 returns AWAITING_HITL_OTP accurately...');
  resetSandboxState();
  const cleanScen3 = await executeAgentScenario('SCENARIO_3_ADVERSARIAL_SCAM_BLOCK', {
    invoiceText: 'Official Tuition Instalment',
    recipientIban: 'GB82-BARC-2000-0055-7799-11',
    amountGbp: 850
  });
  assert.strictEqual(cleanScen3.status, 'AWAITING_HITL_OTP');
  assert.ok(cleanScen3.summary.includes('Invoice Passed Fraud Scan'));
  console.log('  -> PASS: Clean invoice returned consistent status:', cleanScen3.status);

  // TEST 6: Malicious prompt-injection invoice blocked with risk >= 90
  console.log('\n[TEST 6] Verifying adversarial prompt-injection & fake IBAN block...');
  resetSandboxState();
  const scamScen3 = await executeAgentScenario('SCENARIO_3_ADVERSARIAL_SCAM_BLOCK');
  assert.strictEqual(scamScen3.status, 'BLOCKED_FRAUD');
  assert.ok(scamScen3.log.risk_score >= 90);
  console.log('  -> PASS: Malicious invoice blocked with Risk Score', scamScen3.log.risk_score + '/100.');

  // TEST 7: Dynamic UKVI 28-Day Visa Shield calculation (London £1,529 floor, £1,750 balance, £265 debit -> £94 sweep)
  console.log('\n[TEST 7] Verifying dynamic UKVI £1,529 Visa Shield math & balance protection...');
  resetSandboxState();
  const visaRes = await executeAgentScenario('SCENARIO_2_VISA_FLOOR_SHIELD');
  assert.strictEqual(visaRes.status, 'AUTO_EXECUTED');
  assert.strictEqual(visaRes.calculation.shortfallGbp, 44.00);
  assert.strictEqual(visaRes.calculation.recommendedTopUpGbp, 94.00);
  assert.strictEqual(sandboxState.wallets.GBP.balance, 1579.00);
  assert.strictEqual(sandboxState.studentProfile.visa_consecutive_compliant_days, 26);
  console.log('  -> PASS: Computed £44 shortfall + £50 buffer = £94 sweep; post-debit balance £1,579.00 (Day 26/28).');

  // TEST 8: End-to-end Tuition Staging + Bound OTP Confirmation + Replay/Tamper Prevention
  console.log('\n[TEST 8] Verifying end-to-end £1,500 tuition stage -> OTP confirmation -> idempotency...');
  resetSandboxState();
  const stageTuition = await executeAgentScenario('SCENARIO_1_CREDIT_AND_TUITION');
  assert.strictEqual(stageTuition.status, 'AWAITING_HITL_OTP');
  const approvalId = stageTuition.pendingApproval.approvalId;
  const initialBdt = sandboxState.wallets.BDT.balance;

  // Attempt wrong OTP first
  let wrongOtpRejected = false;
  try {
    await confirmStagedTransferOtp({ approvalId, otpCode: '000000' });
  } catch (err) {
    wrongOtpRejected = err.message.includes('INVALID_OTP');
  }
  assert.strictEqual(wrongOtpRejected, true);

  // Confirm with valid OTP 202688
  const confirmRes = await confirmStagedTransferOtp({
    approvalId,
    otpCode: '202688',
    expectedAmountGbp: 1500,
    expectedRecipientIban: 'GB82-BARC-2000-0055-7799-11'
  });
  assert.strictEqual(confirmRes.status, 'COMPLETED_HITL_OTP');
  assert.strictEqual(sandboxState.wallets.BDT.balance, initialBdt - stageTuition.pendingApproval.sourceBdt);

  // Attempt replay of the same approvalId
  let replayBlocked = false;
  try {
    await confirmStagedTransferOtp({ approvalId, otpCode: '202688' });
  } catch (err) {
    replayBlocked = err.message.includes('DUPLICATE_EXECUTION_BLOCKED');
  }
  assert.strictEqual(replayBlocked, true);
  console.log('  -> PASS: Staged £1,500 settled on valid OTP, BDT deducted, and replay attack blocked.');

  // TEST 9: Cryptographic EIP-712 / secp256k1 Attestation Verification
  console.log('\n[TEST 9] Verifying cryptographic EIP-712 signature integrity...');
  assert.strictEqual(verifyEscrowAttestation(confirmRes.attestation), true);
  const tamperedAttestation = { ...confirmRes.attestation, canonicalPayload: confirmRes.attestation.canonicalPayload + ' ' };
  assert.strictEqual(verifyEscrowAttestation(tamperedAttestation), false);
  console.log('  -> PASS: Valid signature verified; tampered payload rejected.');

  // TEST 10: Team Roster & UKVI Calculator Verification
  console.log('\n[TEST 10] Verifying 3-member SEC roster & UKVI London/Outside-London calculator...');
  assert.strictEqual(sandboxState.teamRoster.length, 3);
  assert.strictEqual(sandboxState.teamRoster[2].name, 'Shadman Sakib');
  const london9m = calculateUkviTarget({ location: 'LONDON', monthsCounted: 9 });
  const outside9m = calculateUkviTarget({ location: 'OUTSIDE_LONDON', monthsCounted: 9 });
  assert.strictEqual(london9m.totalRequiredFloorGbp, 13761.00);
  assert.strictEqual(outside9m.totalRequiredFloorGbp, 10539.00);
  console.log('  -> PASS: All 3 team members present; UKVI 9-month caps verified (£13,761 London / £10,539 Outside).');

  // TEST 11: Below-Market Rent Anomaly Detection (£300 vs £750 median)
  console.log('\n[TEST 11] Verifying Market Rent Anomaly Detection (£300 vs £750 median)...');
  const rentScan = scanForPromptInjectionAndFraud(
    'Private student room flat near university campus £300 rent monthly advance holding deposit',
    'GB44-MULE-8811-2233-44',
    300
  );
  assert.strictEqual(rentScan.priceAnomalyDetected, true);
  assert.strictEqual(rentScan.priceAnomalyDeviationPct, 60);
  const rentPerm = evaluatePermissionTier({
    amountGbp: 300,
    recipientIban: 'GB44-MULE-8811-2233-44',
    securityScan: rentScan
  });
  assert.strictEqual(rentPerm.decision, 'BLOCKED_PRICE_ANOMALY');
  assert.strictEqual(rentPerm.tier, 3);
  console.log('  -> PASS: Rent anomaly flagged (60% below median) and blocked with BLOCKED_PRICE_ANOMALY.');

  // TEST 12: Dynamic 2FA OTP Dispatch (Phone / Gmail) & Dynamic Code Verification
  console.log('\n[TEST 12] Verifying Dynamic 2FA OTP Dispatch via Gmail/Phone & Settlement...');
  resetSandboxState();
  const stagedDynamic = await stageOrExecuteTransfer({
    promptText: 'Official University Hall Deposit',
    recipientIban: 'GB19-LOYD-3096-2601-8842-00',
    amountGbp: 600
  });
  const dynApprovalId = stagedDynamic.pendingApproval.approvalId;
  const otpDispatch1 = dispatchDynamicOtp({
    approvalId: dynApprovalId,
    contactChannel: 'noyon.cse@gmail.com'
  });
  assert.strictEqual(otpDispatch1.channelType, 'GMAIL');
  assert.strictEqual(otpDispatch1.dynamicOtpCode.length, 6);
  // Dispatch a second time to verify code rotates dynamically
  const otpDispatch2 = dispatchDynamicOtp({
    approvalId: dynApprovalId,
    contactChannel: '+447700900812'
  });
  assert.strictEqual(otpDispatch2.channelType, 'SMS');
  assert.strictEqual(otpDispatch2.dynamicOtpCode.length, 6);
  assert.notStrictEqual(otpDispatch1.dynamicOtpCode, otpDispatch2.dynamicOtpCode);

  const dynConfirm = await confirmStagedTransferOtp({
    approvalId: dynApprovalId,
    otpCode: otpDispatch2.dynamicOtpCode,
    contactChannel: '+447700900812',
    expectedAmountGbp: 600,
    expectedRecipientIban: 'GB19-LOYD-3096-2601-8842-00'
  });
  assert.strictEqual(dynConfirm.status, 'COMPLETED_HITL_OTP');
  console.log(`  -> PASS: Dynamic 2FA rotated (${otpDispatch1.dynamicOtpCode} -> ${otpDispatch2.dynamicOtpCode}) & settled via ${otpDispatch2.contactChannel}.`);

  console.log('\n====================================================================');
  console.log(' ALL 12 TEST SUITES PASSED (100% SECURITY, MATH & STATE COMPLIANCE)');
  console.log('====================================================================');
}

runAllTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
