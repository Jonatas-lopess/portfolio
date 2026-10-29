import { ProjectsSource, RepoFacts } from "@/lib/projects/types";

export const DEFAULT_API_URL = "https://api.github.com";

/** How long Next may serve a cached GitHub response before refetching it. */
export const REVALIDATE_SECONDS = 3600;

/** Cache tag on every GitHub fetch, so the revalidate route can drop them all with one `revalidateTag`. */
export const PROJECTS_CACHE_TAG = "projects";

export type GitHubSourceOptions = {
    /** Account that owns every Allowlisted repo. */
    owner: string;
    /** Read-only fine-grained token. Server-side only: never pass a NEXT_PUBLIC value. */
    token: string | undefined;
    /** Whether the repo has a Screenshot at the fixed path. */
    hasScreenshot: (repo: string) => Promise<boolean>;
    /** Defaults to the global fetch, looked up at call time. */
    fetch?: typeof globalThis.fetch;
    /** Defaults to the public GitHub API. Only useful for tests and GitHub Enterprise. */
    apiUrl?: string;
};

type RepoMetadata = {
    description?: string | null;
    homepage?: string | null;
    topics?: string[] | null;
    html_url: string;
    private: boolean;
};

/**
 * The GitHub half of a ProjectsSource: repo metadata and README, read with the
 * REST API. Every failure rejects, so a bad token or an unreadable repo fails
 * the build, and a failed revalidation keeps the last good page.
 */
export function createGitHubSource(options: GitHubSourceOptions): Pick<ProjectsSource, "getRepo"> {
    const apiUrl = options.apiUrl ?? DEFAULT_API_URL;

    async function request(repo: string, path: string, accept: string): Promise<Response> {
        if (!options.token) {
            throw new Error("GITHUB_TOKEN is not set; it is needed to read the Allowlisted repos from GitHub");
        }

        const doFetch = options.fetch ?? globalThis.fetch;
        const init: RequestInit & { next: { revalidate: number; tags: string[] } } = {
            headers: {
                Accept: accept,
                Authorization: `Bearer ${options.token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
            next: { revalidate: REVALIDATE_SECONDS, tags: [PROJECTS_CACHE_TAG] },
        };

        const where = `${options.owner}/${repo}`;
        try {
            return await doFetch(`${apiUrl}${path}`, init);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot reach GitHub while reading ${where}: ${reason}`);
        }
    }

    /** Throws a message that tells the owner what to fix. A 404 is left to the caller. */
    function failIfUnreadable(response: Response, repo: string): void {
        const where = `${options.owner}/${repo}`;
        if (response.status === 401 || response.status === 403) {
            throw new Error(
                `GITHUB_TOKEN was rejected by GitHub (${response.status}) while reading ${where}: ` +
                    `check that the token is valid, not expired, and has read access to the repo's metadata and contents`,
            );
        }
        if (!response.ok && response.status !== 404) {
            throw new Error(`GitHub answered ${response.status} while reading ${where}`);
        }
    }

    async function getRepo(repo: string): Promise<RepoFacts> {
        const repoPath = `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(repo)}`;

        const where = `${options.owner}/${repo}`;
        const metaResponse = await request(repo, repoPath, "application/vnd.github+json");
        failIfUnreadable(metaResponse, repo);
        if (metaResponse.status === 404) {
            throw new Error(
                `Cannot read ${where} on GitHub (404): the repo does not exist or GITHUB_TOKEN has no access to it`,
            );
        }
        const meta = (await metaResponse.json()) as RepoMetadata;

        const readmeResponse = await request(repo, `${repoPath}/readme`, "application/vnd.github.raw+json");
        failIfUnreadable(readmeResponse, repo);
        const readme = readmeResponse.status === 404 ? null : await readmeResponse.text();

        return {
            description: meta.description ?? null,
            homepage: meta.homepage?.trim() || null,
            topics: meta.topics ?? [],
            url: meta.html_url,
            isPublic: !meta.private,
            readme,
            hasScreenshot: await options.hasScreenshot(repo),
        };
    }

    return { getRepo };
}
