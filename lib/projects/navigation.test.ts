import { describe, expect, it } from "vitest";
import { projectNavigation } from "@/lib/projects/navigation";

const slugs = ["siga", "ai_harness", "legal_manager", "erp_project"];

describe("projectNavigation", () => {
    it("gives the position (1-based, Allowlist order), the total and the next slug", () => {
        expect(projectNavigation(slugs, "siga")).toEqual({ position: 1, total: 4, next: "ai_harness", nextPosition: 2 });
        expect(projectNavigation(slugs, "legal_manager")).toEqual({ position: 3, total: 4, next: "erp_project", nextPosition: 4 });
    });

    it("wraps from the last Project to the first", () => {
        expect(projectNavigation(slugs, "erp_project")).toEqual({ position: 4, total: 4, next: "siga", nextPosition: 1 });
    });

    it("has no next with a single Project", () => {
        expect(projectNavigation(["siga"], "siga")).toEqual({ position: 1, total: 1, next: null, nextPosition: null });
    });

    it("returns null for a slug that is not listed", () => {
        expect(projectNavigation(slugs, "other")).toBeNull();
        expect(projectNavigation([], "siga")).toBeNull();
    });
});
