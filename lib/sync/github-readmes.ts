import { assertReadable, githubFetch } from "@/lib/github/request";
import type { ReadmeSource } from "@/lib/sync/types";

export type GitHubReadmesOptions = {
    /** Account that owns every Allowlisted repo. */
    owner: string;
    /** Read-only fine-grained token (contents), the same GITHUB_TOKEN the site uses. */
    token: string | undefined;
    fetch?: typeof globalThis.fetch;
    /** Defaults to the public GitHub API. For tests and GitHub Enterprise. */
    apiUrl?: string;
};

/**
 * Reads READMEs with the GitHub readme API. Like the Screenshot adapter it does
 * not use Next's fetch cache options: Sync runs outside Next and must see the
 * current README. Error messages never include the token.
 */
export function createGitHubReadmes(options: GitHubReadmesOptions): ReadmeSource {
    return {
        async getReadme(repo) {
            const where = `${options.owner}/${repo}`;
            const response = await githubFetch({
                token: options.token,
                fetch: options.fetch,
                apiUrl: options.apiUrl,
                path: `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repo)}/readme`,
                accept: "application/vnd.github.raw+json",
                where,
            });

            if (response.status === 404) return null;
            assertReadable(response, where, "the repo's contents");
            return response.text();
        },
    };
}
