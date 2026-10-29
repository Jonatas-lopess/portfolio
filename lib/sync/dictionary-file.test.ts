import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/dictionary/en";
import { ptBR } from "@/dictionary/pt-BR";
import {
    addToRegistry,
    type DictionaryTree,
    exportNameFor,
    flattenDictionary,
    parseDictionaryFile,
    renderDictionaryFile,
    setPath,
} from "@/lib/sync/dictionary-file";

const read = (name: string) => readFileSync(path.join(process.cwd(), "dictionary", name), "utf8");

describe("Dictionary file format", () => {
    it("renders exactly the layout of the hand-written pt-BR file, so patches stay small", () => {
        expect(renderDictionaryFile("ptBR", ptBR)).toBe(read("pt-BR.ts"));
    });

    it("parses the real pt-BR file back to the same values", () => {
        expect(parseDictionaryFile(read("pt-BR.ts"))).toEqual({ exportName: "ptBR", tree: ptBR });
    });

    it("flattens a nested Dictionary to dotted paths in source order", () => {
        expect(flattenDictionary({ A: { B: "b", C: "c" }, D: "d" })).toEqual([
            { path: "A.B", text: "b" },
            { path: "A.C", text: "c" },
            { path: "D", text: "d" },
        ]);
    });

    it("sets a value at a dotted path, creating sections", () => {
        const tree: DictionaryTree = {};
        setPath(tree, "A.B", "b");
        setPath(tree, "D", "d");
        expect(tree).toEqual({ A: { B: "b" }, D: "d" });
    });

    it("names the export after the Locale", () => {
        expect([exportNameFor("es"), exportNameFor("pt-BR"), exportNameFor("zh-Hans"), exportNameFor("es-mx")]).toEqual([
            "es",
            "ptBR",
            "zhHans",
            "esMx",
        ]);
    });

    it("round-trips awkward text: quotes, backslashes, newlines and unicode", () => {
        const tree = { A: { B: 'say "hi" \\ and\nbye', C: "ação ✓" } };
        expect(parseDictionaryFile(renderDictionaryFile("x", tree)).tree).toEqual(tree);
    });

    it("reads single quotes, quoted keys, trailing commas and comments", () => {
        const file = `import type { DictionaryEntry } from "./en";
// hand note
export const es: DictionaryEntry = {
    /* section */ A: { 'B': 'it\\'s', "C-D": "c", },
};`;
        expect(parseDictionaryFile(file).tree).toEqual({ A: { B: "it's", "C-D": "c" } });
    });

    it.each([
        ["a template literal", "export const es = { A: `x` };"],
        ["a concatenation", 'export const es = { A: "a" + "b" };'],
        ["a spread", "export const es = { ...other };"],
        ["a number", "export const es = { A: 1 };"],
        ["no export", "const es = { A: 'x' };"],
        ["trailing code", 'export const es = { A: "x" };\nconsole.log(1);'],
        ["an unterminated string", 'export const es = { A: "x };'],
    ])("refuses %s with a message instead of guessing", (_name, file) => {
        expect(() => parseDictionaryFile(file)).toThrow(/Cannot read/);
    });
});

describe("the Dictionary registry", () => {
    // A fixture shaped like dictionary/index.ts, so the test does not change when a Locale is added.
    const index = `import type { Locale } from "@/lib/locale";
import { en, type DictionaryEntry } from "./en";
import { ptBR } from "./pt-BR";

export const dictionaries: Record<Locale, DictionaryEntry> = {
    en,
    "pt-BR": ptBR,
};
`;

    it("adds the import and the entry for a new Locale, keeping the rest", () => {
        const patched = addToRegistry(index, "es");

        expect(patched).toContain('import { es } from "./es";');
        expect(patched).toMatch(/\n    es,\n};/);
        expect(patched!.replace('import { es } from "./es";\n', "").replace("    es,\n", "")).toBe(index);
    });

    it("quotes a Locale key that is not an identifier", () => {
        expect(addToRegistry(index, "zh-Hans")).toMatch(/\n    "zh-Hans": zhHans,\n};/);
    });

    it("returns the file unchanged when the Locale is already registered", () => {
        expect(addToRegistry(index, "pt-BR")).toBe(index);
    });

    it("gives up (null) when the file is not in the expected shape", () => {
        expect(addToRegistry("export const dictionaries = makeThem();", "es")).toBeNull();
    });

    it("keeps English as the source of the shape", () => {
        expect(flattenDictionary(en).length).toBeGreaterThan(10);
    });
});
