# 07: Sync job copies Screenshots

**What to build:** An owner-run, on-demand Sync command that copies each Allowlisted Project's Screenshot from its repo into this repo's public folder, named after the repo. The owner reviews the new images as a diff and commits them. Nothing from a private repo is ever served from the owner's server. The Sync job's interface takes a GitHub source and a file store so it can be tested with fakes.

**Spec:** github-sourced-portfolio. ADR 0002. Seam 3 (first part).

**Blocked by:** 03: Projects from GitHub on the live pages

**Status:** ready-for-agent

- [ ] One command runs Sync using the same GitHub token as the site
- [ ] For each Allowlisted Project, the Screenshot at the fixed path in its repo is written to the public folder under the repo's name
- [ ] A repo with no Screenshot is skipped and reported, without failing the run
- [ ] Running Sync twice with no changes produces no file changes
- [ ] The Projects module resolves a copied Screenshot and shows the placeholder otherwise
- [ ] Tests cover the above using a fake GitHub and an in-memory file store
