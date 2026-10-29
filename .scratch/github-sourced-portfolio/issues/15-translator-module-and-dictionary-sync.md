# 15: Translator module and Sync translates the Dictionary

**What to build:** A Translator module with two adapters, Gemini (free tier, default) and local LibreTranslate, and the Sync job extended to produce Dictionary Translations for any Locale that lacks them. Sync translates only Source text that changed, never overwrites an existing Translation, and reports Stale translations; an explicit flag regenerates them. Output is written for the owner to review and commit. Adding a Locale becomes: add it to the Locale list, run Sync.

**Spec:** github-sourced-portfolio. ADR 0002. Seam 3 (second part).

**Blocked by:** 07: Sync job copies Screenshots; 10: Dictionary: typed English source with every string moved in; 11: Approve the proofread English bio

**Status:** ready-for-agent

- [ ] The Translator interface translates a piece of Source text to a Locale; both adapters satisfy it and can be swapped by configuration
- [ ] The Gemini key is read from an environment variable and never committed; a missing key gives a clear error
- [ ] A Locale with no Dictionary file gets every entry generated; the result passes the key-parity test
- [ ] An existing Translation, including the hand-written Portuguese, is never overwritten
- [ ] When English text changes, the matching Translation is reported as stale and left alone; the explicit flag regenerates stale entries
- [ ] Unchanged Source text is not sent to the Translator again
- [ ] A Translator failure leaves existing files untouched and reports which entries failed
- [ ] Tests use a fake GitHub, a fake Translator and an in-memory file store
- [ ] Trying a new Locale end to end (list entry plus Sync) is documented in the repo notes
