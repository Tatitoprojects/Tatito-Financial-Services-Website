/** Indian rupee formatting used across the site. */
export function money(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN')
}

/** Compact short id for newly created records. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3)
}

/** Demo-only password obfuscation. Replace with real server-side auth before launch. */
export function hashPassword(value: string): string {
  return btoa(encodeURIComponent(value))
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isEmailOrMobile(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\d{10}$/.test(value)
}

export const EMI_DEFAULTS = { amount: 500000, months: 36 }
