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
 * current README. A README 404 is only "no README" when the repo itself is readable;
 * an unreadable repo rejects. Error messages never include the token.
 */
export function createGitHubReadmes(options: GitHubReadmesOptions): ReadmeSource {
    return {
        async getReadme(repo) {
            const where = `${options.owner}/${repo}`;
            const repoPath = `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repo)}`;
            const get = (path: string, accept: string) =>
                githubFetch({ token: options.token, fetch: options.fetch, apiUrl: options.apiUrl, path, accept, where });

            const response = await get(`${repoPath}/readme`, "application/vnd.github.raw+json");
            if (response.status === 404) {
                // GitHub answers 404 for a private repo the token cannot see, so a 404 alone
                // would hide an unreadable Allowlisted repo. Only a readable repo has "no README".
                const metadata = await get(repoPath, "application/vnd.github+json");
                if (metadata.status === 404) {
                    throw new Error(
                        `${where} was not found or cannot be read with GITHUB_TOKEN: check the Allowlist spelling and that the token has read access to the repo`,
                    );
                }
                assertReadable(metadata, where, "the repo");
                return null;
            }
            assertReadable(response, where, "the repo's contents");
            return response.text();
        },
    };
}
