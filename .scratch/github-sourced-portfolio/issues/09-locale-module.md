# 09: Locale module

**What to build:** All Locale knowledge lives in one module: the Locale list and default, negotiation from the Accept-Language header, building a Locale-prefixed path, switching a path to another Locale, and Dictionary lookup that falls back to English for an unknown Locale. The middleware, the root layout, the navigation and the pages all call it. The root layout stops importing from the middleware. Navigation links carry the Locale explicitly and work from any page, including deep Project pages.

**Spec:** github-sourced-portfolio. Seam 2. Bug sweep finding 5.

**Blocked by:** 02: Projects module with an in-memory adapter, plus Vitest

**Status:** ready-for-agent

- [ ] One module owns the Locale list and the default Locale; no other file hard-codes `en` or `pt-BR`
- [ ] Negotiation picks the best supported Locale from Accept-Language, handling underscores and unknown values, and falls back to the default
- [ ] Building a path for a Locale and switching a path from one Locale to another are pure functions that handle both prefixed and unprefixed paths
- [ ] Dictionary lookup for an unknown Locale returns the English entry instead of `undefined`
- [ ] Navigation links work from `/`, from the Projects list and from a Project page (none resolve relative to the current path)
- [ ] The middleware and the root layout use the module; the layout no longer imports from the middleware
- [ ] Unit tests cover negotiation, path building and switching, and lookup fallback; typecheck, lint, tests and build pass
