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
    forBrokers: string;
    goldLife: string;
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
      /** Describes the opening photo (one of GOLD's homes) for screen readers. */
      heroImageAlt: string;
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
    rentalDesk: {
      eyebrow: string;
      title: string;
      subtitle: string;
      brokerCard: { title: string; body: string; cta: string };
      ownerCard: { title: string; body: string; cta: string };
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
    whatsappCta: string;
    /**
     * Typed into WhatsApp for the visitor. "{property}", "{location}", "{price}"
     * and "{url}" are filled in by the page; the link is what tells the team
     * exactly which unit is meant.
     */
    whatsappMessage: string;
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
    whatsappLabel: string;
    /** Typed into WhatsApp when someone starts a chat from the contact page. */
    whatsappMessage: string;
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
    /**
     * The app card under the tagline, on every page. "App Store" and "iPhone"
     * stay in English in both languages: Apple's rules forbid translating or
     * transliterating its trademarks.
     */
    app: {
      title: string;
      body: string;
      /** Under the QR code, which only shows on wide screens. */
      scanHint: string;
      /** The card is a single link; this is what a screen reader announces for it. */
      linkLabel: string;
    };
    /** The credit Apple requires wherever its badge appears, placed with the legal line. */
    appleCredit: string;
    /**
     * GOLD's commercial register and tax card numbers, which Egypt's Consumer
     * Protection Law (181/2018, art. 37) asks a business selling at a distance
     * to give. Kept in the footer's small print, where people look for it.
     */
    registration: string;
  };
  rentalRequestPage: {
    eyebrow: string;
    title: string;
    intro: string;
    brokerSectionTitle: string;
    requestSectionTitle: string;
    name: string;
    company: string;
    phone: string;
    whatsapp: string;
    email: string;
    propertyTypeLabel: string;
    locationLabel: string;
    budgetMinLabel: string;
    budgetMaxLabel: string;
    bedroomsLabel: string;
    furnishedLabel: string;
    furnishedAny: string;
    furnishedYes: string;
    furnishedNo: string;
    moveInDateLabel: string;
    rentalPeriodLabel: string;
    rentalPeriodAny: string;
    notesLabel: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    referenceLabel: string;
    submitAnother: string;
    errors: {
      name: string;
      phone: string;
      propertyType: string;
      location: string;
      email: string;
      generic: string;
    };
  };
  listPropertyPage: {
    eyebrow: string;
    title: string;
    intro: string;
    ownerSectionTitle: string;
    listingSectionTitle: string;
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    propertyTypeLabel: string;
    locationLabel: string;
    priceLabel: string;
    bedroomsLabel: string;
    furnishedLabel: string;
    furnishedYes: string;
    furnishedNo: string;
    availableFromLabel: string;
    photosLabel: string;
    photosHint: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    submitAnother: string;
    errors: {
      name: string;
      phone: string;
      propertyType: string;
      location: string;
      price: string;
      photos: string;
      email: string;
      generic: string;
    };
  };
  /**
   * The confidentiality agreement's signing page, opened right after "Request a
   * unit" or "List your property", and from the link in the confirmation email.
   * The agreement itself is English (lib/nda.ts); everything around it is here.
   * "{reference}" and "{date}" are filled in by the page.
   */
  ndaPage: {
    eyebrow: string;
    title: string;
    intro: string;
    receivedRequest: string;
    receivedListing: string;
    detailsTitle: string;
    nameLabel: string;
    companyLabel: string;
    phoneLabel: string;
    emailLabel: string;
    agreementTitle: string;
    agreementLanguageNote: string;
    download: string;
    signTitle: string;
    drawTab: string;
    uploadTab: string;
    drawHint: string;
    clear: string;
    uploadHint: string;
    chooseFile: string;
    replaceFile: string;
    agreeLabel: string;
    submit: string;
    submitting: string;
    errorDraw: string;
    errorFile: string;
    errorFileType: string;
    errorAgree: string;
    errorGeneric: string;
    doneTitle: string;
    doneBody: string;
    signedTitle: string;
    signedBody: string;
    invalidTitle: string;
    invalidBody: string;
    backHome: string;
  };
  /**
   * The page behind an unlock link. It is a handoff to the app, not a form: it
   * never checks whether the code is real, because a browser-visible answer
   * would tell anyone guessing which prefixes exist and undo the deliberately
   * indistinguishable 404 that /api/unlock returns.
   *
   * The feature is called what the app calls it -- "Compound guide" under the
   * "Guide" tab (Strings.swift in the app) -- so a guest following this page
   * looks for words that are actually on their screen.
   */
  unlockPage: {
    /** Link-preview title and description. Never include the code: previews get forwarded. */
    metaTitle: string;
    metaDescription: string;
    /** The same page in the other language, shown as a link on the page itself. */
    otherLanguage: string;
    eyebrow: string;
    title: string;
    intro: string;
    codeLabel: string;
    /** For a link whose code is missing or cut off. The URL text is never shown back. */
    incompleteTitle: string;
    incompleteIntro: string;
    getTheApp: string;
    getTheAppHint: string;
    askUs: string;
    /** Shown when there is no App Store link: WhatsApp is how a guest gets the list. */
    askUsHint: string;
    /** After it is, WhatsApp stays for Android and for anyone who can't install. */
    askUsHintWithApp: string;
    haveAppLead: string;
    openInApp: string;
    openInAppHint: string;
    manualTitle: string;
    manualBody: string;
    manualTitleNoCode: string;
    manualBodyNoCode: string;
    whatsappMessage: string;
    whatsappMessageNoCode: string;
  };
};

