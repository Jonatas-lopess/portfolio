import { describe, expect, it } from "vitest";
import { createGitHubSource, PROJECTS_CACHE_TAG } from "@/lib/projects/github";

type Call = { url: string; init?: RequestInit };

type FakeRoute = { status?: number; json?: unknown; text?: string; headers?: Record<string, string> };

/** A fake GitHub: routes by URL path and records every request made. */
function fakeGitHub(routes: Record<string, FakeRoute>) {
    const calls: Call[] = [];
    const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init });
        const route = routes[new URL(url).pathname];
        if (!route) {
            return new Response("not found", { status: 404 });
        }
        const body = route.text ?? JSON.stringify(route.json ?? {});
        return new Response(body, { status: route.status ?? 200, headers: route.headers });
    }) as typeof globalThis.fetch;
    return { fetch, calls };
}

const repoMeta = {
    description: "A short description",
    homepage: "https://alpha.example.com",
    topics: ["next", "typescript"],
    html_url: "https://github.com/owner/alpha",
    private: false,
};

function source(routes: Record<string, FakeRoute>, overrides: Partial<Parameters<typeof createGitHubSource>[0]> = {}) {
    const github = fakeGitHub(routes);
    return {
        ...github,
        source: createGitHubSource({
            owner: "owner",
            token: "ghp_secret",
            fetch: github.fetch,
            hasScreenshot: async () => false,
            ...overrides,
        }),
    };
}

describe("reading a repo from GitHub", () => {
    const routes = {
        "/repos/owner/alpha": { json: repoMeta },
        "/repos/owner/alpha/readme": { text: "# Alpha\n<!-- portfolio:start -->\nHello\n<!-- portfolio:end -->" },
    };

    it("maps repo metadata and the README into repo facts", async () => {
        const { source: github } = source(routes);

        expect(await github.getRepo("alpha")).toEqual({
            description: "A short description",
            homepage: "https://alpha.example.com",
            topics: ["next", "typescript"],
            url: "https://github.com/owner/alpha",
            isPublic: true,
            readme: "# Alpha\n<!-- portfolio:start -->\nHello\n<!-- portfolio:end -->",
            hasScreenshot: false,
        });
    });

    it("authenticates every request with the token", async () => {
        const { source: github, calls } = source(routes);
        await github.getRepo("alpha");

        expect(calls).toHaveLength(2);
        for (const call of calls) {
            expect(new Headers(call.init?.headers).get("authorization")).toBe("Bearer ghp_secret");
        }
    });

    it("asks for the README as raw text", async () => {
        const { source: github, calls } = source(routes);
        await github.getRepo("alpha");

        const readmeCall = calls.find((c) => c.url.endsWith("/readme"));
        expect(new Headers(readmeCall?.init?.headers).get("accept")).toBe("application/vnd.github.raw+json");
    });

    it("asks Next to revalidate the cached responses hourly", async () => {
        const { source: github, calls } = source(routes);
        await github.getRepo("alpha");

        for (const call of calls) {
            expect((call.init as { next?: { revalidate?: number } }).next?.revalidate).toBe(3600);
        }
    });

    it("tags every cached response so the revalidate route can drop them together", async () => {
        const { source: github, calls } = source(routes);
        await github.getRepo("alpha");

        expect(PROJECTS_CACHE_TAG).toBe("projects");
        expect(calls.length).toBeGreaterThan(0);
        for (const call of calls) {
            expect((call.init as { next?: { tags?: string[] } }).next?.tags).toEqual(["projects"]);
        }
    });

    it("reports a private repo as not public", async () => {
        const { source: github } = source({ ...routes, "/repos/owner/alpha": { json: { ...repoMeta, private: true } } });
        expect((await github.getRepo("alpha")).isPublic).toBe(false);
    });

    it("treats a blank homepage and missing topics as none", async () => {
        const { source: github } = source({
            ...routes,
            "/repos/owner/alpha": { json: { ...repoMeta, homepage: "", topics: undefined, description: null } },
        });

        expect(await github.getRepo("alpha")).toEqual(
            expect.objectContaining({ homepage: null, topics: [], description: null }),
        );
    });

    it("takes hasScreenshot from the injected check, by repo name", async () => {
        const { source: github } = source(routes, { hasScreenshot: async (repo) => repo === "alpha" });
        expect((await github.getRepo("alpha")).hasScreenshot).toBe(true);
    });
});

describe("failures", () => {
    const ok = {
        "/repos/owner/alpha": { json: repoMeta },
        "/repos/owner/alpha/readme": { text: "# Alpha" },
    };

    it.each([401, 403])("names the token when GitHub answers %i", async (status) => {
        const { source: github } = source({ ...ok, "/repos/owner/alpha": { status, json: { message: "Bad credentials" } } });

        await expect(github.getRepo("alpha")).rejects.toThrow(/GITHUB_TOKEN.*\b(invalid|rejected)\b/i);
        await expect(github.getRepo("alpha")).rejects.toThrow(String(status));
    });

    it("names the repo when GitHub cannot find it", async () => {
        const { source: github } = source({});
        await expect(github.getRepo("alpha")).rejects.toThrow(/owner\/alpha/);
    });

    it("fails on any other error status, naming the repo and status", async () => {
        const { source: github } = source({ ...ok, "/repos/owner/alpha": { status: 500, json: {} } });
        await expect(github.getRepo("alpha")).rejects.toThrow(/500.*owner\/alpha/);
    });

    it("fails when the README request is rejected for the token", async () => {
        const { source: github } = source({ ...ok, "/repos/owner/alpha/readme": { status: 401 } });
        await expect(github.getRepo("alpha")).rejects.toThrow(/GITHUB_TOKEN/);
    });

    it("fails on a README error other than not found, rather than showing less", async () => {
        const { source: github } = source({ ...ok, "/repos/owner/alpha/readme": { status: 500 } });
        await expect(github.getRepo("alpha")).rejects.toThrow(/500.*owner\/alpha/);
    });

    it("has a null README when the repo has none", async () => {
        const { source: github } = source({ "/repos/owner/alpha": { json: repoMeta } });
        expect((await github.getRepo("alpha")).readme).toBeNull();
    });

    it("fails clearly when no token is set, without calling GitHub", async () => {
        const { source: github, calls } = source(ok, { token: undefined });

        await expect(github.getRepo("alpha")).rejects.toThrow(/GITHUB_TOKEN is not set/);
        expect(calls).toHaveLength(0);
    });

    it("names the repo when the network request itself fails", async () => {
        const failing = (async () => {
            throw new TypeError("fetch failed");
        }) as typeof globalThis.fetch;
        const { source: github } = source(ok, { fetch: failing });

        await expect(github.getRepo("alpha")).rejects.toThrow(/owner\/alpha.*fetch failed/);
    });

    it("never puts the token in an error message", async () => {
        const { source: github } = source({ "/repos/owner/alpha": { status: 401 } });
        await expect(github.getRepo("alpha")).rejects.not.toThrow(/ghp_secret/);
    });
});
