import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileStore } from "@/lib/sync/file-store";

describe("the filesystem FileStore", () => {
    let root: string;
    beforeEach(async () => {
        root = await mkdtemp(path.join(os.tmpdir(), "sync-store-"));
    });
    afterEach(async () => {
        await rm(root, { recursive: true, force: true });
    });

    it("writes a public path under the root, creating folders, and reads it back", async () => {
        const store = createFileStore(root);
        const bytes = new Uint8Array([1, 2, 3, 255]);

        expect(await store.read("/screenshots/alpha.png")).toBeNull();
        await store.write("/screenshots/alpha.png", bytes);

        expect(new Uint8Array(await readFile(path.join(root, "screenshots", "alpha.png")))).toEqual(bytes);
        expect(await store.read("/screenshots/alpha.png")).toEqual(bytes);
    });

    it("refuses a path that escapes the root", async () => {
        const store = createFileStore(root);

        await expect(store.write("/../evil.png", new Uint8Array([1]))).rejects.toThrow(/outside/);
        await expect(store.read("/../evil.png")).rejects.toThrow(/outside/);
    });
});
