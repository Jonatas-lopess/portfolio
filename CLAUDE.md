# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Bilingual (en / pt-BR) personal portfolio built on Next.js 13.4 App Router, Tailwind (class-based dark mode) and project data read from GitHub. Tests use Vitest (`@/*` alias resolved in `vitest.config.ts`).

## Commands

- `pnpm install` — install deps (`pnpm install --frozen-lockfile` in CI)
- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — `next lint` (`next/core-web-vitals`)
- `pnpm test` — `vitest run` (no network needed)

pnpm is the single package manager (pinned via `packageManager` in `package.json`); `pnpm-lock.yaml` is the only lockfile. Do not add `package-lock.json` or `yarn.lock`. `pnpm-workspace.yaml` only holds `allowBuilds` (pnpm 11 blocks dependency install scripts by default; `unrs-resolver` is set to `false`).

Env vars: `GITHUB_TOKEN` (server-only, read by `lib/projects/live.ts`; optional `GITHUB_API_URL` override), `REVALIDATE_KEY` (checked by the revalidate route). No `.env*` file is in the repo.

## Architecture

**Locale module (`lib/locale/`).** The only place that knows the Locales. It exports `locales`, `Locale`, `defaultLocale`, `isLocale`, `negotiateLocale(acceptLanguage)` (q-values, underscores, case-insensitive, regional tags match their language, unknown gives the default), `hasLocalePrefix(path)`, `localePath(locale, path)` (absolute path for an unprefixed path), `switchLocalePath(path, locale)` (prefixed or unprefixed input) and `getDictionary(locale)` (English for an unknown Locale). It is pure and unit-tested in `lib/locale/locale.test.ts`. Middleware, the root layout, `NavBar`, `LocaleSwitch`, `ListItem` and the pages all go through it; nothing else hard-codes `en` or `pt-BR` (apart from the keys of `dictionary/content.ts`). Every link is built with `localePath`, never a relative href. Adding a locale means adding it to `locales` and giving it a dictionary entry.

**Locale routing via middleware.** All pages live under `app/[lang]/`. `middleware.ts` checks `hasLocalePrefix(pathname)`; if the path is not prefixed, it uses `negotiateLocale` on `Accept-Language` and *rewrites* (not redirects) to `localePath(locale, pathname)`. So the URL bar stays locale-free until `LocaleSwitch` pushes an explicit `/{lang}/...` path. Pages type `params.lang` as `Locale`, which the middleware guarantees.

**Translations are a typed in-code dictionary.** `dictionary/content.ts` is a `Record<string, DictionaryEntry>` keyed by locale; the shape is the global ambient interface in `@types/dictionary_entry.d.ts` (no import needed). Pages read `getDictionary(params.lang).Section.Key`. New strings must be added to the interface and to both locales.

**Project data comes from GitHub through `lib/projects/` (server components).** The Allowlist is `projects.allowlist.ts`; the live adapter is `lib/projects/live.ts` (see ADR 0001), and the pages read through the module in `lib/projects/index.ts`. The build fails loudly on a bad or missing token or an unreadable Allowlisted repo.
- `projects/page.tsx` renders every Project's image stacked at `opacity-0`, with a placeholder when there is no Screenshot.
- `ListItem` (client component) reveals the image on hover by querying `#list-images img[alt="<lowercased li text>"]`, so the image's `alt` must equal the lowercased project title. Don't change the alt text or the list markup in one place without the other.
- `projects/[projectName]/page.tsx` fetches a single project by slug and calls `notFound()` if absent.

**Cache invalidation.** `POST /api/revalidate` calls `revalidatePath("/[lang]/projects")` when the `revalidate_key` request header matches `REVALIDATE_KEY`.

**Theming.** `components/Theme.tsx` wraps `next-themes` (`attribute="class"`) and pairs with Tailwind `darkMode: 'class'`; `ThemeSwitch` toggles it.

**Config notes.** `next.config.js` is empty: all images are local (`public/`), so no `next/image` host allowance is needed. `@/*` maps to the repo root (no `src/`). `public/curriculo-jonatas.pdf` is the CV linked from the About page.

## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
