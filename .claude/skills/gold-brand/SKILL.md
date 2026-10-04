---
name: gold-brand
description: GOLD's brand, voice and bilingual (English/Arabic RTL) rules for gold-eg.com. Use for any change to the site's pages, copy, components, images or marketing assets, and for anything shown in Arabic.
---

# GOLD brand and site rules

GOLD Investment Opportunities ("Golden Opportunities of Leading Domain") is an Egyptian real-estate brand founded in 2024. Most live listings are holiday chalets and villas rented by the night in the North Coast, Ain Sokhna and Gouna; there are also monthly rentals in New Cairo, a few homes for sale, a B2B Rental Desk (brokers and owners, with a signed agreement) and an iOS app ("GOLD for iPhone") with a compound guide. Full brand book extract: `GOLD_brand_spec.md`.

## Look

- Colours: black `#231F20` (footer `#171314`), metallic gold as a gradient (`--gold-metal` in `app/globals.css`, accent `#D9B355`, darker `#B8860B` on light grounds), Piege `#E2E1D4` for light sections, Gray `#58595B`. Gold on black is the default; don't introduce new accent colours.
- Logo: only the four approved combinations (black or gold on white, white or gold on black). The 4-G mark (`components/gmark.tsx`) is a faint watermark, never a pattern fill.
- Type: Jost for UI and body, Libre Baskerville for small accents and titles, Tajawal for Arabic. Baskerville has no Arabic letters: never set Arabic text in `font-serif`.
- Photography: real GOLD listing photos first; no stock architecture.

## Voice

Plain, calm and specific. Say what something is or does ("2-bedroom chalet in Il Monte Galala, EGP 6,000 per night"), not how premium it is. Sentence case for buttons and headings in copy; the existing all-caps letter-spaced styling is a CSS treatment applied to English only.

## Arabic and right-to-left

- Every page is `dir="rtl"` in Arabic. Lay rows out once in logical order and let the direction mirror them; never add `flex-row-reverse` or reverse arrays "for Arabic" as well, which flips them back (the header menu, footer and home search were built that way and read backwards).
- Prefer logical utilities: `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `border-s`, `text-start`.
- No `uppercase` and no letter-spacing on Arabic text; give it a size step up instead (see `app/[locale]/unlock/[code]/page.tsx`).
- Latin codes, prices with Latin digits and phone numbers inside Arabic sentences may need `dir="ltr"` or a `‎` mark so punctuation stays on the right side.
- In Arabic copy the brand is written جولد in running text; GOLD stays in the logo and legal name.

## Apple and the app

- App Store badge: Apple's official artwork only (`public/badges/`), black badge, Arabic badge on Arabic pages, at least 40px tall, clear space of a quarter of its height, never recoloured, animated or redrawn. One badge per layout.
- "App Store" and "iPhone" stay in English in every language and are never uppercased or transliterated (not آيفون). Say "GOLD for iPhone" / "جولد لأجهزة iPhone".
- Where the badge appears, Apple's trademark credit sits with the legal line (`footer.appleCredit` in `lib/site-content.ts`).

## Where things live

- All visible copy, both languages: `lib/site-content.ts` (`SiteCopy`). Add English and Arabic together.
- App links and WhatsApp helpers: `lib/app-links.ts`. Phone parsing: `lib/phone.ts`.
- Leave `/goldenadmin2026` alone unless the task is about the admin.
