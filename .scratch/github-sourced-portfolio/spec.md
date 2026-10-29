Status: ready-for-agent

# GitHub-sourced, multi-locale portfolio

## Problem Statement

The owner's portfolio reads its Projects from a Supabase database and storage bucket. That duplicates details that already live in each Project's GitHub repo, adds a service to maintain, and currently holds no data at all. The owner's work includes private and commercial repos: the site must be able to present them without ever exposing their code, and without accidentally leaking anything from a README written for people who already have access.

The site is also only usable in two Locales, with text hard-coded in places (a Portuguese-only page title, an English-only "Links" heading), a two-way language toggle that cannot grow past two languages, and project descriptions that exist in one language. Adding a language today means editing many files and hand-translating everything.

Several modules are shallow and leak across their seams: three callers reach straight into the database client, Locale knowledge is spread over about seven files, the Project index and its images are joined by a DOM selector on `alt` text, and the LinkedIn, GitHub and CV links are duplicated.

## Solution

Projects are read from GitHub. The owner keeps a public Allowlist in this repo naming which repos may appear and at what Visibility. For each listed repo the site reads structured facts from GitHub repo metadata and the Project summary from one Marked block in the README, using a read-only token held only on the server. Nothing outside the Marked block is ever shown. Repos not on the Allowlist are Hidden. A code link appears only for Full Projects whose repo GitHub reports as public. Private repos stay private; people who should read the code get Code access through GitHub invites.

English is the Source text for everything. An owner-run Sync job copies Screenshots into this repo and produces Translations for the Project summaries and the Dictionary through a swappable Translator (free Gemini tier by default, local LibreTranslate as a second adapter). The owner reviews the diff and commits. The running site only reads committed files and never calls a translation service. Adding a Locale becomes: add it to the Locale list, run Sync, review.

Three modules are deepened behind small interfaces: Projects, Locale and Translator (inside Sync). The Project index and Profile links are rebuilt on top of them. Supabase is removed.

## User Stories

### Visitors

1. As a visitor, I want to see a list of the owner's projects, so that I can quickly judge the owner's work.
2. As a visitor, I want hovering a project name to reveal its screenshot, so that I get a feel for the project without opening it.
3. As a visitor, I want each project to open to a page with a summary, stack, screenshot and links, so that I understand what it is.
4. As a visitor, I want a demo link on projects that have one, so that I can try the project myself.
5. As a visitor, I want a code link only on projects whose code is actually public, so that I never click through to a dead or access-denied page.
6. As a visitor, I want a project with no screenshot to show a placeholder instead of a broken image, so that the page still looks intentional.
7. As a visitor, I want the site in my browser's language when it is supported, so that I can read it without switching.
8. As a visitor, I want to switch language from a dropdown of language names written in their own language, so that I can find mine even if I cannot read the current one.
9. As a visitor, I want the language I picked to stay as I navigate between pages, so that I am not bounced back to another language.
10. As a visitor, I want project text in my language, so that I understand it fully.
11. As a visitor, I want to see correct English text rather than an outdated translation when a project's text has changed, so that I am never told something that is no longer true.
12. As a visitor, I want the page title and description to be in my language, so that search results and browser tabs make sense.
13. As a visitor, I want a friendly, translated "project not found" page for a project that does not exist, so that I know where I am.
14. As a visitor, I want the navigation links to work from every page, including deep project pages, so that I never land on a broken URL.
15. As a visitor, I want to toggle light and dark themes with a control that works for keyboard and screen readers, so that the site is comfortable and accessible.
16. As a visitor using a screen reader, I want the LinkedIn, GitHub and CV links to have names, so that I know what each icon does.
17. As a visitor, I want to download the owner's CV from the home and about pages, so that I can share it with colleagues.
18. As a visitor, I want the About page to read naturally in my language, so that the owner's introduction is credible.

### The owner

