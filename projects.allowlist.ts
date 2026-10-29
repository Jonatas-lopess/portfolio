import type { AllowlistEntry } from "@/lib/projects";

/** The GitHub account that owns every repo below. Public information, so it is not an env var. */
export const githubOwner = "Jonatas-lopess";

/**
 * The Allowlist: the only repos that may appear on the site as Projects. A
 * repo that is not listed is Hidden, so nothing about it is ever shown.
 * Order here is the order on the Projects page.
 *
 * Entry fields:
 *   repo        Repo name under `githubOwner`; also the URL slug. Required.
 *   visibility  "showcase" (default): summary, stack, screenshot and demo link, no code link.
 *               "full": adds a code link, but only if GitHub reports the repo as public.
 *   title       Optional display title; defaults to the repo name.
 *
 * Example:
 *   { repo: "my-public-app", visibility: "full" },
 *   { repo: "client-dashboard", title: "Client Dashboard" },
 *
 * A Project's summary is written in its own README, between `<!-- portfolio:start -->` and
 * `<!-- portfolio:end -->`. Only that text is shown; nothing else in the README ever is. With no
 * usable block (missing marker, empty block, or a second start marker before the end), the
 * summary falls back to the repo's short GitHub description.
 *
 * A Project's Screenshot is `docs/screenshot.png` in its repo; `pnpm sync` copies it to
 * `public/screenshots/<repo>.png`.
 *
 * The site reads each repo with the server-only GITHUB_TOKEN, which must have
 * read access (metadata and contents) to every repo listed here.
 */
export const allowlist: AllowlistEntry[] = [];
