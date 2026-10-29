import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));
vi.mock("@/lib/projects/live", () => ({ projects: { listSlugs: () => ["alpha", "beta"] } }));

import { POST } from "@/app/api/revalidate/route";

function post(headers: Record<string, string> = {}) {
    return POST(new Request("http://localhost/api/revalidate", { method: "POST", headers }));
}

describe("POST /api/revalidate", () => {
    beforeEach(() => {
        vi.stubEnv("REVALIDATE_KEY", "s3cret");
        revalidatePath.mockReset();
        revalidateTag.mockReset();
    });
    afterEach(() => vi.unstubAllEnvs());

    it("revalidates the tag and every Locale's list and Project pages for a valid x-revalidate-key", async () => {
        const response = await post({ "x-revalidate-key": "s3cret" });

        expect(response.status).toBe(200);
        expect(revalidateTag).toHaveBeenCalledWith("projects");
        expect(revalidatePath.mock.calls.map((c) => c[0]).sort()).toEqual(
            [
                "/en/projects",
                "/en/projects/alpha",
                "/en/projects/beta",
                "/pt-BR/projects",
                "/pt-BR/projects/alpha",
                "/pt-BR/projects/beta",
            ].sort(),
        );
        expect(await response.json()).toMatchObject({ revalidated: true });
    });

    it("never passes a dynamic pattern to revalidatePath", async () => {
        await post({ "x-revalidate-key": "s3cret" });
        for (const [path] of revalidatePath.mock.calls) {
            expect(path).not.toContain("[");
        }
    });

    it("still accepts the deprecated revalidate_key header", async () => {
        const response = await post({ revalidate_key: "s3cret" });
        expect(response.status).toBe(200);
        expect(revalidateTag).toHaveBeenCalledWith("projects");
    });

    it.each<[string, Record<string, string>]>([
        ["no key", {}],
        ["a wrong key", { "x-revalidate-key": "nope" }],
        ["a wrong legacy key", { revalidate_key: "nope" }],
        ["a key of different length", { "x-revalidate-key": "s3cret-and-more" }],
        ["an empty key", { "x-revalidate-key": "" }],
    ])("answers 401 and refreshes nothing for %s", async (_name, headers) => {
        const response = await post(headers);

        expect(response.status).toBe(401);
        expect(revalidateTag).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("prefers x-revalidate-key over the legacy header", async () => {
        const response = await post({ "x-revalidate-key": "nope", revalidate_key: "s3cret" });
        expect(response.status).toBe(401);
    });

    it.each([
        ["unset", undefined],
        ["empty", ""],
    ])("never authorizes when REVALIDATE_KEY is %s", async (_name, value) => {
        if (value === undefined) delete process.env.REVALIDATE_KEY;
        else process.env.REVALIDATE_KEY = value;

        const attempts: Record<string, string>[] = [{}, { "x-revalidate-key": "" }, { "x-revalidate-key": "anything" }, { revalidate_key: "" }];
        for (const headers of attempts) {
            expect((await post(headers)).status).toBe(401);
        }
        expect(revalidateTag).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("answers 500 when revalidation throws", async () => {
        revalidateTag.mockImplementation(() => {
            throw new Error("boom");
        });
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect((await post({ "x-revalidate-key": "s3cret" })).status).toBe(500);
    });
});
