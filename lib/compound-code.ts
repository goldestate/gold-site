import { randomInt } from 'node:crypto';

/**
 * Server-only. Kept out of directory-taxonomy.ts because that module is imported by
 * client components, and pulling node:crypto into the browser bundle fails the build.
 *
 * The alphabet drops O/0 and I/1/L: these codes get read aloud over the phone and
 * retyped from WhatsApp. Generated with crypto randomness on the server only -- a
 * client-generated code would be guessable from the device clock.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCompoundCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
  return `GOLD-${pick(2)}-${pick(4)}`;
}
