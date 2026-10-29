# My portfolio

A showcase of some of my commercial/personal projects as well as a brief CV of my career so far

## Project Stack

**Front-end/Back-end:** NextJS, TailwindCSS

## Screenshots

Each Project's Screenshot lives in its own repo at `docs/screenshot.png` (a PNG). Run `GITHUB_TOKEN=... pnpm sync` to copy the Screenshots of the repos on `projects.allowlist.ts` into `public/screenshots/<repo>.png`, review them in `git status`, and commit. Repos without the file are skipped and listed; running it again with no changes writes nothing.

## Project summary: the README marker

The text shown as a Project's summary is written in the Project's own README, between two HTML comments (invisible when GitHub renders the README):

```md
<!-- portfolio:start -->
One or two paragraphs about the Project, written for visitors of the site.
<!-- portfolio:end -->
```

- **Shown:** only the text between the first `<!-- portfolio:start -->` and the first `<!-- portfolio:end -->` after it, trimmed. Whitespace inside the comments is ignored (`<!--portfolio:start-->` works).
- **Never shown:** everything else in the README. Nothing outside the markers is ever published.
- **Fallback:** if the README has no usable block (no README, a missing marker, an empty block, or a second start marker before the end), the summary is the repo's short GitHub description, or nothing if it has none.
