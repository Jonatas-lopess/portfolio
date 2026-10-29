# 03: Projects from GitHub on the live pages

**What to build:** A GitHub adapter behind the Projects module, and the Projects list page, the Project detail page and static generation all reading from the module instead of Supabase. A visitor sees the Allowlisted Projects with a summary, stack, demo link, optional code link and Screenshot (or a placeholder). The adapter reads with a read-only fine-grained token held only on the server. Pages refresh hourly. The build fails loudly on a bad token or an unreadable Allowlisted repo, and a failed background refresh keeps serving the last good page.

**Spec:** github-sourced-portfolio. ADR 0001. Bug sweep findings 4 and 12.

**Blocked by:** 02: Projects module with an in-memory adapter, plus Vitest

**Status:** done

- [x] An Allowlist is committed to the repo; entries carry the repo, a Visibility and an optional title
- [x] Structured fields come from GitHub repo metadata: short description, homepage as the demo link, topics as the stack, repo URL
- [x] The token is read from a server-only environment variable and never reaches client code
- [x] The Projects list and detail pages render only Allowlisted Projects through the module
- [x] Static generation returns the correct dynamic segment key and no longer uses a non-null assertion that can crash the build (fixes the `ProjectName` / `projectName` mismatch)
- [x] The Project image has a meaningful `alt` text (the display title), not a file name
- [x] A Project without a Screenshot shows a placeholder
- [ ] Pages revalidate hourly; the protected on-demand endpoint still works
- [x] The build fails with a clear message if the token is invalid or an Allowlisted repo cannot be read
- [ ] A failed revalidation keeps serving the previous page
- [ ] The adapter is covered by tests against a fake GitHub response; typecheck, lint and build pass with the token set

## Comments

Implemented. Verification notes:

- Allowlist is committed **empty** (`projects.allowlist.ts`, with a documented example). The owner must add entries before any Project appears. The checked box means the file and its entry shape exist, not that it is populated.
- Owner is the constant `githubOwner = "Jonatas-lopess"` in `projects.allowlist.ts` (public data, so no env var).
- Token: `GITHUB_TOKEN` (server-only). `GITHUB_API_URL` is an optional override used only for tests and GitHub Enterprise.
- Verified against a local fake GitHub server (not live GitHub, no real token was available): good token builds and renders the Marked block only, title, stack, demo and code link (Full + public), `alt` = title, placeholder image; bad token (401) and missing token fail `next build` with a clear message; empty Allowlist builds with `GITHUB_TOKEN` unset.
- **Not verified, so left unticked:**
  - Hourly revalidation and "a failed revalidation keeps the previous page": `revalidate = 3600` is set on both pages and the adapter throws on every failure (so Next cannot cache an error page), but the time-based refresh was not observed running, and was not run against a real GitHub or a real deployment.
  - "Protected on-demand endpoint still works": the route is untouched and returns 401 for a wrong/missing key, but a successful call with a real `REVALIDATE_KEY` was not exercised, and finding 10 (it passes the literal `/[lang]/projects`) is ticket 06.
  - "Typecheck, lint and build pass with the token set": tsc, eslint on the changed files, tests and build pass, but `pnpm lint` as a whole still fails on the UTF-16 `types_db.ts` (ticket 04) and the build with a real token was never run.
- Screenshots: `hasScreenshot` is true when `public/screenshots/<slug>.png` exists in this repo (`lib/projects/screenshots.ts`, filesystem check at render). Ticket 07 copies files there. Works for `next build`/`next start`; a host that leaves `public/` out of the server bundle would report none.
- `generateStaticParams` returns `{ lang, projectName }` for every Locale and slug (the list page returns `{ lang }` per Locale) so the build prerenders, and therefore fails loudly on a bad token. `locales` is now exported from `middleware.ts` until ticket 09.
- `ListItem` is unchanged in mechanism: it still matches `img[alt=<lowercased li text>]`, so list-page image `alt` is the lowercased title (the detail page uses the title as is). Ticket 08 replaces this. It still links to `/projects/<slug>` without a locale prefix.
- Translations: `lib/projects/translations.ts` always returns null; ticket 16 fills it in.
