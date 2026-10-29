import { assertReadable, githubFetch } from "@/lib/github/request";
import type { ScreenshotSource } from "@/lib/sync/types";

/**
 * Where a Project's Screenshot lives in its own repo. One fixed path, so the
 * owner's only job is to commit the image there. It must be a PNG: Sync
 * stores it as `public/screenshots/<repo>.png`.
 */
export const SCREENSHOT_REPO_PATH = "docs/screenshot.png";

export type GitHubScreenshotsOptions = {
    /** Account that owns every Allowlisted repo. */
    owner: string;
    /** Read-only fine-grained token (contents), the same GITHUB_TOKEN the site uses. */
    token: string | undefined;
    fetch?: typeof globalThis.fetch;
    /** Defaults to the public GitHub API. For tests and GitHub Enterprise. */
    apiUrl?: string;
};

/**
 * Reads Screenshots with the GitHub contents API. It deliberately does not use
 * Next's fetch cache options: Sync runs outside Next and must see the current file.
 * Error messages never include the token.
 */
export function createGitHubScreenshots(options: GitHubScreenshotsOptions): ScreenshotSource {
    return {
        async getScreenshot(repo) {
            const where = `${options.owner}/${repo}`;
            const response = await githubFetch({
                token: options.token,
                fetch: options.fetch,
                apiUrl: options.apiUrl,
                path: `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repo)}/contents/${SCREENSHOT_REPO_PATH}`,
                accept: "application/vnd.github.raw+json",
                where,
                // The low-level reason is left out on purpose: it could echo request details.
            });

            if (response.status === 404) return null;
            assertReadable(response, where, "the repo's contents");
            return new Uint8Array(await response.arrayBuffer());
        },
    };
}
