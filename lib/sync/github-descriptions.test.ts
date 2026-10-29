import { describe, expect, it } from "vitest";
import { createGitHubDescriptions } from "@/lib/sync/github-descriptions";

type Call = { url: string; init?: RequestInit };

/** A fake GitHub API: repo metadata by URL path. Anything else is 404 unless a status is forced. */
function fakeGitHub(repos: Record<string, unknown>, forced?: number) {
    const calls: Call[] = [];
    const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        if (forced) return new Response("nope", { status: forced });
        const meta = repos[new URL(String(input)).pathname];
        return meta === undefined ? new Response("{}", { status: 404 }) : new Response(JSON.stringify(meta), { status: 200 });
    }) as typeof globalThis.fetch;
    return { fetch, calls };
}

describe("reading a short description from GitHub", () => {
    it("fetches the repo metadata with the token and answers the description", async () => {
        const gh = fakeGitHub({ "/repos/owner/alpha": { description: "Offline-first ERP" } });
        const source = createGitHubDescriptions({ owner: "owner", token: "ghp_secret", fetch: gh.fetch });

        expect(await source.getDescription("alpha")).toBe("Offline-first ERP");

        const headers = gh.calls[0].init?.headers as Record<string, string>;
        expect(headers.Accept).toBe("application/vnd.github+json");
        expect(headers.Authorization).toBe("Bearer ghp_secret");
    });

    it("answers null for a missing, null or blank description", async () => {
        const gh = fakeGitHub({
            "/repos/owner/none": {},
            "/repos/owner/nul": { description: null },
            "/repos/owner/blank": { description: "   " },
        });
        const source = createGitHubDescriptions({ owner: "owner", token: "t", fetch: gh.fetch });

        expect(await source.getDescription("none")).toBeNull();
        expect(await source.getDescription("nul")).toBeNull();
        expect(await source.getDescription("blank")).toBeNull();
    });

    it("rejects when the repo cannot be found or read, since GitHub answers 404 for a private repo the token cannot see", async () => {
        const source = createGitHubDescriptions({ owner: "owner", token: "ghp_secret", fetch: fakeGitHub({}).fetch });
        const error = await source.getDescription("alpha").then(() => null, (e: Error) => e);

        expect(error?.message).toMatch(/owner\/alpha.*(not found|cannot be read)/s);
        expect(error?.message).not.toContain("ghp_secret");
    });

    it("rejects without leaking the token when GitHub refuses it", async () => {
        const source = createGitHubDescriptions({ owner: "owner", token: "ghp_secret", fetch: fakeGitHub({}, 401).fetch });
        const error = await source.getDescription("alpha").then(() => null, (e: Error) => e);
        expect(error?.message).toMatch(/GITHUB_TOKEN was rejected.*owner\/alpha/);
        expect(error?.message).not.toContain("ghp_secret");
    });

    it("rejects with a clear error when the token is missing", async () => {
        const source = createGitHubDescriptions({ owner: "owner", token: undefined, fetch: fakeGitHub({}).fetch });
        await expect(source.getDescription("alpha")).rejects.toThrow(/GITHUB_TOKEN is not set/);
    });

    it("honours the API URL override", async () => {
        const gh = fakeGitHub({ "/repos/owner/alpha": { description: "x" } });
        await createGitHubDescriptions({ owner: "owner", token: "t", fetch: gh.fetch, apiUrl: "http://localhost:9999" }).getDescription("alpha");
        expect(gh.calls[0].url).toBe("http://localhost:9999/repos/owner/alpha");
    });
});
