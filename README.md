# Tungal Schools & Colleges: new homepage, Option A (v2)

## What changed in v2 (19 Nov 2026)

- **Real photography.** 15 authentic Tungal photos from tungalschools.com now fill the hero, pathway cards, campus panels, directors and gallery. They are inline `<img>` tags with `-800` srcset variants for phones. Only the Montessori card keeps its brand illustration, because no real Montessori photo exists yet. The director portraits are cropped from the joint photo in the About page's Leadership section.
- **Marquee** (`.marquee`, `marquee()` in main.js). It lists programmes, campuses and two of the institution's stated principles, separated by the crest. It runs at 60 px/s, speeds up and follows the direction of scroll, skews slightly with scroll velocity, and slows to about 15% on hover. Screen readers get a plain list instead, and reduced motion makes it static.
- **Split-word hero headline reveal**, re-run on every slide (`splitWords()`).
- **Pinned horizontal student-life gallery** on desktop (≥1025 px), with inner image parallax (`pinnedGallery()`, GSAP ScrollTrigger with `containerAnimation`). Mobile keeps the swipe row, and reduced motion keeps the grid.
- **Spotlight cards.** A soft gold glow follows the pointer on pathway, pillar, director and results cards (fine pointers only).
- **Verified 2025 results bento** in Achievements: 4 IIT selections (named), 367 engineering, and 43 MBBS, 34 BAMS and 9 BDS medical selections, with counters. It also shows the IFS rank-14 alumna. Source: the Results page and homepage posters.
- **Polish:** a scroll-progress line under the header, clip-path reveals on the director portraits, and a light paper grain.
- **Real contact details:** campus phones in the panels and footer (from the Contact page), the Bagalkot address and office hours.

To revert to v1's illustration-only look, restore the `class="art"` images. `site-data.js` `photos` still works for swapping individual photos.

---


A standalone, static homepage: HTML, CSS and vanilla JS, with GSAP and ScrollTrigger self-hosted. It does not touch the live Wix site, so it can be reviewed separately and launched when approved.

```
index.html                     page markup, meta, Open Graph, JSON-LD
assets/css/main.css            design tokens, components, sections, motion, breakpoints
assets/js/site-data.js         EDIT THIS: photos, programmes, contacts, social, results, testimonials
assets/js/main.js              interactions (carousel, tabs, accordion, form, reveals, header)
assets/vendor/                 gsap.min.js, ScrollTrigger.min.js (3.x, local)
assets/fonts/                  Fraunces (variable), Plus Jakarta Sans 400–700 (woff2, local)
assets/brand/                  logo system (SVG, outlined), 25-year seal, og-image.png
assets/art/                    brand illustrations used until real photos are supplied
assets/photos/                 drop authentic photographs here (see README inside)
forms/admission-enquiry.php    enquiry handler (set $to before going live)
```

Run locally with `python3 -m http.server` from this folder and open http://localhost:8000.

## Before launch

1. **Photos.** Add authentic Tungal photographs to `assets/photos/` and register each slot in `site-data.js`. There are 21 slots, listed in that file. Director portraits must be approved photos of Mr. Ashok Tungal and Mrs. Laxmi Tungal.
2. **Contact details.** The phone numbers, emails and social profiles on tungalschools.com could not be read during this build, so the footer shows campus addresses only. Add contacts and social profiles in `site-data.js` (`contact`, `social`).
3. **Addresses.** The Jamkhandi, Hulyal and Vijayapura addresses come from public school listings (Careers360) and should be confirmed by the trust. The Bagalkot street address is unknown.
4. **Results and testimonials.** Add verified items to `achievements` and `testimonials`. Until then, the Wall of Fame shows its placeholder structure and the testimonials slot shows an invitation to share stories.
5. **Form.** Set the admissions inbox in `forms/admission-enquiry.php`, or point the form `action` at your existing handler. The JS posts `FormData` and expects a 2xx response.
6. **Kannada sign-off.** Have a Kannada reader at the trust confirm ತುಂಗಳ in the logo files.

## Asset inventory

| Asset | Homepage section | Source | Type |
|---|---|---|---|
| assets/brand/tungal-logo-horizontal(-reverse).svg | Header | New identity, this project | Logo (outlined SVG) |
| assets/brand/tungal-25-seal.svg | 25-year legacy | New identity, this project | Logo |
| assets/brand/tungal-logo-primary-reverse.svg | Footer | New identity, this project | Logo |
| assets/brand/tungal-icon.svg / -mono.svg | Why Tungal, favicon, footer | New identity, this project | Logo |
| assets/brand/og-image.png | Social sharing | Rendered from brand assets | Graphic |
| assets/art/art-orbits.svg | Hero 1, PU card, Bagalkot, gallery 02 | Drawn for this project | Illustration, no people |
| assets/art/art-leaves.svg | Hero 2, Montessori card, Hulyal, gallery 07 | Drawn for this project | Illustration, no people |
| assets/art/art-sunrise.svg | Hero 3, competitive prep card, Vijayapura | Drawn for this project | Illustration, no people |
| assets/art/art-pages.svg | School card, gallery 01 and 05 | Drawn for this project | Illustration, no people |
| assets/art/art-campus.svg | UG card, Jamkhandi, gallery 06 | Drawn for this project | Illustration (generic building, not a Tungal campus) |
| assets/art/art-field.svg | Gallery 03 (Sports) | Drawn for this project | Illustration, no people |
| assets/art/art-stage.svg | Gallery 04 (Cultural events) | Drawn for this project | Illustration, no people |
| Director monograms (AT, LT) | Directors' Talk | CSS | Placeholder until approved portraits arrive |

