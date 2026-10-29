import { describe, expect, it } from "vitest";
import { formatProjectTranslationsReport } from "@/lib/sync/format-project-translations";
import type { ProjectTranslationsReport } from "@/lib/sync/types";

const emptyTaglines = { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [] };
const empty: ProjectTranslationsReport = { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [], taglines: emptyTaglines, pruned: [], failed: [] };

describe("the Project summaries report as text", () => {
    it("says there is nothing to translate for an empty Allowlist", () => {
        const { lines, failures } = formatProjectTranslationsReport(empty, 0);
        expect(failures).toBe(0);
        expect(lines.join("\n")).toMatch(/Allowlist is empty.*nothing to translate/);
    });

    it("still reports pruned entries when the Allowlist is empty", () => {
        const { lines } = formatProjectTranslationsReport({ ...empty, pruned: ["gone"] }, 0);
        expect(lines.join("\n")).toMatch(/pruned.*gone/);
    });

    it("counts a failure even when the Allowlist is empty (e.g. an unreadable stored file)", () => {
        const { lines, failures } = formatProjectTranslationsReport({ ...empty, failed: [{ repo: "(file)", error: "bad json" }] }, 0);
        expect(failures).toBe(1);
        expect(lines.join("\n")).toContain("bad json");
    });

    it("lists generated, unchanged, skipped and pruned entries", () => {
        const { lines } = formatProjectTranslationsReport(
            {
                ...empty,
                generated: [{ repo: "a", locale: "pt-BR" }],
                regenerated: [{ repo: "b", locale: "pt-BR" }],
                unchanged: [{ repo: "c", locale: "pt-BR" }],
                skipped: ["d"],
                pruned: ["gone"],
            },
            4,
        );
        const text = lines.join("\n");
        expect(text).toContain("generated:   a (pt-BR)");
        expect(text).toContain("regenerated: b (pt-BR)");
        expect(text).toContain("unchanged:   1");
        expect(text).toMatch(/skipped \(no Marked block.*\): d/);
        expect(text).toMatch(/pruned.*not on the Allowlist.*gone/);
    });

    it("names the flag next to Stale entries and tells apart an unknown hash", () => {
        const { lines, failures } = formatProjectTranslationsReport(
            { ...empty, stale: [{ repo: "a", locale: "pt-BR", unknownHash: false }, { repo: "b", locale: "es", unknownHash: true }] },
            2,
        );
        const text = lines.join("\n");
        expect(failures).toBe(0);
        expect(text).toContain("--regenerate-stale");
        expect(text).toContain("a (pt-BR)");
        expect(text).toMatch(/no recorded hash.*b \(es\)/s);
    });

    it("does not list stale entries as stale once they were regenerated", () => {
        const { lines } = formatProjectTranslationsReport(
            { ...empty, stale: [{ repo: "a", locale: "pt-BR", unknownHash: false }], regenerated: [{ repo: "a", locale: "pt-BR" }] },
            1,
        );
        expect(lines.join("\n")).not.toContain("STALE");
    });

    it("groups failures with the same cause, redacts secrets, counts them and says nothing was written", () => {
        const { lines, failures } = formatProjectTranslationsReport(
            {
                ...empty,
                failed: [
                    { repo: "a", locale: "pt-BR", error: "bad KEY1" },
                    { repo: "b", locale: "pt-BR", error: "bad KEY1" },
                    { repo: "c", error: "other" },
                ],
            },
            3,
            (t) => t.replace("KEY1", "***"),
        );
        expect(failures).toBe(3);
        expect(lines).toContain("  FAILED 2 entries (a (pt-BR), b (pt-BR)): bad ***");
        expect(lines).toContain("  FAILED 1 entry (c): other");
        expect(lines.join("\n")).toContain("nothing was translated or written");
        expect(lines.join("\n")).not.toContain("KEY1");
    });

    describe("taglines", () => {
        it("lists generated, regenerated, unchanged and skipped taglines under their own heading", () => {
            const { lines } = formatProjectTranslationsReport(
                {
                    ...empty,
                    taglines: {
                        generated: [{ repo: "a", locale: "pt-BR" }],
                        regenerated: [{ repo: "b", locale: "pt-BR" }],
                        stale: [],
                        unchanged: [{ repo: "c", locale: "pt-BR" }, { repo: "e", locale: "pt-BR" }],
                        skipped: ["d"],
                    },
                },
                5,
            );
            const text = lines.join("\n");
            const taglines = text.slice(text.indexOf("Project taglines"));
            expect(text.indexOf("Project taglines")).toBeGreaterThan(text.indexOf("Project summaries"));
            expect(taglines).toContain("generated:   a (pt-BR)");
            expect(taglines).toContain("regenerated: b (pt-BR)");
            expect(taglines).toContain("unchanged:   2");
            expect(taglines).toMatch(/skipped \(no description.*\): d/);
        });

        it("does not mix tagline entries into the summary lines", () => {
            const { lines } = formatProjectTranslationsReport({ ...empty, taglines: { ...emptyTaglines, generated: [{ repo: "a", locale: "pt-BR" }] } }, 1);
            const text = lines.join("\n");
            expect(text.slice(0, text.indexOf("Project taglines"))).not.toContain("a (pt-BR)");
        });

        it("names the flag next to Stale taglines, telling a changed description from an unknown hash", () => {
            const { lines, failures } = formatProjectTranslationsReport(
                {
                    ...empty,
                    taglines: { ...emptyTaglines, stale: [{ repo: "a", locale: "pt-BR", unknownHash: false }, { repo: "b", locale: "es", unknownHash: true }] },
                },
                2,
            );
            const text = lines.join("\n");
            expect(failures).toBe(0);
            expect(text).toMatch(/STALE \(the repo's description changed.*--regenerate-stale.*a \(pt-BR\)/s);
            expect(text).toMatch(/no recorded hash.*b \(es\)/s);
        });

        it("does not list regenerated taglines as stale", () => {
            const { lines } = formatProjectTranslationsReport(
                {
                    ...empty,
                    taglines: { ...emptyTaglines, stale: [{ repo: "a", locale: "pt-BR", unknownHash: false }], regenerated: [{ repo: "a", locale: "pt-BR" }] },
                },
                1,
            );
            expect(lines.join("\n")).not.toContain("STALE");
        });

        it("marks a tagline failure as such, counts it and redacts it", () => {
            const { lines, failures } = formatProjectTranslationsReport(
                { ...empty, failed: [{ repo: "a", locale: "pt-BR", field: "tagline", error: "bad KEY1" }] },
                1,
                (t) => t.replace("KEY1", "***"),
            );
            expect(failures).toBe(1);
            expect(lines).toContain("  FAILED 1 entry (a (pt-BR) tagline): bad ***");
        });

        it("says nothing about taglines when the Allowlist is empty", () => {
            const { lines } = formatProjectTranslationsReport(empty, 0);
            expect(lines.join("\n")).not.toContain("Project taglines");
        });
    });
});
