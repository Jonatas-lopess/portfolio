# 12: Language switcher dropdown

**What to build:** The two-way language toggle becomes a dropdown listing every Locale by its native name ("English", "Português"). Choosing one navigates to the same page in that Locale. After this, adding a Locale needs no UI change.

**Spec:** github-sourced-portfolio.

**Blocked by:** 09: Locale module

**Status:** done

- [x] The dropdown lists every Locale from the Locale module, each by its native name
- [x] The current Locale is shown as selected
- [x] Choosing a Locale goes to the same page in that Locale, including from a Project page
- [x] It is usable with the keyboard and announced correctly by a screen reader
- [x] Adding a Locale to the list makes it appear with no component change

## Verified

- `tsc`, `pnpm lint`, `pnpm test` (119 tests, including `localeNames` covering exactly `locales`) and `pnpm build` pass.
- Production server: `/en`, `/pt-BR`, `/en/about`, `/pt-BR/about` and a Project page render a `<select aria-label>` with both options, each with its `lang`, and the current Locale `selected`.
- Headless Chromium over CDP: from `/en/about`, choosing Português goes to `/pt-BR/about` (and back); from `/en/projects/alpha` (fake GitHub API, temporary Allowlist entry, reverted) it goes to `/pt-BR/projects/alpha`. Navigation is client-side. Tab reaches the select; ArrowUp/ArrowDown and type-ahead change it; the label and `<html lang>` follow the Locale; dark theme text is white.
- Not verified: a real screen reader (relies on the native `<select>` and `aria-label`); other browsers; the open popup's look (OS-drawn). After switching, focus returns to the page body because the root layout remounts on a Locale change.
- Hand-written: the `NavBar.Language` strings ("Language", "Idioma") and the native names in `localeNames`.
