# 16: Project summary Translations

**What to build:** Sync also translates each Project summary (the Marked block) into every Locale, recording a hash of the Source text, and the Projects module shows the Translation for the visitor's Locale. When the live Marked block no longer matches the stored hash, the visitor sees the fresh English text instead of an outdated Translation, and Sync reports the entry as stale.

**Spec:** github-sourced-portfolio. ADR 0002.

**Blocked by:** 15: Translator module and Sync translates the Dictionary; 03: Projects from GitHub on the live pages

**Status:** done

- [x] Sync produces a reviewable Translation per Project per Locale with the Source text hash
- [x] Existing Translations are never overwritten; changed Source text marks them stale and the report lists them
- [x] The Projects module returns the Translation when its hash matches the live Marked block
- [x] When the hash differs, the Project summary is the current English text, in every Locale
- [x] When there is no Translation, the English text is shown, then the repo description if there is no Marked block
- [x] Hidden Projects are never sent to the Translator
- [x] Tests cover current, stale and missing Translations through the Projects module interface and through Sync

## Comments

Decisions (details in `CLAUDE.md`, "Project summary Translations"):

- **Store:** committed `projects.translations.json` at the repo root, `{ "<repo>": { "<locale>": { "text", "sourceHash" } } }`, sorted keys, two-space indent, final newline. Imported statically by `lib/projects/translations.ts` (`createTranslationReader`), so it works under any host with no request-time filesystem access. A change to it shows after the next deploy. It is `{}` today (empty Allowlist).
- **Display:** unchanged fallback in the Projects module, plus the default Locale never consults the store: current Translation, else live English Marked block, else repo description. Tested through `createProjects` (current, stale, missing, blank, missing hash, no Marked block, Hidden repo, default Locale) in `lib/projects/project-translations.test.ts`.
- **Sync:** `projectTranslations` step on `runSync` (`lib/sync/project-translations.ts`), README source `createGitHubReadmes`, report formatter `formatProjectTranslationsReport`. Tested with a fake GitHub, fake Translator and in-memory store (`lib/sync/project-translations.test.ts`, `github-readmes.test.ts`, `format-project-translations.test.ts`). Missing hash on an existing entry is "stale, unknown hash" (reported, left alone, replaced only with `--regenerate-stale`); no baselining because no hand-written summaries exist. Any failure means nothing is translated or written. Repos in the file but not on the Allowlist are pruned from it (story 20) and reported as `pruned`; a failed run prunes nothing. A README 404 on an unreadable repo (GitHub 404s private repos the token cannot see) is a failure, not "no README".
- **Empty Allowlist:** `pnpm sync` prints "nothing to translate", needs no token or key, exits 0.
- **Verified end to end** (fake GitHub API, fake LibreTranslate HTTP server, `GITHUB_TOKEN=x`, temporary Allowlist entry, all reverted): generate, idempotent second run, production build shows the Translation on `/pt-BR/projects/<slug>` and English on `/en/...`, README changed + `POST /api/revalidate` shows the new English text in both Locales; `--regenerate-stale` replaces; Translator down gives exit 1 and an untouched file; no Marked block is skipped. **Not run against the real Gemini API** (no key exists).
- **Bug found and fixed on the way (not in this ticket's scope, needed for the revalidate check):** `export const dynamicParams = false` in `app/[lang]/layout.tsx` made every page answer 404 (`NoFallbackError`, Next 15.5.28) after `POST /api/revalidate`, reproduced at the previous commit with a plain GitHub-sourced Project and no translations. Replaced by `if (!isLocale(lang)) notFound()` in the layout, which keeps unknown paths such as `/old-name.pdf` at 404. This affects ticket 06: its deployed-site check would have failed before this fix.
