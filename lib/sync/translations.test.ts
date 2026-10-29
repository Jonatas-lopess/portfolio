import { describe, expect, it } from "vitest";
import { hashSourceText } from "@/lib/projects";
import { runSync, type SyncDeps } from "@/lib/sync";
import { parseDictionaryFile, renderDictionaryFile, flattenDictionary } from "@/lib/sync/dictionary-file";
import { createMemoryStore } from "@/lib/sync/in-memory";
import { SYNC_STATE_PATH } from "@/lib/sync/translations";
import { createFakeTranslator } from "@/lib/translator/fake";

const source = { Nav: { Home: "Home", About: "About" }, Title: "Title" };
const enc = (text: string) => new TextEncoder().encode(text);
const dec = (bytes: Uint8Array | null) => (bytes ? new TextDecoder().decode(bytes) : null);

const REGISTRY = `import type { Locale } from "@/lib/locale";
import { en, type DictionaryEntry } from "./en";
import { ptBR } from "./pt-BR";

export const dictionaries: Record<Locale, DictionaryEntry> = {
    en,
    "pt-BR": ptBR,
};
`;
const ptBR = { Nav: { Home: "Início", About: "Sobre" }, Title: "Título" };
const h = hashSourceText;
const stateOf = (store: ReturnType<typeof createMemoryStore>) => JSON.parse(dec(store.files.get(SYNC_STATE_PATH) ?? null) ?? "null");
const fileOf = (store: ReturnType<typeof createMemoryStore>, locale: string) => dec(store.files.get(`/dictionary/${locale}.ts`) ?? null);

/** The repo-root store with the registry and optionally a pt-BR file and state. */
function repo(files: Record<string, string> = {}) {
    return createMemoryStore(Object.fromEntries(Object.entries({ "/dictionary/index.ts": REGISTRY, ...files }).map(([k, v]) => [k, enc(v)])));
}

function sync(options: {
    store: ReturnType<typeof createMemoryStore>;
    translator?: ReturnType<typeof createFakeTranslator>;
    locales?: string[];
    source?: typeof source;
    regenerateStale?: boolean;
    screenshots?: SyncDeps["github"];
}) {
    const translator = options.translator ?? createFakeTranslator();
    return runSync({
        github: options.screenshots ?? { getScreenshot: async () => null },
        store: createMemoryStore(),
        allowlist: [],
        translations: {
            translator,
            store: options.store,
            source: options.source ?? source,
            sourceLocale: "en",
            locales: options.locales ?? ["pt-BR"],
            regenerateStale: options.regenerateStale,
        },
    }).then((report) => ({ report, translator }));
}

const ptFile = (tree: object = ptBR) => renderDictionaryFile("ptBR", tree as never);
const ptState = (source_: typeof source = source) => ({
    "pt-BR": { "Nav.Home": h(source_.Nav.Home), "Nav.About": h(source_.Nav.About), Title: h(source_.Title) },
});

describe("Sync generates a Locale with no Dictionary file", () => {
    it("translates every entry, writes a file that has exactly the English keys, and records the Source hashes", async () => {
        const store = repo();
        const { report, translator } = await sync({ store, locales: ["es"] });

        expect(translator.requests).toEqual([
            { text: "Home", locale: "es" },
            { text: "About", locale: "es" },
            { text: "Title", locale: "es" },
        ]);
        const written = parseDictionaryFile(fileOf(store, "es")!);
        expect(written.exportName).toBe("es");
        expect(flattenDictionary(written.tree)).toEqual([
            { path: "Nav.Home", text: "[es] Home" },
            { path: "Nav.About", text: "[es] About" },
            { path: "Title", text: "[es] Title" },
        ]);
        expect(stateOf(store)).toEqual({ es: { "Nav.About": h("About"), "Nav.Home": h("Home"), Title: h("Title") } });
        expect(report.translations!.es).toMatchObject({ created: true, generated: ["Nav.Home", "Nav.About", "Title"], failed: [] });
    });

    it("registers the new Locale in the Dictionary registry", async () => {
        const store = repo();
        const { report } = await sync({ store, locales: ["es"] });

        expect(dec(store.files.get("/dictionary/index.ts")!)).toContain('import { es } from "./es";');
        expect(dec(store.files.get("/dictionary/index.ts")!)).toMatch(/\n    es,\n};/);
        expect(report.translations!.es.registry).toBe("added");
    });

    it("reports the exact lines to add when the registry is not in a shape it can patch", async () => {
        const store = repo({ "/dictionary/index.ts": "export const dictionaries = build();\n" });
        const { report } = await sync({ store, locales: ["es"] });

        expect(dec(store.files.get("/dictionary/index.ts")!)).toBe("export const dictionaries = build();\n");
        expect(report.translations!.es.registry).toBe("manual");
        expect(report.translations!.es.registryLines).toEqual(['import { es } from "./es";', "    es,"]);
    });

    it("running Sync again sends nothing to the Translator and writes nothing", async () => {
        const store = repo();
        await sync({ store, locales: ["es"] });
        const before = new Map(store.files);
        store.writes.length = 0;

        const { report, translator } = await sync({ store, locales: ["es"] });

        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(store.files).toEqual(before);
        expect(report.translations!.es).toMatchObject({ created: false, generated: [], unchanged: ["Nav.Home", "Nav.About", "Title"] });
    });
});

