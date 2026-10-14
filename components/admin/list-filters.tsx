'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The filter bar the admin's long lists share: a search box, a row of chips
 * for the one choice staff make most (type or status, each with its count),
 * dropdowns for the rest, and a line saying how many are showing with a way
 * to clear it all. Built for a phone first: everything wraps or scrolls
 * sideways rather than squeezing.
 */

export type FilterOption = { value: string; label: string; count?: number };

export const ALL = '';

export function FilterSearch({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
      >
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m13 13 4 4" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        className="h-11 w-full rounded-full border border-white/15 bg-white/5 pl-10 pr-10 text-base text-white outline-none transition placeholder:text-white/35 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] sm:text-sm"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition hover:text-white"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      ) : null}
    </label>
  );
}

/** One choice made by tapping: "All" first, then each option with how many it holds. */
export function FilterChips({
  options,
  value,
  onChange,
  label
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const total = options.reduce((sum, option) => sum + (option.count ?? 0), 0);
  const all: FilterOption = { value: ALL, label: 'All', count: total };
  const rowRef = useRef<HTMLDivElement>(null);

  // Coming back to a remembered filter, its chip may sit past the edge of a
  // phone screen; slide the row so it shows. Only the row moves, never the page.
  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    const left = chip.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + chip.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollLeft = left - 16;
    }
  }, [value]);

  return (
    <div ref={rowRef} role="group" aria-label={label} className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2">
        {[all, ...visibleOptions(options, value)].map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value || 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                active
                  ? 'bg-[#D9B355] text-[#171314]'
                  : 'border border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
              }`}
            >
              {option.label}
              {option.count !== undefined ? (
                <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-black/15' : 'bg-white/10 text-white/55'}`}>
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A dropdown for a less common choice. Its first entry means "any". */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  anyLabel = 'Any'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  anyLabel?: string;
}) {
  return (
    <SelectShell label={label} value={value} onChange={onChange} active={Boolean(value)}>
      <option value={ALL} className="bg-[#231F20] text-white">
        {anyLabel}
      </option>
      {visibleOptions(options, value).map((option) => (
        <option key={option.value} value={option.value} className="bg-[#231F20] text-white">
          {/* The chosen one drops its count so the closed box has room for the name on a phone. */}
          {option.count !== undefined && option.value !== value ? `${option.label} (${option.count})` : option.label}
        </option>
      ))}
    </SelectShell>
  );
}

/** The order the list is in. Always set, so it never lights up like a filter does. */
export function SortSelect({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <SelectShell label="Sort" value={value} onChange={onChange} active={false}>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#231F20] text-white">
          {option.label}
        </option>
      ))}
    </SelectShell>
  );
}

function SelectShell({
  label,
  value,
  onChange,
  active,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none truncate rounded-full border bg-white/5 pl-4 pr-9 text-base outline-none transition focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] sm:text-sm ${
            active ? 'border-[rgba(217,179,85,0.6)] text-[#D9B355]' : 'border-white/15 text-white/80'
          }`}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </span>
    </label>
  );
}

/** "Showing 12 of 99", and a way back to everything when anything is narrowing the list. */
export function FilterSummary({
  shown,
  total,
  noun,
  filtering,
  onClear
}: {
  shown: number;
  total: number;
  noun: string;
  filtering: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[32px] flex-wrap items-center justify-between gap-2 text-xs text-white/50" aria-live="polite">
      <span>{filtering ? `Showing ${shown} of ${total} ${noun}` : `${total} ${noun}`}</span>
      {filtering ? (
        <button
          type="button"
          onClick={onClear}
          className="min-h-[32px] rounded-full px-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#D9B355] transition hover:text-white"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

/** Counts per value, in the order the options were given. */
export function countOptions<T>(
  items: T[],
  options: { value: string; label: string }[],
  valueOf: (item: T) => string
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = valueOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return options.map((option) => ({ ...option, count: counts.get(option.value) ?? 0 }));
}

/**
 * Empty choices are left out, except the one in use: approve the last listing
 * under "Pending review" and that chip stays lit at 0 rather than vanishing
 * with the list still narrowed to it.
 */
function visibleOptions(options: FilterOption[], value: string): FilterOption[] {
  return options.filter((option) => option.count === undefined || option.count > 0 || option.value === value);
}

/** True when every word of the search appears somewhere in the given text. */
export function matchesSearch(search: string, text: string): boolean {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = text.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/**
 * State that survives leaving the page and coming back in the same tab: staff
 * filter the list, open an item, save it, and land back on the list they had.
 * Read after the first render, so the server and the browser agree on the first one.
 */
export function useStoredState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(key);
      if (saved !== null) setValue(JSON.parse(saved) as T);
    } catch {
      // Private browsing or a bad value: start from the default.
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Not remembered, but the filter still works.
    }
  }, [key, loaded, value]);

  return [value, setValue];
}
