# 03: Projects listing page

**What to build:** The Projects page matches the "Projects — listing" mockup: breadcrumb, large title with the count, intro line, the "Project index" header row, numbered rows with a circle arrow, and the bottom bar with "Back to top". Hovering or keyboard-focusing a row puts it in the active state shown on the first row of the mockup (tagline, "View project" label, filled circle). The old hover Screenshot reveal is gone from this page. Works in both Locales, both themes and on narrow screens.

**Spec:** new-layout.

**Blocked by:** 01: Site header restyle, 02: Project tagline (translated repo description)

**Status:** done

- [x] Layout and typography match the mockup (breadcrumb, giant title with `(NN)` count, right-aligned intro, "PROJECT INDEX" / "EXPLORE THE WORK" row, rules, bottom bar)
- [x] Rows are in Allowlist order, numbered with zero-padded positions, each row one link (title plus arrow) to the Project page via `localePath`, with the Project's slug encoded
- [x] Active state (hover and keyboard focus) shows the tagline and the "View project" label with the filled arrow circle; Projects without a tagline show none; the state is React state, as before, and nothing queries the document
- [x] Rows are fully usable by keyboard and touch (no hover-only information that is needed to use the page); the count has an accessible label from the Dictionary
- [x] "Back to top" scrolls to the top of the page
- [x] No Screenshots are rendered on this page; the Screenshot-related props and the `md` hidden image pane are removed from `ProjectIndex`
- [x] New strings are in `en.ts` and in every other Locale file (generated with `pnpm sync`, then reviewed); the Dictionary parity test passes
- [x] Light theme and widths below `md` are usable
- [x] Component test or equivalent covers numbering, active state and the tagline-less row; existing ProjectIndex tests are updated
- [ ] `CLAUDE.md` sections on `ProjectIndex` and the Projects page are updated; `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` and `pnpm build` pass
