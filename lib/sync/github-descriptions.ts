import { assertReadable, githubFetch } from "@/lib/github/request";
import { taglineSourceText } from "@/lib/projects/tagline";
import type { DescriptionSource } from "@/lib/sync/types";

export type GitHubDescriptionsOptions = {
    /** Account that owns every Allowlisted repo. */
    owner: string;
    /** Read-only fine-grained token, the same GITHUB_TOKEN the site uses. */
    token: string | undefined;
    fetch?: typeof globalThis.fetch;
    /** Defaults to the public GitHub API. For tests and GitHub Enterprise. */
    apiUrl?: string;
};

/**
 * Reads each repo's short description (the tagline's Source text) from the repo
 * metadata. Like the other Sync adapters it does not use Next's fetch cache:
 * Sync runs outside Next and must see the current description. A 404 rejects,
 * because GitHub also answers 404 for a private repo the token cannot see. A
 * missing or blank description is `null`. Error messages never include the token.
 */
export function createGitHubDescriptions(options: GitHubDescriptionsOptions): DescriptionSource {
    return {
        async getDescription(repo) {
            const where = `${options.owner}/${repo}`;
            const response = await githubFetch({
                token: options.token,
                fetch: options.fetch,
                apiUrl: options.apiUrl,
                path: `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repo)}`,
                accept: "application/vnd.github+json",
                where,
            });
            if (response.status === 404) {
                throw new Error(
                    `${where} was not found or cannot be read with GITHUB_TOKEN: check the Allowlist spelling and that the token has read access to the repo`,
                );
            }
            assertReadable(response, where, "the repo's metadata");
            const meta = (await response.json()) as { description?: string | null };
            return taglineSourceText(meta.description ?? null);
        },
    };
}
