# 09: Locale module

**What to build:** All Locale knowledge lives in one module: the Locale list and default, negotiation from the Accept-Language header, building a Locale-prefixed path, switching a path to another Locale, and Dictionary lookup that falls back to English for an unknown Locale. The middleware, the root layout, the navigation and the pages all call it. The root layout stops importing from the middleware. Navigation links carry the Locale explicitly and work from any page, including deep Project pages.

**Spec:** github-sourced-portfolio. Seam 2. Bug sweep finding 5.

**Blocked by:** 02: Projects module with an in-memory adapter, plus Vitest

**Status:** done

- [x] One module owns the Locale list and the default Locale; no other file hard-codes `en` or `pt-BR`
- [x] Negotiation picks the best supported Locale from Accept-Language, handling underscores and unknown values, and falls back to the default
- [x] Building a path for a Locale and switching a path from one Locale to another are pure functions that handle both prefixed and unprefixed paths
- [x] Dictionary lookup for an unknown Locale returns the English entry instead of `undefined`
- [x] Navigation links work from `/`, from the Projects list and from a Project page (none resolve relative to the current path)
- [x] The middleware and the root layout use the module; the layout no longer imports from the middleware
- [x] Unit tests cover negotiation, path building and switching, and lookup fallback; typecheck, lint, tests and build pass

## Comments

Done. `lib/locale/` is the module (see CLAUDE.md for its interface). Decisions:

- The Accept-Language matching is a small pure implementation, so `@formatjs/intl-localematcher`, `negotiator` and `@types/negotiator` were dropped.
- `Locale` is `"en" | "pt-BR"` derived from the `locales` tuple; `lib/projects/types.ts` re-exports it instead of its old `string` placeholder. In-memory Translations are now `Partial<Record<Locale, ...>>`.
- `localePath("en", "/")` is `/en` (no trailing slash). `localePath` expects an unprefixed path; use `switchLocalePath` for a path that may be prefixed.
- Page `params.lang` is typed `Locale` (the middleware guarantees it). `getDictionary` still takes a `string` and falls back to English.
- `ListItem` takes a `locale` prop (passed from the list page) and builds its href with `localePath`. Its alt-selector hover is untouched until 08.
- `LocaleSwitch` is still the two-way toggle, now built on `switchLocalePath` and `locales`; ticket 12 replaces it.
- Verified against a production build and `next start` with a fake GitHub API: `/` rewrites by Accept-Language (`pt_BR,en;q=0.5` gives pt-BR, `fr` and none give en), `/en` and `/pt-BR` render with absolute nav hrefs, and a project page and the list page carry `/en|pt-BR`, `/..../about`, `/..../projects` and `/<locale>/projects/<slug>` hrefs.
- Not in this ticket: the middleware matcher also rewrites public files (`/curriculo-jonatas.pdf`, `/screenshot-placeholder.svg`), which 404 under `next start`. The matcher is unchanged from before this ticket.
