# 13: Profile links module with accessible names

**What to build:** The LinkedIn, GitHub and CV links are defined once and rendered in two presentations: icons only on the Home page and labelled on the About page. Every link has an accessible name, translated for the CV link. Changing a URL touches one place.

**Spec:** github-sourced-portfolio. Bug sweep finding 8 (part).

**Blocked by:** 10: Dictionary: typed English source with every string moved in

**Status:** done

- [x] LinkedIn, GitHub and CV URLs exist in exactly one place
- [x] The Home page shows the icon-only presentation and the About page shows the labelled presentation, both from the same module
- [x] Every icon link has an accessible name; the CV name comes from the Dictionary
- [x] The CV download still works from both pages
- [x] The visual result matches today's pages

## Comments

Done. `lib/profile-links.ts` holds the LinkedIn, GitHub and CV URLs (and the LinkedIn/GitHub accessible names, which are proper names and not translated); `components/ProfileLinks.tsx` renders them as `variant="icons"` (Home) or `variant="labelled"` (About). Home and About now only call it.

- CV name: reuses `About.CVDownload` ("Download CV" / "Baixar CV"), so no new Dictionary key and no new hand-written string. Home's icon-only CV link uses it as its `aria-label`.
- Icon links get `aria-label`; the SVGs are `aria-hidden="true"`. On About the visible text is the name, so no `aria-label` there.
- Verified: `tsc`, `pnpm lint`, `pnpm test` (new `lib/profile-links.test.ts`: unique, https, named, CV not external), `pnpm build`; the URLs and the PDF name appear in no other source file. Headless Chromium 1248 via CDP: Home and About, en and pt-BR, light and dark (8 screenshots at 1000x700) are byte-identical before and after. Production server: `/en`, `/pt-BR`, `/en/about`, `/pt-BR/about` return 200 with the hrefs, `target`/`rel`, `download` and names; `/curriculo-jonatas.pdf` returns 200 `application/pdf`.
- Not verified: an actual file download in a browser (only the `download` attribute and the 200 PDF); a screen reader; the Home HTML "before" was not captured (the before-curl hit a trailing-slash redirect), so the Home markup comparison rests on the source diff and the identical screenshots. About's link markup is identical apart from `aria-hidden` on the SVGs.
