# GOLD Investment Opportunities — Brand Spec (for landing page build)

Source: `Gold_Main_Brand.pdf` (internal brand guideline). This file extracts the exact
specs Codex should follow. Accompanying reference images are in `/images`:
- `logo-mark.png` — the 4-G's monogram
- `logo-color-variants.png` — all 4 approved logo color/background combos
- `main-colors-black-gold.png` — primary black + gold swatches
- `photography-style-grid.png` — approved photography style/mood
- `stationery-final.png` — applied letterhead/envelope/business card example

## Brand story
GOLD stands for **Golden Opportunities of Leading Domain**. The brand began in 2024 in
real estate (buying, selling, consultation) and plans to expand into four sub-brands /
investment sectors within five years.

**Mission:** Deliver trusted, high-quality real estate solutions while creating
meaningful value for clients through expert consultation, transparency, and
exceptional service.

**Vision:** Become a leading multi-sector group recognized for innovation, integrity,
and long-term impact, growing into a diversified organization across investment and
management sectors.

## The main brand / logo
The main brand sits above four sub-brands, unified by a **4 G's icon** — four interlocking
"G" shapes around a central diamond. Each G represents one Golden Way to Invest:

| Sub-brand | Focus |
|---|---|
| Gold Real Estate | Property investment, buying, selling, consultation |
| Gold Life | Luxury and lifestyle services |
| Gold Management | Professional management solutions, operational excellence |
| Gold Export | Export opportunities, global markets |

**Approved logo/background combinations** (see `logo-color-variants.png`):
1. Black logo on white background
2. Gold logo on white background
3. White logo on black background
4. Gold logo on black background

No other color combination is approved for the logo.

## Color palette

### Primary colors
| Name | CMYK | RGB | Hex | Notes |
|---|---|---|---|---|
| Black | C0 M0 Y0 K100 | R35 G31 B32 | `#231F20` | Strength, luxury, premium value |
| Gold | — | — | — | Represented as a gold-foil/metallic texture, not a flat CMYK/RGB value in this guideline (print uses gold stamp/foil technique, not standard ink). **For digital use, a metallic gold gradient must be approximated** — no exact hex was specified in the source guideline; treat any on-screen gold as a placeholder pending sign-off from the brand owner. |

### Friendly (supporting) colors
| Name | CMYK | RGB | Hex |
|---|---|---|---|
| Gray | C64 M56 Y53 K28 | R88 G89 B91 | `#58595B` |
| Piege (beige) | C11 M7 Y16 K0 | R226 G225 B212 | `#E2E1D4` |
| Kashmer (taupe) | C20 M18 Y20 K0 | R204 G199 B194 | `#CCC7C2` |
| Grayish blue | C20 M9 Y11 K0 | R200 G214 B217 | `#C8D6D9` |

Each friendly color also has a 5-step tint ramp (full color → near-white) shown in the
guideline for use in UI states, backgrounds, and dividers.

### Approved dark background styles
1. **Middle light background** — subtle textured/noise gradient, not flat black
2. **Solid black background** — flat `#231F20`
3. **Spotlight background** — radial light glow from one corner, rest solid black

## Typography
Two typeface families, used deliberately for contrast:

| Typeface | Role | Weights shown |
|---|---|---|
| **Avenir Next** | Primary — modern, clean, forward-thinking. Used for the bulk of UI/body copy. | Bold, Medium, Regular |
| **Baskerville** | Secondary — classic, refined, timeless serif. Used sparingly for heritage/elegant accents. | Bold, Medium, Regular |

No Arabic typography is specified in the source guideline — this must be defined new
for the bilingual build (see "Gaps to fill" below).

## Photography style
- Clear, high-resolution, professional images only
- Mix of **color and black-and-white** — B&W used for a more luxurious/vintage feel
  where appropriate
- Subject matter shown in the guideline: family/lifestyle moments, interior architecture,
  luxury furniture, close-up textural/still-life shots (marble bust, palm leaf, light and
  shadow)

## Applied stationery reference
The guideline shows the identity applied to a letterhead, envelope, and business card —
all on black backgrounds with the gold logo and gold-outlined 4-G's pattern as a large
watermark/texture element. Useful as a reference for how gold-on-black restraint should
look at production quality (see `stationery-final.png`).

## Social/video layout conventions (for future reference, not this landing page)
The guideline defines fixed placement rules for social posts and video templates:
main visual space, "Main ToV" (tone-of-voice/message) placement, logo + slogan block,
and contact/CTA strip — consistent across "main placement," "sub-brand mode," and
"partner brand" variants. Not required for the landing page build but useful if asked
to extend into social templates later.

---

## Gaps in the source guideline (flagged, not sourced — decide before build)
These items are **not specified** in the PDF and were assumed/invented when drafting
the landing page prompt. Confirm or override before Codex finalizes styling:

- **Exact digital gold hex/RGB** — guideline only shows a print foil texture
- **Arabic typeface pairing** — no Arabic type direction exists in the source
- **All headline/CTA copy** — placeholder, not brand-approved messaging
- **Web-specific UI patterns** (buttons, forms, nav) — guideline covers print/social/logo
  only, no functional web component specs
