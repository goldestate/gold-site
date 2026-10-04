import Image from 'next/image';
import type { SiteCopy } from '@/lib/site-content';
import { Link } from '@/i18n/navigation';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, LineIcon } from './section-ui';

const SUBBRAND_HREFS: Record<'estate' | 'life' | 'management' | 'export', string> = {
  estate: '/properties',
  life: '/gold-life',
  management: '/gold-management',
  export: '/gold-export'
};

// Alignment and order follow the page's direction, so nothing below mirrors by hand.

export function StorySection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="light" className="px-4 pb-20 pt-32 sm:px-6 sm:pt-40 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="light" />
          <div className="mt-10 max-w-2xl border-t border-[rgba(35,31,32,0.12)] pt-8">
            <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">{copy.story.eyebrow}</div>
            <p className="mt-5 font-serif text-2xl leading-snug text-[#231F20] sm:text-3xl">{copy.story.quote}</p>
            <p className="mt-6 text-base leading-8 text-[rgba(35,31,32,0.82)]">{copy.story.body}</p>
          </div>
        </div>

        {/* One of GOLD's own homes: Swan Lake, Gouna. */}
        <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_30px_60px_-30px_rgba(35,31,32,0.55)]">
          <Image
            src="/hero/swan-lake-gouna.jpg"
            alt={isRtl ? 'سوان ليك في الجونة، والمباني تنعكس على البحيرة' : 'Swan Lake in Gouna, its buildings reflected in the lagoon'}
            width={931}
            height={900}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="h-[24rem] w-full object-cover object-center sm:h-[30rem]"
          />
        </div>
      </div>
    </SurfaceShell>
  );
}

export function MissionVisionSection({ copy }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="dark" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
        <div className="rounded-[1.25rem] bg-white/[0.035] p-8 ring-1 ring-white/10 sm:p-10">
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {copy.missionVision.missionLabel}
          </div>
          <p className="mt-4 text-base leading-8 text-white/[0.78]">{copy.missionVision.mission}</p>
        </div>
        <div className="rounded-[1.25rem] bg-white/[0.035] p-8 ring-1 ring-white/10 sm:p-10">
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {copy.missionVision.visionLabel}
          </div>
          <p className="mt-4 text-base leading-8 text-white/[0.78]">{copy.missionVision.vision}</p>
        </div>
      </div>
    </SurfaceShell>
  );
}

export function WhatWeDoAndWhyChooseUsSection({ copy }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="light" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">{copy.whatWeDo.eyebrow}</div>
          <h3 className="mt-3 text-2xl font-medium text-[#231F20]">{copy.whatWeDo.title}</h3>
          <p className="mt-4 text-base leading-8 text-[rgba(35,31,32,0.82)]">{copy.whatWeDo.body}</p>
        </div>
        <div>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">{copy.whyChooseUs.eyebrow}</div>
          <h3 className="mt-3 text-2xl font-medium text-[#231F20]">{copy.whyChooseUs.title}</h3>
          <ul className="mt-6 divide-y divide-[rgba(35,31,32,0.1)] border-y border-[rgba(35,31,32,0.1)]">
            {copy.whyChooseUs.items.map((item) => (
              <li key={item} className="flex items-center gap-3 py-3.5 text-sm leading-6 text-[rgba(35,31,32,0.82)]">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#8B6508]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SurfaceShell>
  );
}

export function AchievementsSection({ copy }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="spotlight" className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <GMark tone="gold" size={480} className="-end-20 -top-20 opacity-[0.05]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {copy.achievements.eyebrow}
          </div>
          <div className="gold-gradient-text mt-3 text-5xl font-medium tracking-[0.04em]">{copy.achievements.stat}</div>
          <div className="mt-2 text-sm uppercase tracking-[0.24em] text-white/60">{copy.achievements.statLabel}</div>
        </div>
        <p className="max-w-2xl text-base leading-8 text-white/[0.76]">{copy.achievements.body}</p>
      </div>
    </SurfaceShell>
  );
}

export function RentalAndGoldLifeSection({ copy }: { copy: SiteCopy['about']; isRtl: boolean }) {
  const card =
    'flex flex-col rounded-[1.25rem] bg-[#FBFAF6] p-8 shadow-[0_24px_50px_-30px_rgba(35,31,32,0.45)] ring-1 ring-[rgba(35,31,32,0.07)] sm:p-10';

  return (
    <SurfaceShell variant="light" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className={card}>
          <LineIcon icon="key" className="h-10 w-10" gold />
          <div className="mt-5 font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
            {copy.rentalProgram.eyebrow}
          </div>
          <h3 className="mt-3 text-xl font-medium text-[#231F20]">{copy.rentalProgram.title}</h3>
          <p className="mt-4 text-sm leading-7 text-[rgba(35,31,32,0.78)]">{copy.rentalProgram.body}</p>
        </div>

        <div className={card}>
          <LineIcon icon="life" className="h-10 w-10" gold />
          <div className="mt-5 font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
            {copy.goldLife.eyebrow}
          </div>
          <h3 className="mt-3 text-xl font-medium text-[#231F20]">{copy.goldLife.title}</h3>
          <p className="mt-4 text-sm leading-7 text-[rgba(35,31,32,0.78)]">{copy.goldLife.body}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {copy.goldLife.services.map((service) => (
              <span
                key={service}
                className="rounded-full border border-[rgba(184,134,11,0.3)] px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[#B8860B]"
              >
                {service}
              </span>
            ))}
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#58595B]">
            {copy.goldLife.partnersLabel}: {copy.goldLife.partners.join(' · ')}
          </p>
        </div>
      </div>
    </SurfaceShell>
  );
}

export function SubbrandStrip({
  copy,
  locale
}: {
  copy: SiteCopy['about']['subbrands'];
  isRtl: boolean;
  locale: 'en' | 'ar';
}) {
  return (
    <section id="subbrands" className="relative overflow-hidden bg-[#171314] px-4 py-24 sm:px-6 lg:px-8">
      <GMark tone="gold" size={520} className="-end-24 -top-24 opacity-[0.05]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="font-serif text-xs uppercase tracking-[0.42em] text-[rgba(217,179,85,0.88)]">{copy.eyebrow}</div>
        <h2 className="mt-4 text-3xl font-medium uppercase tracking-[0.16em] text-white sm:text-4xl">{copy.title}</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {copy.items.map((item) => (
            <Link
              key={item.name}
              href={SUBBRAND_HREFS[item.icon]}
              locale={locale}
              className="group flex flex-col rounded-[1.25rem] bg-white/[0.035] p-7 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/[0.055] hover:ring-[rgba(217,179,85,0.4)]"
            >
              <LineIcon icon={item.icon} gold className="h-11 w-11 transition group-hover:scale-105" />
              <div className="mt-6 text-base font-semibold tracking-[0.1em] text-white">{item.name}</div>
              <p className="mt-3 text-sm leading-6 text-white/[0.58]">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