describe("Sync and an existing Translation", () => {
    it("never overwrites it, and baselines the current Source hash when none was recorded", async () => {
        const store = repo({ "/dictionary/pt-BR.ts": ptFile() });
        const { report, translator } = await sync({ store });

        expect(translator.requests).toEqual([]);
        expect(fileOf(store, "pt-BR")).toBe(ptFile());
        expect(store.writes).toEqual([SYNC_STATE_PATH]);
        expect(stateOf(store)).toEqual(ptState());
        expect(report.translations!["pt-BR"]).toMatchObject({ baselined: ["Nav.Home", "Nav.About", "Title"], generated: [], stale: [], failed: [] });
    });

    it("sends only a new English key, adds it, and leaves every existing value untouched", async () => {
        const store = repo({ "/dictionary/pt-BR.ts": ptFile(), [SYNC_STATE_PATH]: JSON.stringify(ptState()) });
        const next = { Nav: { Home: "Home", About: "About", Contact: "Contact" }, Title: "Title" };

        const { report, translator } = await sync({ store, source: next as never });

        expect(translator.requests).toEqual([{ text: "Contact", locale: "pt-BR" }]);
        const written = parseDictionaryFile(fileOf(store, "pt-BR")!).tree;
        expect(written).toEqual({ Nav: { Home: "Início", About: "Sobre", Contact: "[pt-BR] Contact" }, Title: "Título" });
        expect(fileOf(store, "pt-BR")).toBe(ptFile({ Nav: { Home: "Início", About: "Sobre", Contact: "[pt-BR] Contact" }, Title: "Título" }));
        expect(report.translations!["pt-BR"]).toMatchObject({ generated: ["Nav.Contact"], created: false });
        expect(stateOf(store)["pt-BR"]["Nav.Contact"]).toBe(h("Contact"));
    });

    it("reports a Stale translation when the English changed, without sending it or overwriting it", async () => {
        const store = repo({ "/dictionary/pt-BR.ts": ptFile(), [SYNC_STATE_PATH]: JSON.stringify(ptState()) });
        const changed = { Nav: { Home: "Home", About: "About us" }, Title: "Title" };

        const { report, translator } = await sync({ store, source: changed as never });

        expect(translator.requests).toEqual([]);
        expect(fileOf(store, "pt-BR")).toBe(ptFile());
        expect(report.translations!["pt-BR"].stale).toEqual(["Nav.About"]);
        expect(stateOf(store)["pt-BR"]["Nav.About"]).toBe(h("About"));
    });

    it("keeps reporting it as stale on every run until it is regenerated", async () => {
        const store = repo({ "/dictionary/pt-BR.ts": ptFile(), [SYNC_STATE_PATH]: JSON.stringify(ptState()) });
        const changed = { Nav: { Home: "Home", About: "About us" }, Title: "Title" };

        await sync({ store, source: changed as never });
        const { report } = await sync({ store, source: changed as never });

        expect(report.translations!["pt-BR"].stale).toEqual(["Nav.About"]);
    });

    it("regenerates only the Stale entries, and only with the explicit flag", async () => {
        const store = repo({ "/dictionary/pt-BR.ts": ptFile(), [SYNC_STATE_PATH]: JSON.stringify(ptState()) });
        const changed = { Nav: { Home: "Home", About: "About us" }, Title: "Title" };

        const { report, translator } = await sync({ store, source: changed as never, regenerateStale: true });

        expect(translator.requests).toEqual([{ text: "About us", locale: "pt-BR" }]);
        expect(parseDictionaryFile(fileOf(store, "pt-BR")!).tree).toEqual({
            Nav: { Home: "Início", About: "[pt-BR] About us" },
            Title: "Título",
        });
        expect(report.translations!["pt-BR"]).toMatchObject({ regenerated: ["Nav.About"], stale: ["Nav.About"], generated: [] });
        expect(stateOf(store)["pt-BR"]["Nav.About"]).toBe(h("About us"));

        const again = await sync({ store, source: changed as never, regenerateStale: true });
        expect(again.translator.requests).toEqual([]);
        expect(again.report.translations!["pt-BR"].stale).toEqual([]);
    });
});

