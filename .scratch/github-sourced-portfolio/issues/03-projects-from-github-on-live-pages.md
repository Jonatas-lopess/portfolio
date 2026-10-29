# 03: Projects from GitHub on the live pages

**What to build:** A GitHub adapter behind the Projects module, and the Projects list page, the Project detail page and static generation all reading from the module instead of Supabase. A visitor sees the Allowlisted Projects with a summary, stack, demo link, optional code link and Screenshot (or a placeholder). The adapter reads with a read-only fine-grained token held only on the server. Pages refresh hourly. The build fails loudly on a bad token or an unreadable Allowlisted repo, and a failed background refresh keeps serving the last good page.

**Spec:** github-sourced-portfolio. ADR 0001. Bug sweep findings 4 and 12.

**Blocked by:** 02: Projects module with an in-memory adapter, plus Vitest

**Status:** ready-for-agent

- [ ] An Allowlist is committed to the repo; entries carry the repo, a Visibility and an optional title
- [ ] Structured fields come from GitHub repo metadata: short description, homepage as the demo link, topics as the stack, repo URL
- [ ] The token is read from a server-only environment variable and never reaches client code
- [ ] The Projects list and detail pages render only Allowlisted Projects through the module
- [ ] Static generation returns the correct dynamic segment key and no longer uses a non-null assertion that can crash the build (fixes the `ProjectName` / `projectName` mismatch)
- [ ] The Project image has a meaningful `alt` text (the display title), not a file name
- [ ] A Project without a Screenshot shows a placeholder
- [ ] Pages revalidate hourly; the protected on-demand endpoint still works
- [ ] The build fails with a clear message if the token is invalid or an Allowlisted repo cannot be read
- [ ] A failed revalidation keeps serving the previous page
- [ ] The adapter is covered by tests against a fake GitHub response; typecheck, lint and build pass with the token set
