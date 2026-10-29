import { describe, expect, it } from "vitest";
import { dictionaries } from "@/dictionary";
import { getDictionary, locales } from "@/lib/locale";

/** Every leaf's dotted path, so nested keys are compared and not only the top level. */
function keyPaths(value: unknown, prefix = ""): string[] {
    if (typeof value !== "object" || value === null) return [prefix];
    return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix === "" ? key : `${prefix}.${key}`));
}

function compareKeyPaths(expected: unknown, actual: unknown) {
    const want = keyPaths(expected);
    const got = keyPaths(actual);
    return {
        missing: want.filter((path) => !got.includes(path)).sort(),
        extra: got.filter((path) => !want.includes(path)).sort(),
    };
}

describe("every Locale's Dictionary", () => {
    it.each(locales.map((locale) => [locale]))("%s has exactly the English key set", (locale) => {
        expect(compareKeyPaths(dictionaries.en, dictionaries[locale])).toEqual({ missing: [], extra: [] });
    });

    it.each(locales.map((locale) => [locale]))("%s has only non-empty strings", (locale) => {
        for (const path of keyPaths(dictionaries[locale])) {
            const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], dictionaries[locale]);
            expect(typeof value, `${locale} ${path}`).toBe("string");
            expect((value as string).trim(), `${locale} ${path}`).not.toBe("");
        }
    });

    it("is served by getDictionary for each supported Locale", () => {
        for (const locale of locales) expect(getDictionary(locale)).toBe(dictionaries[locale]);
    });

    it("falls back to English through getDictionary for an unknown Locale", () => {
        expect(getDictionary("fr")).toBe(dictionaries.en);
    });
});

describe("the key comparison itself", () => {
    const english = { A: { B: "b", C: "c" }, D: "d" };

    it("reports a missing nested key", () => {
        expect(compareKeyPaths(english, { A: { B: "b" }, D: "d" })).toEqual({ missing: ["A.C"], extra: [] });
    });

    it("reports an extra nested key", () => {
        expect(compareKeyPaths(english, { A: { B: "b", C: "c", E: "e" }, D: "d" })).toEqual({ missing: [], extra: ["A.E"] });
    });

    it("reports a whole section that is missing", () => {
        expect(compareKeyPaths(english, { D: "d" })).toEqual({ missing: ["A.B", "A.C"], extra: [] });
    });

    it("accepts the same keys with different text", () => {
        expect(compareKeyPaths(english, { A: { B: "x", C: "y" }, D: "z" })).toEqual({ missing: [], extra: [] });
    });
});
