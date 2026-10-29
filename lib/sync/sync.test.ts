import { describe, expect, it } from "vitest";
import { runSync } from "@/lib/sync";
import { createMemoryStore } from "@/lib/sync/in-memory";
import type { ScreenshotSource } from "@/lib/sync";

/** Stand-in image bytes; Sync never decodes them, it only copies and compares. */
const png = (label: string) => new TextEncoder().encode(`png:${label}`);

/** A fake GitHub: the Screenshot bytes by repo name. A repo that is absent has no Screenshot. */
function fakeScreenshots(byRepo: Record<string, Uint8Array | Error>) {
    const asked: string[] = [];
    const github: ScreenshotSource = {
        async getScreenshot(repo) {
            asked.push(repo);
            const found = byRepo[repo];
            if (found instanceof Error) throw found;
            return found ?? null;
        },
    };
    return { ...github, asked };
}

describe("Sync copies Screenshots", () => {
    it("writes an Allowlisted Project's Screenshot to the public path named after the repo", async () => {
        const store = createMemoryStore();
        const github = fakeScreenshots({ alpha: png("alpha-v1") });

        const report = await runSync({ github, store, allowlist: [{ repo: "alpha" }] });

        expect(await store.read("/screenshots/alpha.png")).toEqual(png("alpha-v1"));
        expect(report.screenshots).toEqual({ copied: ["alpha"], unchanged: [], skipped: [], failed: [] });
    });

    it("makes no write when the stored file already has the same bytes", async () => {
        const store = createMemoryStore({ "/screenshots/alpha.png": png("alpha-v1") });
        const github = fakeScreenshots({ alpha: png("alpha-v1") });

        const report = await runSync({ github, store, allowlist: [{ repo: "alpha" }] });

        expect(store.writes).toEqual([]);
        expect(report.screenshots).toEqual({ copied: [], unchanged: ["alpha"], skipped: [], failed: [] });
    });

    it("running Sync twice changes nothing the second time", async () => {
        const store = createMemoryStore();
        const deps = { github: fakeScreenshots({ alpha: png("a"), beta: png("b") }), store, allowlist: [{ repo: "alpha" }, { repo: "beta" }] };

        await runSync(deps);
        const afterFirst = new Map(store.files);
        store.writes.length = 0;
        const second = await runSync(deps);

        expect(store.writes).toEqual([]);
        expect(store.files).toEqual(afterFirst);
        expect(second.screenshots.copied).toEqual([]);
        expect(second.screenshots.unchanged).toEqual(["alpha", "beta"]);
    });

    it("replaces the stored file when the Screenshot changed in the repo", async () => {
        const store = createMemoryStore({ "/screenshots/alpha.png": png("alpha-v1") });
        const github = fakeScreenshots({ alpha: png("alpha-v2") });

        const report = await runSync({ github, store, allowlist: [{ repo: "alpha" }] });

        expect(await store.read("/screenshots/alpha.png")).toEqual(png("alpha-v2"));
        expect(report.screenshots.copied).toEqual(["alpha"]);
    });

    it("skips and reports a repo with no Screenshot, and still syncs the others", async () => {
        const store = createMemoryStore();
        const github = fakeScreenshots({ beta: png("b") });

        const report = await runSync({ github, store, allowlist: [{ repo: "alpha" }, { repo: "beta" }] });

        expect(report.screenshots).toEqual({ copied: ["beta"], unchanged: [], skipped: ["alpha"], failed: [] });
        expect(await store.read("/screenshots/alpha.png")).toBeNull();
    });

    it("treats an empty file as no Screenshot", async () => {
        const store = createMemoryStore();
        const github = fakeScreenshots({ alpha: new Uint8Array() });

        const report = await runSync({ github, store, allowlist: [{ repo: "alpha" }] });

        expect(report.screenshots.skipped).toEqual(["alpha"]);
        expect(store.writes).toEqual([]);
    });

    it("keeps the existing file when a repo has no Screenshot any more", async () => {
        const store = createMemoryStore({ "/screenshots/alpha.png": png("old") });

        await runSync({ github: fakeScreenshots({}), store, allowlist: [{ repo: "alpha" }] });

        expect(await store.read("/screenshots/alpha.png")).toEqual(png("old"));
    });

    it("reports a repo that cannot be read as failed, leaves its file alone, and carries on", async () => {
        const store = createMemoryStore({ "/screenshots/alpha.png": png("old") });
        const github = fakeScreenshots({ alpha: new Error("GitHub answered 500 while reading owner/alpha"), beta: png("b") });

        const report = await runSync({ github, store, allowlist: [{ repo: "alpha" }, { repo: "beta" }] });

        expect(report.screenshots.failed).toEqual([{ repo: "alpha", error: "GitHub answered 500 while reading owner/alpha" }]);
        expect(report.screenshots.copied).toEqual(["beta"]);
        expect(await store.read("/screenshots/alpha.png")).toEqual(png("old"));
    });

    it("reports a store write error as failed for that repo", async () => {
        const store = createMemoryStore();
        store.write = async () => {
            throw new Error("disk full");
        };

        const report = await runSync({ github: fakeScreenshots({ alpha: png("a") }), store, allowlist: [{ repo: "alpha" }] });

        expect(report.screenshots).toEqual({ copied: [], unchanged: [], skipped: [], failed: [{ repo: "alpha", error: "disk full" }] });
    });

    it("only ever asks GitHub about Allowlisted repos, once each", async () => {
        const store = createMemoryStore();
        const github = fakeScreenshots({ alpha: png("a"), secret: png("s") });

        await runSync({ github, store, allowlist: [{ repo: "alpha" }, { repo: "alpha", visibility: "full" }] });

        expect(github.asked).toEqual(["alpha"]);
        expect(Array.from(store.files.keys())).toEqual(["/screenshots/alpha.png"]);
    });
});
