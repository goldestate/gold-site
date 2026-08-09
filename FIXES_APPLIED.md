# GOLD Website — Polish Pass Changelog

All items below were verified in a real headless-browser render (desktop + 390px
mobile, English + Arabic/RTL) before and after the fix.

## Bugs fixed

1. **Invisible "Why GOLD" headline.** `USPSection` has a dark background but was
   passed `tone="light"` on `SectionTitle`, which sets near-black text — dark text
   on a dark background made "A MEASURED APPROACH TO PREMIUM INVESTMENT"
   essentially unreadable. Removed the incorrect override.
   `components/sections.tsx`

2. **Content clipped on mobile across every section.** The hero, brand-story, and
   contact grids had no explicit column count below the `lg:` breakpoint. CSS
   Grid's default "auto" track sizing lets a track grow to the *min-content*
   width of its widest child; wide-letterspaced uppercase headings and card
   images pushed several grid tracks past the viewport width, and the section's
   `overflow-hidden` silently clipped the overflow instead of showing a scroll
   bar — so on a phone, headlines and the hero image card were cut off at the
   right edge with no visual indication anything was wrong.
   Fixed by:
   - Forcing an explicit `grid-cols-1` (with the existing `lg:grid-cols-[...]`
     override untouched) on every top-level section grid.
   - Adding `min-w-0` to grid/flex children so they can shrink below their
     content's intrinsic width instead of forcing the track wider.
   - Scaling down letter-spacing and font size at the `sm:` breakpoint on the
     hero eyebrow/headline/stat labels and the shared `SectionTitle` component.
   - Added `overflow-x: hidden` on `html, body` as a defensive backstop.
   `components/sections.tsx`, `app/globals.css`

3. **`<html lang>` stuck on `"en"` even on the Arabic pages.** The root layout
   hardcoded `<html lang="en">`; only an inner `<div>` got the correct
   `lang`/`dir`. Screen readers, spellcheck, and browser translate prompts would
   treat Arabic content as English. Fixed by resolving the active locale
   server-side (`getLocale()` from `next-intl/server`) and setting `lang`/`dir`
   on the actual `<html>` element.
   `app/layout.tsx`

## Polish

4. **Property card price/button crowding.** Longer price ranges (e.g.
   "EGP 18M – 26M") wrapped to two lines and crowded the "View Details" button
   next to them, so cards in the same row looked inconsistent. Restructured to
   stack price above a full-width button on every card for a uniform result
   regardless of text length.
   `components/sections.tsx`

5. **Brand typefaces were never actually loading.** Avenir Next and Baskerville
   (per the brand guideline) are commercial fonts not installed on most
   visitors' machines, so the "primary/secondary typeface" pairing was silently
   falling back to generic system fonts. Wired up close, freely-licensed
   equivalents via `next/font/google` — Montserrat (geometric sans, same role as
   Avenir Next) and Libre Baskerville (classic serif) — plus Tajawal for Arabic
   (the guideline specifies no Arabic pairing, so this was previously unused
   dead code in the Tailwind config). Swap these for licensed copies of the
   real typefaces if/when available.
   `app/layout.tsx`, `tailwind.config.ts`

## Not fixed — needs your input

- **Contact form cannot send email.** `/api/inquiry` requires `RESEND_API_KEY`,
  `EMAIL_TO`, and `EMAIL_FROM` environment variables. None exist in this
  project (no `.env` file at all), so submissions will always fail with
  "Email service is not configured" until real credentials are added.

- **Hero/property photography is hot-linked from `images.unsplash.com`.** Works,
  but it's off-brand from a control/licensing standpoint — the guideline calls
  for a specific curated photography style (family/lifestyle, interior
  architecture, B&W mix, still-life). Recommend replacing with licensed,
  brand-shot images before launch.