19. As the owner, I want to decide which of my repos appear on the site in one public list, so that nothing appears by accident.
20. As the owner, I want a repo that is not on the list to be completely absent, including its name, so that commercial projects are not even hinted at.
21. As the owner, I want new Allowlist entries to default to Showcase, so that I opt in to showing code rather than opting out.
22. As the owner, I want a Full entry to show a code link only if GitHub reports the repo public, so that making a mistake in the list cannot link to a private repo.
23. As the owner, I want to override a Project's display title, so that a badly named repo reads well as a heading.
24. As the owner, I want the Project summary to come only from a block I mark in the README, so that nothing sensitive in the README can reach the site.
25. As the owner, I want a repo without a Marked block to show only its GitHub description, so that the site degrades safely instead of failing.
26. As the owner, I want the markers to be invisible when GitHub renders the README, so that my READMEs stay as they are.
27. As the owner, I want structured fields (description, demo link, stack, repo link) to come from GitHub metadata, so that I maintain them in one place.
28. As the owner, I want the site to read private repos with a read-only token limited to the listed repos, so that a leaked token cannot do damage.
29. As the owner, I want the token never to reach a browser, so that visitors cannot use it.
30. As the owner, I want to give a specific recruiter Code access with a GitHub invite, so that I can control who reads a commercial repo without building a login.
31. As the owner, I want the build to fail loudly if the token is bad or a listed repo cannot be read, so that I never deploy an empty site.
32. As the owner, I want a failed background refresh to keep serving the last good page, so that a GitHub outage does not show visitors an error.
33. As the owner, I want pages to refresh hourly and also on demand through the existing protected endpoint, so that edits appear without a redeploy.
34. As the owner, I want to run one command that copies Screenshots from my repos into this repo, so that I can control exactly which images go public.
35. As the owner, I want to review every copied image and translation as a diff before committing, so that nothing machine-made goes public unseen.
36. As the owner, I want Sync to translate only text that changed, so that I stay inside free quotas and do not re-review unchanged text.
37. As the owner, I want Sync never to overwrite a Translation that already exists, including my hand-written Portuguese, so that my wording is safe.
38. As the owner, I want Sync to report Stale translations and regenerate them only when I explicitly ask, so that I decide when my wording is replaced.
39. As the owner, I want to add a new language by adding it to one list and running Sync, so that expanding the site is cheap.
40. As the owner, I want to choose between a hosted free translator and a local one, so that I can keep commercial text on my machine if I prefer.
41. As the owner, I want my About bio proofread in English first, so that errors are not translated into every language.
42. As the owner, I want a test to fail if any Locale is missing a Dictionary key, so that a page never shows blank text.
43. As the owner, I want the site free of any dependency on a particular host, so that I can move off Vercel later.
44. As the owner, I want Supabase and everything that depends on it removed, so that there is nothing left to maintain or secure.

### Maintainers and future agents

45. As a maintainer, I want one Projects module with a small interface, so that pages, static generation and tests all use it the same way.
46. As a maintainer, I want an in-memory adapter for Projects, so that I can test every rule without network access.
47. As a maintainer, I want all Locale knowledge in one module, so that adding a Locale or changing how links carry it is a change in one place.
48. As a maintainer, I want the Project index to own its hover state in React, so that its behavior no longer depends on matching `alt` text.
49. As a maintainer, I want the profile links defined once, so that changing a URL touches one place.
50. As a maintainer, I want a test runner in the repo, so that these behaviors are verified rather than assumed.

## Implementation Decisions

