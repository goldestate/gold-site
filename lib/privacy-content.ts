import type { Locale } from '@/i18n/routing';

/**
 * The privacy policy, in its own module rather than in site-content.ts.
 *
 * It is a legal document, not marketing copy: it changes on a different schedule,
 * for different reasons, and adding two hundred lines of it to SiteCopy would make
 * that type harder to read for everything else. Apple also requires a public URL
 * for it before an app can be submitted, so it has to exist independently of
 * whatever the marketing site is saying this quarter.
 *
 * Everything here is checked against what the code actually does. If the app or a
 * form starts collecting something new, this file changes in the same commit.
 */

export type PrivacySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PrivacyCopy = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: PrivacySection[];
};

const CONTACT_EMAIL = 'gold.domain01@gmail.com';
const CONTACT_PHONE = '+20 106 637 7883';
const ADDRESS =
  'The Office, Tolip El Narge, El Tagmoa El Khames, 90th Street, New Cairo, Egypt';

const en: PrivacyCopy = {
  eyebrow: 'Privacy',
  title: 'What we collect, and what we do not.',
  updated: 'Last updated 7 September 2026',
  intro:
    'This policy covers the GOLD website at gold-eg.com and the GOLD iPhone app. It is written to be read, not to be survived — if something here is unclear, ask us and we will explain it.',
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        `GOLD Investment Opportunities, ${ADDRESS}. You can reach us at ${CONTACT_EMAIL} or ${CONTACT_PHONE} about anything in this policy.`
      ]
    },
    {
      heading: 'What the app collects',
      paragraphs: [
        'Very little, and none of it identifies you.',
        'When you first open the app it generates a random identifier — a string of letters and numbers with no connection to your name, phone, email, or Apple ID — and keeps it in your device’s Keychain. It is sent to us only when you enter a neighbourhood code, so that we can count how many phones a code has been shared with and stop a code that has spread too far. It is not an advertising identifier and we cannot use it to recognise you anywhere else.',
        'Your chosen language and the properties you save stay on your phone. They are never sent to us.'
      ]
    },
    {
      heading: 'What the app does not collect',
      bullets: [
        'Your location. The app never asks for it and cannot access it.',
        'Your contacts, photos, camera, or microphone.',
        'Any advertising identifier, and no tracking across other apps or websites.',
        'Analytics. There is no analytics or crash-reporting service in the app.',
        'An account. There is nothing to sign up for and no password to create.'
      ]
    },
    {
      heading: 'What the website collects',
      paragraphs: ['Only what you type into a form, and only when you send it.'],
      bullets: [
        'Enquiry form: your name, phone number, email address, the type of property you are interested in, and your message. This is emailed to our team and is not stored in our database.',
        'Rental request form: your name, company, phone, WhatsApp number, email, and what you are looking for — location, budget, bedrooms, dates and any notes you add.',
        'List your property form: your name, phone, WhatsApp number, email, the property details you enter, and any photos you upload.',
        'Your IP address, briefly, to limit how many times the same visitor can submit a form or try a code. It is used for that and nothing else.'
      ]
    },
    {
      heading: 'Why we collect it',
      paragraphs: [
        'To answer you. Everything above exists so that someone at GOLD can call you back about the property you asked about, match a rental to what you are looking for, or unlock the right neighbourhood directory for the compound you are staying in.',
        'We do not sell your information, we do not share it for advertising, and we do not build profiles of you.'
      ]
    },
    {
      heading: 'Who else can see it',
      paragraphs: [
        'Three companies handle data on our behalf, and only to run the service:'
      ],
      bullets: [
        'Supabase — stores our database and uploaded photos.',
        'Railway — hosts the website.',
        'Resend — delivers enquiry emails to our team.'
      ]
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'Enquiries live in our team’s email for as long as we might need them to follow up with you. Rental requests and property listings stay in our database while they are relevant to a live search or listing. Rate-limiting records are deleted automatically within a day.',
        'If you want any of it removed sooner, ask us and we will delete it.'
      ]
    },
    {
      heading: 'Your choices',
      bullets: [
        'Ask us what we hold about you, and we will tell you.',
        'Ask us to correct it or delete it, and we will.',
        'Delete the app and everything it kept on your phone — the random identifier, your saved properties, your unlocked compounds — goes with it.'
      ],
      paragraphs: [`Write to ${CONTACT_EMAIL} for any of these.`]
    },
    {
      heading: 'Children',
      paragraphs: [
        'The service is meant for adults looking at property. We do not knowingly collect anything from children under 13. If you believe a child has sent us their details, tell us and we will remove them.'
      ]
    },
    {
      heading: 'Changes',
      paragraphs: [
        'If this policy changes, the date at the top changes with it. If a change materially affects what we collect or why, we will say so plainly here rather than quietly editing a line.'
      ]
    },
    {
      heading: 'Contact',
      paragraphs: [`${CONTACT_EMAIL} · ${CONTACT_PHONE}`, ADDRESS]
    }
  ]
};

