# 05: Typographic Project cover

**What to build:** A Project without a Screenshot shows the generated typographic cover from the mockup in the Project page's cover slot instead of the SVG placeholder: title split into a large first word and a smaller remainder, thin grid lines, mono corner labels and an arrow, with the mono caption row under it. A Project with a Screenshot still shows the Screenshot there.

**Spec:** new-layout.

**Blocked by:** 04: Project page layout

**Status:** done

- [x] The cover matches the mockup's look for the example Project (large first word, smaller rest, grid, arrow, caption row)
- [x] Corner labels are derived from existing data only: title and position at the top, the first stack topics (or nothing) at the bottom; no new per-Project fields, nothing hard-coded per Project
- [x] Single-word titles, long titles and titles with underscores (such as `ai_harness`) render without overflow
- [x] The cover is decorative or labelled correctly for assistive tech (the title is already the page heading); no duplicated announcement
- [x] Works in light and dark theme and below `md`
- [x] When the Project has a Screenshot, the Screenshot is shown as before; `SCREENSHOT_PLACEHOLDER` and its SVG are removed once nothing uses them
- [x] A test covers title splitting and label derivation (pure function), including the edge cases above
- [x] `CLAUDE.md` mentions of the placeholder and `TODO.md` are updated; `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` pass
- [ ] `pnpm build` passes (not run)
