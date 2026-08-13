import { SectionTitle } from './section-ui';

const PARTNER_LOGOS = [
  { slug: 'sodic', name: 'SODIC', height: 34 },
  { slug: 'hyde-park', name: 'Hyde Park Development', height: 40 },
  { slug: 'ora', name: 'ORA', height: 38 },
  { slug: 'lavista', name: 'LaVista Developments', height: 32 },
  { slug: 'misr-italia', name: 'Misr Italia Properties', height: 34 },
  { slug: 'emaar', name: 'EMAAR', height: 36 },
  { slug: 'hassan-allam', name: 'Hassan Allam Properties', height: 40 },
  { slug: 'mountain-view', name: 'Mountain View', height: 62 }
];

export function PartnersMarquee({
  eyebrow,
  title,
  isRtl,
  variant = 'dark'
}: {
  eyebrow: string;
  title: string;
  isRtl: boolean;
  variant?: 'dark' | 'light';
}) {
  const isLight = variant === 'light';
  const tint = isLight ? 'gold' : 'white';
  const edgeColor = isLight ? '#e2e1d4' : '#1b1819';

  const track = (keySuffix: string) => (
    <div className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={keySuffix === 'b'}>
      {PARTNER_LOGOS.map((logo) =>
        isLight ? (
          <div
            key={`${logo.slug}-${keySuffix}`}
            className="flex flex-none items-center justify-center rounded-xl bg-white px-6 py-4 shadow-[0_8px_24px_rgba(35,31,32,0.08)] transition duration-300 hover:shadow-[0_10px_28px_rgba(35,31,32,0.14)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/partners/${logo.slug}-${tint}.png`}
              alt={keySuffix === 'a' ? logo.name : ''}
              style={{ height: logo.height * 0.72 }}
              className="w-auto"
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${logo.slug}-${keySuffix}`}
            src={`/partners/${logo.slug}-${tint}.png`}
            alt={keySuffix === 'a' ? logo.name : ''}
            style={{ height: logo.height }}
            className="w-auto flex-none opacity-80 transition duration-300 hover:opacity-100"
          />
        )
      )}
    </div>
  );

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={eyebrow} title={title} isRtl={isRtl} tone={isLight ? 'light' : 'dark'} />
      </div>
      <div className="relative mt-10 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32"
          style={{ background: `linear-gradient(90deg, ${edgeColor}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32"
          style={{ background: `linear-gradient(270deg, ${edgeColor}, transparent)` }}
        />
        <div className="marquee-track flex w-max" dir={isRtl ? 'rtl' : 'ltr'}>
          {track('a')}
          {track('b')}
        </div>
      </div>
    </div>
  );
}
