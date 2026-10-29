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
- **Fallback:** if the README has no usable block (no README, a missing marker, an empty block, or a second start marker before the end), the summary is the repo's short GitHub description, or nothing if it has none.

## Translations

Sync also writes the Dictionary Translations (`dictionary/<locale>.ts`) from the English `dictionary/en.ts`; the site never calls a translation service. Set `GEMINI_API_KEY` (free key from Google AI Studio) or `TRANSLATOR=libretranslate` (local server, `LIBRETRANSLATE_URL`, default `http://localhost:5000`), then run `pnpm sync`. Existing Translations are never overwritten; if the English changed they are reported as stale, and `pnpm sync --regenerate-stale` replaces them. Review `git diff` and commit `dictionary/` including `dictionary/.sync-state.json`.

### Try a new Locale end to end

1. Add the tag to `locales` and its native name to `localeNames` in `lib/locale/index.ts`.
2. `pnpm sync`.
3. Review the diff, run `pnpm test` and `pnpm exec tsc --noEmit`, commit.

Also add a CV for it (`public/cv/<locale>.pdf` and `cvLocales` in `lib/profile-links.ts`) and the Locale to the revalidate route test. See `CLAUDE.md` for details.
