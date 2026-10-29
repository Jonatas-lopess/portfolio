# 06: Revalidation covers the Locale pages and project pages

**What to build:** Calling the protected revalidation endpoint refreshes every Locale's Projects list and every Project page, so edits appear without a redeploy. Today it revalidates a literal dynamic pattern, which may not match `/en/projects` or `/pt-BR/projects`, and it does not touch Project pages at all. The endpoint's secret header name contains an underscore, which some proxies drop; decide whether to keep it.

**Spec:** github-sourced-portfolio. Bug sweep finding 10 (needs verification on a real deployment).

**Blocked by:** 03: Projects from GitHub on the live pages

**Status:** ready-for-human

- [x] After a change in GitHub and a call to the endpoint, the Projects list in each Locale shows it on the next request
- [x] The same holds for a Project detail page in each Locale
- [x] A request with a missing or wrong key still gets a 401 and refreshes nothing
- [x] The header name is checked against the hosting proxy; if it can be dropped, it is renamed and the change is documented
- [x] Verified against a running production build, not only the dev server
- [ ] Owner confirms on the deployed site (see Comments)

## Comments

### Implementation (agent)

**Mechanism.** Per the Next docs, `revalidatePath` on a dynamic pattern (`/[lang]/projects`) without a `type` "has no effect by default", so the old route did nothing for `/en/projects`, `/pt-BR/projects`, or the detail pages. Now:

- `lib/projects/github.ts` tags every GitHub fetch with `PROJECTS_CACHE_TAG = "projects"` (alongside `revalidate: 3600`); tests updated.
- `app/api/revalidate/route.ts` calls `revalidateTag("projects")` and also `revalidatePath` on each concrete path: `/{locale}/projects` and `/{locale}/projects/{slug}` for every Locale in `locales` and every slug from `listSlugs()`. The response lists the paths.
- Auth: still POST-only, 401 on a missing or wrong key and nothing is refreshed. The compare is constant time (sha256 of both sides, then `timingSafeEqual`), and an unset or empty `REVALIDATE_KEY` never authorizes (no `undefined === undefined`).
- Header: new name `x-revalidate-key` (no underscore). `revalidate_key` is still accepted for backward compatibility and is deprecated; `x-revalidate-key` wins if both are sent. Rationale: nginx drops headers with underscores by default (`underscores_in_headers off`), and some other proxies do too. Whether the owner's host/proxy drops it was not checked (see below), so the safe move was to add the underscore-free name rather than guess.
- `route.test.ts`: 12 unit tests (valid key, both header names, wrong/missing/empty/different-length key, unset/empty env, no dynamic pattern, 500 path) with `next/cache` mocked; no network.

**Observed, on a production build** (`pnpm build && pnpm start` on port 3456, a local fake GitHub server via `GITHUB_API_URL`, `GITHUB_TOKEN=x`, a temporary `{ repo: "demo" }` Allowlist entry, since reverted). The detail pages show the README text; the list page shows only the title and count, so a temporary `data-probe` attribute carrying the summary was added to the list page for the check and reverted.

- Bumped the fake repo's README and description, requested all of `/en/projects`, `/pt-BR/projects`, `/en/projects/demo`, `/pt-BR/projects/demo`: all four still showed the old content before revalidation (cached, fake server not hit).
- `POST` with a wrong key and with no key: 401, pages unchanged, fake server not hit.
- `POST` with `x-revalidate-key`: 200; the first request to each of the four pages afterwards already showed the new content (fresh, not stale-then-fresh), and a second request showed the same. The fake server was hit again (4 fetches total over the run), so the data really was refetched.
- `POST` with the legacy `revalidate_key` header: 200 and refetched.
- `GET` gives 405.
- I did not try the tag alone or the paths alone, so I do not know which of the two did the work; both are called.

**Not verified (assumed).** I cannot reach the owner's deployed host from here, so these are unverified: that the revalidate call works on the real deployment (hosting platform behavior, e.g. a CDN cache in front of Next could still serve the old page), and whether the host's proxy drops `revalidate_key`. Also untested: a real GitHub response (fake server only), and the stale-while-revalidate behavior on a host with several instances. The ticket stays `ready-for-human` only for the owner's deployed-site check; the code work is done.

**Owner steps.** After deploying, set `REVALIDATE_KEY`, change a README or description between the `portfolio:start`/`end` markers, then `curl -X POST https://<site>/api/revalidate -H 'x-revalidate-key: <key>'` and confirm `/en/projects/<slug>` and `/pt-BR/projects/<slug>` show the change on the next load. Update any existing caller (webhook, script) to `x-revalidate-key` when convenient.
