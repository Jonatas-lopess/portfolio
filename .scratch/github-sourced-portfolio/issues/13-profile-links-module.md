# 13: Profile links module with accessible names

**What to build:** The LinkedIn, GitHub and CV links are defined once and rendered in two presentations: icons only on the Home page and labelled on the About page. Every link has an accessible name, translated for the CV link. Changing a URL touches one place.

**Spec:** github-sourced-portfolio. Bug sweep finding 8 (part).

**Blocked by:** 10: Dictionary: typed English source with every string moved in

**Status:** ready-for-agent

- [ ] LinkedIn, GitHub and CV URLs exist in exactly one place
- [ ] The Home page shows the icon-only presentation and the About page shows the labelled presentation, both from the same module
- [ ] Every icon link has an accessible name; the CV name comes from the Dictionary
- [ ] The CV download still works from both pages
- [ ] The visual result matches today's pages
