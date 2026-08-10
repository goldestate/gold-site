import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import {
  AboutSection,
  ContactSection,
  HeroSection,
  PropertiesSection,
  SubbrandStrip,
  USPSection
} from './sections';
import type { SiteCopy } from '@/lib/site-content';
import type { Property } from '@/lib/properties-store';

type LandingPageProps = {
  locale: 'en' | 'ar';
  copy: SiteCopy;
  properties: Property[];
};

export function LandingPage({ locale, copy, properties }: LandingPageProps) {
  const isRtl = locale === 'ar';

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#231F20] text-white ${isRtl ? 'font-arabic' : ''}`}
    >
      <SiteHeader copy={copy} locale={locale} isRtl={isRtl} />
      <main>
        <HeroSection copy={copy.hero} isRtl={isRtl} />
        <AboutSection copy={copy.about} isRtl={isRtl} />
        <USPSection copy={copy.usps} isRtl={isRtl} />
        <PropertiesSection copy={copy.properties} properties={properties} locale={locale} isRtl={isRtl} />
        <SubbrandStrip copy={copy.subbrands} isRtl={isRtl} />
        <ContactSection copy={copy.contact} isRtl={isRtl} />
      </main>
      <SiteFooter copy={copy} locale={locale} />
    </div>
  );
}
