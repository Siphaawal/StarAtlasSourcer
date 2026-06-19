// Lightweight Solana address validation (format check, not on-curve verification).
// Solana public keys are base58-encoded 32-byte values → 32–44 base58 chars.
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaAddress(addr: string): boolean {
  return BASE58.test(addr.trim());
}

/** Shorten an address for display, e.g. "7Xy9...4mTq". */
export function shortAddress(addr: string): string {
  const a = addr.trim();
  return a.length <= 12 ? a : `${a.slice(0, 4)}…${a.slice(-4)}`;
}
