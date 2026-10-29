import { describe, expect, it } from "vitest";
import { formatProjectTranslationsReport } from "@/lib/sync/format-project-translations";
import type { ProjectTranslationsReport } from "@/lib/sync/types";

const empty: ProjectTranslationsReport = { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [], pruned: [], failed: [] };

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
});