describe("Sync when the Translator fails", () => {
    it("leaves an existing file and the state untouched and names the entries that failed", async () => {
        const state = JSON.stringify(ptState());
        const store = repo({ "/dictionary/pt-BR.ts": ptFile(), [SYNC_STATE_PATH]: state });
        const next = { Nav: { Home: "Home", About: "About", Contact: "Contact", Help: "Help" }, Title: "Title" };
        const translator = createFakeTranslator({ failOn: ["Help"] });

        const { report } = await sync({ store, source: next as never, translator });

        expect(store.writes).toEqual([]);
        expect(fileOf(store, "pt-BR")).toBe(ptFile());
        expect(dec(store.files.get(SYNC_STATE_PATH)!)).toBe(state);
        expect(report.translations!["pt-BR"].failed).toEqual([{ path: "Nav.Help", error: "fake translator refused: Help" }]);
        expect(report.translations!["pt-BR"]).toMatchObject({ generated: [], baselined: [] });
    });

    it("creates no file and no registry line for a new Locale", async () => {
        const store = repo();
        const { report } = await sync({ store, locales: ["es"], translator: createFakeTranslator({ failOn: ["About"] }) });

        expect(store.writes).toEqual([]);
        expect(store.files.has("/dictionary/es.ts")).toBe(false);
        expect(report.translations!.es.failed.map((f) => f.path)).toEqual(["Nav.About"]);
        expect(report.translations!.es.registry).toBe("skipped");
    });

    it("still completes the other Locales", async () => {
        const store = repo({ "/dictionary/pt-BR.ts": ptFile(), [SYNC_STATE_PATH]: JSON.stringify(ptState()) });
        const next = { Nav: { Home: "Home", About: "About", Contact: "Contact" }, Title: "Title" };

        const { report } = await sync({ store, source: next as never, locales: ["es", "pt-BR"], translator: createFakeTranslator({ failOn: ["Home"] }) });

        expect(report.translations!.es.failed).toHaveLength(1);
        expect(report.translations!["pt-BR"].generated).toEqual(["Nav.Contact"]);
        expect(store.files.has("/dictionary/es.ts")).toBe(false);
    });

    it("does not stop Screenshots from being copied", async () => {
        const screenshotStore = createMemoryStore();
        const report = await runSync({
            github: { getScreenshot: async () => enc("png") },
            store: screenshotStore,
            allowlist: [{ repo: "alpha" }],
            translations: { translator: createFakeTranslator({ failOn: ["Home"] }), store: repo(), source, sourceLocale: "en", locales: ["es"] },
        });

        expect(report.screenshots.copied).toEqual(["alpha"]);
        expect(report.translations!.es.failed).toHaveLength(1);
    });
});

describe("Sync refuses to guess", () => {
    it("reports a file it cannot read and does not call the Translator", async () => {
        const broken = 'export const ptBR = { A: `template` };';
        const store = repo({ "/dictionary/pt-BR.ts": broken });
        const { report, translator } = await sync({ store });

        expect(translator.requests).toEqual([]);
        expect(fileOf(store, "pt-BR")).toBe(broken);
        expect(report.translations!["pt-BR"].failed[0]).toMatchObject({ path: "(file)" });
        expect(report.translations!["pt-BR"].failed[0].error).toMatch(/Cannot read/);
    });

    it("will not rewrite a hand-formatted file just to add a key, and says so before translating", async () => {
        const handFormatted = ptFile().replace("export const", "// hand note\nexport const");
        const store = repo({ "/dictionary/pt-BR.ts": handFormatted, [SYNC_STATE_PATH]: JSON.stringify(ptState()) });
        const next = { Nav: { Home: "Home", About: "About", Contact: "Contact" }, Title: "Title" };

        const { report, translator } = await sync({ store, source: next as never });

        expect(translator.requests).toEqual([]);
        expect(fileOf(store, "pt-BR")).toBe(handFormatted);
        expect(report.translations!["pt-BR"].failed[0]).toMatchObject({ path: "(file)" });
        expect(report.translations!["pt-BR"].failed[0].error).toContain("Nav.Contact");
    });

    it("still baselines a hand-formatted file, since that changes no Dictionary text", async () => {
        const handFormatted = ptFile().replace("export const", "// hand note\nexport const");
        const store = repo({ "/dictionary/pt-BR.ts": handFormatted });
        const { report } = await sync({ store });

        expect(fileOf(store, "pt-BR")).toBe(handFormatted);
        expect(report.translations!["pt-BR"].baselined).toHaveLength(3);
    });

    it("reports a Locale tag that cannot be a file name", async () => {
        const store = repo();
        const { report, translator } = await sync({ store, locales: ["../evil"] });

        expect(translator.requests).toEqual([]);
        expect(report.translations!["../evil"].failed[0].error).toMatch(/not a valid Locale/);
    });

    it("reports a corrupt state file instead of overwriting it", async () => {
        const store = repo({ [SYNC_STATE_PATH]: "{not json" });
        const { report, translator } = await sync({ store, locales: ["es"] });

        expect(translator.requests).toEqual([]);
        expect(dec(store.files.get(SYNC_STATE_PATH)!)).toBe("{not json");
        expect(report.translations!.es.failed[0]).toMatchObject({ path: "(state)" });
    });

    it("skips the Source locale", async () => {
        const store = repo();
        const { report, translator } = await sync({ store, locales: ["en"] });

        expect(translator.requests).toEqual([]);
        expect(report.translations).toEqual({});
    });
});

describe("Sync without a Translator configured", () => {
    it("has no translations key and touches no Dictionary file", async () => {
        const report = await runSync({ github: { getScreenshot: async () => null }, store: createMemoryStore(), allowlist: [] });
        expect(report.translations).toBeUndefined();
    });
});
