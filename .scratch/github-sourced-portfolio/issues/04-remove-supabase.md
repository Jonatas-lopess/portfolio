# 04: Remove Supabase

**What to build:** Nothing in the repo depends on Supabase any more. There is no data to migrate, so this is deletion plus the cleanup it implies.

**Spec:** github-sourced-portfolio. Bug sweep findings 3 and 11 (both disappear with this).

**Blocked by:** 03: Projects from GitHub on the live pages

**Status:** ready-for-agent

- [ ] The database client, the generated database types file and the old Project and image type definitions are gone
- [ ] The Supabase packages and the Supabase CLI dev dependency are removed and the lockfile is updated
- [ ] The image host allowance for the Supabase storage domain is removed from the framework config
- [ ] No references to Supabase or its environment variables remain in code, docs or `CLAUDE.md`
- [ ] A build without any Supabase environment variable succeeds (given the GitHub token)
- [ ] Typecheck, lint, tests and build pass
