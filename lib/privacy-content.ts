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
  updated: 'Last updated 25 September 2026',
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
        'Very little.',
        'The first time you open the app it creates a random identifier — a string of letters and numbers that is not your name, phone number, email or Apple ID — and keeps it in your iPhone’s Keychain. It is not an advertising identifier, and we cannot use it to recognise you in other apps or on other websites.',
        'The app sends that identifier to us in two cases. When you enter a compound code, we store it with that code, the time the code was first entered on your phone and the time it was most recently entered, so that we can see how many phones a code has reached and end one that has spread too far. And each time you open the Guide tab or pull it to refresh, and whenever you come back to the app while a code is unlocked, the app sends the identifier to ask which of your codes are still live, so that a code that has ended is taken off your phone. Opening the Guide tab sends it even if you have never entered a code.',
        'Each code is issued for one stay, and our staff give it a short note so they know whose it is — for example a first name and a unit number. Because the record above ties your identifier to a code, someone at GOLD looking at it can tell which stay a phone belongs to. We use this only to run the compound guide.',
        'The enquiry, rental request and list-your-property forms in the app send us the same details as the website’s forms described below, and only when you send them.',
        'Your chosen language and the properties you save stay on your phone. They are never sent to us.'
      ]
    },
    {
      heading: 'What the app does not collect',
      bullets: [
        'Your location. If you allow it, the app uses your iPhone’s location to work out which GOLD compound you are at, so it can show that compound’s guide without a code. That happens entirely on your phone: the app compares your location with the list of compounds it already has, and your location is never sent to us, so we never see or store it. It asks only when you tap Continue in the Guide tab, and you can turn it off at any time in Settings › GOLD › Location.',
        'Your contacts, camera or microphone. A photo only reaches us if you pick it yourself to add to a property listing.',
        'Any advertising identifier, and no tracking across other apps or websites.',
        'Analytics. There is no analytics or crash-reporting service in the app.',
        'An account. There is nothing to sign up for and no password to create.'
      ]
    },
    {
      heading: 'What the website collects',
      paragraphs: ['What you type into a form, only when you send it, and your IP address to stop abuse.'],
      bullets: [
        'Enquiry form: your name, phone number, email address, the type of property you are interested in, and your message. This is emailed to our team and is not stored in our database.',
        'Rental request form: your name, company, phone, WhatsApp number, email, and what you are looking for — location, budget, bedrooms, dates and any notes you add.',
        'List your property form: your name, phone, WhatsApp number, email, the property details you enter, and any photos you upload.',
        'Your IP address, to limit how many times the same visitor can send a form or try a code. The app’s identifier is counted the same way when a phone enters or checks codes. Both are used for that and nothing else.',
        'Messages you send us on WhatsApp — including from the “Ask GOLD on WhatsApp” button on a code link — reach us like any other WhatsApp message: we see your number and what you write.'
      ]
    },
    {
      heading: 'Why we collect it',
      paragraphs: [
        'To answer you. Everything above exists so that someone at GOLD can call you back about the property you asked about, match a rental to what you are looking for, or open the right compound guide for your stay.',
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
        'Enquiries live in our team’s email for as long as we might need them to follow up with you. Rental requests and property listings stay in our database while they are relevant to a live search or listing.',
        'Code records — the app identifier, the code it entered and those two times — are kept after the code ends or is revoked, so our staff can still see how many phones a finished stay’s code reached. They are not deleted on a schedule: they stay until you ask us to delete them, or until we remove that compound from the guide. Tell us the code you were given and we will delete its records. The code itself, and the note our staff wrote on it, are kept with them.',
        'On your phone, the contacts a code opened are removed the next time the app can reach us after the code ends.',
        'Rate-limit counters hold an IP address or app identifier, a count, and when the count resets, 10 to 15 minutes later. For the website’s forms they are kept only in our server’s memory. For codes they are kept in our database and deleted, after they expire, by a clean-up that runs as the site is used. How soon depends on how busy the site is: it can take anywhere from minutes to more than a day.',
        'If you want any of it removed sooner, ask us and we will delete it.'
      ]
    },
    {
      heading: 'Your choices',
      bullets: [
        'Ask us what we hold about you, and we will tell you.',
        'Ask us to correct it or delete it, and we will. For the app, tell us the code you were given so we can find its records.',
        'Deleting the app removes your saved properties, your language choice and the copy of the guide kept on your phone. The random identifier and the list of compounds you unlocked are kept in the iPhone’s Keychain, which iOS does not clear when an app is deleted, so they come back if you reinstall the app on the same phone. They are never synced to iCloud or moved to another phone, and erasing the iPhone removes them.'
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
  updated: 'آخر تحديث 25 سبتمبر 2026',
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
        'القليل جداً.',
        'عند فتح التطبيق لأول مرة، يُنشئ معرّفاً عشوائياً — مجموعة حروف وأرقام ليست اسمك ولا رقم هاتفك ولا بريدك ولا حساب آبل الخاص بك — ويحفظه في الـ Keychain على الآيفون. هو ليس معرّفاً إعلانياً، ولا يمكننا استخدامه للتعرف عليك في تطبيقات أو مواقع أخرى.',
        'يرسل التطبيق هذا المعرّف إلينا في حالتين. عند إدخال كود الكمبوند، نحفظه مع ذلك الكود ووقت أول إدخال للكود على هاتفك ووقت آخر إدخال له، حتى نعرف عدد الهواتف التي وصل إليها الكود ونوقف أي كود انتشر أكثر من اللازم. وفي كل مرة تفتح فيها تبويب «الدليل» أو تسحبه للتحديث، وكلما عدت إلى التطبيق وهناك كود مفتوح، يرسل التطبيق المعرّف ليسأل أيّ أكوادك ما زال سارياً، حتى يُزال من هاتفك أي كود انتهى. وفتح تبويب «الدليل» يرسله حتى لو لم تُدخل أي كود من قبل.',
        'كل كود يُصدر لإقامة واحدة، ويكتب فريقنا عليه ملاحظة قصيرة ليعرف لمن هو — مثل الاسم الأول ورقم الوحدة. ولأن السجل المذكور أعلاه يربط معرّفك بكود، يستطيع من يطّلع عليه في جولد أن يعرف لأي إقامة يعود الهاتف. نستخدم ذلك فقط لتشغيل دليل الكمبوند.',
        'نماذج الاستفسار وطلب الإيجار وعرض عقارك داخل التطبيق ترسل إلينا نفس البيانات التي ترسلها نماذج الموقع الموضحة أدناه، وفقط عند إرسالها.',
        'لغتك المختارة والعقارات التي تحفظها تبقى على هاتفك ولا تصل إلينا أبداً.'
      ]
    },
    {
      heading: 'ما لا يجمعه التطبيق',
      bullets: [
        'موقعك. إذا سمحت بذلك، يستخدم التطبيق موقع الآيفون ليعرف في أي كمبوند من كمبوندات جولد أنت، فيعرض دليل ذلك الكمبوند بدون كود. يحدث ذلك بالكامل على هاتفك: يقارن التطبيق موقعك بقائمة الكمبوندات الموجودة لديه، ولا يُرسل موقعك إلينا أبداً، فلا نراه ولا نحفظه. لا يطلبه إلا عندما تضغط «متابعة» في تبويب «الدليل»، ويمكنك إيقافه في أي وقت من الإعدادات › GOLD › الموقع.',
        'جهات اتصالك أو الكاميرا أو الميكروفون. لا تصلنا أي صورة إلا إذا اخترتها بنفسك لإضافتها إلى عرض عقار.',
        'أي معرّف إعلاني، ولا تتبع عبر التطبيقات أو المواقع الأخرى.',
        'التحليلات. لا توجد أي خدمة تحليلات أو تقارير أعطال داخل التطبيق.',
        'حساب. لا يوجد تسجيل ولا كلمة مرور.'
      ]
    },
    {
      heading: 'ما يجمعه الموقع',
      paragraphs: ['ما تكتبه في النموذج وفقط عند إرساله، وعنوان الـ IP الخاص بك للحد من إساءة الاستخدام.'],
      bullets: [
        'نموذج الاستفسار: اسمك ورقم هاتفك وبريدك الإلكتروني ونوع العقار الذي يهمك ورسالتك. يُرسل إلى فريقنا بالبريد ولا يُخزَّن في قاعدة بياناتنا.',
        'نموذج طلب الإيجار: اسمك والشركة والهاتف ورقم واتساب والبريد وما تبحث عنه — الموقع والميزانية وعدد الغرف والتواريخ وأي ملاحظات تضيفها.',
        'نموذج عرض عقارك: اسمك والهاتف ورقم واتساب والبريد وتفاصيل العقار وأي صور ترفعها.',
        'عنوان الـ IP الخاص بك، للحد من عدد مرات إرسال النماذج أو تجربة الأكواد من نفس الزائر. ويُحتسب معرّف التطبيق بالطريقة نفسها عندما يُدخل هاتف أكواداً أو يتحقق منها. يُستخدمان لذلك فقط.',
        'الرسائل التي ترسلها إلينا على واتساب — بما فيها رسائل زر «تواصل مع جولد على واتساب» في رابط الكود — تصلنا مثل أي رسالة واتساب أخرى: نرى رقمك وما تكتبه.'
      ]
    },
    {
      heading: 'لماذا نجمعها',
      paragraphs: [
        'لنرد عليك. كل ما سبق موجود ليتمكن أحد من فريق جولد من الاتصال بك بخصوص العقار الذي سألت عنه، أو إيجاد إيجار يناسب ما تبحث عنه، أو فتح دليل الكمبوند الصحيح لإقامتك.',
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
        'تبقى الاستفسارات في بريد فريقنا طالما قد نحتاجها للرد عليك. تبقى طلبات الإيجار وعروض العقارات في قاعدة بياناتنا ما دامت ذات صلة ببحث أو عرض قائم.',
        'سجلات الأكواد — معرّف التطبيق والكود الذي أُدخل عليه والوقتان المذكوران — نحتفظ بها بعد انتهاء الكود أو إلغائه، حتى يرى فريقنا عدد الهواتف التي وصل إليها كود إقامة انتهت. ولا تُحذف تلقائياً في موعد محدد: تبقى حتى تطلب منّا حذفها، أو حتى نزيل ذلك الكمبوند من الدليل. أخبرنا بالكود الذي وصلك وسنحذف سجلاته. ويبقى الكود نفسه والملاحظة التي كتبها فريقنا عليه معها.',
        'على هاتفك، تُزال جهات الاتصال التي فتحها الكود في أول مرة يتمكن فيها التطبيق من الوصول إلينا بعد انتهاء الكود.',
        'سجلات الحد من المحاولات تحتوي على عنوان IP أو معرّف التطبيق، وعدد المحاولات، ووقت إعادة ضبط العدد بعد 10 إلى 15 دقيقة. بالنسبة لنماذج الموقع تبقى في ذاكرة الخادم فقط. وبالنسبة للأكواد تُحفظ في قاعدة بياناتنا، وتحذفها بعد انتهائها عملية تنظيف تعمل مع استخدام الموقع. ويتوقف موعد الحذف على مدى نشاط الموقع: قد يكون بعد دقائق، وقد يستغرق أكثر من يوم.',
        'إذا أردت حذف أي منها قبل ذلك، اطلب منّا وسنحذفها.'
      ]
    },
    {
      heading: 'حقوقك',
      bullets: [
        'اسألنا عمّا نحتفظ به عنك وسنخبرك.',
        'اطلب تصحيحه أو حذفه وسنفعل. بالنسبة للتطبيق، أخبرنا بالكود الذي وصلك حتى نجد سجلاته.',
        'حذف التطبيق يزيل العقارات المحفوظة واختيار اللغة ونسخة الدليل المحفوظة على هاتفك. أما المعرّف العشوائي وقائمة الكمبوندات التي فتحتها فمحفوظة في الـ Keychain على الآيفون، ولا يمسحها iOS عند حذف التطبيق، لذلك تعود إذا أعدت تثبيت التطبيق على نفس الهاتف. لا تُزامن أبداً مع iCloud ولا تنتقل إلى هاتف آخر، ومسح الآيفون بالكامل يزيلها.'
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
