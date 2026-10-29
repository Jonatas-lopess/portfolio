import { describe, expect, it } from "vitest";
import { activeNavItem } from "@/lib/nav";

describe("activeNavItem", () => {
    it("marks Home on the Locale root, with or without a trailing slash", () => {
        expect(activeNavItem("/en")).toBe("home");
        expect(activeNavItem("/pt-BR/")).toBe("home");
    });

    it("marks Projects on the listing in either Locale", () => {
        expect(activeNavItem("/en/projects")).toBe("projects");
        expect(activeNavItem("/pt-BR/projects")).toBe("projects");
    });

    it("keeps Projects active on a Project page, including encoded slugs", () => {
        expect(activeNavItem("/en/projects/siga-erp")).toBe("projects");
        expect(activeNavItem("/pt-BR/projects/Ai%20harness")).toBe("projects");
    });

    it("marks About in either Locale", () => {
        expect(activeNavItem("/en/about")).toBe("about");
        expect(activeNavItem("/pt-BR/about")).toBe("about");
    });

    it("works on an unprefixed path", () => {
        expect(activeNavItem("/")).toBe("home");
        expect(activeNavItem("/projects/x")).toBe("projects");
    });

    it("marks nothing for other paths or lookalike segments", () => {
        expect(activeNavItem("/en/unknown")).toBeNull();
        expect(activeNavItem("/en/projectsfoo")).toBeNull();
        expect(activeNavItem("/en/about/more")).toBeNull();
        expect(activeNavItem(null)).toBeNull();
    });
});
