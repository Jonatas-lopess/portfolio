# 16: Project summary Translations

**What to build:** Sync also translates each Project summary (the Marked block) into every Locale, recording a hash of the Source text, and the Projects module shows the Translation for the visitor's Locale. When the live Marked block no longer matches the stored hash, the visitor sees the fresh English text instead of an outdated Translation, and Sync reports the entry as stale.

**Spec:** github-sourced-portfolio. ADR 0002.

**Blocked by:** 15: Translator module and Sync translates the Dictionary; 03: Projects from GitHub on the live pages

**Status:** ready-for-agent

- [ ] Sync produces a reviewable Translation per Project per Locale with the Source text hash
- [ ] Existing Translations are never overwritten; changed Source text marks them stale and the report lists them
- [ ] The Projects module returns the Translation when its hash matches the live Marked block
- [ ] When the hash differs, the Project summary is the current English text, in every Locale
- [ ] When there is no Translation, the English text is shown, then the repo description if there is no Marked block
- [ ] Hidden Projects are never sent to the Translator
- [ ] Tests cover current, stale and missing Translations through the Projects module interface and through Sync
