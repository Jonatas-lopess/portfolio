# 07: Sync job copies Screenshots

**What to build:** An owner-run, on-demand Sync command that copies each Allowlisted Project's Screenshot from its repo into this repo's public folder, named after the repo. The owner reviews the new images as a diff and commits them. Nothing from a private repo is ever served from the owner's server. The Sync job's interface takes a GitHub source and a file store so it can be tested with fakes.

**Spec:** github-sourced-portfolio. ADR 0002. Seam 3 (first part).

**Blocked by:** 03: Projects from GitHub on the live pages

**Status:** done

- [x] One command runs Sync using the same GitHub token as the site
- [x] For each Allowlisted Project, the Screenshot at the fixed path in its repo is written to the public folder under the repo's name
- [x] A repo with no Screenshot is skipped and reported, without failing the run
- [x] Running Sync twice with no changes produces no file changes
- [x] The Projects module resolves a copied Screenshot and shows the placeholder otherwise
- [x] Tests cover the above using a fake GitHub and an in-memory file store

## Notes

- Screenshot path in each repo: `docs/screenshot.png` (PNG). Copied to `public/screenshots/<repo>.png`, named by `screenshotPath`.
- Code in `lib/sync/`, CLI in `scripts/sync.ts` (`pnpm sync`, via `tsx`). Tests in `lib/sync/*.test.ts` use a fake GitHub and an in-memory store.
- Verified by running `pnpm sync` twice against a local fake GitHub server: the first run copied, the second reported `unchanged` and left the file (content and mtime) alone. Not verified against real GitHub.
