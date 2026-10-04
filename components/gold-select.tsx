'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

export type GoldSelectOption = { value: string; label: string };

type Placement = { top: number; left: number; width: number; maxHeight: number; above: boolean };

const PANEL_MAX_HEIGHT = 288;
const GAP = 8;

/**
 * A dropdown the page draws itself, in place of the browser's <select>.
 *
 * A native select hands its list to the operating system, which draws the options
 * in its own colours. With the site's white text that came out as white on a
 * white sheet on most desktops (the options looked empty), and as a spinning
 * wheel at the bottom of the screen on a phone. This keeps the list in GOLD's
 * colours on every device, opens it right under the field, and still works from
 * the keyboard the way a select does: arrows, Home/End, Enter, Escape, and typing
 * the first letters of an option.
 *
 * The list is rendered into <body> and positioned against the field, so a section
 * with overflow: hidden (the home hero) can't cut it off.
 */
export function GoldSelect({
  value,
  onChange,
  options,
  label,
  tone = 'dark',
  isRtl = false,
  className = '',
  triggerClassName,
  placeholder,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  options: GoldSelectOption[];
  /** Read by screen readers; the visible label, if any, sits outside. */
  label: string;
  /** 'dark' for the black pages and forms, 'light' for the white filter panel. */
  tone?: 'dark' | 'light';
  isRtl?: boolean;
  /** Classes for the wrapper. */
  className?: string;
  /** The field's own look. Layout (flex, chevron spacing) is added here. */
  triggerClassName: string;
  /** Shown, muted, while the value matches no option -- an optional field not yet filled. */
  placeholder?: string;
  id?: string;
}) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const matched = options.findIndex((option) => option.value === value);
  // With nothing chosen yet, the list opens at its top.
  const selectedIndex = Math.max(matched, 0);
  const selected = matched >= 0 ? options[matched] : null;

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - GAP;
    const aboveSpace = rect.top - GAP;
    // Below unless it would be cramped there and roomier above.
    const above = below < Math.min(PANEL_MAX_HEIGHT, 200) && aboveSpace > below;
    const maxHeight = Math.max(Math.min(PANEL_MAX_HEIGHT, (above ? aboveSpace : below) - GAP), 120);
    setPlacement({
      top: above ? rect.top - GAP : rect.bottom + GAP,
      left: rect.left,
      width: rect.width,
      maxHeight,
      above
    });
  }, []);

  const openList = () => {
    setActive(selectedIndex);
    place();
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close(true);
  };

  // Follow the field while the page scrolls or resizes, and close on a tap
  // anywhere else -- the way a native select behaves.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || listRef.current?.contains(target)) return;
      close(false);
    };
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, place]);

  // Keep the highlighted option in view while arrowing through a long list.
  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const findByTyping = (key: string): number => {
    const now = Date.now();
    typed.current = {
      text: now - typed.current.at > 700 ? key : typed.current.text + key,
      at: now
    };
    const query = typed.current.text.toLocaleLowerCase();
    const start = open ? active : selectedIndex;
    for (let step = 1; step <= options.length; step += 1) {
      const index = (start + step) % options.length;
      if (options[index].label.toLocaleLowerCase().startsWith(query)) return index;
    }
    return -1;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActive((index) => Math.min(index + 1, last));
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else setActive((index) => Math.max(index - 1, 0));
        return;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        return;
      case 'End':
        if (open) {
          event.preventDefault();
          setActive(last);
        }
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(active);
        else openList();
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          close(true);
        }
        return;
      case 'Tab':
        if (open) close(false);
        return;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const index = findByTyping(event.key);
          if (index < 0) return;
          // Like a native select: typing moves the highlight when open, and
          // changes the value straight away when closed.
          if (open) setActive(index);
          else onChange(options[index].value);
        }
    }
  };

  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const dark = tone === 'dark';

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-label={label}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`flex items-center justify-between gap-3 text-start ${triggerClassName}`}
      >
        <span className={`min-w-0 truncate ${selected ? '' : 'opacity-45'}`}>{selected ? selected.label : placeholder}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 flex-none opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {mounted && open && placement
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{
                position: 'fixed',
                left: placement.left,
                width: placement.width,
                maxHeight: placement.maxHeight,
                ...(placement.above
                  ? { bottom: window.innerHeight - placement.top }
                  : { top: placement.top })
              }}
              className={`z-[80] min-w-[12rem] overflow-y-auto overscroll-contain rounded-[1.1rem] border p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${
                dark ? 'border-white/[0.12] bg-[#231F20] text-white' : 'border-[rgba(35,31,32,0.12)] bg-white text-[#231F20]'
              }`}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === active;
                return (
                  <li
                    key={option.value}
                    id={optionId(index)}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => setActive(index)}
                    // Chosen on pointer-up through click, so a finger scrolling the
                    // list doesn't pick whatever it started on.
                    onClick={() => choose(index)}
                    className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-[0.8rem] px-3.5 py-2.5 text-sm transition-colors ${
                      isActive ? (dark ? 'bg-white/10' : 'bg-[rgba(35,31,32,0.06)]') : ''
                    } ${isSelected ? (dark ? 'text-[#D9B355]' : 'text-[#9A7424]') : ''}`}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {isSelected ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 flex-none"
                      >
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    ) : null}
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