export const SITE_URL = 'https://gold-eg.com';

/**
 * The picture link previews use (WhatsApp, iMessage, X), resolved against
 * SITE_URL by the root layout's metadataBase.
 *
 * A static file in public/ rather than app/opengraph-image.tsx, because its path
 * has a file extension, which the locale middleware never touches; /opengraph-image
 * has none, so the middleware redirects it to /en/opengraph-image, which is a 404
 * -- every preview built from it was broken.
 *
 * It is the app icon's mark flattened onto the icon's own dark background: square
 * and fully opaque, so it reads as a thumbnail on light and dark chat themes alike
 * (app/icon.png has transparent rounded corners). It is its own file, not
 * /icon.png, so that changing the favicon (or turning it into icon.tsx) can never
 * quietly break every link preview.
 */
export const SHARE_IMAGE = { url: '/share-icon.png', width: 512, height: 512 } as const;

/** og:locale for each site language. */
export const OG_LOCALE: Record<Locale, string> = { en: 'en_GB', ar: 'ar_EG' };

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
      contact: 'Contact',
      forBrokers: 'Gold Partners',
      goldLife: 'Gold Life'
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
        statValue3: '4',
        heroImageAlt: 'Hacienda West on the North Coast at dusk, with the sea behind a lit pool'
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
      },
      rentalDesk: {
        eyebrow: 'Rental Desk',
        title: 'A faster way to match rentals',
        subtitle:
          'Our B2B desk connects broker requirements with owner listings directly, so both sides move faster.',
        brokerCard: {
          title: 'Gold Partners',
          body: 'Submit a client’s rental requirement and we will match it against active listings and reach back out.',
          cta: 'Submit a Rental Request'
        },
        ownerCard: {
          title: 'For Property Owners',
          body: 'List your property for rent and our team will review it, then match it with brokers looking for exactly that.',
          cta: 'List Your Property'
        }
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
      whatsappCta: 'WhatsApp us',
      whatsappMessage: 'Hello GOLD, I’m interested in {property} ({location}, {price}). {url}',
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
      whatsappLabel: 'WhatsApp',
      whatsappMessage: 'Hello GOLD, I have a question.',
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
      legal: '© 2026 GOLD Investment Opportunities. All rights reserved.',
      app: {
        title: 'Download the GOLD app',
        body: 'Browse every listing, save the ones you like and find trusted help in your compound. Free, no sign-up.',
        scanHint: 'Scan with your iPhone',
        linkLabel: 'Download the GOLD app on the App Store'
      },
      appleCredit:
        'Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc.',
      registration: 'Commercial Register No. 33859 · Tax Card No. 764-027-395'
    },
    rentalRequestPage: {
      eyebrow: 'Rental Desk / Gold Partners',
      title: 'Submit a Rental Request',
      intro:
        'Tell us what your client needs and we will match it against active rental listings and reach back out with options.',
      brokerSectionTitle: 'Your details',
      requestSectionTitle: 'What your client needs',
      name: 'Full name',
      company: 'Company (optional)',
      phone: 'Phone',
      whatsapp: 'WhatsApp (optional)',
      email: 'Email',
      propertyTypeLabel: 'Property type',
      locationLabel: 'Location',
      budgetMinLabel: 'Budget min (EGP)',
      budgetMaxLabel: 'Budget max (EGP)',
      bedroomsLabel: 'Bedrooms (min)',
      furnishedLabel: 'Furnished',
      furnishedAny: 'No preference',
      furnishedYes: 'Furnished',
      furnishedNo: 'Unfurnished',
      moveInDateLabel: 'Move-in date',
      rentalPeriodLabel: 'Rental period',
      rentalPeriodAny: 'Any',
      notesLabel: 'Notes (optional)',
      submit: 'Submit Rental Request',
      submitting: 'Submitting...',
      successTitle: 'Request received',
      successBody: 'Your rental request has been submitted. The GOLD team will match it against active listings and reach out.',
      referenceLabel: 'Your reference code',
      submitAnother: 'Submit another request',
      errors: {
        name: 'Please enter your full name.',
        phone: 'Please enter a valid phone number.',
        propertyType: 'Please select a property type.',
        location: 'Please select a location.',
        email: 'Enter your email for the confirmation and the agreement.',
        generic: 'We could not submit your request right now. Please try again later.'
      }
    },
    listPropertyPage: {
      eyebrow: 'Rental Desk / For Owners',
      title: 'List Your Property for Rent',
      intro: 'Add your property to our rental desk and our team will review it, then match it with brokers looking for exactly that.',
      ownerSectionTitle: 'Your details',
      listingSectionTitle: 'Property details',
      name: 'Full name',
      phone: 'Phone',
      whatsapp: 'WhatsApp (optional)',
      email: 'Email',
      propertyTypeLabel: 'Property type',
      locationLabel: 'Location',
      priceLabel: 'Monthly rent (EGP)',
      bedroomsLabel: 'Bedrooms',
      furnishedLabel: 'Furnished',
      furnishedYes: 'Furnished',
      furnishedNo: 'Unfurnished',
      availableFromLabel: 'Available from',
      photosLabel: 'Photos',
      photosHint: 'Upload at least one photo of the property.',
      submit: 'Submit Listing',
      submitting: 'Submitting...',
      successTitle: 'Listing submitted',
      successBody: 'Your property has been submitted for review. Our team will approve it and start matching it with broker requests.',
      submitAnother: 'List another property',
      errors: {
        name: 'Please enter your full name.',
        phone: 'Please enter a valid phone number.',
        propertyType: 'Please select a property type.',
        location: 'Please select a location.',
        price: 'Please enter a valid monthly rent.',
        photos: 'Please upload at least one photo.',
        email: 'Enter your email for the confirmation and the agreement.',
        generic: 'We could not submit your listing right now. Please try again later.'
      }
    },
    ndaPage: {
      eyebrow: 'One last step',
      title: 'Sign the confidentiality agreement',
      intro:
        'GOLD asks every client, broker and owner to keep the unit and client details we share confidential. Read the agreement, then sign it on screen or upload a signed copy.',
      receivedRequest: 'Your request {reference} is with our team.',
      receivedListing: 'Your property is with our team for review.',
      detailsTitle: 'Your details',
      nameLabel: 'Name',
      companyLabel: 'Company',
      phoneLabel: 'Contact number',
      emailLabel: 'Email',
      agreementTitle: 'The agreement',
      agreementLanguageNote: '',
      download: 'Download the PDF',
      signTitle: 'Sign',
      drawTab: 'Sign on screen',
      uploadTab: 'Upload a signed copy',
      drawHint: 'Sign in the box with your finger or mouse.',
      clear: 'Clear',
      uploadHint: 'Download the PDF, sign it, then upload a photo or PDF of the signed copy.',
      chooseFile: 'Choose a photo or PDF',
      replaceFile: 'Choose another file',
      agreeLabel: 'I have read and agree to this agreement.',
      submit: 'Sign and send',
      submitting: 'Sending...',
      errorDraw: 'Sign in the box first.',
      errorFile: 'Choose the signed copy first.',
      errorFileType: 'Use a photo (JPEG, PNG or WebP) or a PDF, under 10 MB.',
      errorAgree: 'Tick the box to accept the agreement.',
      errorGeneric: 'Could not send. Please try again.',
      doneTitle: 'Thank you. The agreement is signed.',
      doneBody: 'GOLD has your signed agreement. We will contact you on WhatsApp.',
      signedTitle: 'This agreement is already signed.',
      signedBody: 'Signed on {date}. There is nothing else to do.',
      invalidTitle: 'This link isn’t valid.',
      invalidBody: 'It may be incomplete. Ask GOLD on WhatsApp and we will send you a new signing link.',
      backHome: 'Back to GOLD'
    },
    unlockPage: {
      metaTitle: 'Your GOLD compound guide',
      metaDescription:
        'The code GOLD sent you opens your compound guide: the shops nearby, and the plumber, the electrician and the other people we actually use, with their numbers.',
      otherLanguage: 'العربية',
      eyebrow: 'Compound guide',
      title: 'Your compound, unlocked.',
      intro:
        'This code opens your compound’s guide — the shops nearby, plus the plumber, the electrician, the AC technician and the rest of the people we actually use, with their numbers.',
      codeLabel: 'Your code',
      incompleteTitle: 'This link isn’t complete.',
      incompleteIntro:
        'The code that belongs at the end of it is missing or cut off. Ask GOLD for your code and we will send it to you on WhatsApp.',
      getTheApp: 'Get the GOLD app',
      getTheAppHint: 'Free on the App Store, for iPhone.',
      askUs: 'Ask GOLD on WhatsApp',
      askUsHint: 'The app is launching shortly. Message us and we will send you the list in the meantime.',
      askUsHintWithApp: 'On Android, or can’t install the app? Message us and we will send you the list.',
      haveAppLead: 'Already have the app?',
      openInApp: 'Open it',
      openInAppHint: 'If it doesn’t open, the app isn’t on this phone yet.',
      manualTitle: 'Or enter it by hand',
      manualBody: 'Open the GOLD app, tap Guide, then Enter code, and type the code above.',
      manualTitleNoCode: 'When you have your code',
      manualBodyNoCode:
        'Open the GOLD app, tap Guide, then Enter code, and type it in. It looks like GOLD-XX-XXXX.',
      whatsappMessage: 'Hello, I have a GOLD code for my compound guide: {code}',
      whatsappMessageNoCode:
        'Hello, the GOLD link I was sent doesn’t have a code in it. Could you send me my code for the compound guide?'
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
      contact: 'تواصل معنا',
      forBrokers: 'شركاء GOLD',
      goldLife: 'Gold Life'
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
        statValue3: '4',
        heroImageAlt: 'هاسيندا ويست في الساحل الشمالي عند الغروب، والبحر خلف حمام سباحة مضاء'
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
      },
      rentalDesk: {
        eyebrow: 'مكتب الإيجارات',
        title: 'طريقة أسرع لمطابقة الإيجارات',
        subtitle: 'يربط مكتبنا للوسطاء والملاك متطلبات الوسطاء بعروض الملاك مباشرة، ليتحرك الطرفان بسرعة أكبر.',
        brokerCard: {
          title: 'شركاء GOLD',
          body: 'أرسل متطلبات عميلك الإيجارية وسنقوم بمطابقتها مع العروض النشطة والتواصل معك.',
          cta: 'إرسال طلب إيجار'
        },
        ownerCard: {
          title: 'لملاك العقارات',
          body: 'أضف عقارك للإيجار وسيراجعه فريقنا، ثم يطابقه مع وسطاء يبحثون عن نفس المواصفات بالضبط.',
          cta: 'أضف عقارك للإيجار'
        }
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
      whatsappCta: 'راسلنا على واتساب',
      whatsappMessage: 'مرحباً جولد، أنا مهتم بـ {property} ({location}، {price}). {url}',
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
      whatsappLabel: 'واتساب',
      whatsappMessage: 'مرحباً جولد، لدي استفسار.',
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
      legal: '© 2026 GOLD Investment Opportunities. جميع الحقوق محفوظة.',
      app: {
        title: 'حمّل تطبيق جولد',
        body: 'تصفّح كل العقارات، واحفظ ما يعجبك، واعثر على فنيين موثوقين في الكمبوند. مجاني وبدون تسجيل.',
        scanHint: 'امسح الرمز بكاميرا iPhone',
        // The words on Apple's Arabic badge, so what is read out matches what is seen.
        linkLabel: 'حمّل تطبيق جولد: تنزيل من App Store'
      },
      // The \u200E (an invisible left-to-right mark) after each "Inc." keeps its full
      // stop with the English name; without it the Arabic line pulls the stop to
      // the wrong side.
      appleCredit:
        'Apple وشعار Apple علامتان تجاريتان لشركة Apple Inc.\u200E، مسجّلتان في الولايات المتحدة ودول أخرى. App Store علامة خدمة لشركة Apple Inc.\u200E',
      // \u200E before each number: right after Arabic letters, browsers read the
      // dash-separated tax card number as Arabic numerals and flip its groups.
      registration: 'سجل تجاري رقم \u200E33859 · بطاقة ضريبية رقم \u200E764-027-395'
    },
    rentalRequestPage: {
      eyebrow: 'مكتب الإيجارات / شركاء GOLD',
      title: 'إرسال طلب إيجار',
      intro: 'أخبرنا بما يحتاجه عميلك وسنقوم بمطابقته مع العروض الإيجارية النشطة والتواصل معك بالخيارات المتاحة.',
      brokerSectionTitle: 'بياناتك',
      requestSectionTitle: 'ماذا يحتاج عميلك',
      name: 'الاسم الكامل',
      company: 'الشركة (اختياري)',
      phone: 'رقم الهاتف',
      whatsapp: 'واتساب (اختياري)',
      email: 'البريد الإلكتروني',
      propertyTypeLabel: 'نوع العقار',
      locationLabel: 'الموقع',
      budgetMinLabel: 'أقل ميزانية (جنيه)',
      budgetMaxLabel: 'أعلى ميزانية (جنيه)',
      bedroomsLabel: 'غرف النوم (كحد أدنى)',
      furnishedLabel: 'مفروش',
      furnishedAny: 'لا يهم',
      furnishedYes: 'مفروش',
      furnishedNo: 'غير مفروش',
      moveInDateLabel: 'تاريخ الانتقال',
      rentalPeriodLabel: 'مدة الإيجار',
      rentalPeriodAny: 'أي مدة',
      notesLabel: 'ملاحظات (اختياري)',
      submit: 'إرسال طلب الإيجار',
      submitting: 'جار الإرسال...',
      successTitle: 'تم استلام الطلب',
      successBody: 'تم إرسال طلب الإيجار الخاص بك. سيقوم فريق GOLD بمطابقته مع العروض النشطة والتواصل معك.',
      referenceLabel: 'رقم مرجع طلبك',
      submitAnother: 'إرسال طلب آخر',
      errors: {
        name: 'من فضلك أدخل الاسم الكامل.',
        phone: 'من فضلك أدخل رقم هاتف صحيح.',
        propertyType: 'من فضلك اختر نوع العقار.',
        location: 'من فضلك اختر الموقع.',
        email: 'أدخل بريدك الإلكتروني لتصلك رسالة التأكيد والاتفاقية.',
        generic: 'تعذر إرسال طلبك الآن. حاول مرة أخرى لاحقاً.'
      }
    },
    listPropertyPage: {
      eyebrow: 'مكتب الإيجارات / للملاك',
      title: 'أضف عقارك للإيجار',
      intro: 'أضف عقارك إلى مكتب الإيجارات لدينا وسيراجعه فريقنا، ثم يطابقه مع وسطاء يبحثون عن نفس المواصفات بالضبط.',
      ownerSectionTitle: 'بياناتك',
      listingSectionTitle: 'تفاصيل العقار',
      name: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      whatsapp: 'واتساب (اختياري)',
      email: 'البريد الإلكتروني',
      propertyTypeLabel: 'نوع العقار',
      locationLabel: 'الموقع',
      priceLabel: 'الإيجار الشهري (جنيه)',
      bedroomsLabel: 'غرف النوم',
      furnishedLabel: 'مفروش',
      furnishedYes: 'مفروش',
      furnishedNo: 'غير مفروش',
      availableFromLabel: 'متاح اعتباراً من',
      photosLabel: 'الصور',
      photosHint: 'ارفع صورة واحدة على الأقل للعقار.',
      submit: 'إرسال العرض',
      submitting: 'جار الإرسال...',
      successTitle: 'تم إرسال العرض',
      successBody: 'تم إرسال عقارك للمراجعة. سيقوم فريقنا بمراجعته والبدء في مطابقته مع طلبات الوسطاء.',
      submitAnother: 'إضافة عقار آخر',
      errors: {
        name: 'من فضلك أدخل الاسم الكامل.',
        phone: 'من فضلك أدخل رقم هاتف صحيح.',
        propertyType: 'من فضلك اختر نوع العقار.',
        location: 'من فضلك اختر الموقع.',
        price: 'من فضلك أدخل إيجاراً شهرياً صحيحاً.',
        photos: 'من فضلك ارفع صورة واحدة على الأقل.',
        email: 'أدخل بريدك الإلكتروني لتصلك رسالة التأكيد والاتفاقية.',
        generic: 'تعذر إرسال عرضك الآن. حاول مرة أخرى لاحقاً.'
      }
    },
    ndaPage: {
      eyebrow: 'خطوة أخيرة',
      title: 'وقّع اتفاقية السرية',
      intro:
        'تطلب جولد من كل عميل ووسيط ومالك الحفاظ على سرية تفاصيل الوحدات والعملاء التي نشاركها. اقرأ الاتفاقية، ثم وقّعها على الشاشة أو ارفع نسخة موقّعة.',
      receivedRequest: 'طلبك {reference} لدى فريقنا الآن.',
      receivedListing: 'عقارك لدى فريقنا للمراجعة.',
      detailsTitle: 'بياناتك',
      nameLabel: 'الاسم',
      companyLabel: 'الشركة',
      phoneLabel: 'رقم التواصل',
      emailLabel: 'البريد الإلكتروني',
      agreementTitle: 'الاتفاقية',
      agreementLanguageNote: 'نص الاتفاقية باللغة الإنجليزية.',
      download: 'حمّل ملف PDF',
      signTitle: 'التوقيع',
      drawTab: 'وقّع على الشاشة',
      uploadTab: 'ارفع نسخة موقّعة',
      drawHint: 'وقّع داخل المربع بإصبعك أو بالماوس.',
      clear: 'مسح',
      uploadHint: 'حمّل ملف PDF ووقّعه، ثم ارفع صورة أو ملف PDF للنسخة الموقّعة.',
      chooseFile: 'اختر صورة أو ملف PDF',
      replaceFile: 'اختر ملفاً آخر',
      agreeLabel: 'قرأت هذه الاتفاقية وأوافق عليها.',
      submit: 'وقّع وأرسل',
      submitting: 'جارٍ الإرسال...',
      errorDraw: 'وقّع داخل المربع أولاً.',
      errorFile: 'اختر النسخة الموقّعة أولاً.',
      errorFileType: 'استخدم صورة (JPEG أو PNG أو WebP) أو ملف PDF، أقل من 10 ميجابايت.',
      errorAgree: 'ضع علامة في المربع للموافقة على الاتفاقية.',
      errorGeneric: 'تعذّر الإرسال. حاول مرة أخرى.',
      doneTitle: 'شكراً لك. تم توقيع الاتفاقية.',
      doneBody: 'وصلت الاتفاقية الموقّعة إلى جولد. سنتواصل معك على واتساب.',
      signedTitle: 'هذه الاتفاقية موقّعة بالفعل.',
      signedBody: 'تم التوقيع في {date}. لا داعي لأي شيء آخر.',
      invalidTitle: 'هذا الرابط غير صالح.',
      invalidBody: 'قد يكون ناقصاً. تواصل مع جولد على واتساب وسنرسل لك رابط توقيع جديداً.',
      backHome: 'العودة إلى جولد'
    },
    unlockPage: {
      metaTitle: 'دليل الكمبوند من جولد',
      metaDescription:
        'الكود الذي أرسلته لك جولد يفتح دليل الكمبوند: المحلات القريبة، والسباك والكهربائي وباقي من نتعامل معهم فعلاً، بأرقامهم.',
      otherLanguage: 'English',
      eyebrow: 'دليل الكمبوند',
      title: 'كمبوندك مفتوح لك.',
      intro:
        'هذا الكود يفتح لك دليل الكمبوند — المحلات القريبة، ومعها السباك والكهربائي وفني التكييف وباقي من نتعامل معهم فعلاً، بأرقامهم.',
      codeLabel: 'الكود الخاص بك',
      incompleteTitle: 'هذا الرابط غير مكتمل.',
      incompleteIntro:
        'الكود الذي يجب أن يكون في نهاية الرابط ناقص أو غير موجود. اطلب الكود من جولد وسنرسله لك على واتساب.',
      getTheApp: 'حمّل تطبيق جولد',
      getTheAppHint: 'مجانًا على App Store، للآيفون.',
      askUs: 'تواصل مع جولد على واتساب',
      askUsHint: 'التطبيق على وشك الإطلاق. راسلنا وسنرسل لك القائمة حتى ذلك الحين.',
      askUsHintWithApp: 'على أندرويد، أو لا يمكنك تثبيت التطبيق؟ راسلنا وسنرسل لك القائمة.',
      haveAppLead: 'لديك التطبيق بالفعل؟',
      openInApp: 'افتحه',
      openInAppHint: 'إذا لم يفتح، فالتطبيق غير مثبت على هذا الهاتف بعد.',
      manualTitle: 'أو أدخل الكود يدويًا',
      manualBody: 'افتح تطبيق جولد، واضغط «الدليل»، ثم «أدخل الكود»، واكتب الكود الموضح أعلاه.',
      manualTitleNoCode: 'عندما يصلك الكود',
      manualBodyNoCode:
        'افتح تطبيق جولد، واضغط «الدليل»، ثم «أدخل الكود»، واكتبه. شكله GOLD-XX-XXXX.',
      whatsappMessage: 'مرحباً، معي كود جولد لدليل الكمبوند: {code}',
      whatsappMessageNoCode:
        'مرحباً، رابط جولد الذي وصلني لا يحتوي على كود. هل يمكنكم إرسال الكود الخاص بي لدليل الكمبوند؟'
    }
  }
};

export function getSiteCopy(locale: Locale): SiteCopy {
  return siteCopy[locale];
}
