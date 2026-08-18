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
      panelTitle: string;
      panelSubtitle: string;
      propertyTypeLabel: string;
      anyPropertyType: string;
      unitTypeLabel: string;
      anyUnitType: string;
      locationLabel: string;
      anyLocation: string;
      bedroomsLabel: string;
      bathroomsLabel: string;
      anyCount: string;
      areaLabel: string;
      areaHint: string;
      priceLabel: string;
      priceHint: string;
      resetLabel: string;
      resultsCount: string;
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
    bedroomsLabel: string;
    bathroomsLabel: string;
    areaLabel: string;
    descriptionLabel: string;
    enquireCta: string;
    callCta: string;
    notFoundTitle: string;
    notFoundBody: string;
  };
  about: {
    eyebrow: string;
    title: string;
    story: { eyebrow: string; title: string; quote: string; body: string };
    missionVision: { missionLabel: string; mission: string; visionLabel: string; vision: string };
    whatWeDo: { eyebrow: string; title: string; body: string };
    whyChooseUs: { eyebrow: string; title: string; items: string[] };
    achievements: { eyebrow: string; title: string; body: string; stat: string; statLabel: string };
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
  subbrandPages: {
    backLabel: string;
    goldLife: {
      eyebrow: string;
      title: string;
      body: string;
      servicesLabel: string;
      services: string[];
      partnersLabel: string;
      partners: string[];
      ctaLabel: string;
    };
    goldManagement: {
      eyebrow: string;
      title: string;
      body: string;
      ctaLabel: string;
    };
    goldExport: {
      eyebrow: string;
      title: string;
      body: string;
      comingSoonLabel: string;
      ctaLabel: string;
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
  { label: 'Up to EGP 50M', max: 50_000_000 },
  { label: 'Up to EGP 75M', max: 75_000_000 },
  { label: 'EGP 100M+', max: 500_000_000 }
];

const priceBucketsAr: PriceBucket[] = [
  { label: 'حتى 10 مليون جنيه', max: 10_000_000 },
  { label: 'حتى 20 مليون جنيه', max: 20_000_000 },
  { label: 'حتى 30 مليون جنيه', max: 30_000_000 },
  { label: 'حتى 50 مليون جنيه', max: 50_000_000 },
  { label: 'حتى 75 مليون جنيه', max: 75_000_000 },
  { label: '100 مليون جنيه فأكثر', max: 500_000_000 }
];

const goldLifePartners = ['SAF', 'A-Line', 'Mobica Sharm', 'DRIVE Finance', 'FORSA', 'Contrast Designs'];

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    seo: {
      title: 'GOLD Investment Opportunities',
      description:
        'Buy primary, rental, and resale premium properties in New Cairo, North Coast, Sheikh Zayed, Ain Sokhna, and Gouna with GOLD — trusted real estate consultation and property management.'
    },
    nav: {
      home: 'Home',
      properties: 'Properties',
      about: 'About',
      contact: 'Contact'
    },
    home: {
      hero: {
        eyebrow: 'Primary. Rental. Resale.',
        title: 'Find your next property',
        subtitle: 'Browse live primary, resale, and rental listings in New Cairo, the North Coast, Sheikh Zayed, Ain Sokhna, and Gouna.',
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
      intro: 'Filter by type, location, unit, rooms, size, and budget to see what is actually available.',
      filters: {
        panelTitle: 'Filter Properties',
        panelSubtitle: 'Apply filters to find your perfect property.',
        propertyTypeLabel: 'Property Type',
        anyPropertyType: 'Any type',
        unitTypeLabel: 'Unit Type',
        anyUnitType: 'Any unit',
        locationLabel: 'Location',
        anyLocation: 'Any location',
        bedroomsLabel: 'Bedrooms',
        bathroomsLabel: 'Bathrooms',
        anyCount: 'Any',
        areaLabel: 'Property Size',
        areaHint: 'Area range (m²)',
        priceLabel: 'Property Price',
        priceHint: 'Set your budget range (EGP)',
        resetLabel: 'Reset filters',
        resultsCount: '{count} properties found',
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
      bedroomsLabel: 'Bedrooms',
      bathroomsLabel: 'Bathrooms',
      areaLabel: 'Area',
      descriptionLabel: 'About this property',
      enquireCta: 'Enquire About This Property',
      callCta: 'Call Now',
      notFoundTitle: 'Property not found',
      notFoundBody: 'This listing may have been removed or is no longer published.'
    },
    about: {
      eyebrow: 'About GOLD',
      title: 'GOLD is more than a name. It is a framework for value.',
      story: {
        eyebrow: 'Our Story',
        title: 'GOLD',
        quote: 'GOLD stands for Golden Opportunities of Leading Domain.',
        body: 'Everyone understands what this word represents — you can almost feel its value as soon as you hear it. In our brand, we take the word gold to another level and give it a unique perspective. It reflects the essence of what we offer: services as valuable and rare as gold itself.'
      },
      missionVision: {
        missionLabel: 'Mission',
        mission:
          'Give clients real estate advice they can trust, with transparent pricing and no pressure to decide before they are ready.',
        visionLabel: 'Vision',
        vision: 'Grow GOLD into a group that spans real estate, lifestyle, and management — built to last, not just to sell.'
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
        body: 'Since we started, we have worked with a growing number of clients across primary, resale, and rental deals. That track record — not just the pitch — is what keeps GOLD growing as a name people come back to.',
        stat: 'EGP 1B+',
        statLabel: 'In sales achieved'
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
    subbrandPages: {
      backLabel: 'Back to About',
      goldLife: {
        eyebrow: 'Gold Life',
        title: 'Lifestyle services, curated',
        body: 'Beyond real estate, Gold Life brings a curated set of services to make property ownership effortless — from finishing touches to financing.',
        servicesLabel: 'Services',
        services: ['Finishing', 'Furnishing', 'Car Dealership', 'Financial Funding'],
        partnersLabel: 'In partnership with',
        partners: goldLifePartners,
        ctaLabel: 'Talk to the Gold Life team'
      },
      goldManagement: {
        eyebrow: 'Gold Management',
        title: 'Rent a unit, or rent and manage your unit',
        body: 'Our Rental & Facility Management Program delivers a premium investment and lifestyle experience across distinguished destinations such as Cairo and the North Coast. Created to serve both property owners and tenants, the program enables owners to maximize the value of their units through professional rental and management services, while offering tenants access to carefully selected properties that combine comfort, quality, and convenience.',
        ctaLabel: 'Talk to the Gold Management team'
      },
      goldExport: {
        eyebrow: 'Gold Export',
        title: 'Cross-border opportunities, coming soon',
        body: 'Gold Export is the newest of our four Golden Ways to invest, focused on cross-border export opportunities with global reach. We are currently building this offering — get in touch if you would like to be the first to hear more.',
        comingSoonLabel: 'Coming Soon',
        ctaLabel: 'Get in touch'
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
      tagline: 'Golden Opportunity Of Leading Domain.',
      legal: '© 2026 GOLD Investment Opportunities. All rights reserved.'
    }
  },
  ar: {
    seo: {
      title: 'فرص استثمارية من GOLD',
      description:
        'عقارات أساسية وإيجار وإعادة بيع مميزة في القاهرة الجديدة والساحل الشمالي والشيخ زايد والعين السخنة والجونة مع GOLD — استشارات عقارية موثوقة وإدارة احترافية للأملاك.'
    },
    nav: {
      home: 'الرئيسية',
      properties: 'العقارات',
      about: 'من نحن',
      contact: 'تواصل معنا'
    },
    home: {
      hero: {
        eyebrow: 'أساسي. إيجار. إعادة بيع.',
        title: 'ابحث عن عقارك القادم',
        subtitle: 'تصفح عقارات أساسية وإعادة بيع وإيجار في القاهرة الجديدة والساحل الشمالي والشيخ زايد والعين السخنة والجونة.',
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
      intro: 'صفِّ النتائج حسب النوع والموقع والوحدة والغرف والمساحة والميزانية لترى ما هو متاح فعلاً.',
      filters: {
        panelTitle: 'تصفية العقارات',
        panelSubtitle: 'طبّق الفلاتر للعثور على عقارك المثالي.',
        propertyTypeLabel: 'نوع العقار',
        anyPropertyType: 'أي نوع',
        unitTypeLabel: 'نوع الوحدة',
        anyUnitType: 'أي وحدة',
        locationLabel: 'الموقع',
        anyLocation: 'أي موقع',
        bedroomsLabel: 'غرف النوم',
        bathroomsLabel: 'الحمامات',
        anyCount: 'أي عدد',
        areaLabel: 'مساحة العقار',
        areaHint: 'نطاق المساحة (م²)',
        priceLabel: 'سعر العقار',
        priceHint: 'حدد نطاق ميزانيتك (جنيه)',
        resetLabel: 'إعادة تعيين',
        resultsCount: '{count} عقار متاح',
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
      bedroomsLabel: 'غرف النوم',
      bathroomsLabel: 'الحمامات',
      areaLabel: 'المساحة',
      descriptionLabel: 'عن هذا العقار',
      enquireCta: 'استفسر عن هذا العقار',
      callCta: 'اتصل الآن',
      notFoundTitle: 'العقار غير موجود',
      notFoundBody: 'ربما تم حذف هذا العرض أو لم يعد منشوراً.'
    },
    about: {
      eyebrow: 'عن GOLD',
      title: 'GOLD ليس مجرد اسم. إنه إطار للقيمة.',
      story: {
        eyebrow: 'قصتنا',
        title: 'GOLD',
        quote: 'GOLD اختصار لعبارة Golden Opportunities of Leading Domain.',
        body: 'يفهم الجميع ما تمثله هذه الكلمة — يمكنك أن تشعر بقيمتها فور سماعها. في علامتنا، نأخذ كلمة الذهب إلى مستوى آخر ونمنحها منظوراً فريداً. إنها تعكس جوهر ما نقدمه: خدمات ثمينة ونادرة كالذهب نفسه.'
      },
      missionVision: {
        missionLabel: 'الرسالة',
        mission: 'نقدم لعملائنا استشارة عقارية يثقون بها، بأسعار شفافة ودون أي ضغط لاتخاذ قرار قبل أن يكونوا جاهزين.',
        visionLabel: 'الرؤية',
        vision: 'أن تنمو GOLD لتشمل العقارات ونمط الحياة والإدارة — مجموعة مبنية لتستمر، لا لتبيع فقط.'
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
        body: 'منذ انطلاقتنا، تعاملنا مع عدد متزايد من العملاء في صفقات أساسية وإعادة بيع وإيجار. هذا السجل — لا الكلام التسويقي — هو ما يجعل GOLD اسماً يعود إليه العملاء.',
        stat: '1 مليار+ جنيه',
        statLabel: 'مبيعات محققة'
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
    subbrandPages: {
      backLabel: 'العودة إلى من نحن',
      goldLife: {
        eyebrow: 'Gold Life',
        title: 'خدمات نمط حياة منتقاة',
        body: 'بعيداً عن العقارات، يقدم Gold Life مجموعة منتقاة من الخدمات لجعل امتلاك العقار أمراً سهلاً — من التشطيب إلى التمويل.',
        servicesLabel: 'الخدمات',
        services: ['تشطيب', 'فرش وأثاث', 'وكالة سيارات', 'تمويل مالي'],
        partnersLabel: 'بالشراكة مع',
        partners: goldLifePartners,
        ctaLabel: 'تواصل مع فريق Gold Life'
      },
      goldManagement: {
        eyebrow: 'Gold Management',
        title: 'أوجر وحدتك، أو أوجرها وأدرها معنا',
        body: 'يقدم برنامج الإيجار وإدارة المرافق لدينا تجربة استثمارية ومعيشية فاخرة عبر وجهات مميزة مثل القاهرة والساحل الشمالي. صُمم البرنامج لخدمة الملاك والمستأجرين معاً، حيث يمكّن الملاك من تعظيم قيمة وحداتهم من خلال خدمات إيجار وإدارة احترافية، بينما يمنح المستأجرين وصولاً إلى عقارات مختارة بعناية تجمع بين الراحة والجودة والملاءمة.',
        ctaLabel: 'تواصل مع فريق Gold Management'
      },
      goldExport: {
        eyebrow: 'Gold Export',
        title: 'فرص عالمية عابرة للحدود، قريباً',
        body: 'Gold Export هو أحدث طرقنا الذهبية الأربع للاستثمار، ويركز على فرص التصدير عبر الحدود بنطاق عالمي. نعمل حالياً على تطوير هذه الخدمة — تواصل معنا إذا كنت ترغب في أن تكون أول من يعلم بالمستجدات.',
        comingSoonLabel: 'قريباً',
        ctaLabel: 'تواصل معنا'
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
      tagline: 'الفرصة الذهبية لمجال ريادي.',
      legal: '© 2026 GOLD Investment Opportunities. جميع الحقوق محفوظة.'
    }
  }
};

export function getSiteCopy(locale: Locale): SiteCopy {
  return siteCopy[locale];
}
