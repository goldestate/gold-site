import type { Locale } from '@/i18n/routing';

export type SiteCopy = {
  seo: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    about: string;
    usps: string;
    properties: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    statLabel1: string;
    statValue1: string;
    statLabel2: string;
    statValue2: string;
    statLabel3: string;
    statValue3: string;
  };
  about: {
    eyebrow: string;
    title: string;
    story: string;
    missionLabel: string;
    mission: string;
    visionLabel: string;
    vision: string;
    quote: string;
    signature: string;
  };
  usps: {
    eyebrow: string;
    title: string;
    items: Array<{
      title: string;
      description: string;
      icon: 'shield' | 'gem' | 'compass' | 'key';
    }>;
  };
  properties: {
    eyebrow: string;
    title: string;
    filters: {
      locationLabel: string;
      allLocations: string;
      priceLabel: string;
      anyPrice: string;
      priceBuckets: Array<{ label: string; max: number }>;
      noResultsTitle: string;
      noResultsBody: string;
      viewDetails: string;
    };
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
    options: string[];
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
    sublinks: string[];
  };
};

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    seo: {
      title: 'GOLD Investment Opportunities',
      description:
        'Luxury real estate and investment holding brand presenting premium properties, expert consultation, and a multi-sector future.'
    },
    nav: {
      home: 'Home',
      about: 'Brand Story',
      usps: 'Why GOLD',
      properties: 'Featured Listings',
      contact: 'Contact'
    },
    hero: {
      eyebrow: 'Golden Opportunities of Leading Domain',
      titleLine1: 'GOLD',
      titleLine2: 'Investment Opportunities',
      subtitle:
        'A premium real estate and investment holding brand built on trust, rare opportunities, and long-term value.',
      primaryCta: 'Explore Properties',
      secondaryCta: 'Book a Consultation',
      statLabel1: 'Founded',
      statValue1: '2024',
      statLabel2: 'Sub-brands',
      statValue2: '4',
      statLabel3: 'Focus',
      statValue3: 'Premium Growth'
    },
    about: {
      eyebrow: 'Brand Story',
      title: 'GOLD is more than a name. It is a framework for value.',
      story:
        'GOLD stands for Golden Opportunities of Leading Domain. The brand began in 2024 in real estate, bringing together buying, selling, and elite consultation under one disciplined, elegant identity. It now evolves into a holding platform built for enduring relevance and measurable impact.',
      missionLabel: 'Mission',
      mission:
        'Deliver trusted, high-quality real estate solutions through expert consultation, transparency, and exceptional service.',
      visionLabel: 'Vision',
      vision:
        'Become a leading multi-sector group recognized for innovation, integrity, and long-term investment value.',
      quote:
        'High value is not loud. It is precise, calm, and unmistakably well made.',
      signature: 'GOLD Investment Opportunities'
    },
    usps: {
      eyebrow: 'Why Choose Us',
      title: 'A measured approach to premium investment.',
      items: [
        {
          title: 'Trust',
          description:
            'A discreet, relationship-first process designed for clarity, confidence, and zero friction.',
          icon: 'shield'
        },
        {
          title: 'Premium Quality',
          description:
            'Only carefully selected homes and investment assets that meet a strict luxury standard.',
          icon: 'gem'
        },
        {
          title: 'Expertise',
          description:
            'Consultation grounded in market insight, negotiation discipline, and long-term planning.',
          icon: 'compass'
        },
        {
          title: 'Exclusive Access',
          description:
            'Private opportunities, off-market introductions, and a curated network of partners.',
          icon: 'key'
        }
      ]
    },
    properties: {
      eyebrow: 'Featured Listings',
      title: 'Selected properties with quiet confidence.',
      filters: {
        locationLabel: 'Location',
        allLocations: 'All locations',
        priceLabel: 'Budget',
        anyPrice: 'Any price',
        priceBuckets: [
          { label: 'Up to EGP 10M', max: 10_000_000 },
          { label: 'Up to EGP 20M', max: 20_000_000 },
          { label: 'Up to EGP 30M', max: 30_000_000 },
          { label: 'Up to EGP 50M', max: 50_000_000 }
        ],
        noResultsTitle: 'No properties match these filters.',
        noResultsBody: 'Try a different location or a wider budget range.',
        viewDetails: 'View Details'
      }
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
    },
    contact: {
      eyebrow: 'Contact / Inquiry',
      title: 'Speak with the team behind GOLD.',
      intro:
        'Tell us what you are looking for and we will respond with a private, tailored recommendation.',
      formTitle: 'Start your inquiry',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      message: 'Message',
      interest: 'Property Interest',
      submit: 'Send inquiry',
      success: 'Your inquiry has been sent. The GOLD team will contact you shortly.',
      addressLabel: 'Office',
      address: 'The Office, Tulip, 90th Street, 5th Settlement, New Cairo, Egypt',
      hotlineLabel: 'Hotline',
      hotline: '+20 15663',
      emailLabel: 'Email',
      emailValue: 'gold.domain01@gmail.com',
      mapCta: 'Open map',
      placeholderInterest: 'Select a property type',
      options: ['Residential villa', 'Luxury apartment', 'Investment plot', 'Commercial asset'],
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
      legal: '© 2026 GOLD Investment Opportunities. All rights reserved.',
      sublinks: [
        'Gold Real Estate',
        'Gold Life',
        'Gold Management',
        'Gold Export'
      ]
    }
  },
  ar: {
    seo: {
      title: 'فرص استثمارية من GOLD',
      description:
        'علامة عقارية واستثمارية فاخرة تقدم عقارات مميزة واستشارات متخصصة وبنية قابلة للتوسع لقطاعات متعددة.'
    },
    nav: {
      home: 'الرئيسية',
      about: 'قصة العلامة',
      usps: 'لماذا GOLD',
      properties: 'العروض المميزة',
      contact: 'تواصل معنا'
    },
    hero: {
      eyebrow: 'الفرص الذهبية في المجال الريادي',
      titleLine1: 'GOLD',
      titleLine2: 'فرص استثمارية',
      subtitle:
        'علامة عقارية واستثمارية راقية مبنية على الثقة والفرص النادرة والقيمة طويلة الأجل.',
      primaryCta: 'استعرض العقارات',
      secondaryCta: 'احجز استشارة',
      statLabel1: 'التأسيس',
      statValue1: '2024',
      statLabel2: 'القطاعات',
      statValue2: '4',
      statLabel3: 'التركيز',
      statValue3: 'نمو متميز'
    },
    about: {
      eyebrow: 'قصة العلامة',
      title: 'GOLD ليس مجرد اسم. إنه إطار للقيمة.',
      story:
        'GOLD اختصار لعبارة Golden Opportunities of Leading Domain. بدأت العلامة في 2024 في مجال العقارات، وتقدم الشراء والبيع والاستشارات ضمن هوية دقيقة وأنيقة، ثم تتوسع الآن إلى منصة استثمارية متعددة القطاعات.',
      missionLabel: 'الرسالة',
      mission:
        'تقديم حلول عقارية موثوقة وعالية الجودة من خلال استشارات خبيرة وشفافية وخدمة استثنائية.',
      visionLabel: 'الرؤية',
      vision:
        'أن نصبح مجموعة رائدة متعددة القطاعات معروفة بالابتكار والنزاهة والقيمة الاستثمارية المستدامة.',
      quote: 'القيمة الحقيقية لا تصرخ. إنها دقيقة وهادئة ولا تخطئها العين.',
      signature: 'فرص GOLD الاستثمارية'
    },
    usps: {
      eyebrow: 'لماذا نحن',
      title: 'منهج هادئ لاستثمار متميز.',
      items: [
        {
          title: 'الثقة',
          description: 'عملية خاصة وواضحة تمنحك راحة البال وسلاسة القرار.',
          icon: 'shield'
        },
        {
          title: 'جودة فاخرة',
          description: 'عقارات وأصول مختارة بعناية لتلائم معايير الرفاهية العالية.',
          icon: 'gem'
        },
        {
          title: 'خبرة',
          description: 'استشارات تعتمد على قراءة السوق والانضباط في التفاوض والتخطيط الطويل.',
          icon: 'compass'
        },
        {
          title: 'وصول حصري',
          description: 'فرص خاصة وتعريفات غير مطروحة للسوق وشبكة شركاء مختارة.',
          icon: 'key'
        }
      ]
    },
    properties: {
      eyebrow: 'العروض المميزة',
      title: 'اختيارات انتقائية بثقة هادئة.',
      filters: {
        locationLabel: 'الموقع',
        allLocations: 'كل المواقع',
        priceLabel: 'الميزانية',
        anyPrice: 'أي سعر',
        priceBuckets: [
          { label: 'حتى 10 مليون جنيه', max: 10_000_000 },
          { label: 'حتى 20 مليون جنيه', max: 20_000_000 },
          { label: 'حتى 30 مليون جنيه', max: 30_000_000 },
          { label: 'حتى 50 مليون جنيه', max: 50_000_000 }
        ],
        noResultsTitle: 'لا توجد عقارات مطابقة لهذا البحث.',
        noResultsBody: 'جرّب موقعاً مختلفاً أو نطاق ميزانية أوسع.',
        viewDetails: 'عرض التفاصيل'
      }
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
    },
    contact: {
      eyebrow: 'التواصل / الاستفسار',
      title: 'تحدث مع فريق GOLD.',
      intro:
        'أخبرنا بما تبحث عنه وسنعود إليك بتوصية خاصة ومصممة خصيصاً لك.',
      formTitle: 'ابدأ الاستفسار',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      message: 'الرسالة',
      interest: 'نوع الاهتمام',
      submit: 'إرسال الاستفسار',
      success: 'تم إرسال استفسارك. سيتواصل معك فريق GOLD قريباً.',
      addressLabel: 'المكتب',
      address: 'The Office, Tulip, 90th Street, 5th Settlement, New Cairo, Egypt',
      hotlineLabel: 'الخط الساخن',
      hotline: '+20 15663',
      emailLabel: 'البريد',
      emailValue: 'gold.domain01@gmail.com',
      mapCta: 'عرض الخريطة',
      placeholderInterest: 'اختر نوع العقار',
      options: ['فيلا سكنية', 'شقة فاخرة', 'قطعة استثمارية', 'أصل تجاري'],
      errors: {
        name: 'من فضلك أدخل الاسم الكامل.',
        phone: 'من فضلك أدخل رقم هاتف صحيح.',
        email: 'من فضلك أدخل بريداً إلكترونياً صحيحاً.',
        message: 'من فضلك اكتب رسالة قصيرة.',
        interest: 'من فضلك اختر مجال الاهتمام.'
      }
    },
    footer: {
      tagline: 'فرص ذهبية. مجال ريادي. ثقة هادئة.',
      legal: '© 2026 GOLD Investment Opportunities. جميع الحقوق محفوظة.',
      sublinks: [
        'Gold Real Estate',
        'Gold Life',
        'Gold Management',
        'Gold Export'
      ]
    }
  }
};

export function getSiteCopy(locale: Locale): SiteCopy {
  return siteCopy[locale];
}
