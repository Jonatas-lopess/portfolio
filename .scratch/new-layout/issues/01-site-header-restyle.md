# 01: Site header restyle

**What to build:** Every page shows the new header from the mockups: Home / Projects / About with the active page marked (full-brightness text and a short underline), a divider line under the bar, and on the right the Locale select with a chevron, a thin separator, then the theme toggle icon. Pages sit in a centered content column with the mockups' generous side gutters, and the mono font used for labels (breadcrumbs, counts, chips) is available to the pages that follow.

**Spec:** new-layout.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The header matches the "Projects — listing" and "Projects — SIGA Erp detail" mockups (spacing, divider, active-link treatment, separator between the Locale select and the theme icon)
- [ ] The active link is derived from the current path in either Locale, including on a Project page (Projects stays active); it carries `aria-current="page"`
- [ ] The Locale select still lists every Locale by native name, switches to the same page in that Locale, and keeps its accessible name; the theme toggle keeps its accessible name and `aria-pressed`
- [ ] No hard-coded Locale, no relative hrefs (links built with `localePath`)
- [ ] Works in light and dark theme and below `md` (the bar does not overflow at narrow widths)
- [ ] Home and About still render and look intact inside the new column
- [ ] A mono font is loaded through `next/font` and exposed to Tailwind for the following tickets
- [ ] `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit` and `pnpm build` pass
