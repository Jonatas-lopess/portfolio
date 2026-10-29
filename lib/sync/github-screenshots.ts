import { DEFAULT_API_URL } from "@/lib/projects/github";
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
    const apiUrl = options.apiUrl ?? DEFAULT_API_URL;

    return {
        async getScreenshot(repo) {
            const where = `${options.owner}/${repo}`;
            if (!options.token) {
                throw new Error("GITHUB_TOKEN is not set; it is needed to read the Allowlisted repos from GitHub");
            }

            const path = `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repo)}/contents/${SCREENSHOT_REPO_PATH}`;
            let response: Response;
            try {
                response = await (options.fetch ?? globalThis.fetch)(`${apiUrl}${path}`, {
                    headers: {
                        Accept: "application/vnd.github.raw+json",
                        Authorization: `Bearer ${options.token}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                });
            } catch (error) {
                // The reason is dropped on purpose: a low-level error could echo request details.
                throw new Error(`Cannot reach GitHub while reading ${where}`);
            }

            if (response.status === 404) return null;
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    `GITHUB_TOKEN was rejected by GitHub (${response.status}) while reading ${where}: ` +
                        `check that the token is valid, not expired, and has read access to the repo's contents`,
                );
            }
            if (!response.ok) {
                throw new Error(`GitHub answered ${response.status} while reading ${where}`);
            }
            return new Uint8Array(await response.arrayBuffer());
        },
    };
}
