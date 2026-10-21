export const DEFAULT_PRICES = [
  { resultType: "company", label: "Company found", credits: 0.1 },
  { resultType: "person", label: "Decision maker found", credits: 1 },
  { resultType: "email_verified", label: "Verified email", credits: 5 },
  { resultType: "email_catch_all", label: "Catch-all email", credits: 2 },
  { resultType: "verify_only", label: "Verify only (cleaning)", credits: 0.5 },
  { resultType: "phone", label: "Phone found and live", credits: 40 },
  { resultType: "company_data", label: "Company data column", credits: 5 },
] as const;

export const TOPUP_PACKS = [
  { id: "pack_1000", credits: 1000, usd: 10 },
  { id: "pack_5000", credits: 5000, usd: 45 },
  { id: "pack_20000", credits: 20000, usd: 160 },
] as const;

export const SIGNUP_GRANT_CREDITS = 50;
