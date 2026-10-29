# TODO

Summary of `.scratch/`. Source of truth is each ticket's `Status:` and `Blocked by:` line; keep this file in sync when they change (see `docs/agents/issue-tracker.md`).

## Efforts

- **github-sourced-portfolio** (`.scratch/github-sourced-portfolio/`): read Projects from GitHub instead of Supabase, add generated multi-locale support. Spec in `spec.md`, decisions in `docs/adr/`, vocabulary in `GLOSSARY.md`.
- **bug-sweep** (`.scratch/bug-sweep/findings.md`): 12 findings from a 2026-10-29 sweep. No tickets of its own; every finding is folded into the tickets above (map at the bottom of `findings.md`).

## Tickets (github-sourced-portfolio)

All `ready-for-agent` unless noted (01, 02 and 03 are `done`). Numbers are ticket files in `.scratch/github-sourced-portfolio/issues/`.

| # | Ticket | Blocked by | Bug sweep |
|---|---|---|---|
| 01 | One package manager (pnpm) and a working lockfile (`done`) | none | 1 |
| 02 | Projects module with an in-memory adapter, plus Vitest (`done`) | 01 | |
| 03 | Projects from GitHub on the live pages (`done`) | 02 | 4, 12 |
| 04 | Remove Supabase | 03 | 3, 11 |
| 05 | Upgrade Next to a patched version | 01, 04 | 2 |
| 06 | Revalidation covers the Locale pages and project pages | 03 | 10 |
| 07 | Sync job copies Screenshots | 03 | |
| 08 | Project index with React hover state | 03, 09 | 6 |
| 09 | Locale module | 02 | 5 |
| 10 | Dictionary: typed English source with every string moved in | 09 | 7, 9 |
| 11 | Approve the proofread English bio (`ready-for-human`) | 10 | |
| 12 | Language switcher dropdown | 09 | |
| 13 | Profile links module with accessible names | 10 | 8 |
| 14 | Accessible theme toggle | 10 | 8 |
| 15 | Translator module and Sync translates the Dictionary | 07, 10, 11 | |
| 16 | Project summary Translations | 03, 15 | |

## Start here

01, 02 and 03 are done. Next: 09 (Locale module), then 04, 06, 07 and 08 as their blockers clear.

## Human steps

- 03: add the repos to show to `projects.allowlist.ts` and set `GITHUB_TOKEN` (fine-grained, read-only metadata and contents, limited to those repos) in the deploy environment. Add `<!-- portfolio:start -->` / `<!-- portfolio:end -->` to each README.
- 11: approve the proofread English bio (blocks 15 and so 16).
