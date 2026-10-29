# 15: Translator module and Sync translates the Dictionary

**What to build:** A Translator module with two adapters, Gemini (free tier, default) and local LibreTranslate, and the Sync job extended to produce Dictionary Translations for any Locale that lacks them. Sync translates only Source text that changed, never overwrites an existing Translation, and reports Stale translations; an explicit flag regenerates them. Output is written for the owner to review and commit. Adding a Locale becomes: add it to the Locale list, run Sync.

**Spec:** github-sourced-portfolio. ADR 0002. Seam 3 (second part).

**Blocked by:** 07: Sync job copies Screenshots; 10: Dictionary: typed English source with every string moved in; 11: Approve the proofread English bio

**Status:** done

- [x] The Translator interface translates a piece of Source text to a Locale; both adapters satisfy it and can be swapped by configuration
- [x] The Gemini key is read from an environment variable and never committed; a missing key gives a clear error
- [x] A Locale with no Dictionary file gets every entry generated; the result passes the key-parity test
- [x] An existing Translation, including the hand-written Portuguese, is never overwritten
- [x] When English text changes, the matching Translation is reported as stale and left alone; the explicit flag regenerates stale entries
- [x] Unchanged Source text is not sent to the Translator again
- [x] A Translator failure leaves existing files untouched and reports which entries failed
- [x] Tests use a fake GitHub, a fake Translator and an in-memory file store
- [x] Trying a new Locale end to end (list entry plus Sync) is documented in the repo notes

## Comments

Decisions (details in `CLAUDE.md`, "Translator" and "Try a new Locale end to end"):

- **Translator interface:** `translate(text, locale): Promise<string>` in `lib/translator/`, source language fixed to English. `createTranslator(env, fetch?)` selects the adapter from `TRANSLATOR=gemini|libretranslate` (default gemini). Locale tags are plain strings (`es`, `pt-BR`), so the Translator does not depend on the Locale list.
- **Gemini adapter:** REST `generateContent` with an injected `fetch`, key from `GEMINI_API_KEY` in the `x-goog-api-key` header (never in a URL or error), clear error when missing (raised on the first `translate`, so a run with nothing to translate does not need it). Model from `GEMINI_MODEL`, default `gemini-3.5-flash-lite`: Google's pricing page lists it free of charge on the Free Tier and the models page recommends it for new projects (checked 2026-10-29); this is the one model name taken from docs and may need updating. Prompt: translate only, keep product names, code, URLs and placeholders, no commentary. Language names come from `Intl.DisplayNames`. 429/503 are retried (3 attempts). **Never run against the real Gemini API**: no key exists; only the request/response shape was checked against Google's docs (the `x-goog-api-key` header is from memory of the API, not from the page fetched).
- **LibreTranslate adapter:** `LIBRETRANSLATE_URL` (default `http://localhost:5000`), optional `LIBRETRANSLATE_API_KEY`; sends the primary language subtag (`pt-BR` as `pt`).
- **Source hashes:** committed `dictionary/.sync-state.json`, `{ locale: { "Section.Key": sha256(English text) } }`, sorted. Existing Translation with no recorded hash is baselined to the current English hash on first Sync (pt-BR: 20 entries baselined; nothing sent, `pt-BR.ts` untouched, `About.Text` included).
- **File format:** identical to `pt-BR.ts`, so a Sync patch is a small diff. Existing files are rewritten only to add missing keys, and only if they are byte-identical to what Sync would render; otherwise Sync refuses and lists the keys to add by hand. Per Locale it is all or nothing on a Translator failure.
- **Registry:** Sync patches `dictionary/index.ts` itself; if the shape changes it prints the two lines to add. `localeNames` is reported as REQUIRED when missing.
- **Flag scope:** `--regenerate-stale` applies to every Locale (no per-Locale form yet).
- **Verified:** unit tests (offline, fake Translator, fake fetch, in-memory store). End to end with a throwaway `es` Locale and a local fake LibreTranslate server: first `pnpm sync` generated all 20 entries, patched the registry, printed the `localeNames` REQUIRED line; after adding the name, `tsc` and the parity test passed; a second run changed nothing; an English edit was reported Stale for both Locales and left alone, then replaced with `--regenerate-stale`; with the server stopped a new key failed, exit code 1, files untouched. Then reverted (no `es` anywhere). The throwaway also showed two tests outside Sync that spell out the Locale list (cvPath needs `cvLocales`, the revalidate route test); documented as manual steps.
- **Ticket 16 can reuse:** `createTranslator`/`Translator`/`createFakeTranslator`, `hashSourceText`, the missing / baselined / current / stale classification, the all-or-nothing failure rule, `formatTranslationsReport`, and the `TranslationsDeps` pattern for another optional `SyncDeps` dependency.
