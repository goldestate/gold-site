/**
 * Egyptian phone numbers as they actually arrive: pasted from WhatsApp, typed on a
 * phone keyboard that may be set to Arabic, two numbers on one line, a five-digit
 * hotline instead of a number. Shared by the admin (client) and the API (server),
 * so it imports nothing.
 */

const ARABIC_INDIC = /[٠-٩۰-۹]/g;

/** ٠١٠ and ۰۱۰ become 010. Keyboards set to Arabic type these, and nothing downstream dials them. */
export function toAsciiDigits(value: string): string {
  return value.replace(ARABIC_INDIC, (char) => {
    const code = char.charCodeAt(0);
    return String((code >= 0x06f0 ? code - 0x06f0 : code - 0x0660));
  });
}

/** Digits only, keeping a leading + (international). */
export function cleanPhone(raw: string): string {
  const ascii = toAsciiDigits(raw).trim();
  const digits = ascii.replace(/\D/g, '');
  return ascii.startsWith('+') ? `+${digits}` : digits;
}

/** 01x mobile, in local, 20-prefixed, +20 or 0020 form. */
export function isEgyptianMobile(raw: string): boolean {
  const digits = cleanPhone(raw).replace(/^\+/, '');
  // The optional 0 after 20 covers "+20 0100...", which people write constantly.
  return /^(?:(?:0020|20)0?)?0?1[0125]\d{8}$/.test(digits);
}

/**
 * Short national service numbers: 19xxx, 16xxx, 15xxx and the like. Only 15-19:
 * a five-digit run starting 10-14 is a unit or a plot ("Unit 12345"), not a line.
 */
const HOTLINE = /^1[5-9]\d{3}$/;

export function isHotline(raw: string): boolean {
  return HOTLINE.test(cleanPhone(raw));
}

/**
 * Whether a number can be on WhatsApp at all. Egyptian landlines (02, 03, 046...)
 * and hotlines cannot, and a WhatsApp button for one opens a chat that goes
 * nowhere. Foreign numbers are allowed: a foreign-registered handyman is rare but
 * real, and nothing about the number says he isn't on WhatsApp.
 */
export function isWhatsAppCapable(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const cleaned = cleanPhone(raw);
  if (isEgyptianMobile(cleaned)) return true;
  if (cleaned.startsWith('+')) return !cleaned.startsWith('+20') && cleaned.length >= 9;
  if (cleaned.startsWith('00')) return !cleaned.startsWith('0020') && cleaned.length >= 10;
  return false;
}

/** The WhatsApp number to store for a phone, or null when it cannot be one. */
export function whatsappFor(raw: string | null | undefined): string | null {
  return raw && isWhatsAppCapable(raw) ? cleanPhone(raw) : null;
}

/** A run of digits that is a whole number on its own, so the next group starts a new one. */
function isComplete(digits: string): boolean {
  const d = digits.replace(/^\+/, '');
  return (
    /^01[0125]\d{8}$/.test(d) || // mobile
    /^(?:0020|20)1[0125]\d{8}$/.test(d) || // mobile, international form
    /^02\d{8}$/.test(d) || // Cairo and Giza
    /^03\d{7}$/.test(d) || // Alexandria
    /^0[4-9]\d{8}$/.test(d) || // every other governorate, e.g. Matrouh 046
    HOTLINE.test(d) ||
    (digits.startsWith('+') && d.length >= 11)
  );
}

/** Splits digits typed with no gap between two numbers: 0100123456701223334444. */
function splitGlued(digits: string): string[] {
  if (digits.length <= 13 || digits.startsWith('+')) return [digits];
  for (const size of [11, 10, 9]) {
    const head = digits.slice(0, size);
    const tail = digits.slice(size);
    if (isComplete(head) && tail.startsWith('0')) return [head, ...splitGlued(tail)];
  }
  return [digits];
}

/** Whether a cleaned run is worth treating as a phone number rather than, say, a villa number. */
function isPhoneLike(digits: string): boolean {
  const d = digits.replace(/^\+/, '');
  return d.length >= 7 || HOTLINE.test(d);
}

/**
 * A villa, building or unit number: one to four digits, no leading 0 or +. When
 * one comes right before a number ("Building 12 - 0100 123 4567", "Ahmed 2 0100
 * ..."), gluing it on makes 1201001234567, which dials nobody.
 */
function isLabelNumber(digits: string): boolean {
  return /^[1-9]\d{0,3}$/.test(digits);
}

export type ExtractedLine = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
};

/**
 * One pasted line in, a name and numbers out.
 *
 * Numbers are separated where one ends and the next begins, so "0100 123 4567 -
 * 0122 555 4433" is two numbers, not one 22-digit phone. The first number is the
 * phone; the first mobile among them is the WhatsApp, so a pharmacy's landline
 * with a delivery mobile after it gets both buttons, and a landline alone gets no
 * WhatsApp button at all.
 */
export function extractLine(line: string): ExtractedLine {
  const text = toAsciiDigits(line);
  const runs = [...text.matchAll(/\+?\(?\d[\d\s\-().]*\d|\b\d{5}\b/g)];
  const numbers: string[] = [];
  const keep: { start: number; end: number }[] = [];

  for (const run of runs) {
    const runStart = run.index ?? 0;
    const found: string[] = [];
    let current = '';
    // Where this run's numbers begin. A label number dropped from the front stays
    // in the name, so "Building 12" keeps its 12.
    let numbersStart = runStart;
    for (const match of run[0].matchAll(/\+?\d+/g)) {
      const group = match[0];
      if (current && isComplete(current) && /^[+0]/.test(group)) {
        found.push(current);
        current = group;
      } else if (found.length === 0 && isLabelNumber(current) && (group.startsWith('0') || isComplete(group))) {
        // A short run before a 0 (or a whole number) is a label, not the number's start.
        current = group;
        numbersStart = runStart + (match.index ?? 0);
      } else {
        current += current ? group.replace(/^\+/, '') : group;
      }
    }
    if (current) found.push(current);
    const usable = found.flatMap(splitGlued).filter(isPhoneLike);
    if (usable.length > 0) {
      numbers.push(...usable);
      keep.push({ start: numbersStart, end: runStart + run[0].length });
    }
  }

  let name = '';
  let cursor = 0;
  for (const span of keep) {
    name += `${text.slice(cursor, span.start)} `;
    cursor = span.end;
  }
  name += text.slice(cursor);
  name = name
    .replace(/\s+/g, ' ')
    .replace(/(?:[\s\-–—:,/|•]|\bor\b|\btel\b|\bphone\b)+$/gi, '')
    .replace(/^[\s\-–—:,/|•]+/, '')
    .trim();

  const phone = numbers[0] ?? null;
  const whatsapp = numbers.find((item) => isWhatsAppCapable(item)) ?? null;
  return { name: name || phone || '', phone, whatsapp };
}