const ar: PrivacyCopy = {
  eyebrow: 'الخصوصية',
  title: 'ما نجمعه، وما لا نجمعه.',
  updated: 'آخر تحديث 7 سبتمبر 2026',
  intro:
    'تغطي هذه السياسة موقع جولد على gold-eg.com وتطبيق جولد على الآيفون. كُتبت لتُقرأ بوضوح — إذا كان أي شيء هنا غير واضح، اسألنا وسنشرحه.',
  sections: [
    {
      heading: 'من نحن',
      paragraphs: [
        `جولد للفرص الاستثمارية، ${ADDRESS}. يمكنك التواصل معنا على ${CONTACT_EMAIL} أو ${CONTACT_PHONE} بخصوص أي شيء في هذه السياسة.`
      ]
    },
    {
      heading: 'ما يجمعه التطبيق',
      paragraphs: [
        'القليل جداً، ولا شيء منه يعرّف بشخصك.',
        'عند فتح التطبيق لأول مرة، يُنشئ معرّفاً عشوائياً — مجموعة حروف وأرقام لا صلة لها باسمك أو رقمك أو بريدك أو حساب آبل الخاص بك — ويحفظه في الـ Keychain على جهازك. يُرسل إلينا فقط عند إدخال كود الحي، حتى نعرف عدد الأجهزة التي استخدمت الكود ونوقفه إذا انتشر أكثر من اللازم. هو ليس معرّفاً إعلانياً ولا يمكننا استخدامه للتعرف عليك في أي مكان آخر.',
        'لغتك المختارة والعقارات التي تحفظها تبقى على هاتفك ولا تصل إلينا أبداً.'
      ]
    },
    {
      heading: 'ما لا يجمعه التطبيق',
      bullets: [
        'موقعك. التطبيق لا يطلبه ولا يمكنه الوصول إليه.',
        'جهات اتصالك أو صورك أو الكاميرا أو الميكروفون.',
        'أي معرّف إعلاني، ولا تتبع عبر التطبيقات أو المواقع الأخرى.',
        'التحليلات. لا توجد أي خدمة تحليلات أو تقارير أعطال داخل التطبيق.',
        'حساب. لا يوجد تسجيل ولا كلمة مرور.'
      ]
    },
    {
      heading: 'ما يجمعه الموقع',
      paragraphs: ['فقط ما تكتبه في النموذج، وفقط عند إرساله.'],
      bullets: [
        'نموذج الاستفسار: اسمك ورقم هاتفك وبريدك الإلكتروني ونوع العقار الذي يهمك ورسالتك. يُرسل إلى فريقنا بالبريد ولا يُخزَّن في قاعدة بياناتنا.',
        'نموذج طلب الإيجار: اسمك والشركة والهاتف ورقم واتساب والبريد وما تبحث عنه — الموقع والميزانية وعدد الغرف والتواريخ وأي ملاحظات تضيفها.',
        'نموذج عرض عقارك: اسمك والهاتف ورقم واتساب والبريد وتفاصيل العقار وأي صور ترفعها.',
        'عنوان الـ IP الخاص بك، لفترة قصيرة، للحد من عدد مرات إرسال النماذج أو تجربة الأكواد. يُستخدم لذلك فقط.'
      ]
    },
    {
      heading: 'لماذا نجمعها',
      paragraphs: [
        'لنرد عليك. كل ما سبق موجود ليتمكن أحد من فريق جولد من الاتصال بك بخصوص العقار الذي سألت عنه، أو إيجاد إيجار يناسب ما تبحث عنه، أو فتح دليل الحي الصحيح للكمبوند الذي تقيم فيه.',
        'نحن لا نبيع بياناتك، ولا نشاركها لأغراض إعلانية، ولا نبني ملفات تعريفية عنك.'
      ]
    },
    {
      heading: 'من يمكنه الاطلاع عليها',
      paragraphs: ['ثلاث شركات تتعامل مع البيانات نيابة عنّا، ولتشغيل الخدمة فقط:'],
      bullets: [
        'Supabase — تخزين قاعدة البيانات والصور المرفوعة.',
        'Railway — استضافة الموقع.',
        'Resend — إيصال رسائل الاستفسار إلى فريقنا.'
      ]
    },
    {
      heading: 'مدة الاحتفاظ بها',
      paragraphs: [
        'تبقى الاستفسارات في بريد فريقنا طالما قد نحتاجها للرد عليك. تبقى طلبات الإيجار وعروض العقارات في قاعدة بياناتنا ما دامت ذات صلة ببحث أو عرض قائم. أما سجلات الحد من المحاولات فتُحذف تلقائياً خلال يوم.',
        'إذا أردت حذف أي منها قبل ذلك، اطلب منّا وسنحذفها.'
      ]
    },
    {
      heading: 'حقوقك',
      bullets: [
        'اسألنا عمّا نحتفظ به عنك وسنخبرك.',
        'اطلب تصحيحه أو حذفه وسنفعل.',
        'احذف التطبيق ويُحذف معه كل ما احتفظ به على هاتفك — المعرّف العشوائي والعقارات المحفوظة والكمبوندات المفتوحة.'
      ],
      paragraphs: [`راسلنا على ${CONTACT_EMAIL} لأي من ذلك.`]
    },
    {
      heading: 'الأطفال',
      paragraphs: [
        'الخدمة موجهة للبالغين الباحثين عن عقارات. نحن لا نجمع عن قصد أي بيانات من أطفال دون 13 عاماً. إذا كنت تعتقد أن طفلاً أرسل لنا بياناته، أخبرنا وسنحذفها.'
      ]
    },
    {
      heading: 'التغييرات',
      paragraphs: [
        'إذا تغيرت هذه السياسة، يتغير التاريخ في أعلى الصفحة معها. وإذا أثّر التغيير فعلياً على ما نجمعه أو لماذا، سنوضح ذلك هنا بصراحة بدلاً من تعديل سطر بهدوء.'
      ]
    },
    {
      heading: 'للتواصل',
      paragraphs: [`${CONTACT_EMAIL} · ${CONTACT_PHONE}`, ADDRESS]
    }
  ]
};

export function getPrivacyCopy(locale: Locale): PrivacyCopy {
  return locale === 'ar' ? ar : en;
}
