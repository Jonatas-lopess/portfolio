import { describe, expect, it } from "vitest";
import { deactivate, indexLabel, padNumber, rowState } from "@/lib/project-index";

describe("indexLabel", () => {
    it("numbers rows from 1 with two digits", () => {
        expect(indexLabel(0)).toBe("01");
        expect(indexLabel(3)).toBe("04");
        expect(indexLabel(9)).toBe("10");
    });

    it("does not truncate three-digit positions", () => {
        expect(indexLabel(99)).toBe("100");
    });
});

describe("padNumber", () => {
    it("pads the count to two digits", () => {
        expect(padNumber(0)).toBe("00");
        expect(padNumber(4)).toBe("04");
        expect(padNumber(12)).toBe("12");
    });
});

describe("rowState", () => {
    const withTagline = { slug: "siga", tagline: "Offline-first ERP" };
    const withoutTagline = { slug: "ai", tagline: null };

    it("shows the tagline only on the active row", () => {
        expect(rowState(withTagline, "siga")).toEqual({ active: true, tagline: "Offline-first ERP" });
        expect(rowState(withTagline, "ai")).toEqual({ active: false, tagline: null });
        expect(rowState(withTagline, null)).toEqual({ active: false, tagline: null });
    });

    it("is active without any tagline when the Project has none", () => {
        expect(rowState(withoutTagline, "ai")).toEqual({ active: true, tagline: null });
    });

    it("treats a blank tagline as none", () => {
        expect(rowState({ slug: "x", tagline: "  " }, "x")).toEqual({ active: true, tagline: null });
    });
});

describe("deactivate", () => {
    it("clears the row that was active", () => {
        expect(deactivate("siga", "siga")).toBeNull();
    });

    it("keeps another row active (focus moved or pointer entered it first)", () => {
        expect(deactivate("ai", "siga")).toBe("ai");
        expect(deactivate(null, "siga")).toBeNull();
    });
});
