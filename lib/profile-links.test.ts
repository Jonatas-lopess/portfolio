import { describe, expect, it } from "vitest";
import { locales } from "@/lib/locale";
import { cvPath, profileLinkAnchorProps, profileLinkHref, profileLinks } from "./profile-links";

describe("profileLinks", () => {
    it("has unique ids", () => {
        expect(new Set(profileLinks.map((l) => l.id)).size).toBe(profileLinks.length);
    });

    it("opens every external link over https and gives it a name", () => {
        for (const link of profileLinks.filter((l) => l.external)) {
            expect("href" in link && link.href.startsWith("https://")).toBe(true);
            expect("name" in link && link.name.length > 0).toBe(true);
        }
    });

    it("serves the CV from the public folder, not as an external link", () => {
        const cv = profileLinks.find((l) => l.id === "cv");
        expect(cv?.external).toBe(false);
        expect(profileLinkHref(cv!, "en")).toBe(cvPath("en"));
    });
});

describe("cvPath", () => {
    it("gives each Locale its own CV file", () => {
        expect(new Set(locales.map(cvPath)).size).toBe(locales.length);
        expect(cvPath("pt-BR")).toBe("/cv/pt-BR.pdf");
        expect(cvPath("en")).toBe("/cv/en.pdf");
    });

    it("falls back to the default Locale's CV for an unknown Locale", () => {
        expect(cvPath("xx" as never)).toBe(cvPath("en"));
    });

    it("downloads under a readable name per Locale", () => {
        const cv = profileLinks.find((l) => l.id === "cv")!;
        expect(profileLinkAnchorProps(cv, "pt-BR")).toEqual({ download: "Jonatas-Lopes-CV-pt-BR.pdf" });
    });
});
