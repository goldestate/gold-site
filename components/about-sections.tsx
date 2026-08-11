import Image from 'next/image';
import type { SiteCopy } from '@/lib/site-content';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, LineIcon } from './section-ui';

export function StorySection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="light" className="px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className={isRtl ? 'text-right' : ''}>
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="light" />
          <div className="mt-8 max-w-2xl">
            <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
              {copy.story.eyebrow}
            </div>
            <p className="mt-4 text-base leading-8 text-[rgba(35,31,32,0.82)]">{copy.story.body}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-black/10">
          <Image
            src="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80"
            alt="Modern architecture detail"
            width={1000}
            height={1200}
            className="h-[26rem] w-full object-cover object-center"
          />
        </div>
      </div>
    </SurfaceShell>
  );
}

export function MissionVisionSection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="dark" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-7">
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {copy.missionVision.missionLabel}
          </div>
          <p className={`mt-4 text-base leading-8 text-white/78 ${isRtl ? 'text-right' : ''}`}>
            {copy.missionVision.mission}
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-7">
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {copy.missionVision.visionLabel}
          </div>
          <p className={`mt-4 text-base leading-8 text-white/78 ${isRtl ? 'text-right' : ''}`}>
            {copy.missionVision.vision}
          </p>
        </div>
      </div>
    </SurfaceShell>
  );
}

export function WhatWeDoAndWhyChooseUsSection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="light" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        <div className={isRtl ? 'text-right' : ''}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
            {copy.whatWeDo.eyebrow}
          </div>
          <h3 className="mt-3 text-2xl font-medium text-[#231F20]">{copy.whatWeDo.title}</h3>
          <p className="mt-4 text-base leading-8 text-[rgba(35,31,32,0.82)]">{copy.whatWeDo.body}</p>
        </div>
        <div className={isRtl ? 'text-right' : ''}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
            {copy.whyChooseUs.eyebrow}
          </div>
          <h3 className="mt-3 text-2xl font-medium text-[#231F20]">{copy.whyChooseUs.title}</h3>
          <ul className="mt-5 space-y-3">
            {copy.whyChooseUs.items.map((item) => (
              <li
                key={item}
                className={`flex items-start gap-3 text-sm leading-6 text-[rgba(35,31,32,0.82)] ${
                  isRtl ? 'flex-row-reverse text-right' : ''
                }`}
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[#B8860B]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SurfaceShell>
  );
}

export function AchievementsSection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="spotlight" className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <GMark tone="gold" size={480} className={`-top-20 opacity-[0.05] ${isRtl ? '-left-20' : '-right-20'}`} />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div className={isRtl ? 'text-right' : ''}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {copy.achievements.eyebrow}
          </div>
          <div className="gold-gradient-text mt-3 text-5xl font-medium tracking-[0.04em]">
            {copy.achievements.stat}
          </div>
          <div className="mt-2 text-sm uppercase tracking-[0.24em] text-white/60">
            {copy.achievements.statLabel}
          </div>
        </div>
        <p className={`text-base leading-8 text-white/76 ${isRtl ? 'text-right' : ''}`}>
          {copy.achievements.body}
        </p>
      </div>
    </SurfaceShell>
  );
}

export function RentalAndGoldLifeSection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="light" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className={`rounded-[1.6rem] border border-[rgba(35,31,32,0.1)] bg-white p-7 shadow-[0_18px_50px_rgba(35,31,32,0.08)] ${isRtl ? 'text-right' : ''}`}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
            {copy.rentalProgram.eyebrow}
          </div>
          <h3 className="mt-3 text-xl font-medium text-[#231F20]">{copy.rentalProgram.title}</h3>
          <p className="mt-4 text-sm leading-7 text-[rgba(35,31,32,0.78)]">{copy.rentalProgram.body}</p>
        </div>

        <div className={`rounded-[1.6rem] border border-[rgba(35,31,32,0.1)] bg-white p-7 shadow-[0_18px_50px_rgba(35,31,32,0.08)] ${isRtl ? 'text-right' : ''}`}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
            {copy.goldLife.eyebrow}
          </div>
          <h3 className="mt-3 text-xl font-medium text-[#231F20]">{copy.goldLife.title}</h3>
          <p className="mt-4 text-sm leading-7 text-[rgba(35,31,32,0.78)]">{copy.goldLife.body}</p>
          <div className={`mt-5 flex flex-wrap gap-2 ${isRtl ? 'justify-end' : ''}`}>
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

export function SubbrandStrip({ copy, isRtl }: { copy: SiteCopy['about']['subbrands']; isRtl: boolean }) {
  return (
    <section id="subbrands" className="relative overflow-hidden border-y border-white/10 bg-[#1a1718] px-4 py-12 sm:px-6 lg:px-8">
      <GMark tone="gold" size={420} className={`-top-16 opacity-[0.05] ${isRtl ? '-left-16' : '-right-16'}`} />
      <div className="relative mx-auto max-w-7xl">
        <div className={isRtl ? 'text-right' : ''}>
          <div className="font-serif text-xs uppercase tracking-[0.42em] text-[rgba(217,179,85,0.88)]">
            {copy.eyebrow}
          </div>
          <h2 className="mt-4 text-2xl font-medium uppercase tracking-[0.18em] text-white">
            {copy.title}
          </h2>
        </div>
        <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 xl:grid-cols-4">
          {copy.items.map((item) => (
            <div key={item.name}>
              <LineIcon icon={item.icon} gold className="h-9 w-9" />
              <div className="mt-4 text-sm font-semibold tracking-[0.18em] text-white">{item.name}</div>
              <p className="mt-2 text-xs leading-6 text-white/58">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
