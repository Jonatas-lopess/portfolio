/**
 * Reading and writing `dictionary/<locale>.ts`, the one file format Sync
 * produces. The format is exactly the hand-written `pt-BR.ts`, so a patch to
 * that file is a small diff:
 *
 *   import type { DictionaryEntry } from "./en";
 *
 *   export const ptBR: DictionaryEntry = {
 *       Section: {
 *           Key: "text"
 *       }
 *   };
 *
 * Reading is a small parser for exactly this subset (nested object literals of
 * string literals) rather than importing the module, so Sync can read a file
 * through the same FileStore it writes to, and so a file it cannot understand
 * is reported instead of guessed at.
 */

export type DictionaryTree = { [key: string]: string | DictionaryTree };

export type DictionaryEntryText = { path: string; text: string };

/** Every string leaf with its dotted path, in the order the object lists them. */
export function flattenDictionary(tree: DictionaryTree, prefix = ""): DictionaryEntryText[] {
    return Object.entries(tree).flatMap(([key, value]) => {
        const path = prefix === "" ? key : `${prefix}.${key}`;
        return typeof value === "string" ? [{ path, text: value }] : flattenDictionary(value, path);
    });
}

/** Sets a string at a dotted path, creating the sections on the way. */
export function setPath(tree: DictionaryTree, path: string, text: string): void {
    const keys = path.split(".");
    let node = tree;
    for (const key of keys.slice(0, -1)) {
        const next = node[key];
        if (typeof next === "string") throw new Error(`${path}: ${key} is both a section and a string`);
        node = (node[key] = next ?? {});
    }
    node[keys[keys.length - 1]] = text;
}

/** The exported constant for a Locale tag: `es` -> `es`, `pt-BR` -> `ptBR`, `zh-Hans` -> `zhHans`. */
export function exportNameFor(locale: string): string {
    return locale
        .split("-")
        .map((part, i) => (i === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1)))
        .join("");
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export function renderDictionaryFile(exportName: string, tree: DictionaryTree): string {
    const body = (node: DictionaryTree, depth: number): string => {
        const pad = "    ".repeat(depth);
        const lines = Object.entries(node).map(([key, value]) => {
            const name = IDENTIFIER.test(key) ? key : JSON.stringify(key);
            return typeof value === "string"
                ? `${pad}${name}: ${JSON.stringify(value)}`
                : `${pad}${name}: {\n${body(value, depth + 1)}\n${pad}}`;
        });
        return lines.join(",\n");
    };
    return `import type { DictionaryEntry } from "./en";\n\nexport const ${exportName}: DictionaryEntry = {\n${body(tree, 1)}\n};\n`;
}

class Reader {
    private i = 0;
    constructor(private readonly text: string) {}

    private fail(message: string): never {
        const line = this.text.slice(0, this.i).split("\n").length;
        throw new Error(`Cannot read the Dictionary file: ${message} (line ${line}). Sync only reads the generated format; use plain "double-quoted" strings in nested objects.`);
    }

    private skip(): void {
        for (;;) {
            const rest = this.text.slice(this.i);
            const space = /^\s+/.exec(rest);
            if (space) this.i += space[0].length;
            else if (rest.startsWith("//")) this.i += (rest.indexOf("\n") + 1 || rest.length);
            else if (rest.startsWith("/*")) {
                const end = rest.indexOf("*/");
                if (end < 0) this.fail("unterminated comment");
                this.i += end + 2;
            } else return;
        }
    }

    private peek(): string {
        this.skip();
        return this.text[this.i] ?? "";
    }

    private expect(char: string): void {
        if (this.peek() !== char) this.fail(`expected "${char}"`);
        this.i++;
    }

