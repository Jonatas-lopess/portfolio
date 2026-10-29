# My portfolio

A showcase of some of my commercial/personal projects as well as a brief CV of my career so far

## Project Stack

**Front-end/Back-end:** NextJS, TailwindCSS

## Screenshots

Each Project's Screenshot lives in its own repo at `docs/screenshot.png` (a PNG). Run `GITHUB_TOKEN=... pnpm sync` to copy the Screenshots of the repos on `projects.allowlist.ts` into `public/screenshots/<repo>.png`, review them in `git status`, and commit. Repos without the file are skipped and listed; running it again with no changes writes nothing.

## Project summary: the README marker

The text shown as a Project's summary is written in the Project's own README, between two HTML comments (invisible when GitHub renders the README):

```md
<!-- portfolio:start -->
One or two paragraphs about the Project, written for visitors of the site.
<!-- portfolio:end -->
```

- **Shown:** only the text between the first `<!-- portfolio:start -->` and the first `<!-- portfolio:end -->` after it, trimmed. Whitespace inside the comments is ignored (`<!--portfolio:start-->` works).
- **Never shown:** everything else in the README. Nothing outside the markers is ever published.
- **Fallback:** if the README has no usable block (no README, a missing marker, an empty block, or a second start marker before the end), the summary is the repo's short GitHub description, or nothing if it has none. The short description is never translated.
- **Other Locales:** see "Project summary Translations" below.

## Translations

Sync also writes the Dictionary Translations (`dictionary/<locale>.ts`) from the English `dictionary/en.ts`; the site never calls a translation service. Set `GEMINI_API_KEY` (free key from Google AI Studio) or `TRANSLATOR=libretranslate` (local server, `LIBRETRANSLATE_URL`, default `http://localhost:5000`), then run `pnpm sync`. Existing Translations are never overwritten; if the English changed they are reported as stale, and `pnpm sync --regenerate-stale` replaces them. Review `git diff` and commit `dictionary/` including `dictionary/.sync-state.json`.

### Project summary Translations

`pnpm sync` also translates each Allowlisted Project's Marked block into every Locale except English and records the result in the committed `projects.translations.json`: `{ "<repo>": { "<locale>": { "text": "...", "sourceHash": "..." } } }`, keys sorted. `sourceHash` is the SHA-256 of the English block the text was made from. The site imports the file at build time (no network or filesystem access at request time).

- A visitor sees the Translation only while the live block still has that hash. If the README block changed, they see the current English text (never an outdated Translation) until you run Sync; Sync reports the entry as stale and leaves it alone, and `pnpm sync --regenerate-stale` replaces it. An entry with no `sourceHash` is treated as stale with an unknown hash.
- A repo with no Marked block is skipped and reported (nothing to translate). Repos not on the Allowlist are never read or sent to the Translator; entries for them in the file are only reported.
- Existing Translations (including ones you edited by hand) are never overwritten. If the Translator fails, nothing is written and the failed entries are listed; `pnpm sync` exits 1.
- It reads READMEs with `GITHUB_TOKEN` and translates with the Translator above. With an empty Allowlist neither is needed: `pnpm sync` prints that there is nothing to translate and exits 0.
- Review `git diff projects.translations.json` and commit it. The site shows the new text after the next deploy, because the file is part of the build.

### Try a new Locale end to end

1. Add the tag to `locales` and its native name to `localeNames` in `lib/locale/index.ts`.
2. `pnpm sync`.
3. Review the diff, run `pnpm test` and `pnpm exec tsc --noEmit`, commit.

Also add a CV for it (`public/cv/<locale>.pdf` and `cvLocales` in `lib/profile-links.ts`) and the Locale to the revalidate route test. See `CLAUDE.md` for details.
