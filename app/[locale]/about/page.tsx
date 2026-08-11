import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { PartnersMarquee } from '@/components/partners-marquee';
import {
  StorySection,
  MissionVisionSection,
  WhatWeDoAndWhyChooseUsSection,
  AchievementsSection,
  RentalAndGoldLifeSection,
  SubbrandStrip
} from '@/components/about-sections';
import { SurfaceShell } from '@/components/section-ui';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.about.title} — ${copy.seo.title}`,
    description: copy.about.story.body.slice(0, 160)
  };
}

export default function AboutPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const isRtl = locale === 'ar';

  return (
    <PageShell locale={locale} copy={copy}>
      <StorySection copy={copy.about} isRtl={isRtl} />
      <MissionVisionSection copy={copy.about} isRtl={isRtl} />
      <WhatWeDoAndWhyChooseUsSection copy={copy.about} isRtl={isRtl} />
      <AchievementsSection copy={copy.about} isRtl={isRtl} />
      <SurfaceShell variant="light" className="py-16">
        <PartnersMarquee
          eyebrow={copy.about.partners.eyebrow}
          title={copy.about.partners.title}
          isRtl={isRtl}
          variant="light"
        />
      </SurfaceShell>
      <RentalAndGoldLifeSection copy={copy.about} isRtl={isRtl} />
      <SubbrandStrip copy={copy.about.subbrands} isRtl={isRtl} />
    </PageShell>
  );
}
