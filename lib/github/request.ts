export const DEFAULT_API_URL = "https://api.github.com";

export const GITHUB_API_VERSION = "2022-11-28";

export type GitHubRequest = {
    /** Read-only fine-grained token. Server-side only. */
    token: string | undefined;
    /** Defaults to the global fetch, looked up at call time. */
    fetch?: typeof globalThis.fetch;
    /** Defaults to the public GitHub API. For tests and GitHub Enterprise. */
    apiUrl?: string;
    /** Path under the API URL, starting with `/`. */
    path: string;
    /** The `Accept` header, which picks JSON or raw content. */
    accept: string;
    /** `owner/repo`, for error messages. */
    where: string;
    /** Extra `fetch` options, such as Next's cache settings. */
    init?: RequestInit;
    /** Append the low-level error to the "cannot reach" message. Off when it could echo request details. */
    includeReason?: boolean;
};

/**
 * One authenticated GitHub request. Rejects with a message that tells the
 * owner what to fix when the token is missing or GitHub cannot be reached. The
 * token never appears in a message.
 */
export async function githubFetch(request: GitHubRequest): Promise<Response> {
    if (!request.token) {
        throw new Error("GITHUB_TOKEN is not set; it is needed to read the Allowlisted repos from GitHub");
    }

    const init: RequestInit = {
        ...request.init,
        headers: {
            Accept: request.accept,
            Authorization: `Bearer ${request.token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
    };

    try {
        return await (request.fetch ?? globalThis.fetch)(`${request.apiUrl ?? DEFAULT_API_URL}${request.path}`, init);
    } catch (error) {
        const reason = request.includeReason ? `: ${error instanceof Error ? error.message : String(error)}` : "";
        throw new Error(`Cannot reach GitHub while reading ${request.where}${reason}`);
    }
}

/** GitHub signals an exhausted quota with a 403 or 429 plus these headers. */
function isRateLimited(response: Response): boolean {
    if (response.status === 429) return true;
    return (
        response.status === 403 &&
        (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after"))
    );
}

/**
 * Throws a message that tells the owner what to fix. A 404 is left to the
 * caller. `scope` names what the token must be able to read, for the 401/403 message.
 */
export function assertReadable(response: Response, where: string, scope: string): void {
    if (isRateLimited(response)) {
        throw new Error(
            `GitHub rate limit reached (${response.status}) while reading ${where}: ` +
                `this is not a token problem; wait and try again`,
        );
    }
    if (response.status === 401 || response.status === 403) {
        throw new Error(
            `GITHUB_TOKEN was rejected by GitHub (${response.status}) while reading ${where}: ` +
                `check that the token is valid, not expired, and has read access to ${scope}`,
        );
    }
    if (!response.ok && response.status !== 404) {
        throw new Error(`GitHub answered ${response.status} while reading ${where}`);
    }
}
