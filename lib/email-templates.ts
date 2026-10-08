import { SITE_URL } from './site-content';
import { locationLabel, type LocationValue } from './property-taxonomy';
import { rentalPropertyTypeLabel, type RentalPropertyTypeValue } from './rental-taxonomy';
import type { Email } from './email';

/**
 * The emails the site sends. Guests get both languages in one message, the one
 * they used on the site first: nothing about an email address says which
 * language its owner reads. Staff notifications are English, like the admin.
 */

type Lang = 'en' | 'ar';

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FONT = 'Helvetica, Arial, sans-serif';
const FONT_AR = 'Tahoma, Arial, sans-serif';

function button(href: string, label: string): string {
  return `<a href="${escape(href)}" style="display:inline-block;background:#D9B355;color:#231F20;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px;padding:12px 22px;border-radius:999px;">${escape(label)}</a>`;
}

/** One language's part of a message: paragraphs, then an optional button. */
type Part = { paragraphs: string[]; action?: { href: string; label: string }; footnote?: string };

function partHtml(part: Part, lang: Lang): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';
  const font = lang === 'ar' ? FONT_AR : FONT;
  const paragraphs = part.paragraphs
    .map((text) => `<p style="margin:0 0 14px;">${escape(text)}</p>`)
    .join('');
  const action = part.action ? `<p style="margin:20px 0 14px;">${button(part.action.href, part.action.label)}</p>` : '';
  const footnote = part.footnote
    ? `<p style="margin:0;color:#A39D94;font-size:13px;">${escape(part.footnote)}</p>`
    : '';
  return `<div dir="${dir}" style="text-align:${align};font-family:${font};color:#F2EEE6;font-size:15px;line-height:1.65;">${paragraphs}${action}${footnote}</div>`;
}

function layout(parts: { lang: Lang; part: Part }[]): string {
  const body = parts
    .map(({ lang, part }, index) =>
      (index > 0 ? '<hr style="border:none;border-top:1px solid #3d3637;margin:24px 0;">' : '') + partHtml(part, lang)
    )
    .join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#231F20;border-radius:16px;">
<tr><td style="padding:28px 28px 6px;font-family:${FONT};color:#D9B355;font-size:13px;letter-spacing:5px;">GOLD</td></tr>
<tr><td style="padding:12px 28px 30px;">${body}</td></tr>
</table>
<p style="margin:16px 0 0;font-family:${FONT};color:#8a847c;font-size:12px;">GOLD Investment Opportunities · <a href="${SITE_URL}" style="color:#8a847c;">gold-eg.com</a></p>
</td></tr></table></body></html>`;
}

function partText(part: Part): string {
  return [
    ...part.paragraphs,
    ...(part.action ? [`${part.action.label}: ${part.action.href}`] : []),
    ...(part.footnote ? [part.footnote] : [])
  ].join('\n\n');
}

function bilingual(first: Lang, parts: Record<Lang, Part>, subjects: Record<Lang, string>): Omit<Email, 'to'> {
  const order: Lang[] = first === 'ar' ? ['ar', 'en'] : ['en', 'ar'];
  return {
    subject: subjects[first],
    html: layout(order.map((lang) => ({ lang, part: parts[lang] }))),
    text: order.map((lang) => partText(parts[lang])).join('\n\n—\n\n')
  };
}

export function ndaUrl(token: string, lang: Lang): string {
  return `${SITE_URL}/${lang}/nda/${token}`;
}

/** To a broker, after "Request a unit". */
export function requestReceivedEmail(input: {
  to: string;
  lang: Lang;
  name: string;
  referenceCode: string;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  ndaToken: string | null;
}): Email {
  const unit = (lang: Lang) =>
    `${rentalPropertyTypeLabel(input.propertyType, lang)} — ${locationLabel(input.location, lang)}`;
  const sign = (lang: Lang) =>
    input.ndaToken
      ? {
          action: {
            href: ndaUrl(input.ndaToken, lang),
            label: lang === 'ar' ? 'وقّع الاتفاقية' : 'Sign the agreement'
          },
          footnote:
            lang === 'ar'
              ? 'إذا كنت قد وقّعتها بالفعل، فلا داعي لأي شيء آخر.'
              : 'If you have already signed it, there is nothing else to do.'
        }
      : {};
  return {
    to: input.to,
    ...bilingual(
      input.lang,
      {
        en: {
          paragraphs: [
            `Hello ${input.name},`,
            `Thank you. GOLD's team has your request: ${unit('en')}, reference ${input.referenceCode}. We will contact you on WhatsApp with units that match.`,
            ...(input.ndaToken ? ['Next step: sign GOLD’s confidentiality agreement.'] : [])
          ],
          ...sign('en')
        },
        ar: {
          paragraphs: [
            `مرحباً ${input.name}،`,
            `شكراً لك. وصل طلبك إلى فريق جولد: ${unit('ar')}، المرجع ${input.referenceCode}. سنتواصل معك على واتساب بالوحدات المناسبة.`,
            ...(input.ndaToken ? ['الخطوة التالية: وقّع اتفاقية السرية الخاصة بجولد.'] : [])
          ],
          ...sign('ar')
        }
      },
      {
        en: `We received your request · ${input.referenceCode}`,
        ar: `استلمنا طلبك · ${input.referenceCode}`
      }
    )
  };
}

