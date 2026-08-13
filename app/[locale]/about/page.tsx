import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import {
  StorySection,
  MissionVisionSection,
  WhatWeDoAndWhyChooseUsSection,
  AchievementsSection,
  RentalAndGoldLifeSection,
  SubbrandStrip
} from '@/components/about-sections';

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
      <SubbrandStrip copy={copy.about.subbrands} isRtl={isRtl} />
      <WhatWeDoAndWhyChooseUsSection copy={copy.about} isRtl={isRtl} />
      <AchievementsSection copy={copy.about} isRtl={isRtl} />
      <RentalAndGoldLifeSection copy={copy.about} isRtl={isRtl} />
    </PageShell>
  );
}
