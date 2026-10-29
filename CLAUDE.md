# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Bilingual (en / pt-BR) personal portfolio built on Next.js 13.4 App Router, Tailwind (class-based dark mode) and Supabase. Tests use Vitest (`@/*` alias resolved in `vitest.config.ts`).

## Commands

- `pnpm install` — install deps (`pnpm install --frozen-lockfile` in CI)
- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — `next lint` (`next/core-web-vitals`)
- `pnpm test` — `vitest run` (no network needed)

pnpm is the single package manager (pinned via `packageManager` in `package.json`); `pnpm-lock.yaml` is the only lockfile. Do not add `package-lock.json` or `yarn.lock`. `pnpm-workspace.yaml` only holds `allowBuilds` (pnpm 11 blocks dependency install scripts by default; `supabase` and `unrs-resolver` are set to `false`, so the Supabase CLI binary is not downloaded and `node_modules/.bin/supabase` is absent).

Env vars: `GITHUB_TOKEN` (server-only, read by `lib/projects/live.ts`; optional `GITHUB_API_URL` override), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (read in `app/api/db.ts`), `REVALIDATE_KEY` (checked by the revalidate route). No `.env*` file is in the repo.

## Architecture

**Locale routing via middleware.** All pages live under `app/[lang]/`. `middleware.ts` checks whether the path starts with `/en` or `/pt-BR`; if not, it negotiates a locale from `Accept-Language` (default `en`) and *rewrites* (not redirects) to `/{locale}{path}`. So the URL bar stays locale-free until `LocaleSwitch` pushes an explicit `/{lang}/...` path. `locales` lives in `middleware.ts`, and `layout.tsx` imports `defaultLocale` from there. Adding a locale means editing both the middleware list and the dictionary.

**Translations are a typed in-code dictionary.** `dictionary/content.ts` is a `Record<string, DictionaryEntry>` keyed by locale; the shape is the global ambient interface in `@types/dictionary_entry.d.ts` (no import needed). Pages read `dictionary[params.lang]?.Section.Key`. New strings must be added to the interface and to both locales.

**Project data now comes from GitHub through `lib/projects/` (see `projects.allowlist.ts`, `lib/projects/live.ts`, ADR 0001); the pages no longer import Supabase. The Supabase description below is legacy, deleted by ticket 04.**

**Legacy Supabase data (server components).** `app/api/db.ts` exports a singleton anon client (typed with `Database` from `types_db.ts`, which is UTF-16 with CRLF line endings — it can look binary to some tools).
- `projects` table: columns mirrored by `@types/project_object.d.ts`.
- `images` storage bucket: `projects/page.tsx` lists the whole bucket and renders every image stacked at `opacity-0`.
- `ListItem` (client component) reveals the image on hover by querying `#list-images img[alt="<lowercased li text>"]` — so the image's `alt` must equal the lowercased project name. Don't change the alt text or the list markup in one place without the other.
- `projects/[projectName]/page.tsx` fetches a single project by name and calls `notFound()` if absent.

**Cache invalidation.** `POST /api/revalidate` calls `revalidatePath("/[lang]/projects")` when the `revalidate_key` request header matches `REVALIDATE_KEY` (presumably invoked when Supabase data changes).

**Theming.** `components/Theme.tsx` wraps `next-themes` (`attribute="class"`) and pairs with Tailwind `darkMode: 'class'`; `ThemeSwitch` toggles it.

**Config notes.** `next.config.js` whitelists the Supabase storage host for `next/image`; a different Supabase project needs its domain added there. `@/*` maps to the repo root (no `src/`). `public/curriculo-jonatas.pdf` is the CV linked from the About page.

## Known quirks

- `generateStaticParams` in `projects/[projectName]/page.tsx` returns `{ ProjectName }` (capital P), but the route segment is `projectName`, so the static params don't match the segment.
- `ListItem` links to `/projects/${name}` with no locale prefix, so it relies on the middleware rewrite and drops an explicit locale choice.

## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
