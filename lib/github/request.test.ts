import { describe, expect, it } from "vitest";
import { assertReadable, githubFetch } from "@/lib/github/request";

const response = (status: number, headers?: Record<string, string>) => new Response("{}", { status, headers });

describe("assertReadable", () => {
    it("blames the token on a plain 401 or 403", () => {
        for (const status of [401, 403]) {
            expect(() => assertReadable(response(status), "o/r", "contents")).toThrow(/GITHUB_TOKEN was rejected.*o\/r/);
        }
    });

    it("reports the rate limit, not the token, on a 403 with x-ratelimit-remaining: 0", () => {
        const limited = response(403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1700000000" });

        expect(() => assertReadable(limited, "o/r", "contents")).toThrow(/rate limit/i);
        expect(() => assertReadable(limited, "o/r", "contents")).not.toThrow(/rejected/);
        expect(() => assertReadable(limited, "o/r", "contents")).toThrow(/o\/r/);
    });

    it("reports the rate limit on a 403 with retry-after", () => {
        expect(() => assertReadable(response(403, { "retry-after": "60" }), "o/r", "contents")).toThrow(/rate limit/i);
    });

    it("still blames the token on a 403 that has quota left", () => {
        expect(() => assertReadable(response(403, { "x-ratelimit-remaining": "42" }), "o/r", "contents")).toThrow(/rejected/);
    });

    it("reports the rate limit on a 429", () => {
        expect(() => assertReadable(response(429), "o/r", "contents")).toThrow(/rate limit/i);
    });

    it("lets a 404 through for the caller to handle, and fails on other errors", () => {
        expect(() => assertReadable(response(404), "o/r", "contents")).not.toThrow();
        expect(() => assertReadable(response(200), "o/r", "contents")).not.toThrow();
        expect(() => assertReadable(response(500), "o/r", "contents")).toThrow(/500.*o\/r/);
    });
});

describe("githubFetch", () => {
    it("sends the token and API version and never echoes the token on failure", async () => {
        let seen: RequestInit | undefined;
        const ok = (async (_url: RequestInfo | URL, init?: RequestInit) => {
            seen = init;
            return response(200);
        }) as typeof globalThis.fetch;

        await githubFetch({ token: "ghp_secret", fetch: ok, apiUrl: "http://x", path: "/p", accept: "a/b", where: "o/r" });
        expect(seen?.headers).toEqual({ Accept: "a/b", Authorization: "Bearer ghp_secret", "X-GitHub-Api-Version": "2022-11-28" });
    });
});
