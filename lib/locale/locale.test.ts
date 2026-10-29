import { describe, expect, it } from "vitest";
import { getDictionary, hasLocalePrefix, isLocale, localePath, negotiateLocale, switchLocalePath } from "@/lib/locale";

describe("negotiateLocale", () => {
    it("picks an exact supported Locale", () => {
        expect(negotiateLocale("pt-BR")).toBe("pt-BR");
        expect(negotiateLocale("en")).toBe("en");
    });

    it("falls back to the default Locale when the header is absent or empty", () => {
        expect(negotiateLocale(null)).toBe("en");
        expect(negotiateLocale(undefined)).toBe("en");
        expect(negotiateLocale("")).toBe("en");
    });

    it("falls back to the default Locale for unknown languages", () => {
        expect(negotiateLocale("fr-FR,de;q=0.8")).toBe("en");
        expect(negotiateLocale("*")).toBe("en");
        expect(negotiateLocale("garbage;;;")).toBe("en");
    });

    it("accepts underscores in place of hyphens", () => {
        expect(negotiateLocale("pt_BR")).toBe("pt-BR");
        expect(negotiateLocale("en_US,pt_BR;q=0.5")).toBe("en");
    });

    it("matches case-insensitively and returns the canonical spelling", () => {
        expect(negotiateLocale("pt-br")).toBe("pt-BR");
        expect(negotiateLocale("PT-BR")).toBe("pt-BR");
    });

    it("matches a regional or bare tag to a supported Locale of the same language", () => {
        expect(negotiateLocale("en-US")).toBe("en");
        expect(negotiateLocale("en-GB,en;q=0.9")).toBe("en");
        expect(negotiateLocale("pt")).toBe("pt-BR");
        expect(negotiateLocale("pt-PT")).toBe("pt-BR");
    });

    it("prefers the highest q-value, not the first position", () => {
        expect(negotiateLocale("en;q=0.5,pt-BR;q=0.9")).toBe("pt-BR");
        expect(negotiateLocale("fr,pt-BR;q=0.5,en;q=0.4")).toBe("pt-BR");
    });

    it("keeps header order among equal q-values", () => {
        expect(negotiateLocale("pt-BR,en")).toBe("pt-BR");
        expect(negotiateLocale("en,pt-BR")).toBe("en");
    });

    it("ignores languages with q=0", () => {
        expect(negotiateLocale("pt-BR;q=0,fr")).toBe("en");
        expect(negotiateLocale("pt-BR;q=0, en;q=0.1")).toBe("en");
    });

    it("tolerates spaces and a malformed q-value", () => {
        expect(negotiateLocale(" fr ; q=0.9 , pt-BR ; q=0.8 ")).toBe("pt-BR");
        expect(negotiateLocale("pt-BR;q=abc")).toBe("pt-BR");
    });
});

describe("localePath", () => {
    it("prefixes a path with the Locale", () => {
        expect(localePath("en", "/projects")).toBe("/en/projects");
        expect(localePath("pt-BR", "/projects/my-app")).toBe("/pt-BR/projects/my-app");
    });

    it("gives the bare Locale path for the root", () => {
        expect(localePath("en", "/")).toBe("/en");
        expect(localePath("pt-BR", "")).toBe("/pt-BR");
    });

    it("always gives an absolute path, even for a path without a leading slash", () => {
        expect(localePath("en", "about")).toBe("/en/about");
    });
});

describe("hasLocalePrefix", () => {
    it("is true only for paths whose first segment is a supported Locale", () => {
        expect(hasLocalePrefix("/en")).toBe(true);
        expect(hasLocalePrefix("/en/projects")).toBe(true);
        expect(hasLocalePrefix("/pt-BR/")).toBe(true);
        expect(hasLocalePrefix("/")).toBe(false);
        expect(hasLocalePrefix("/projects")).toBe(false);
        expect(hasLocalePrefix("/english")).toBe(false);
        expect(hasLocalePrefix("/fr/projects")).toBe(false);
        expect(hasLocalePrefix("/projects/en")).toBe(false);
    });
});

describe("switchLocalePath", () => {
    it("swaps the Locale prefix of a prefixed path", () => {
        expect(switchLocalePath("/en/projects/my-app", "pt-BR")).toBe("/pt-BR/projects/my-app");
        expect(switchLocalePath("/pt-BR/about", "en")).toBe("/en/about");
    });

    it("swaps the Locale on the bare Locale path", () => {
        expect(switchLocalePath("/en", "pt-BR")).toBe("/pt-BR");
        expect(switchLocalePath("/pt-BR/", "en")).toBe("/en");
    });

    it("adds the prefix to an unprefixed path", () => {
        expect(switchLocalePath("/projects", "pt-BR")).toBe("/pt-BR/projects");
        expect(switchLocalePath("/", "pt-BR")).toBe("/pt-BR");
    });

    it("does not mistake a path segment that merely starts with a Locale for a prefix", () => {
        expect(switchLocalePath("/english/notes", "pt-BR")).toBe("/pt-BR/english/notes");
    });

    it("keeps a path already in the target Locale unchanged", () => {
        expect(switchLocalePath("/en/projects", "en")).toBe("/en/projects");
    });
});

describe("isLocale", () => {
    it("accepts supported Locales exactly as spelled", () => {
        expect(isLocale("en")).toBe(true);
        expect(isLocale("pt-BR")).toBe(true);
        expect(isLocale("pt-br")).toBe(false);
        expect(isLocale("fr")).toBe(false);
        expect(isLocale("")).toBe(false);
    });
});

describe("getDictionary", () => {
    it("gives the Dictionary of a supported Locale", () => {
        expect(getDictionary("en").NavBar.Projects).toBe("Projects");
        expect(getDictionary("pt-BR").NavBar.Projects).toBe("Projetos");
    });

    it("falls back to the English Dictionary for an unknown Locale", () => {
        expect(getDictionary("fr").NavBar.Projects).toBe("Projects");
        expect(getDictionary("").NavBar.Home).toBe("Home");
    });
});
