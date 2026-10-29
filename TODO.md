# TODO

Summary of `.scratch/`. Source of truth is each ticket's `Status:` and `Blocked by:` line; keep this file in sync when they change (see `docs/agents/issue-tracker.md`).

## Efforts

- **github-sourced-portfolio** (`.scratch/github-sourced-portfolio/`): read Projects from GitHub instead of Supabase, add generated multi-locale support. Spec in `spec.md`, decisions in `docs/adr/`, vocabulary in `GLOSSARY.md`.
- **bug-sweep** (`.scratch/bug-sweep/findings.md`): 12 findings from a 2026-10-29 sweep. No tickets of its own; every finding is folded into the tickets above (map at the bottom of `findings.md`).

## Tickets (github-sourced-portfolio)

All `ready-for-agent` unless noted (01, 02, 03, 04, 05, 07, 08, 09, 10, 12, 13 and 14 are `done`; 06 is `ready-for-human`). Numbers are ticket files in `.scratch/github-sourced-portfolio/issues/`.

| # | Ticket | Blocked by | Bug sweep |
|---|---|---|---|
| 01 | One package manager (pnpm) and a working lockfile (`done`) | none | 1 |
| 02 | Projects module with an in-memory adapter, plus Vitest (`done`) | 01 | |
| 03 | Projects from GitHub on the live pages (`done`) | 02 | 4, 12 |
| 04 | Remove Supabase (`done`) | 03 | 3, 11 |
| 05 | Upgrade Next to a patched version (`done`, Next 15.5.28) | 01, 04 | 2 |
| 06 | Revalidation covers the Locale pages and project pages (`ready-for-human`: code done, deployed-site check left) | 03 | 10 |
| 07 | Sync job copies Screenshots (`done`) | 03 | |
| 08 | Project index with React hover state (`done`) | 03, 09 | 6 |
| 09 | Locale module (`done`) | 02 | 5 |
| 10 | Dictionary: typed English source with every string moved in (`done`) | 09 | 7, 9 |
| 11 | Approve the proofread English bio (`done`) | 10 | |
| 12 | Language switcher dropdown (`done`) | 09 | |
| 13 | Profile links module with accessible names (`done`) | 10 | 8 |
| 14 | Accessible theme toggle (`done`) | 10 | 8 |
| 15 | Translator module and Sync translates the Dictionary | 07, 10, 11 | |
| 16 | Project summary Translations | 03, 15 | |

## Start here

01 to 05, 07 to 14 are done. 06 is done apart from the owner's check on the deployed site. 11 is done. Next: 15, then 16.

## Human steps

- 03: add the repos to show to `projects.allowlist.ts` and set `GITHUB_TOKEN` (fine-grained, read-only metadata and contents, limited to those repos) in the deploy environment. Add `<!-- portfolio:start -->` / `<!-- portfolio:end -->` to each README.
- 06: on the deployed site, set `REVALIDATE_KEY`, edit a README or description, then `curl -X POST https://<site>/api/revalidate -H 'x-revalidate-key: <key>'` and confirm both Locales' list and Project pages show the change. Switch any existing caller from the deprecated `revalidate_key` header to `x-revalidate-key` (nginx drops underscore headers by default). Not verifiable from the repo.
- 07: commit a PNG at `docs/screenshot.png` in each repo to show, then run `GITHUB_TOKEN=... pnpm sync` and commit the new files in `public/screenshots/`. Not run against real GitHub yet.
