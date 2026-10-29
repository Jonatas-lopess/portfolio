# New layout (header, Projects listing, Project page)

The owner designed a new look for the header, the Projects page and the Project page. Mockups (dark theme, desktop) are in `designs/`:

- `Projects — listing.png`: header, Projects listing.
- `Projects — SIGA Erp detail.png`: header, Project page (example Project: SIGA Erp, 01 of 04).

Home and About are not redesigned; they only pick up the new header and page width.

## What the designs show

**Header (every page).** Home / Projects / About on the left, the active link in full white weight with a short underline; a divider line under the bar; the Locale select with a chevron, a thin vertical separator, then the theme icon on the right. Content sits in a centered column with generous side gutters.

**Projects listing.**
- Mono breadcrumb "PORTFOLIO / SELECTED WORK".
- Very large "Projects" title with the count as a small superscript "(04)"; a short intro line right-aligned.
- Mono row "PROJECT INDEX" on the left, "EXPLORE THE WORK ↙" on the right, then a rule.
- One row per Project: zero-padded index (01..04), large title, a circle arrow button at the right, rules between rows. The first row is shown in its active state: it also shows the tagline ("Offline-first ERP for Brazilian retail") and a "View project" label, and its arrow circle is filled. Treat this as the hover/focus state (it replaces the old hover Screenshot reveal); the other rows show title and arrow only.
- Bottom bar: mono "PORTFOLIO / PROJECTS" and "Back to top ↑".
- No Screenshots on this page any more.

**Project page.**
- "← All projects" at the left, mono "PROJECT 01 / 04" at the right.
- Huge title; the tagline at the right.
- Two columns: left "01 Project summary" (the summary text) and "02 Project Stack" (topics as bordered mono chips); right a cover (see below) with a mono caption row under it.
- "CONTINUE EXPLORING" with "NEXT / 02 Ai_harness →" (the next Project in Allowlist order).
- Bottom bar: mono "PROJECTS / SIGA Erp" and "All projects ←".
- The design shows no Code/Visit buttons (SIGA Erp has neither). Keep them for Projects that have them, placed with the summary column.
- Cover: a generated "typographic" cover (title split into a large first word and a smaller remainder, thin grid lines, mono corner labels, an arrow). It is the cover used when a Project has no Screenshot; when it has one, the Screenshot is shown as the cover.

## Decisions (owner, 2026-10-29)

- **Tagline** = the repo's short GitHub description. It is **translated by Sync** per Locale with the same hash / Stale flow as the Project summary. It replaces the "the short description is never translated" rule in CLAUDE.md. A Project with no description shows no tagline (the row and hero simply omit it).
- **Category** ("Desktop app" in the mockups) is **dropped**; no data source exists for it.
- **Screenshot**: kept. Used as the cover when present; otherwise the typographic cover replaces `SCREENSHOT_PLACEHOLDER` (the SVG placeholder). Sync and the Screenshot path are untouched.
- **Cover corner labels** are derived from existing data (title, position, stack topics); no new per-Project fields.

## Not designed (the implementing tickets must handle these sensibly)

- Light theme: the site has class-based dark mode and the light theme must stay usable. Reuse the existing light palette; do not invent a new one.
- Mobile / narrow widths: the listing and Project page must work below `md` (stack the columns, keep rows tappable).
- New strings (breadcrumbs, "Explore the work", "View project", "Back to top", "All projects", "Continue exploring", "Next", "Project", intro line, ...) go in the Dictionary: `en.ts` by hand, other Locales through `pnpm sync` (see CLAUDE.md).

## Out of scope

Home and About redesign, Screenshot Sync changes, new Locales.