/** To an owner, after "List your property". */
export function listingReceivedEmail(input: {
  to: string;
  lang: Lang;
  name: string;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  ndaToken: string | null;
}): Email {
  const unit = (lang: Lang) =>
    `${rentalPropertyTypeLabel(input.propertyType, lang)} — ${locationLabel(input.location, lang)}`;
  const sign = (lang: Lang) =>
    input.ndaToken
      ? {
          action: {
            href: ndaUrl(input.ndaToken, lang),
            label: lang === 'ar' ? 'وقّع الاتفاقية' : 'Sign the agreement'
          },
          footnote:
            lang === 'ar'
              ? 'إذا كنت قد وقّعتها بالفعل، فلا داعي لأي شيء آخر.'
              : 'If you have already signed it, there is nothing else to do.'
        }
      : {};
  return {
    to: input.to,
    ...bilingual(
      input.lang,
      {
        en: {
          paragraphs: [
            `Hello ${input.name},`,
            `Thank you for listing your property with GOLD: ${unit('en')}. Our team reviews every listing before it goes live, and will contact you on WhatsApp.`,
            ...(input.ndaToken ? ['Next step: sign GOLD’s confidentiality agreement.'] : [])
          ],
          ...sign('en')
        },
        ar: {
          paragraphs: [
            `مرحباً ${input.name}،`,
            `شكراً لعرض عقارك مع جولد: ${unit('ar')}. يراجع فريقنا كل عقار قبل نشره، وسنتواصل معك على واتساب.`,
            ...(input.ndaToken ? ['الخطوة التالية: وقّع اتفاقية السرية الخاصة بجولد.'] : [])
          ],
          ...sign('ar')
        }
      },
      {
        en: 'We received your property listing',
        ar: 'استلمنا عرض عقارك'
      }
    )
  };
}

const ADMIN_RENTAL_DESK = `${SITE_URL}/goldenadmin2026/rental-desk`;

function adminEmail(to: string, subject: string, lines: string[], action: { href: string; label: string }): Email {
  const part: Part = { paragraphs: lines, action };
  return { to, subject, html: layout([{ lang: 'en', part }]), text: partText(part) };
}

/** To GOLD staff, when a request or a listing arrives. */
export function adminSubmissionEmail(input: {
  to: string;
  kind: 'request' | 'listing';
  name: string;
  phone: string;
  email: string | null;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  referenceCode?: string;
}): Email {
  const what = `${rentalPropertyTypeLabel(input.propertyType, 'en')} — ${locationLabel(input.location, 'en')}`;
  return adminEmail(
    input.to,
    input.kind === 'request'
      ? `New request ${input.referenceCode ?? ''} · ${input.name}`
      : `New listing · ${input.name}`,
    [
      input.kind === 'request' ? `New unit request${input.referenceCode ? ` (${input.referenceCode})` : ''}.` : 'New property listing.',
      `${input.name} · ${input.phone}${input.email ? ` · ${input.email}` : ''}`,
      what
    ],
    { href: ADMIN_RENTAL_DESK, label: 'Open the Rental Desk' }
  );
}

/** To GOLD staff, when someone signs the agreement. */
export function adminNdaSignedEmail(input: {
  to: string;
  ndaId: string;
  name: string;
  method: 'drawn' | 'uploaded';
  /** The signed PDF, attached when it could be made. */
  pdf?: { filename: string; content: string } | null;
}): Email {
  const email = adminEmail(
    input.to,
    `Agreement signed · ${input.name}`,
    [
      `${input.name} signed GOLD’s confidentiality agreement${input.method === 'drawn' ? ' on screen' : ' and uploaded the signed copy'}.`,
      ...(input.pdf ? ['The signed agreement is attached as a PDF.'] : [])
    ],
    { href: `${SITE_URL}/goldenadmin2026/nda/${input.ndaId}`, label: 'View the agreement' }
  );
  return input.pdf ? { ...email, attachments: [input.pdf] } : email;
}
