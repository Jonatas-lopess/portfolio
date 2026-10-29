# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Bilingual (en / pt-BR) personal portfolio built on Next.js 15.5 App Router, Tailwind (class-based dark mode) and project data read from GitHub. Tests use Vitest (`@/*` alias resolved in `vitest.config.ts`).

## Commands

- `pnpm install` — install deps (`pnpm install --frozen-lockfile` in CI)
- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — `next lint` (`next/core-web-vitals`)
- `pnpm test` — `vitest run` (no network needed)
- `pnpm sync` — the owner-run Sync job (`scripts/sync.ts`, run with `tsx`, which resolves the `@/` alias): copies each Allowlisted Project's Screenshot into `public/screenshots/`. Needs `GITHUB_TOKEN`; review with `git status` / `git diff`, then commit the images.

pnpm is the single package manager (pinned via `packageManager` in `package.json`); `pnpm-lock.yaml` is the only lockfile. Do not add `package-lock.json` or `yarn.lock`. `pnpm-workspace.yaml` only holds `allowBuilds` (pnpm 11 blocks dependency install scripts by default; `esbuild` and `unrs-resolver` are set to `false`).

Env vars: `GITHUB_TOKEN` (server-only, read by `lib/projects/live.ts` and `pnpm sync`; optional `GITHUB_API_URL` override, honoured by both), `REVALIDATE_KEY` (checked by the revalidate route). No `.env*` file is in the repo.

## Architecture

**Locale module (`lib/locale/`).** The only place that knows the Locales. It exports `locales`, `Locale`, `defaultLocale`, `isLocale`, `negotiateLocale(acceptLanguage)` (q-values, underscores, case-insensitive, regional tags match their language, unknown gives the default), `hasLocalePrefix(path)`, `localePath(locale, path)` (absolute path for an unprefixed path), `switchLocalePath(path, locale)` (prefixed or unprefixed input), `localeNames` (`Record<Locale, string>` of native names, "English" / "Português", kept out of the Dictionary so they read the same in every Locale) and `getDictionary(locale)` (English for an unknown Locale). It is pure and unit-tested in `lib/locale/locale.test.ts`. Middleware, the root layout, `NavBar`, `LocaleSwitch`, `ProjectIndex` and the pages all go through it; nothing else hard-codes `en` or `pt-BR` (apart from the file names and registry keys in `dictionary/`). Every link is built with `localePath`, never a relative href. Adding a locale means adding it to `locales` and `localeNames` (typed, so TypeScript flags a missing name), creating `dictionary/<locale>.ts` and adding it to `dictionaries` in `dictionary/index.ts` (typed `Record<Locale, DictionaryEntry>`, so TypeScript flags a missing one).

**Locale routing via middleware.** All pages live under `app/[lang]/`. `middleware.ts` checks `hasLocalePrefix(pathname)`; if the path is not prefixed, it uses `negotiateLocale` on `Accept-Language` and *rewrites* (not redirects) to `localePath(locale, pathname)`. So the URL bar stays locale-free until `LocaleSwitch` (a native `<select>` listing every Locale from `locales` by `localeNames`, labelled by `NavBar.Language`, each `<option>` with its `lang`) pushes an explicit `/{lang}/...` path. `config.matcher` in `middleware.ts` exempts `_next`, `api`, `favicon.ico` and static file extensions (png, jpe?g, gif, webp, svg, ico, pdf, txt, xml) from the rewrite, so assets such as `/screenshots/x.png` and `/cv/en.pdf` and the `/api/revalidate` route are served as they are. The route segment is `[lang]` and Next types route params as `string`, so each page and the layout reads it once as `const locale = (await params).lang as Locale` (the middleware guarantees a valid prefix); from there on, props and variables are called `locale` and typed `Locale` (`NavBar`, `ProfileLinks`, `LocaleSwitch`, `ThemeSwitch`, `ProjectIndex`). Because those paths stay unprefixed, `app/[lang]/layout.tsx` sets `dynamicParams = false` with `generateStaticParams` over `locales`, so an unknown file such as `/old-name.pdf` returns 404 instead of matching `[lang]`.

**The Dictionary is typed from English.** `dictionary/en.ts` is the hand-edited Source text: `export const en = {...}` and `export type DictionaryEntry = typeof en` (string leaves are plain `string`), the single definition of the shape. Other Locales are separate files (`dictionary/pt-BR.ts`) typed `DictionaryEntry`, so a missing or extra key is a compile error; `dictionary/index.ts` exports `dictionaries: Record<Locale, DictionaryEntry>`, which `getDictionary` reads. `dictionary/dictionary.test.ts` also fails if any Locale's nested key paths differ from English. Pages read `const dictionary = getDictionary(locale)` and then `dictionary.Section.Key`. Every user-visible string lives here (page `<title>`/description come from `Meta` via `generateMetadata` in `app/[lang]/layout.tsx`); a new string goes in `en.ts` and every other Locale file. Still hard-coded on purpose: the owner's name and the LinkedIn/GitHub link names (in `lib/profile-links.ts`). `app/[lang]/not-found.tsx` (client component, Locale from `useParams`) is the translated missing-Project state; `notFound()` gives status 404, but the text only appears after hydration (the server HTML is an empty client-render shell, as it was with the default 404).

