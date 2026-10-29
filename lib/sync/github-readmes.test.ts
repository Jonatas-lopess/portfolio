import { describe, expect, it } from "vitest";
import { createGitHubReadmes } from "@/lib/sync/github-readmes";

type Call = { url: string; init?: RequestInit };

/**
 * A fake GitHub API: README text by URL path, plus the repos GitHub will show the token
 * (`/repos/<owner>/<repo>` answers 200). Anything else is 404 unless a status is forced.
 */
function fakeGitHub(readmes: Record<string, string>, forced?: number, visibleRepos: string[] = []) {
    const calls: Call[] = [];
    const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        if (forced) return new Response("nope", { status: forced });
        const pathname = new URL(String(input)).pathname;
        if (visibleRepos.includes(pathname)) return new Response("{}", { status: 200 });
        const text = readmes[pathname];
        return text === undefined ? new Response("{}", { status: 404 }) : new Response(text, { status: 200 });
    }) as typeof globalThis.fetch;
    return { fetch, calls };
}

describe("reading a README from GitHub", () => {
    it("fetches the raw README with the token", async () => {
        const gh = fakeGitHub({ "/repos/owner/alpha/readme": "# Alpha\n" });
        const source = createGitHubReadmes({ owner: "owner", token: "ghp_secret", fetch: gh.fetch });

        expect(await source.getReadme("alpha")).toBe("# Alpha\n");

        const headers = gh.calls[0].init?.headers as Record<string, string>;
        expect(headers.Accept).toBe("application/vnd.github.raw+json");
        expect(headers.Authorization).toBe("Bearer ghp_secret");
    });

    it("answers null when the repo is readable but has no README (readme 404, repo 200)", async () => {
        const gh = fakeGitHub({}, undefined, ["/repos/owner/alpha"]);
        const source = createGitHubReadmes({ owner: "owner", token: "t", fetch: gh.fetch });

        expect(await source.getReadme("alpha")).toBeNull();
        expect(gh.calls.map((c) => new URL(c.url).pathname)).toEqual(["/repos/owner/alpha/readme", "/repos/owner/alpha"]);
    });

    it("rejects when the repo itself is unreadable, since GitHub also answers 404 for a private repo the token cannot see", async () => {
        const source = createGitHubReadmes({ owner: "owner", token: "ghp_secret", fetch: fakeGitHub({}).fetch });
        const error = await source.getReadme("alpha").then(() => null, (e: Error) => e);

        expect(error?.message).toMatch(/owner\/alpha.*(not found|cannot be read)/s);
        expect(error?.message).not.toContain("ghp_secret");
    });

    it("rejects when the repo check is refused", async () => {
        const fetch = (async (input: RequestInfo | URL) =>
            new Response("nope", { status: String(input).endsWith("/readme") ? 404 : 401 })) as typeof globalThis.fetch;
        const source = createGitHubReadmes({ owner: "owner", token: "t", fetch });
        await expect(source.getReadme("alpha")).rejects.toThrow(/GITHUB_TOKEN was rejected/);
    });

    it("honours the API URL override", async () => {
        const gh = fakeGitHub({ "/repos/owner/alpha/readme": "x" });
        await createGitHubReadmes({ owner: "owner", token: "t", fetch: gh.fetch, apiUrl: "http://localhost:9999" }).getReadme("alpha");
        expect(gh.calls[0].url).toBe("http://localhost:9999/repos/owner/alpha/readme");
    });

    it("rejects without leaking the token when GitHub refuses it", async () => {
        const source = createGitHubReadmes({ owner: "owner", token: "ghp_secret", fetch: fakeGitHub({}, 401).fetch });
        const error = await source.getReadme("alpha").then(() => null, (e: Error) => e);
        expect(error?.message).toMatch(/GITHUB_TOKEN was rejected.*owner\/alpha/);
        expect(error?.message).not.toContain("ghp_secret");
    });

    it("rejects with a clear error when the token is missing", async () => {
        const source = createGitHubReadmes({ owner: "owner", token: undefined, fetch: fakeGitHub({}).fetch });
        await expect(source.getReadme("alpha")).rejects.toThrow(/GITHUB_TOKEN is not set/);
    });
});
