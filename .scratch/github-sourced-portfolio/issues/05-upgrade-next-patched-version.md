# 05: Upgrade Next to a patched version

**What to build:** The site runs on a version of Next that npm no longer flags as having a security vulnerability (13.4.4 is flagged today). Any code changes the upgrade requires are made so the site behaves the same.

**Spec:** github-sourced-portfolio. Bug sweep finding 2. Kept separate because it can require code changes.

**Blocked by:** 01: One package manager (pnpm) and a working lockfile; 04: Remove Supabase

**Status:** ready-for-agent

- [ ] Next (and the matching ESLint config package) are upgraded to a release that clears the vulnerability warning
- [ ] Breaking changes are handled; behavior of routing, middleware rewrites, fetch caching, ISR and the revalidation endpoint is unchanged
- [ ] Typecheck, lint, tests and build all pass
- [ ] A manual run of the dev server shows Home, About, the Projects list and a Project page rendering in both Locales
- [ ] The upgrade notes (what changed and why) are recorded in the ticket
