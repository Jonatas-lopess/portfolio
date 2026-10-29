# 05: Upgrade Next to a patched version

**What to build:** The site runs on a version of Next that npm no longer flags as having a security vulnerability (13.4.4 is flagged today). Any code changes the upgrade requires are made so the site behaves the same.

**Spec:** github-sourced-portfolio. Bug sweep finding 2. Kept separate because it can require code changes.

**Blocked by:** 01: One package manager (pnpm) and a working lockfile; 04: Remove Supabase

**Status:** done

- [x] Next (and the matching ESLint config package) are upgraded to a release that clears the vulnerability warning
- [ ] Breaking changes are handled; behavior of routing, middleware rewrites, fetch caching, ISR and the revalidation endpoint is unchanged
- [x] Typecheck, lint, tests and build all pass
- [x] A manual run of the dev server shows Home, About, the Projects list and a Project page rendering in both Locales
- [x] The upgrade notes (what changed and why) are recorded in the ticket

## Comments

Upgrade notes.

**Target: `next@15.5.28` + `eslint-config-next@15.5.28`** (exact pins, as before). Also `eslint` 8.42.0 -> 8.57.1, because `eslint-config-next@15` pulls `@typescript-eslint/eslint-plugin@8`, which needs `eslint ^8.57`.

Why 15.5.28 and not a 13.x/14.x release:
- The bug sweep only mentioned one npm warning, but `pnpm audit` on 13.4.4 lists ~35 advisories against `next` (4 critical). The ticket's test is "no longer flagged", so the target had to clear all of them.
- 14.2.35 (the last 14.x) and 13.5.11 (the last 13.x) do **not** clear that: many advisories (middleware redirect/bypass, image optimizer RCE and DoS, Server Actions DoS, rewrites SSRF, ...) are only fixed from 15.5.x, with the highest patched version being `>=15.5.28`. 15.5.28 is the smallest release that does, and it is the last release of the 15.5 line (dist-tag `backport`). 16.x was not needed, so not used (it requires Node >= 20.9 and removes `next lint`).
- `pnpm audit` after the upgrade: zero advisories for `next`. Remaining audit findings are 5 `postcss` ones (direct dependency `postcss@8.4.24`, outside this ticket's scope; Next bundles its own postcss).

React: kept at 18.2.0 / `@types/react` 18.2.9. `next@15.5.28` peers allow `react ^18.2.0 || ^19`, and the App Router uses Next's own bundled React regardless. Moving to React 19 is optional and would also need `next-themes` (0.2.1 peers React <= 18) to be bumped, so it was left out to keep the jump small.

Breaking changes handled:
- **Async request APIs (Next 15):** `params` is now a Promise in layouts and pages. `app/[lang]/layout.tsx`, `page.tsx`, `about/page.tsx`, `projects/page.tsx` and `projects/[projectName]/page.tsx` are now `async` and `await params`. `next build` type-checks this, so it was required, not optional. Route `params` are typed `string` by Next, so `lang` is cast to `Locale` (the middleware guarantees a valid prefix).
- **Not affected, checked:** `fetch` caching default (the GitHub adapter always passes `next: { revalidate: 3600 }` explicitly, so the Next 15 change to uncached-by-default does not touch it); `export const revalidate = 3600` and `generateStaticParams` (unchanged; build output still shows `/en/projects`, `/pt-BR/projects` and the project pages as SSG with 1h revalidate); `middleware.ts` (no change needed; `NextResponse.rewrite` and the matcher behave the same); `next/image`, `next/link`, `next/font/google`, `next/navigation` usage (no API change hit); `next.config.js` (empty); no `cookies()`/`headers()`/`searchParams` use; route handler is a POST so the GET-handler caching change does not apply.
- Rendering modes are the same as on 13.4.4 (checked with a build of the previous commit): `/[lang]` and `/[lang]/about` dynamic, `/[lang]/projects` and project pages SSG.
- `pnpm lint` still works but prints a notice that `next lint` is deprecated and removed in Next 16. Migrating to the ESLint CLI is a later chore.
- Peer check: the only remaining unmet peer is `@types/node` (vitest 5 wants >= 22), which pre-dates this ticket.

Box 2 is left unticked on purpose: code changes for the breaking changes are done and routing, middleware rewrites and the endpoint's HTTP responses were checked unchanged, but hourly ISR refresh was not observed running and what the revalidation endpoint invalidates was not measured (see below).

Verification (all run on the final tree):
- `pnpm audit`: no `next` advisories. `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` (75 tests) and `pnpm build` pass.
- `pnpm start`, **curl only** (no browser, so no visual, hydration, hover or theme-toggle check): `/`, `/en`, `/pt-BR`, `/en/about`, `/pt-BR/about`, `/en/projects`, `/pt-BR/projects` and `/curriculo-jonatas.pdf` return 200 (pdf is `application/pdf`); `/en/projects/nope` and `/xx` return 404; `Accept-Language: pt-BR` rewrites `/` and `/projects` to `lang="pt-BR"`, no header or `fr` gives `en`; About `<h1>` is "About me" / "Sobre mim". The same requests were also run against a production build of the previous commit (Next 13.4.4) and gave the same status codes and the same locale results.
- `POST /api/revalidate`: 401 without the key and with a wrong key, 200 `{"revalidated":true}` with the right key (`REVALIDATE_KEY` set), 405 for GET. Same as before the upgrade. Next 15 logs a new warning for it: `revalidatePath("/[lang]/projects")` is a dynamic path passed without the `type` parameter and "has no effect by default". That is the existing finding 10 (ticket 06); whether it invalidated anything on 13.4.4 was not measured, so "revalidation unchanged" only covers the endpoint's HTTP behavior, not what it invalidates.
- Project detail page: temporarily added an Allowlist entry (`demo-app`, Full) and ran a local fake GitHub server through `GITHUB_API_URL` with `GITHUB_TOKEN=x`. `next build` prerendered `/en/projects/demo-app` and `/pt-BR/projects/demo-app` (1h revalidate); `next start` returned 200 for both, with the title, README marked-block summary, stack, demo and code links, `alt="Demo App"`, localized headings (Resume / Resumo), the list item `alt="demo app"`, and 404 for an unknown project. The same page also returned 200 under `pnpm dev`. The temporary Allowlist entry was reverted and the fake server stopped.
- Manual dev-server run (box 4): done with `pnpm dev` plus curl only, not a browser. Home, About, Projects list and the (fake-GitHub) Project page returned 200 with the right `<html lang>` in both Locales. Nothing was looked at visually.
- Not verified: real GitHub (no real token), hourly background revalidation actually firing, a real deployment, and any client-side behavior (hover reveal in `ListItem`, `LocaleSwitch`, theme switch, `next/image` in the browser).
- A stray earlier server left running on the same port briefly served a stale 404 for the project page after a rebuild; a clean rebuild with no server running gave 200 consistently. Not a Next 15 issue.
