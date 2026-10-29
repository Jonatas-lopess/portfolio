# 04: Project page layout

**What to build:** The Project page matches the "Projects — SIGA Erp detail" mockup apart from the generated cover: "All projects" back link and "PROJECT 01 / 04" position, huge title with the tagline at the right, numbered "Project summary" and "Project Stack" sections with the stack as bordered mono chips, a "Continue exploring" link to the next Project, and the bottom bar. The Screenshot (or the existing placeholder, until ticket 05) is shown in the cover slot. Code and Visit buttons stay for Projects that have them.

**Spec:** new-layout.

**Blocked by:** 01: Site header restyle, 02: Project tagline (translated repo description)

**Status:** ready-for-agent

- [ ] Layout matches the mockup (back link and position, hero, two columns, chips, "Continue exploring" row, bottom bar with the Project name and "All projects")
- [ ] The position is the Project's place in Allowlist order out of the total; "Next" is the following Project and wraps from the last to the first; with a single Project the next link is omitted
- [ ] Code and Visit buttons appear in the summary column only when the Project has a code URL / demo URL (a Project with neither shows none), keeping their current rules (code link only for `full` visibility and a public repo)
- [ ] A Project without a tagline or without stack topics omits that element without leaving an empty block
- [ ] An unknown slug still gives the translated not-found state (`notFound()`), and links use `localePath`
- [ ] The cover slot shows the Screenshot when there is one and `SCREENSHOT_PLACEHOLDER` otherwise (replaced in ticket 05)
- [ ] New strings are in `en.ts` and every other Locale file (via `pnpm sync`, then reviewed); the Dictionary parity test passes
- [ ] Light theme and widths below `md` (columns stack) are usable
- [ ] Tests cover position / next (including wrap and single Project); `CLAUDE.md` Project page notes and `TODO.md` are updated
- [ ] `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` and `pnpm build` pass
