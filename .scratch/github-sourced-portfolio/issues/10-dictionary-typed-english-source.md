# 10: Dictionary: typed English source with every string moved in

**What to build:** English is the typed, hand-edited source of the Dictionary, and its type is the single definition of the shape. Every other Locale is a separate reviewable file. Every user-visible string lives in the Dictionary, including the strings that are hard-coded today: the "Links" heading on the About page, the page title and description (Portuguese only today), and the "project not found" message. The existing hand-written Portuguese is kept and treated as an existing Translation. The old UI label "Resume" becomes "Project summary".

**Spec:** github-sourced-portfolio. ADR 0002. Bug sweep findings 7 and 9.

**Blocked by:** 09: Locale module

**Status:** ready-for-agent

- [ ] The English Dictionary is the typed source; the ambient interface for the Dictionary shape is removed
- [ ] The Portuguese Dictionary is preserved with its current wording, in the generated-Locale file layout
- [ ] The page title and description differ per Locale
- [ ] The About links heading and the not-found message come from the Dictionary, and a missing Project shows a translated not-found state
- [ ] "Resume" (meaning Project summary) is renamed to match `GLOSSARY.md`
- [ ] A test fails if any Locale's Dictionary is missing a key or has an extra one compared with English
- [ ] No user-visible string remains hard-coded in pages or modules
