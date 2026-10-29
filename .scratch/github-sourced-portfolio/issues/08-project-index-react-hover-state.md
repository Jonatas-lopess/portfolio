# 08: Project index with React hover state

**What to build:** The Projects page's list of Project names reveals the matching Screenshot on hover, with the state held in React rather than a document query on `alt` text. One client module receives the Projects, each with its Screenshot, and owns the list, the images and the hover state. Links carry the current Locale. Only Allowlisted Projects' images are rendered, instead of every file in a storage bucket.

**Spec:** github-sourced-portfolio. Bug sweep finding 6.

**Blocked by:** 03: Projects from GitHub on the live pages; 09: Locale module

**Status:** done

- [x] Hovering (and keyboard-focusing) a Project name shows that Project's Screenshot and hides it again afterwards
- [x] The implementation no longer relies on matching `alt` text or on a document selector
- [x] Each link goes to the Project page in the current Locale, via the Locale module's path building, and navigates without a full page reload
- [x] Only Screenshots of listed Projects are rendered; a Project without one shows the placeholder
- [x] The Project count shown next to the title matches the number listed
- [x] The page works on a touch device (no hover) by still letting the visitor open each Project

## Comments

Built `components/ProjectIndex.tsx` (client; `useState` of the active slug, mouse enter/leave and focus/blur) and removed `components/ListItem.tsx` and the `#list-images`/`alt` contract. Verified with tsc, lint, 118 tests, a production build and `next start` against a fake GitHub server with two Allowlist entries (one with a Screenshot): link hrefs are Locale-prefixed in both Locales, images exist only for the two listed Projects (placeholder for the one without a Screenshot), `alt` is the display title, count is 2. In headless Chromium (driven over CDP): hovering shows and un-hovers the image, Tab focus shows it and Tab to the next link or out of the list hides it, and clicking a link navigates client-side without a full reload. Not tested on a real touch device or with touch emulation; the touch criterion rests on the links being always rendered and clickable (the image pane is `invisible` below `md`, as before).
