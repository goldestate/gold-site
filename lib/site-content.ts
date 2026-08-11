import type { Locale } from '@/i18n/routing';

type PriceBucket = { label: string; max: number };

export type SiteCopy = {
  seo: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    properties: string;
    about: string;
    contact: string;
  };
  home: {
    hero: {
      eyebrow: string;
      title: string;
      subtitle: string;
      search: {
        propertyTypeLabel: string;
        anyPropertyType: string;
        locationLabel: string;
        anyLocation: string;
        budgetLabel: string;
        anyBudget: string;
        priceBuckets: PriceBucket[];
        submit: string;
      };
      statLabel1: string;
      statValue1: string;
      statLabel2: string;
      statValue2: string;
      statLabel3: string;
      statValue3: string;
    };
    trust: {
      eyebrow: string;
      title: string;
      items: Array<{
        title: string;
        description: string;
        icon: 'shield' | 'gem' | 'compass' | 'management';
      }>;
    };
    featured: {
      eyebrow: string;
      title: string;
      viewAllCta: string;
    };
    partners: {
      eyebrow: string;
      title: string;
    };
    contactCta: {
      eyebrow: string;
      title: string;
      subtitle: string;
      cta: string;
    };
  };
  propertiesPage: {
    eyebrow: string;
    title: string;
    intro: string;
    filters: {
      propertyTypeLabel: string;
      anyPropertyType: string;
      unitTypeLabel: string;
      anyUnitType: string;
      locationLabel: string;
      anyLocation: string;
      priceLabel: string;
      anyPrice: string;
      priceBuckets: PriceBucket[];
      noResultsTitle: string;
      noResultsBody: string;
      viewDetails: string;
    };
  };
  propertyDetail: {
    backToListings: string;
    priceLabel: string;
    locationLabel: string;
    typeLabel: string;
    unitLabel: string;
    enquireCta: string;
    notFoundTitle: string;
    notFoundBody: string;
  };
  about: {
    eyebrow: string;
    title: string;
    story: { eyebrow: string; title: string; body: string };
    missionVision: { missionLabel: string; mission: string; visionLabel: string; vision: string };
    whatWeDo: { eyebrow: string; title: string; body: string };
    whyChooseUs: { eyebrow: string; title: string; items: string[] };
    achievements: { eyebrow: string; title: string; body: string; stat: string; statLabel: string };
    partners: { eyebrow: string; title: string };
    rentalProgram: { eyebrow: string; title: string; body: string };
    goldLife: {
      eyebrow: string;
      title: string;
      body: string;
      services: string[];
      partnersLabel: string;
      partners: string[];
    };
    subbrands: {
      eyebrow: string;
      title: string;
      items: Array<{
        name: string;
        description: string;
        icon: 'estate' | 'life' | 'management' | 'export';
      }>;
    };
  };
  contact: {
    eyebrow: string;
    title: string;
    intro: string;
    formTitle: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    interest: string;
    submit: string;
    success: string;
    addressLabel: string;
    address: string;
    hotlineLabel: string;
    hotline: string;
    emailLabel: string;
    emailValue: string;
    mapCta: string;
    placeholderInterest: string;
    prefillMessage: string;
    errors: {
      name: string;
      phone: string;
      email: string;
      message: string;
      interest: string;
    };
  };
  footer: {
    tagline: string;
    legal: string;
  };
};

const priceBucketsEn: PriceBucket[] = [
  { label: 'Up to EGP 10M', max: 10_000_000 },
  { label: 'Up to EGP 20M', max: 20_000_000 },
  { label: 'Up to EGP 30M', max: 30_000_000 },
  { label: 'Up to EGP 50M', max: 50_000_000 }
];

const priceBucketsAr: PriceBucket[] = [
  { label: 'حتى 10 مليون جنيه', max: 10_000_000 },
  { label: 'حتى 20 مليون جنيه', max: 20_000_000 },
  { label: 'حتى 30 مليون جنيه', max: 30_000_000 },
  { label: 'حتى 50 مليون جنيه', max: 50_000_000 }
];

