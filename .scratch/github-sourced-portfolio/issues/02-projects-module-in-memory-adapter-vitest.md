# 02: Projects module with an in-memory adapter, plus Vitest

**What to build:** A Projects module whose interface lists Projects for a Locale, gets one Project by slug, and lists slugs. It applies every rule from the spec: Allowlist membership (unlisted repos are Hidden), Visibility (Full or Showcase, defaulting to Showcase), the code link only for Full on a public repo, the optional title override, the Marked block as the only source of the Project summary, and the fallback chain from Translation to Source text to the repo's short description. It sits on a seam with an in-memory adapter so all of it can be tested without network. A test runner is added to the repo as part of this ticket.

**Spec:** github-sourced-portfolio. Seam 1.

**Blocked by:** 01: One package manager (pnpm) and a working lockfile

**Status:** done

- [x] A test runner (Vitest) is installed and runnable with a single script; tests need no network
- [x] Hidden Projects (not on the Allowlist) never appear in any listing or lookup
- [x] New entries default to Showcase; a Showcase Project never exposes a code link
- [x] A Full Project exposes a code link only when its repo is reported public
- [x] The title override replaces the repo name as the display title; the slug stays the repo name
- [x] Marked block extraction works, and a missing, empty or malformed marker falls back to the repo's short description; text outside the markers is never returned
- [x] Fallback order for a Locale is: current Translation, else Source text, else short description; a Translation whose stored Source hash no longer matches counts as stale and is skipped
- [x] A Project with no Screenshot reports that, so callers can show a placeholder
- [x] Slug listing returns only Allowlisted Projects
- [x] Tests cross the module interface only, using the in-memory adapter
