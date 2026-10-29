import { describe, expect, it } from "vitest";
import { createGitHubReadmes } from "@/lib/sync/github-readmes";

type Call = { url: string; init?: RequestInit };

/** A fake GitHub README API: text by URL path; anything else is 404 unless a status is forced. */
function fakeGitHub(readmes: Record<string, string>, forced?: number) {
    const calls: Call[] = [];
    const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        if (forced) return new Response("nope", { status: forced });
        const text = readmes[new URL(String(input)).pathname];
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

    it("answers null when the repo has no README (404)", async () => {
        const source = createGitHubReadmes({ owner: "owner", token: "t", fetch: fakeGitHub({}).fetch });
        expect(await source.getReadme("alpha")).toBeNull();
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
