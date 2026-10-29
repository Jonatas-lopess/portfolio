import { describe, expect, it } from "vitest";
import { createGitHubScreenshots, SCREENSHOT_REPO_PATH } from "@/lib/sync/github-screenshots";

type Call = { url: string; init?: RequestInit };

/** A fake GitHub contents API: file bytes by URL path; anything else is 404 unless a status is forced. */
function fakeGitHub(files: Record<string, Uint8Array>, forced?: number) {
    const calls: Call[] = [];
    const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        if (forced) return new Response("nope", { status: forced });
        const file = files[new URL(String(input)).pathname];
        return file ? new Response(file as BodyInit, { status: 200 }) : new Response("{}", { status: 404 });
    }) as typeof globalThis.fetch;
    return { fetch, calls };
}

const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255, 10]);

describe("reading a Screenshot from GitHub", () => {
    it("fetches the raw bytes at the fixed path with the token", async () => {
        const gh = fakeGitHub({ [`/repos/owner/alpha/contents/${SCREENSHOT_REPO_PATH}`]: bytes });
        const source = createGitHubScreenshots({ owner: "owner", token: "ghp_secret", fetch: gh.fetch });

        expect(await source.getScreenshot("alpha")).toEqual(bytes);

        const headers = gh.calls[0].init?.headers as Record<string, string>;
        expect(headers.Accept).toBe("application/vnd.github.raw+json");
        expect(headers.Authorization).toBe("Bearer ghp_secret");
    });

    it("keeps the screenshot path at docs/screenshot.png", () => {
        expect(SCREENSHOT_REPO_PATH).toBe("docs/screenshot.png");
    });

    it("answers null when the repo has no Screenshot (404)", async () => {
        const source = createGitHubScreenshots({ owner: "owner", token: "t", fetch: fakeGitHub({}).fetch });

        expect(await source.getScreenshot("alpha")).toBeNull();
    });

    it("rejects without leaking the token when GitHub refuses the token", async () => {
        const source = createGitHubScreenshots({ owner: "owner", token: "ghp_secret", fetch: fakeGitHub({}, 401).fetch });

        const error = await source.getScreenshot("alpha").then(() => null, (e: Error) => e);
        expect(error?.message).toMatch(/GITHUB_TOKEN was rejected.*owner\/alpha/);
        expect(error?.message).not.toContain("ghp_secret");
    });

    it("says the rate limit was reached, not that the token was rejected, on a rate-limited 403", async () => {
        const fetch = (async () =>
            new Response("{}", { status: 403, headers: { "retry-after": "60" } })) as typeof globalThis.fetch;
        const source = createGitHubScreenshots({ owner: "owner", token: "t", fetch });

        const error = await source.getScreenshot("alpha").then(() => null, (e: Error) => e);
        expect(error?.message).toMatch(/rate limit.*owner\/alpha/i);
        expect(error?.message).not.toMatch(/rejected/);
    });

    it("rejects on other GitHub errors", async () => {
        const source = createGitHubScreenshots({ owner: "owner", token: "t", fetch: fakeGitHub({}, 500).fetch });

        await expect(source.getScreenshot("alpha")).rejects.toThrow(/500.*owner\/alpha/);
    });

    it("rejects without leaking the token when GitHub cannot be reached", async () => {
        const fetch = (async () => {
            throw new Error("connect ECONNREFUSED ghp_secret");
        }) as typeof globalThis.fetch;
        const source = createGitHubScreenshots({ owner: "owner", token: "ghp_secret", fetch });

        const error = await source.getScreenshot("alpha").then(() => null, (e: Error) => e);
        expect(error?.message).toContain("Cannot reach GitHub");
        expect(error?.message).not.toContain("ghp_secret");
    });

    it("rejects before any request when there is no token", async () => {
        const gh = fakeGitHub({});
        const source = createGitHubScreenshots({ owner: "owner", token: undefined, fetch: gh.fetch });

        await expect(source.getScreenshot("alpha")).rejects.toThrow(/GITHUB_TOKEN is not set/);
        expect(gh.calls).toEqual([]);
    });

    it("uses the API URL override", async () => {
        const gh = fakeGitHub({});
        await createGitHubScreenshots({ owner: "o", token: "t", fetch: gh.fetch, apiUrl: "http://localhost:9999" }).getScreenshot("a");

        expect(gh.calls[0].url).toBe(`http://localhost:9999/repos/o/a/contents/${SCREENSHOT_REPO_PATH}`);
    });
});
