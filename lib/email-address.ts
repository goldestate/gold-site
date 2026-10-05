/**
 * A plausible address, worth sending to. Forms collect it as free text.
 *
 * Its own file so the admin can use it in the browser: lib/email.ts sends mail
 * and is server-only.
 */
export function isEmailShaped(value: string | undefined | null): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
