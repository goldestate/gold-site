'use client';

import { useRef, useState, type ReactNode } from 'react';

export function PropertyGallery({
  images,
  alt,
  mono = false,
  badge
}: {
  images: string[];
  alt: string;
  mono?: boolean;
  badge?: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  };

  if (images.length === 0) {
    return <div className="h-[26rem] w-full bg-[rgba(35,31,32,0.06)]" />;
  }

  return (
    <div className="relative" dir="ltr">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex h-[26rem] snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + index}
            src={src}
            alt={`${alt} ${index + 1}`}
            className={`h-full w-full flex-none snap-center object-cover object-center ${
              mono ? 'grayscale contrast-110' : ''
            }`}
          />
        ))}
      </div>

      {badge}

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(active - 1, 0))}
            aria-label="Previous photo"
            disabled={active === 0}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(active + 1, images.length - 1))}
            aria-label="Next photo"
            disabled={active === images.length - 1}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>

          <div className="absolute right-4 top-4 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {active + 1}/{images.length}
          </div>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to photo ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
