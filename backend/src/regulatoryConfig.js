// ============================================================================
// CREDIBORDER AI — REGULATORY CONFIGURATION (SINGLE SOURCE OF TRUTH & CITATIONS)
// Team Retro Engineers: Sheikh Jayed Ahmed Noyon, Fahmiduzzaman, Shadman Sakib
// Sylhet Engineering College (SEC), Bangladesh
// ============================================================================

export const REGULATORY_CONFIG = {
  ukviMaintenanceFloors: {
    LONDON_MONTHLY_GBP: 1529.00,
    OUTSIDE_LONDON_MONTHLY_GBP: 1171.00,
    MAX_MONTHS_COUNTED: 9,
    CONSECUTIVE_DAYS_REQUIRED: 28,
    maxAccommodationDepositDeductibleGbp: 1529.00,
    sourceTitle: 'UK Home Office — Immigration Rules Appendix Student & Appendix Finance (Financial Requirement Update)',
    sourceUrl: 'https://www.gov.uk/student-visa/money',
    effectiveAsOf: '2025-11-11 (2025/2026 Academic Visa Cycle)'
  },
  ukStudentHousingBenchmarks: {
    CAMPUS_STUDIO_MEDIAN_MONTHLY_GBP: 750.00,
    ANOMALY_DEVIATION_THRESHOLD_PCT: 40,
    sourceTitle: 'UK Purpose-Built Student Accommodation (PBSA) & Unipol National Student Housing Survey Benchmark',
    effectiveAsOf: '2026-Q1'
  },
  permissionGovernanceLimits: {
    TIER2_SINGLE_AUTO_CAP_GBP: 100.00,
    TIER2_DAILY_CUMULATIVE_CAP_GBP: 100.00,
    OTP_TTL_MS: 10 * 60 * 1000, // 10 minutes
    MAX_OTP_ATTEMPTS: 3,
    MAX_TRANSFER_AMOUNT_GBP: 50000.00
  },
  readinessIndexMethodology: {
    scaleMin: 300,
    scaleMax: 850,
    baselineScore: 742,
    postTuitionScore: 751,
    virtualCardLimitGbp: 500.00,
    routedBillsGbp: 34.00,
    optimalUtilizationPct: 6.8,
    disclaimer: 'CrediBorder Readiness Score (742 -> 751) is an explainable cross-border affordability index derived from 24-month Open Banking cashflows, not an official Experian/Equifax/TransUnion UK bureau score.'
  }
};

export default REGULATORY_CONFIG;