    private string(): string {
        const quote = this.text[this.i];
        this.i++;
        let out = "";
        for (;;) {
            const c = this.text[this.i];
            if (c === undefined || c === "\n") this.fail("unterminated string");
            this.i++;
            if (c === quote) return out;
            if (c !== "\\") {
                out += c;
                continue;
            }
            const e = this.text[this.i++];
            const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0", "\\": "\\", '"': '"', "'": "'", "/": "/" };
            if (e in simple) out += simple[e];
            else if (e === "u" && this.text[this.i] === "{") {
                const end = this.text.indexOf("}", this.i);
                out += String.fromCodePoint(parseInt(this.text.slice(this.i + 1, end), 16));
                this.i = end + 1;
            } else if (e === "u" || e === "x") {
                const n = e === "u" ? 4 : 2;
                const hex = this.text.slice(this.i, this.i + n);
                if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length !== n) this.fail("bad escape");
                out += String.fromCharCode(parseInt(hex, 16));
                this.i += n;
            } else this.fail(`unsupported escape \\${e}`);
        }
    }

    private key(): string {
        const c = this.peek();
        if (c === '"' || c === "'") return this.string();
        const word = /^[A-Za-z_$][\w$]*/.exec(this.text.slice(this.i));
        if (!word) this.fail("expected a key");
        this.i += word[0].length;
        return word[0];
    }

    object(): DictionaryTree {
        this.expect("{");
        const node: DictionaryTree = {};
        while (this.peek() !== "}") {
            const key = this.key();
            this.expect(":");
            if (key in node) this.fail(`duplicate key ${key}`);
            const c = this.peek();
            if (c === "{") node[key] = this.object();
            else if (c === '"' || c === "'") node[key] = this.string();
            else this.fail("expected a string or an object (templates, numbers and expressions are not supported)");
            if (this.peek() === ",") this.i++;
            else if (this.peek() !== "}") this.fail('expected "," or "}"');
        }
        this.i++;
        return node;
    }

    file(): { exportName: string; tree: DictionaryTree } {
        this.skip();
        while (/^import\b/.test(this.text.slice(this.i))) {
            const end = this.text.indexOf(";", this.i);
            if (end < 0) this.fail("unterminated import");
            this.i = end + 1;
            this.skip();
        }
        const head = /^export\s+const\s+([A-Za-z_$][\w$]*)\s*(?::\s*DictionaryEntry)?\s*=\s*/.exec(this.text.slice(this.i));
        if (!head) this.fail('expected "export const <name>: DictionaryEntry = {"');
        this.i += head[0].length;
        const tree = this.object();
        this.skip();
        if (this.text[this.i] === ";") this.i++;
        if (this.peek() !== "") this.fail("unexpected code after the Dictionary object");
        return { exportName: head[1], tree };
    }
}

export function parseDictionaryFile(text: string): { exportName: string; tree: DictionaryTree } {
    return new Reader(text).file();
}

/**
 * The registry (`dictionary/index.ts`) with a Locale added: an import after the
 * last import, and an entry at the end of `dictionaries`. Returns the text
 * unchanged when the Locale is already imported, and null when the file is not
 * in the expected shape (the caller then reports the lines to add by hand).
 */
export function addToRegistry(source: string, locale: string): string | null {
    if (source.includes(`from "./${locale}"`)) return source;
    const name = exportNameFor(locale);
    const imports = Array.from(source.matchAll(/^import .* from "\.\/[^"]+";\r?\n/gm));
    const lastImport = imports[imports.length - 1];
    const object = /(export const dictionaries[^=]*=\s*\{\r?\n[\s\S]*?)(\r?\n)\};/.exec(source);
    if (!lastImport || !object || lastImport.index === undefined || lastImport.index > object.index) return null;
    if (!object[1].trimEnd().endsWith(",")) return null;

    const key = IDENTIFIER.test(locale) ? locale : JSON.stringify(locale);
    const entry = key === name ? name : `${key}: ${name}`;
    const withEntry = source.slice(0, object.index) + `${object[1]}${object[2]}    ${entry},${object[2]}};` + source.slice(object.index + object[0].length);
    const importEnd = lastImport.index + lastImport[0].length;
    return withEntry.slice(0, importEnd) + `import { ${name} } from "./${locale}";\n` + withEntry.slice(importEnd);
}

/** The lines a person adds to `dictionary/index.ts` when `addToRegistry` cannot. */
export function registryLines(locale: string): string[] {
    const name = exportNameFor(locale);
    const key = IDENTIFIER.test(locale) ? locale : JSON.stringify(locale);
    return [`import { ${name} } from "./${locale}";`, `    ${key === name ? name : `${key}: ${name}`},`];
}
