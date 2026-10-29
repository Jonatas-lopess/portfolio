import { describe, expect, it } from "vitest";
import { CV_PATH, profileLinks } from "./profile-links";

describe("profileLinks", () => {
    it("has unique ids and unique hrefs", () => {
        expect(new Set(profileLinks.map((l) => l.id)).size).toBe(profileLinks.length);
        expect(new Set(profileLinks.map((l) => l.href)).size).toBe(profileLinks.length);
    });

    it("opens every external link over https and gives it a name", () => {
        for (const link of profileLinks.filter((l) => l.external)) {
            expect(link.href.startsWith("https://")).toBe(true);
            expect("name" in link && link.name.length > 0).toBe(true);
        }
    });

    it("serves the CV from the public folder, not as an external link", () => {
        const cv = profileLinks.find((l) => l.id === "cv");
        expect(cv?.href).toBe(CV_PATH);
        expect(cv?.external).toBe(false);
    });
});