const goldLifePartners = ['SAF', 'A-Line', 'Mobica Sharm', 'DRIVE Finance', 'FORSA', 'Contrast Designs'];

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    seo: {
      title: 'GOLD Investment Opportunities',
      description:
        'Buy, rent, or resell premium properties in New Cairo, North Coast, Sheikh Zayed, Ain Sokhna, and Gouna with GOLD — trusted real estate consultation and property management.'
    },
    nav: {
      home: 'Home',
      properties: 'Properties',
      about: 'About',
      contact: 'Contact'
    },
    home: {
      hero: {
        eyebrow: 'Buy. Rent. Resell.',
        title: 'Find your next property',
        subtitle:
          'Verified primary, resale, and rental listings across Egypt’s top destinations — real prices, zero guesswork.',
        search: {
          propertyTypeLabel: 'Property Type',
          anyPropertyType: 'Any type',
          locationLabel: 'Location',
          anyLocation: 'Any location',
          budgetLabel: 'Budget',
          anyBudget: 'Any budget',
          priceBuckets: priceBucketsEn,
          submit: 'Search Properties'
        },
        statLabel1: 'Founded',
        statValue1: '2024',
        statLabel2: 'Sales Achieved',
        statValue2: 'EGP 1B+',
        statLabel3: 'Sub-brands',
        statValue3: '4'
      },
      trust: {
        eyebrow: 'Why Choose Us',
        title: 'A measured approach to premium investment.',
        items: [
          {
            title: 'Trusted Service',
            description: 'A discreet, relationship-first process built on transparency at every step.',
            icon: 'shield'
          },
          {
            title: 'Premium Selections',
            description: 'Every listing is vetted against a strict quality and value standard before it reaches you.',
            icon: 'gem'
          },
          {
            title: 'Market Knowledge',
            description: 'Pricing and negotiation guidance grounded in real, current market data.',
            icon: 'compass'
          },
          {
            title: 'Property Management',
            description: 'From rental to full facility management, your investment stays protected.',
            icon: 'management'
          }
        ]
      },
      featured: {
        eyebrow: 'Newest Listings',
        title: 'Recently added properties',
        viewAllCta: 'View All Properties'
      },
      partners: {
        eyebrow: 'Trusted Partners',
        title: "We work with Egypt's leading developers"
      },
      contactCta: {
        eyebrow: 'Get In Touch',
        title: 'Speak with the GOLD team',
        subtitle: 'Tell us what you are looking for and we will respond with a tailored recommendation.',
        cta: 'Contact Us'
      }
    },
    propertiesPage: {
      eyebrow: 'Properties',
      title: 'Find your next property',
      intro: 'Filter by type, location, unit, and budget to see what is actually available.',
      filters: {
        propertyTypeLabel: 'Property Type',
        anyPropertyType: 'Any type',
        unitTypeLabel: 'Unit Type',
        anyUnitType: 'Any unit',
        locationLabel: 'Location',
        anyLocation: 'Any location',
        priceLabel: 'Budget',
        anyPrice: 'Any price',
        priceBuckets: priceBucketsEn,
        noResultsTitle: 'No properties match these filters.',
        noResultsBody: 'Try a different location, unit type, or a wider budget range.',
        viewDetails: 'View Details'
      }
    },
    propertyDetail: {
      backToListings: 'Back to Properties',
      priceLabel: 'Price',
      locationLabel: 'Location',
      typeLabel: 'Property Type',
      unitLabel: 'Unit Type',
      enquireCta: 'Enquire About This Property',
      notFoundTitle: 'Property not found',
      notFoundBody: 'This listing may have been removed or is no longer published.'
    },
    about: {
      eyebrow: 'About GOLD',
      title: 'GOLD is more than a name. It is a framework for value.',
      story: {
        eyebrow: 'Our Story',
        title: 'GOLD',
        body: 'Everyone understands what this word represents — you can almost feel its value as soon as you hear it. In our brand, we take the word gold to another level and give it a unique perspective. For us, GOLD stands for Golden Opportunities of Leading Domain. It reflects the essence of what we offer: services as valuable and rare as gold itself. Every solution we provide carries exceptional quality, unmatched expertise, and a premium standard that sets us apart.'
      },
      missionVision: {
        missionLabel: 'Mission',
        mission:
          'Deliver trusted, high-quality real estate solutions while creating meaningful value for clients through expert consultation, transparency, and exceptional service.',
        visionLabel: 'Vision',
        vision:
          'Become a leading multi-sector group recognized for innovation, integrity, and long-term impact, growing into a diversified organization across investment and management sectors.'
      },
      whatWeDo: {
        eyebrow: 'What We Do',
        title: 'A golden choice for every client',
        body: 'GOLD was built on the idea that every client deserves a golden choice when searching for their perfect property. Inspired by uniqueness, trust, and premium quality, GOLD offers carefully selected apartments and villas that match different lifestyles and investment goals. The company specializes in both sales and rental services, while also providing professional property management solutions for units and villas.'
      },
      whyChooseUs: {
        eyebrow: 'Why Choose Us',
        title: 'What sets GOLD apart',
        items: [
          'Professional and trusted service',
          'Premium property selections',
          'Strong market knowledge',
          'Customer-focused approach',
          'Reliable property management',
          'Commitment to quality and excellence'
        ]
      },
      achievements: {
        eyebrow: 'What We Achieve',
        title: 'A trusted name in Egyptian real estate',
        body: 'Since our beginning, we have built strong relationships with a large number of satisfied customers by delivering exceptional real estate services and premium property opportunities. Through dedication, professionalism, and commitment to excellence, GOLD Real Estate continues to grow as a trusted name and a golden choice for property investment and living.',
        stat: 'EGP 1B+',
        statLabel: 'In sales achieved'
      },
      partners: {
        eyebrow: 'Our Partners',
        title: "We work with Egypt's leading developers"
      },
      rentalProgram: {
        eyebrow: 'Gold Rental & Facility Management',
        title: 'Rent a unit, or rent and manage your unit',
        body: 'Our Rental Program delivers a premium investment and lifestyle experience across distinguished destinations such as Cairo and the North Coast. Created to serve both property owners and tenants, the program enables owners to maximize the value of their units through professional rental and management services, while offering tenants access to carefully selected properties that combine comfort, quality, and convenience.'
      },
      goldLife: {
        eyebrow: 'Gold Life Program',
        title: 'Lifestyle services, curated',
        body: 'Beyond real estate, Gold Life brings a curated set of services to make property ownership effortless — from finishing touches to financing.',
        services: ['Finishing', 'Furnishing', 'Car Dealership', 'Financial Funding'],
        partnersLabel: 'In partnership with',
        partners: goldLifePartners
      },
      subbrands: {
        eyebrow: 'Sub-brand Platform',
        title: 'Built for four Golden Ways to invest.',
        items: [
          {
            name: 'Gold Real Estate',
            description: 'Property investment, buying, selling, and consultation.',
            icon: 'estate'
          },
          {
            name: 'Gold Life',
            description: 'Luxury and lifestyle services with a softer, elevated touch.',
            icon: 'life'
          },
          {
            name: 'Gold Management',
            description: 'Operational excellence for properties, assets, and people.',
            icon: 'management'
          },
          {
            name: 'Gold Export',
            description: 'Cross-border export opportunities with global reach.',
            icon: 'export'
          }
        ]
      }
    },
    contact: {
      eyebrow: 'Contact / Inquiry',
      title: 'Speak with the team behind GOLD.',
      intro: 'Tell us what you are looking for and we will respond with a private, tailored recommendation.',
      formTitle: 'Start your inquiry',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      message: 'Message',
      interest: 'Property Interest',
      submit: 'Send inquiry',
      success: 'Your inquiry has been sent. The GOLD team will contact you shortly.',
      addressLabel: 'Office',
      address: 'The Office, Tolip El Narge, El Tagmoa El Khames, 90th Street, New Cairo, Egypt',
      hotlineLabel: 'Phone',
      hotline: '+20 106 637 7883',
      emailLabel: 'Email',
      emailValue: 'gold.domain01@gmail.com',
      mapCta: 'Open map',
      placeholderInterest: 'Select a unit type',
      prefillMessage: 'I am interested in {property}. Please send more details.',
      errors: {
        name: 'Please enter your full name.',
        phone: 'Please enter a valid phone number.',
        email: 'Please enter a valid email address.',
        message: 'Please add a short message.',
        interest: 'Please select an area of interest.'
      }
    },
    footer: {
      tagline: 'Golden opportunities. Leading domain. Quiet confidence.',
      legal: '© 2026 GOLD Investment Opportunities. All rights reserved.'
    }
  },
  ar: {
    seo: {
      title: 'فرص استثمارية من GOLD',
      description:
        'اشترِ أو أوجر أو أعد بيع عقارات مميزة في القاهرة الجديدة والساحل الشمالي والشيخ زايد والعين السخنة والجونة مع GOLD — استشارات عقارية موثوقة وإدارة احترافية للأملاك.'
    },
    nav: {
      home: 'الرئيسية',
      properties: 'العقارات',
      about: 'من نحن',
      contact: 'تواصل معنا'
    },
    home: {
      hero: {
        eyebrow: 'اشترِ. أوجر. أعد البيع.',
        title: 'ابحث عن عقارك القادم',
        subtitle: 'عروض أساسية وإعادة بيع وإيجار موثقة في أفضل مناطق مصر — أسعار حقيقية دون تخمين.',
        search: {
          propertyTypeLabel: 'نوع العقار',
          anyPropertyType: 'أي نوع',
          locationLabel: 'الموقع',
          anyLocation: 'أي موقع',
          budgetLabel: 'الميزانية',
          anyBudget: 'أي سعر',
          priceBuckets: priceBucketsAr,
          submit: 'ابحث عن عقارات'
        },
        statLabel1: 'التأسيس',
        statValue1: '2024',
        statLabel2: 'مبيعات محققة',
        statValue2: '1 مليار+ جنيه',
        statLabel3: 'القطاعات',
        statValue3: '4'
      },
      trust: {
        eyebrow: 'لماذا نحن',
        title: 'منهج هادئ لاستثمار متميز.',
        items: [
          {
            title: 'خدمة موثوقة',
            description: 'عملية خاصة وشفافة في كل خطوة، تمنحك راحة البال وسلاسة القرار.',
            icon: 'shield'
          },
          {
            title: 'اختيارات فاخرة',
            description: 'كل عقار يمر بمعايير صارمة للجودة والقيمة قبل أن يصل إليك.',
            icon: 'gem'
          },
          {
            title: 'معرفة السوق',
            description: 'توجيه في التسعير والتفاوض مبني على بيانات سوق حقيقية ومحدثة.',
            icon: 'compass'
          },
          {
            title: 'إدارة الأملاك',
            description: 'من الإيجار إلى الإدارة الكاملة للمرافق، استثمارك يبقى محمياً.',
            icon: 'management'
          }
        ]
      },
      featured: {
        eyebrow: 'أحدث العروض',
        title: 'عقارات أضيفت مؤخراً',
        viewAllCta: 'عرض كل العقارات'
      },
      partners: {
        eyebrow: 'شركاء موثوقون',
        title: 'نتعامل مع كبرى شركات التطوير العقاري في مصر'
      },
      contactCta: {
        eyebrow: 'تواصل معنا',
        title: 'تحدث مع فريق GOLD',
        subtitle: 'أخبرنا بما تبحث عنه وسنعود إليك بتوصية خاصة ومصممة لك.',
        cta: 'تواصل معنا'
      }
    },
    propertiesPage: {
      eyebrow: 'العقارات',
      title: 'ابحث عن عقارك القادم',
      intro: 'صفِّ النتائج حسب النوع والموقع والوحدة والميزانية لترى ما هو متاح فعلاً.',
      filters: {
        propertyTypeLabel: 'نوع العقار',
        anyPropertyType: 'أي نوع',
        unitTypeLabel: 'نوع الوحدة',
        anyUnitType: 'أي وحدة',
        locationLabel: 'الموقع',
        anyLocation: 'أي موقع',
        priceLabel: 'الميزانية',
        anyPrice: 'أي سعر',
        priceBuckets: priceBucketsAr,
        noResultsTitle: 'لا توجد عقارات مطابقة لهذا البحث.',
        noResultsBody: 'جرّب موقعاً أو نوع وحدة مختلفاً أو نطاق ميزانية أوسع.',
        viewDetails: 'عرض التفاصيل'
      }
    },
    propertyDetail: {
      backToListings: 'العودة إلى العقارات',
      priceLabel: 'السعر',
      locationLabel: 'الموقع',
      typeLabel: 'نوع العقار',
      unitLabel: 'نوع الوحدة',
      enquireCta: 'استفسر عن هذا العقار',
      notFoundTitle: 'العقار غير موجود',
      notFoundBody: 'ربما تم حذف هذا العرض أو لم يعد منشوراً.'
    },
    about: {
      eyebrow: 'عن GOLD',
      title: 'GOLD ليس مجرد اسم. إنه إطار للقيمة.',
      story: {
        eyebrow: 'قصتنا',
        title: 'GOLD',
        body: 'يفهم الجميع ما تمثله هذه الكلمة — يمكنك أن تشعر بقيمتها فور سماعها. في علامتنا، نأخذ كلمة الذهب إلى مستوى آخر ونمنحها منظوراً فريداً. بالنسبة لنا، GOLD اختصار لعبارة Golden Opportunities of Leading Domain. إنها تعكس جوهر ما نقدمه: خدمات ثمينة ونادرة كالذهب نفسه. كل حل نقدمه يحمل جودة استثنائية وخبرة لا مثيل لها ومعياراً راقياً يميزنا.'
      },
      missionVision: {
        missionLabel: 'الرسالة',
        mission: 'تقديم حلول عقارية موثوقة وعالية الجودة مع خلق قيمة حقيقية لعملائنا من خلال استشارات خبيرة وشفافية وخدمة استثنائية.',
        visionLabel: 'الرؤية',
        vision: 'أن نصبح مجموعة رائدة متعددة القطاعات معروفة بالابتكار والنزاهة والأثر طويل الأمد، ونتوسع كمنظمة متنوعة عبر قطاعات الاستثمار والإدارة.'
      },
      whatWeDo: {
        eyebrow: 'ماذا نقدم',
        title: 'اختيار ذهبي لكل عميل',
        body: 'تأسست GOLD على فكرة أن كل عميل يستحق اختياراً ذهبياً عند البحث عن عقاره المثالي. مستوحاة من التفرد والثقة والجودة الفاخرة، تقدم GOLD شققاً وفللاً مختارة بعناية تناسب أنماط حياة وأهداف استثمارية مختلفة. تتخصص الشركة في خدمات البيع والإيجار، كما تقدم حلول إدارة احترافية للوحدات والفلل.'
      },
      whyChooseUs: {
        eyebrow: 'لماذا نحن',
        title: 'ما يميز GOLD',
        items: [
          'خدمة احترافية وموثوقة',
          'اختيارات عقارية فاخرة',
          'معرفة قوية بالسوق',
          'نهج يركز على العميل',
          'إدارة أملاك موثوقة',
          'التزام بالجودة والتميز'
        ]
      },
      achievements: {
        eyebrow: 'ما حققناه',
        title: 'اسم موثوق في العقارات المصرية',
        body: 'منذ انطلاقتنا، بنينا علاقات قوية مع عدد كبير من العملاء الراضين من خلال تقديم خدمات عقارية استثنائية وفرص عقارية فاخرة. من خلال التفاني والاحترافية والالتزام بالتميز، تواصل GOLD للعقارات نموها كاسم موثوق واختيار ذهبي للاستثمار العقاري والسكن.',
        stat: '1 مليار+ جنيه',
        statLabel: 'مبيعات محققة'
      },
      partners: {
        eyebrow: 'شركاؤنا',
        title: 'نتعامل مع كبرى شركات التطوير العقاري في مصر'
      },
      rentalProgram: {
        eyebrow: 'برنامج GOLD للإيجار وإدارة المرافق',
        title: 'أوجر وحدتك، أو أوجرها وأدرها معنا',
        body: 'يقدم برنامج الإيجار لدينا تجربة استثمارية ومعيشية فاخرة عبر وجهات مميزة مثل القاهرة والساحل الشمالي. صُمم البرنامج لخدمة الملاك والمستأجرين معاً، حيث يمكّن الملاك من تعظيم قيمة وحداتهم من خلال خدمات إيجار وإدارة احترافية، بينما يمنح المستأجرين وصولاً إلى عقارات مختارة بعناية تجمع بين الراحة والجودة والملاءمة.'
      },
      goldLife: {
        eyebrow: 'برنامج Gold Life',
        title: 'خدمات نمط حياة منتقاة',
        body: 'بعيداً عن العقارات، يقدم Gold Life مجموعة منتقاة من الخدمات لجعل امتلاك العقار أمراً سهلاً — من التشطيب إلى التمويل.',
        services: ['تشطيب', 'فرش وأثاث', 'وكالة سيارات', 'تمويل مالي'],
        partnersLabel: 'بالشراكة مع',
        partners: goldLifePartners
      },
      subbrands: {
        eyebrow: 'منصة الفروع',
        title: 'مصممة لأربع طرق ذهبية للاستثمار.',
        items: [
          {
            name: 'Gold Real Estate',
            description: 'استثمار عقاري وشراء وبيع واستشارات.',
            icon: 'estate'
          },
          {
            name: 'Gold Life',
            description: 'خدمات فاخرة ونمط حياة راقٍ بلمسة أكثر نعومة.',
            icon: 'life'
          },
          {
            name: 'Gold Management',
            description: 'إدارة احترافية للأصول والعقارات والعمليات.',
            icon: 'management'
          },
          {
            name: 'Gold Export',
            description: 'فرص تصدير وأسواق عالمية بنطاق واسع.',
            icon: 'export'
          }
        ]
      }
    },
    contact: {
      eyebrow: 'التواصل / الاستفسار',
      title: 'تحدث مع فريق GOLD.',
      intro: 'أخبرنا بما تبحث عنه وسنعود إليك بتوصية خاصة ومصممة خصيصاً لك.',
      formTitle: 'ابدأ الاستفسار',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      message: 'الرسالة',
      interest: 'نوع الوحدة المطلوبة',
      submit: 'إرسال الاستفسار',
      success: 'تم إرسال استفسارك. سيتواصل معك فريق GOLD قريباً.',
      addressLabel: 'المكتب',
      address: 'المكتب، توليب النرجس، التجمع الخامس، شارع 90، القاهرة الجديدة، مصر',
      hotlineLabel: 'الهاتف',
      hotline: '+20 106 637 7883',
      emailLabel: 'البريد',
      emailValue: 'gold.domain01@gmail.com',
      mapCta: 'عرض الخريطة',
      placeholderInterest: 'اختر نوع الوحدة',
      prefillMessage: 'أنا مهتم بـ {property}. برجاء إرسال مزيد من التفاصيل.',
      errors: {
        name: 'من فضلك أدخل الاسم الكامل.',
        phone: 'من فضلك أدخل رقم هاتف صحيح.',
        email: 'من فضلك أدخل بريداً إلكترونياً صحيحاً.',
        message: 'من فضلك اكتب رسالة قصيرة.',
        interest: 'من فضلك اختر نوع الوحدة.'
      }
    },
    footer: {
      tagline: 'فرص ذهبية. مجال ريادي. ثقة هادئة.',
      legal: '© 2026 GOLD Investment Opportunities. جميع الحقوق محفوظة.'
    }
  }
};

export function getSiteCopy(locale: Locale): SiteCopy {
  return siteCopy[locale];
}