- **Source of project content (see ADR 0001).** Each Project is one GitHub repo named on the Allowlist. Visibility is `full` or `showcase`; Hidden is the absence of an entry. New entries default to Showcase. An optional title override is allowed per entry. The slug is the repo name.
- **Structured fields** come from GitHub repo metadata: short description, homepage (demo link), topics (stack) and repo URL. The code link is exposed only when the entry is Full and GitHub reports the repo as public.
- **Project summary** comes only from the README's Marked block, delimited by an HTML-comment start marker and end marker. Without markers, only the repo's short description is shown. The full README is never rendered.
- **Projects module.** Interface: list Projects for a Locale, get one Project by slug for a Locale, and list slugs for static generation. It resolves Visibility, the title override, the code-link rule, the Screenshot location (or a placeholder), the Marked block, and Locale fallback. Behind its seam are two adapters: GitHub and in-memory. It takes the Locale as an argument until the Locale module lands, then uses it.
- **Fallback chain for Project summary:** the Translation for the requested Locale if it is current, else the Source text from the live README, else the repo's short description. A Translation is current only if the stored hash of its Source text matches the live Marked block.
- **GitHub access.** A fine-grained read-only token (metadata and contents) limited to Allowlisted repos, supplied through a server-only environment variable and never exposed to the client. Calls use the framework's fetch caching with an hourly revalidation, and the existing protected on-demand revalidation endpoint stays.
- **Failure behavior.** Build-time: fail loudly on a bad token or an unreadable Allowlisted repo. Runtime: a failed revalidation keeps the last good page. This also removes the current non-null assertion that crashes static generation.
- **Screenshots.** One image per Project at a fixed path in the Project's repo. The Sync job copies it into this repo's public folder, named after the repo. A Project without one gets a placeholder. No image from a private repo is ever served from the owner's server.
- **Locale module.** Owns the Locale list, default Locale, negotiation from the Accept-Language header, Dictionary lookup with fallback to English for unknown Locales, building a Locale-prefixed path, and switching a path to another Locale. Middleware, the root layout, navigation, the switcher and all pages call it. The root layout no longer imports from middleware. All links carry the Locale explicitly, which fixes the relative navigation links and the Locale-less project links.
- **Dictionary.** English is the typed, hand-edited source; its type is the single definition of the shape. Every other Locale is a generated, reviewable file. Every user-visible string moves into the Dictionary, including the About links heading and the per-Locale page title and description. A new Locale needs no code change beyond the Locale list.
- **Language switcher.** A dropdown of every Locale by its native name replaces the two-way toggle.
- **Project index.** One client module receives Projects (each with its Screenshot) and keeps hover state, with links that carry the Locale. It replaces the DOM selector contract. Only Allowlisted Projects' images are rendered, instead of every file in a bucket.
- **Profile links.** One module owns the LinkedIn, GitHub and CV links and renders them in an icons-only presentation (Home) and a labelled presentation (About). Links are given accessible names.
- **Translator module and Sync job (see ADR 0002).** Interface: translate a piece of Source text to a Locale. Adapters: Gemini free tier (default) and local LibreTranslate. The Sync job takes a GitHub source, a Translator and a file store; it copies Screenshots, then for each Project summary and each Dictionary entry translates only when the Source text hash differs from the stored one and no Translation exists. It never overwrites an existing Translation; a changed Source text marks an existing Translation as stale and is reported. An explicit flag regenerates stale entries. Output is written for review and committed by the owner. The existing hand-written Portuguese Dictionary is treated as existing Translations.
- **Source text proofreading.** The English About bio is corrected once before any translation; the correction is drafted for the owner's approval and not applied without it.
- **Supabase removal.** The database client, generated database types, Supabase packages, the image host allowance and the Supabase environment variables are removed. There is no data to migrate.
- **Hosting.** Only standard framework features and environment variables are used so the site can move host without code changes.
- **Vocabulary.** Terms follow `GLOSSARY.md`. The UI label that meant Project summary is no longer called "Resume".

## Testing Decisions

- A good test crosses a module's interface and asserts observable behavior: what a caller gets back, what is written, what is reported. It does not assert on private helpers, call order, or markup structure.
- There is no test runner or prior art in the repo, so a runner is added as part of the first step. All tests run without network access.
- **Seam 1, Projects module interface**, tested with the in-memory adapter: Allowlist membership and Hidden Projects; Visibility rules including the code link appearing only for Full on a public repo; default Visibility; title override; Marked block extraction, including missing, empty and malformed markers; fallback order for Locale and Stale translations; placeholder when no Screenshot; slug listing.
- **Seam 2, Locale module interface**, pure-function tests: negotiation from Accept-Language including underscores and unknown values; path building and switching for prefixed and unprefixed paths; Dictionary lookup fallback; and a parity test asserting every Locale's Dictionary has exactly the English key set.
- **Seam 3, Sync job interface**, with a fake GitHub, a fake Translator and an in-memory file store: translates only changed Source text; skips entries that already have a Translation; reports Stale translations without overwriting; regenerates stale entries only on the explicit flag; copies Screenshots and skips repos without one; a failing Translator does not corrupt existing files.
- The Project index and Profile links get no dedicated seam; they are thin presentation over the Projects module and are covered by lint, typecheck and the production build.

## Out of Scope

- Any login, gating or proxying of private code on the site. Code access is handled only through GitHub invites.
- Auto-discovering repos by topic or owner.
- Webhooks from project repos.
- Runtime translation of any kind.
- A GitHub Action that runs Sync or commits automatically.
- The bug-sweep fixes in `.scratch/bug-sweep/findings.md`, including the lockfile mismatch and the Next.js security upgrade. They are separate tickets and should not block this work, though the Supabase removal may close some of them.
- Redesigning the site's visual style.
- Migrating Supabase data, since none exists.

## Further Notes

- Everything between the README markers is public on the site, and for a private repo it is also visible to anyone with Code access. The owner should check it for each commercial repo, and contracts or NDAs may restrict showing a client's name or screenshots at all.
- Gemini free-tier limits are not published and are shown per project in AI Studio. Whether free-tier data may be used to improve Google products was not confirmed; the local adapter exists for text that should not leave the owner's machine. Cloud Translation and Azure Translator also have free monthly allowances if a third adapter is ever wanted.
- Suggested delivery order, each step verified with build, lint and tests before the next: Projects module with Vitest and the GitHub adapter (replacing Supabase); Project index; Locale module with the Dictionary layout and switcher; Profile links; Translator and Sync job.
- No commits are made until the owner asks.
