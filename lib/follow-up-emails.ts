import { locationLabel, type LocationValue } from './property-taxonomy';
import { rentalPropertyTypeLabel, type RentalPropertyTypeValue } from './rental-taxonomy';

/**
 * The emails staff send from the Rental Desk to the owners and brokers they
 * tick. The admin's preview and the server that sends them both build the text
 * here, so what staff read before pressing Send is exactly what goes out.
 *
 * Nothing on file says which language a person reads, so the ready-made
 * messages carry both, English first, with both in the subject. A message staff
 * write themselves goes out in the language they wrote it in.
 */

export type FollowUpAudience = 'owners' | 'brokers';
export type FollowUpTemplate = 'approved' | 'interested' | 'custom';
export type FollowUpLang = 'en' | 'ar';

export const FOLLOW_UP_MAX_RECIPIENTS = 50;
export const FOLLOW_UP_SUBJECT_MAX = 150;
export const FOLLOW_UP_MESSAGE_MAX = 4000;

/** What staff pick from, in the order the admin shows them. */
export const FOLLOW_UP_CHOICES: Record<FollowUpAudience, { value: FollowUpTemplate; label: string }[]> = {
  owners: [
    { value: 'approved', label: 'Approved' },
    { value: 'interested', label: 'Client interested' },
    { value: 'custom', label: 'Write my own' }
  ],
  brokers: [
    { value: 'approved', label: 'Approved' },
    { value: 'interested', label: 'Unit found' },
    { value: 'custom', label: 'Write my own' }
  ]
};

export function isFollowUpAudience(value: unknown): value is FollowUpAudience {
  return value === 'owners' || value === 'brokers';
}

export function isFollowUpTemplate(value: unknown): value is FollowUpTemplate {
  return value === 'approved' || value === 'interested' || value === 'custom';
}

/** The person and the listing or request a message is about. */
export type FollowUpSubject = {
  name: string;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  /** Brokers' requests only. */
  referenceCode?: string;
};

export type FollowUpText = {
  subject: string;
  /** In the order they appear in the email. */
  parts: { lang: FollowUpLang; paragraphs: string[]; footnote: string }[];
};

function greeting(name: string, lang: FollowUpLang): string {
  return lang === 'ar' ? `مرحباً ${name}،` : `Hello ${name},`;
}

const REPLY_NOTE: Record<FollowUpLang, string> = {
  en: 'Questions? Reply to this email and our team will answer.',
  ar: 'لديك سؤال؟ رُد على هذه الرسالة وسيجيبك فريقنا.'
};

function unit(subject: FollowUpSubject, lang: FollowUpLang): string {
  return `${rentalPropertyTypeLabel(subject.propertyType, lang)} — ${locationLabel(subject.location, lang)}`;
}

/** A ready-made message, in both languages. */
export function templateText(
  audience: FollowUpAudience,
  template: Exclude<FollowUpTemplate, 'custom'>,
  subject: FollowUpSubject
): FollowUpText {
  const ref = subject.referenceCode ?? '';
  const words: Record<FollowUpLang, string[]> & { subject: string } =
    audience === 'owners'
      ? template === 'approved'
        ? {
            subject: 'Your property is approved · تمت الموافقة على عقارك',
            en: [
              `Your property is approved: ${unit(subject, 'en')}. It is now on GOLD's Rental Desk.`,
              'We will contact you when we have a tenant for it.'
            ],
            ar: [
              `تمت الموافقة على عقارك: ${unit(subject, 'ar')}. أصبح الآن ضمن مكتب الإيجارات في جولد.`,
              'سنتواصل معك عندما يتوفر مستأجر له.'
            ]
          }
        : {
            subject: 'A client is interested in your property · لدينا عميل مهتم بعقارك',
            en: [
              `A client is interested in your property: ${unit(subject, 'en')}.`,
              'Our team will call you to arrange the next step.'
            ],
            ar: [`لدينا عميل مهتم بعقارك: ${unit(subject, 'ar')}.`, 'سيتصل بك فريقنا لترتيب الخطوة التالية.']
          }
      : template === 'approved'
        ? {
            subject: `Your request ${ref} is approved · تمت الموافقة على طلبك`,
            en: [
              `Your request is approved: ${unit(subject, 'en')}, reference ${ref}.`,
              'We are looking for units that match it and will contact you with options.'
            ],
            ar: [
              `تمت الموافقة على طلبك: ${unit(subject, 'ar')}، المرجع ${ref}.`,
              'نبحث الآن عن وحدات مناسبة، وسنتواصل معك بالخيارات المتاحة.'
            ]
          }
        : {
            subject: `We found a unit for your request ${ref} · وجدنا وحدة لطلبك`,
            en: [
              `We found a unit that fits your request: ${unit(subject, 'en')}, reference ${ref}.`,
              'Our team will call you to arrange a viewing.'
            ],
            ar: [
              `وجدنا وحدة تناسب طلبك: ${unit(subject, 'ar')}، المرجع ${ref}.`,
              'سيتصل بك فريقنا لترتيب موعد للمعاينة.'
            ]
          };

  return {
    subject: words.subject,
    parts: (['en', 'ar'] as const).map((lang) => ({
      lang,
      paragraphs: [greeting(subject.name, lang), ...words[lang]],
      footnote: REPLY_NOTE[lang]
    }))
  };
}

/** Which language staff wrote in: whichever script has more letters. */
export function messageLanguage(text: string): FollowUpLang {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return arabic > latin ? 'ar' : 'en';
}

/** A message staff wrote, sent as written after the person's name. One paragraph per line. */
export function customText(name: string, subject: string, message: string): FollowUpText {
  const lang = messageLanguage(`${subject}\n${message}`);
  const paragraphs = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    subject: subject.trim(),
    parts: [{ lang, paragraphs: [greeting(name, lang), ...paragraphs], footnote: REPLY_NOTE[lang] }]
  };
}
