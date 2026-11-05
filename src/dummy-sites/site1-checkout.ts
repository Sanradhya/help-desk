const REFERRAL_RATES: Record<string, number> = {
  SAVE10: 0.1,
  WELCOME5: 0.05,
};

export function applyReferralCode(code: string, subtotal: number): number {
  const rate = REFERRAL_RATES[code.toUpperCase()] ?? 0;
  const discount = subtotal * rate;
  return Math.round((subtotal - discount) * 100) / 100;
}
