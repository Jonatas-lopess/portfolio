# 02: Project tagline (translated repo description)

**What to build:** Each Project has a tagline: the repo's short GitHub description, shown in the requested Locale. Sync translates it into every non-default Locale with the same source-hash / Stale flow as the Project summary, so `/pt-BR` shows a Portuguese tagline when a fresh Translation exists and the English description otherwise. A Project without a description has no tagline. This is data only; the pages that show it come in tickets 03 and 04.

**Spec:** new-layout.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The Projects module exposes a tagline per Project (`null` when the repo has no usable description) alongside the existing summary
- [x] Fallback chain mirrors the summary: stored Translation for the requested non-default Locale whose `sourceHash` equals the hash of the live description and whose text is not blank; else the live English description. The default Locale never has an entry
- [x] `pnpm sync` generates missing tagline Translations for Allowlisted repos only (Hidden repos are never read or sent to the Translator), never sends an entry whose hash matches, reports Stale ones and replaces them only with `--regenerate-stale`
- [x] The committed `projects.translations.json` holds the tagline Translations in a backwards-compatible way: existing summary entries keep working untouched, and an entry or file in the old shape is not treated as corrupt
- [x] All-or-nothing behaviour, pruning of non-Allowlisted repos, redaction of the token and keys, and exit code 1 on any failure carry over to the tagline step
- [x] A repo with no description is `skipped` and reported, like a repo with no Marked block; its tagline Translations (if any) are left alone
- [x] Revalidate (`POST /api/revalidate`) refreshes a changed description in both Locales like it does the summary
- [x] Tests (fake Translator, in-memory sources, no network) cover: generated, unchanged, Stale, regenerated, no description, translator failure writes nothing, fallback to English when the hash differs
- [x] `GLOSSARY.md` gains **Tagline**; `CLAUDE.md` is updated where it says the short description is never translated and describes the translations file and report; `TODO.md` is updated
- [ ] `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` pass (done); `pnpm build` left to the owner run
