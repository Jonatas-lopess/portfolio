import { describe, expect, it } from "vitest";
import { coverLabels, fitScale, splitTitle } from "@/lib/projects/cover";

describe("splitTitle", () => {
    it("puts the first word large and the rest small", () => {
        expect(splitTitle("SIGA Erp")).toEqual({ primary: "SIGA", secondary: "Erp" });
        expect(splitTitle("Legal manager app")).toEqual({ primary: "Legal", secondary: "manager app" });
    });

    it("has no remainder for a single word", () => {
        expect(splitTitle("Portfolio")).toEqual({ primary: "Portfolio", secondary: "" });
    });

    it("splits underscored titles like words", () => {
        expect(splitTitle("ai_harness")).toEqual({ primary: "ai", secondary: "harness" });
        expect(splitTitle("erp_project_v2")).toEqual({ primary: "erp", secondary: "project v2" });
    });

    it("ignores surrounding and repeated separators", () => {
        expect(splitTitle("  SIGA   Erp  ")).toEqual({ primary: "SIGA", secondary: "Erp" });
        expect(splitTitle("_ai__harness_")).toEqual({ primary: "ai", secondary: "harness" });
    });

    it("keeps a title made only of separators or empty as is", () => {
        expect(splitTitle("")).toEqual({ primary: "", secondary: "" });
        expect(splitTitle("___")).toEqual({ primary: "", secondary: "" });
    });
});

describe("coverLabels", () => {
    it("derives the top labels from the title and position, the bottom ones from the first topics", () => {
        expect(coverLabels({ title: "SIGA Erp", position: 1, total: 4, topics: ["offline-first", "local-network", "retail", "rust"] })).toEqual({
            topLeft: "SIGA Erp",
            topRight: "01–04",
            bottomLeft: "offline-first / local-network",
            bottomRight: "retail",
        });
    });

    it("uses fewer labels when there are fewer topics", () => {
        expect(coverLabels({ title: "x", position: 2, total: 4, topics: ["rust", "tauri"] })).toMatchObject({
            bottomLeft: "rust / tauri",
            bottomRight: null,
        });
        expect(coverLabels({ title: "x", position: 2, total: 4, topics: ["rust"] })).toMatchObject({
            bottomLeft: "rust",
            bottomRight: null,
        });
    });

    it("has no bottom labels without topics", () => {
        expect(coverLabels({ title: "x", position: 1, total: 1, topics: [] })).toEqual({
            topLeft: "x",
            topRight: "01–01",
            bottomLeft: null,
            bottomRight: null,
        });
    });

    it("does not truncate three-digit positions", () => {
        expect(coverLabels({ title: "x", position: 100, total: 120, topics: [] }).topRight).toBe("100–120");
    });
});

describe("fitScale", () => {
    it("keeps the full size up to the length that fits", () => {
        expect(fitScale("SIGA", 8)).toBe(1);
        expect(fitScale("12345678", 8)).toBe(1);
        expect(fitScale("", 8)).toBe(1);
    });

    it("shrinks longer text in proportion", () => {
        expect(fitScale("1234567890123456", 8)).toBe(0.5);
    });

    it("never goes below the readable floor", () => {
        expect(fitScale("x".repeat(200), 8)).toBe(0.3);
    });
});