**Project data comes from GitHub through `lib/projects/` (server components).** The Allowlist is `projects.allowlist.ts`; the live adapter is `lib/projects/live.ts` (see ADR 0001), and the pages read through the module in `lib/projects/index.ts`. The build fails loudly on a bad or missing token or an unreadable Allowlisted repo.
- `projects/page.tsx` is a server component: it lists Projects through the module and passes `{ slug, title, screenshot }` plus the Locale and the Dictionary heading/count label to `components/ProjectIndex.tsx`.
- `ProjectIndex` (client component) owns the list, the images and the hover state (`useState` of the active slug; mouse enter/leave and focus/blur on the links). Nothing queries the document or matches `alt`. Only listed Projects get an image (`screenshot` or `SCREENSHOT_PLACEHOLDER`, `alt` = display title). The count shown is `projects.length`. Links use `next/link` with `localePath(locale, "/projects/" + encodeURIComponent(slug))`. The image pane is `invisible` below `md`; the links are always usable, so touch devices just open the Project.
- `SCREENSHOT_PLACEHOLDER` (`/screenshot-placeholder.svg`) lives in `lib/projects/placeholder.ts`, a module of its own so `ProjectIndex` (client) can import it without pulling in `lib/projects/index.ts`, which imports `node:crypto`. The Project page uses it too.
- `projects/[projectName]/page.tsx` (`ProjectPage`) fetches a single project by slug and calls `notFound()` if absent (rendered by `app/[lang]/not-found.tsx`).
- The Allowlist is deduplicated by repo (first entry wins) with `dedupeAllowlist` from `lib/projects/allowlist.ts`, used by both `createProjects` and `runSync`.
- A Project's summary comes from the README's Marked block, `<!-- portfolio:start -->` ... `<!-- portfolio:end -->` (`lib/projects/marked-block.ts`); see the README for the syntax. Without a usable block the summary is the repo's short GitHub description.

**GitHub requests (`lib/github/request.ts`).** `lib/projects/github.ts` and `lib/sync/github-screenshots.ts` both go through `githubFetch` (Bearer token, `X-GitHub-Api-Version` header, missing-token error, "cannot reach GitHub" error) and `assertReadable` (401/403 means the token was rejected, except that a 403 with `x-ratelimit-remaining: 0` or `retry-after`, or a 429, says the rate limit was reached; other non-404 errors name the status). `DEFAULT_API_URL` lives there too. The token never appears in a message; the Sync adapter also leaves out the low-level network error text (`includeReason` off).

**Sync job (`lib/sync/`).** `runSync({ github, store, allowlist })` returns `{ screenshots: { copied, unchanged, skipped, failed } }` (repo names; `failed` entries carry `{ repo, error }`). `github` is a `ScreenshotSource` (`getScreenshot(repo)` gives bytes or null) and `store` a `FileStore` (`read`/`write` by public path). It only touches Allowlisted repos, so a Hidden repo's image is never fetched or copied. The fixed Screenshot path in each Project's repo is **`docs/screenshot.png`** (`SCREENSHOT_REPO_PATH` in `lib/sync/github-screenshots.ts`; must be a PNG). It is written to `public/screenshots/<repo>.png`; the name always comes from `screenshotPath` in `lib/projects`, the same function `screenshotExists` uses to decide whether the site shows it or the placeholder. Identical bytes are not rewritten (compared by content), a repo without the file is skipped and reported, and one repo's failure (for example a 403) does not stop the others; `pnpm sync` exits 1 if any failed. Error messages never include the token. Real adapters: `createGitHubScreenshots` (contents API, `Accept: application/vnd.github.raw+json`, no Next fetch cache) and `createFileStore` (rooted at `public/`); `createMemoryStore` is for tests. A later step (Translations, ticket 15) is a new optional dependency on `SyncDeps` plus a new key on `SyncReport`; `scripts/sync.ts` wires and prints it.

**Cache invalidation.** Every GitHub fetch in `lib/projects/github.ts` carries `next: { revalidate: 3600, tags: ["projects"] }`. `POST /api/revalidate` (key in the `x-revalidate-key` header, compared in constant time with `REVALIDATE_KEY`; 401 if missing, wrong, or `REVALIDATE_KEY` is unset) calls `revalidateTag("projects")` and `revalidatePath` for each concrete `/{locale}/projects` and `/{locale}/projects/{slug}` (locales from `lib/locale`, slugs from `listSlugs()`). Do not pass `"/[lang]/projects"` to `revalidatePath`: a dynamic pattern without a `type` has no effect. The old header name `revalidate_key` is still accepted but deprecated (the underscore is dropped by nginx by default); new callers use `x-revalidate-key`.

**Profile links (`lib/profile-links.ts` + `components/ProfileLinks.tsx`).** The only place the LinkedIn, GitHub and CV URLs (CV = `public/cv/<locale>.pdf` via `cvPath(locale)`, falling back to the default Locale's file, rendered with `download`) are written. `<ProfileLinks variant="icons" | "labelled" locale={locale} />`: `icons` is Home (icon-only links named by `aria-label`), `labelled` is About (icon plus text). SVGs are `aria-hidden`. The rule for each link's accessible name (`profileLinkName`: the CV name is `About.CVDownload` from the Dictionary, LinkedIn/GitHub names are constants in the links file) and for its anchor attributes (`profileLinkAnchorProps`: external links get `target="_blank" rel="noopener"`, the CV gets `download`) lives next to the data in `lib/profile-links.ts`, so the component does not branch on the link. To change a URL, edit the links file only.

**Theming.** `components/Theme.tsx` wraps `next-themes` (`attribute="class"`) and pairs with Tailwind `darkMode: 'class'`; `ThemeSwitch` toggles it.

**Config notes.** `next.config.js` is empty: all images are local (`public/`), so no `next/image` host allowance is needed. `@/*` maps to the repo root (no `src/`). `public/cv/<locale>.pdf` are the CVs (one per Locale) linked from the Home and About pages.

## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
