'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function Chevron({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 flex-none transition-transform duration-200 ${open ? 'rotate-180' : ''} ${className}`}
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

/**
 * A Rental Desk section that folds away to its title, so one long list doesn't
 * push the rest of the page out of reach. Each section remembers, on this
 * device, whether it was left open or closed.
 */
export function CollapsibleSection({
  id,
  title,
  count,
  badge,
  children
}: {
  id: string;
  title: string;
  count: number;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const storageKey = `gold-admin:${id}:open`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) setOpen(saved === '1');
    } catch {
      // Private browsing: every section simply starts open.
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey, next ? '1' : '0');
    } catch {
      // Not remembered, but the section still opens and closes.
    }
  };

  return (
    <section className="mt-10">
      <h2>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={`${id}-content`}
          className="flex min-h-[48px] w-full flex-wrap items-center gap-3 rounded-[1rem] text-left"
        >
          <span className="text-lg font-medium uppercase tracking-[0.14em] text-white">{title}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">{count}</span>
          {badge}
          <span className="ml-auto flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
            {open ? 'Hide' : 'Show'}
            <Chevron open={open} />
          </span>
        </button>
      </h2>
      <div id={`${id}-content`} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

/** Shows the first few items of a long list, with a button to show the rest. */
export function useShowMore<T>(items: T[], initial: number) {
  const [all, setAll] = useState(false);
  const visible = all ? items : items.slice(0, initial);
  const hidden = items.length - visible.length;
  return { visible, hidden, all, toggle: () => setAll((current) => !current), canToggle: items.length > initial };
}

export function ShowMoreButton({
  hidden,
  all,
  onClick,
  noun
}: {
  hidden: number;
  all: boolean;
  onClick: () => void;
  noun: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/30 hover:text-white"
    >
      {all ? `Show fewer ${noun}` : `Show ${hidden} more ${noun}`}
      <Chevron open={all} className="h-4 w-4" />
    </button>
  );
}
