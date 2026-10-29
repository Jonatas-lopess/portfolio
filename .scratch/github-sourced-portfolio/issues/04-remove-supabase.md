# 04: Remove Supabase

**What to build:** Nothing in the repo depends on Supabase any more. There is no data to migrate, so this is deletion plus the cleanup it implies.

**Spec:** github-sourced-portfolio. Bug sweep findings 3 and 11 (both disappear with this).

**Blocked by:** 03: Projects from GitHub on the live pages

**Status:** done

- [x] The database client, the generated database types file and the old Project and image type definitions are gone
- [x] The Supabase packages and the Supabase CLI dev dependency are removed and the lockfile is updated
- [x] The image host allowance for the Supabase storage domain is removed from the framework config
- [x] No references to Supabase or its environment variables remain in code, docs or `CLAUDE.md`
- [x] A build without any Supabase environment variable succeeds (given the GitHub token)
- [x] Typecheck, lint, tests and build pass

## Comments

Implemented. Verification notes:

- Deleted `app/api/db.ts`, `types_db.ts`, `@types/project_object.d.ts`, `@types/image_object.d.ts` (grep confirmed nothing else imported them). Removed `@supabase/auth-helpers-nextjs`, `@supabase/supabase-js` and the `supabase` CLI via `pnpm remove`; `pnpm-lock.yaml` regenerated (no `supabase` left in it) and the `supabase` entry dropped from `pnpm-workspace.yaml` `allowBuilds`.
- `next.config.js` no longer has an `images` block: every `next/image` source is local (`public/`), so no host allowance is needed.
- `CLAUDE.md`: legacy Supabase section rewritten as the GitHub-sourced description; Supabase env vars removed, `GITHUB_TOKEN` / `GITHUB_API_URL` / `REVALIDATE_KEY` kept.
- `ListItem` and the project pages hold no Supabase-shaped types (`ListItem` takes `{ slug, title }`).
- Ran `pnpm exec tsc --noEmit`, `pnpm lint` (now fully clean), `pnpm test` (53 pass) and `pnpm build` with `GITHUB_TOKEN` and all Supabase vars unset (empty Allowlist): all pass. Not run: a build with a real token against live GitHub (no token available; that remains the human step in ticket 03).
- Remaining `supabase` mentions are history in the spec, ADR 0001, bug-sweep findings, and tickets 03, 04, 05, left on purpose.