No authentic Tungal photographs are in this build: the live site's images could not be downloaded from this environment. No generated or stock people are used anywhere.

## Content sources

- Campus programmes, director bios: client brief (treated as the source of truth).
- "Tungal Schools @ a Glance" copy, the Shri K K Tungal Memorial Trust name: tungalschools.com homepage.
- Educational philosophy quote, the four pillars, the PU combinations (PCMB, PCMC, PCMS, PCME): tungalschools.com Jamkhandi page.
- "25 years of nurturing young minds": the trust's existing 25-year emblem.
- Counters show verified figures only: 25 years, 4 campuses, 5 pathways, 3 campuses with hostels.

## QA report (19 November 2026)

All results below come from `qa.py` (Playwright + Chromium) against a local server. Raw output: `qa/results.json`. Screenshots: `qa/shots/`.

**Responsive, at 1440, 1366, 1280, 1024, 768, 430, 390, 375 and 360 px.** Passed at all nine widths:
- No horizontal overflow (scrollWidth equals the viewport width).
- No console errors or page errors, and no failed or 4xx/5xx requests.
- All 25 images loaded, after scrolling and waiting for lazy images.
- Every in-page anchor link has a target, and there is exactly one `h1`.
- Desktop navigation is shown at 1280 px and up; the menu button is shown at 1024 px and below.
- Hero title size scales from 84 px at 1440 to 40 px at 360.
- Touch targets: no interactive element under 44 px at 768 px and below. At desktop widths, the campus chips (36 px) and nav links (41–44 px) are under 44 px, which is acceptable for mouse input; WCAG 2.2 AA requires 24 px.

**Interactions.** Passed:
- Hero: dot click, arrow keys, pause/play, autoplay after 7 s, swipe on touch; inactive slides are aria-hidden.
- Campus tabs: click, arrow keys, End key; programme chips open the correct campus.
- Accordion: opening one item closes the others, and the large index updates.
- Mobile menu: opens, moves focus inside, traps focus over 12 Tab presses, closes on Esc and returns focus, and closes on link tap.
- Header hides on scroll down and returns solid on scroll up. The back-to-top button appears and returns to the top.
- Mobile sticky enquiry button appears mid-page and hides when the form is on screen.

**Form.** Passed:
- An empty submit shows inline errors and focuses the first invalid field.
- `+91 98765 43210` is cleaned to `9876543210`. Invalid emails are rejected.
- The programme list follows the campus (Bagalkot shows PUC only).
- The hostel option shows only where a hostel exists.
- A valid submit POSTs all fields and shows a success message. A server error shows a retry message.

**Accessibility.** axe-core (WCAG 2.0/2.1 A and AA, plus best practice) found 0 violations at 1440 px and at 390 px.

**Reduced motion.** Passed: autoplay is off, the hero stays on slide 1, and all reveal content is visible without scrolling.

**v2 additions, tested in the same run** (`qa2.py`, results in `qa/results.json`). All passed:
- **Marquee:** 60 px/s idle, 9 px/s on hover, no transform under reduced motion.
- **Headline:** split into 8 word spans with the text unchanged.
- **Spotlight:** follows the pointer (60px / 80px).
- **Scroll progress:** updates as you scroll.
- **Gallery:** horizontal mode on desktop, moved 1,691 px sideways while pinned, and not pinned under reduced motion.
- **Counters:** the bento counters end on 4, 43, 34, 9 and 367.
- **Regression checks:** all nine widths are still clean, all 58 images load, and axe-core still finds 0 violations.

**Performance (v2)**, simulated mobile: LCP 1.63 s, CLS 0, 21 requests, 638 KB on initial load.

**Performance (v1)**, simulated mobile (1.6 Mbps, 150 ms RTT, 4× CPU slowdown, 390 px, local server, no compression):
- LCP 1.36 s, CLS 0.
- 20 requests and 493 KB on initial load. Fonts are about 130 KB and GSAP about 118 KB.
- With gzip/brotli on the real host, this will be smaller.

**Not tested.** Real devices, Safari and Firefox (only Chromium ran), Lighthouse, a live form backend, and pages hosted on the production domain.
