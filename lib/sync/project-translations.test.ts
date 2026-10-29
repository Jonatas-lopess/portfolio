import { describe, expect, it } from "vitest";
import { createProjects, hashSourceText } from "@/lib/projects";
import { createTranslationReader } from "@/lib/projects/translations";
import type { RepoFacts } from "@/lib/projects/types";
import { runSync } from "@/lib/sync";
import { createMemoryStore } from "@/lib/sync/in-memory";
import { PROJECT_TRANSLATIONS_PATH } from "@/lib/sync/project-translations";
import type { ReadmeSource } from "@/lib/sync/types";
import { createFakeTranslator } from "@/lib/translator/fake";

const h = hashSourceText;
const enc = (text: string) => new TextEncoder().encode(text);
const dec = (bytes: Uint8Array | null | undefined) => (bytes ? new TextDecoder().decode(bytes) : null);
const readme = (block: string, around = "# Title\nIntro that is never shown.\n") =>
    `${around}\n<!-- portfolio:start -->\n${block}\n<!-- portfolio:end -->\nFooter that is never shown.\n`;

/** A fake GitHub: README text by repo. A repo that is absent has no README; an Error is a failed read. */
function fakeReadmes(byRepo: Record<string, string | Error>) {
    const asked: string[] = [];
    const source: ReadmeSource = {
        async getReadme(repo) {
            asked.push(repo);
            const found = byRepo[repo];
            if (found instanceof Error) throw found;
            return found ?? null;
        },
    };
    return { ...source, asked };
}

type FileShape = Record<string, Record<string, { text: string; sourceHash: string }>>;
const fileOf = (store: ReturnType<typeof createMemoryStore>): FileShape | null => {
    const text = dec(store.files.get(PROJECT_TRANSLATIONS_PATH));
    return text === null ? null : JSON.parse(text);
};
const storeWith = (file: FileShape | string | null) =>
    createMemoryStore(file === null ? {} : { [PROJECT_TRANSLATIONS_PATH]: enc(typeof file === "string" ? file : JSON.stringify(file, null, 2) + "\n") });

function sync(options: {
    store: ReturnType<typeof createMemoryStore>;
    readmes: ReturnType<typeof fakeReadmes>;
    allowlist?: { repo: string }[];
    translator?: ReturnType<typeof createFakeTranslator>;
    locales?: string[];
    regenerateStale?: boolean;
}) {
    const translator = options.translator ?? createFakeTranslator();
    return runSync({
        github: { getScreenshot: async () => null },
        store: createMemoryStore(),
        allowlist: options.allowlist ?? [{ repo: "alpha" }],
        projectTranslations: {
            translator,
            readmes: options.readmes,
            store: options.store,
            sourceLocale: "en",
            locales: options.locales ?? ["en", "pt-BR"],
            regenerateStale: options.regenerateStale,
        },
    }).then((report) => ({ report: report.projectTranslations!, translator }));
}

describe("Sync translates Project summaries", () => {
    it("translates the Marked block into each non-default Locale and records the hash of the Source text", async () => {
        const store = storeWith(null);
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }), locales: ["en", "pt-BR", "es"] });

        expect(translator.requests).toEqual([
            { text: "Alpha does things.", locale: "pt-BR" },
            { text: "Alpha does things.", locale: "es" },
        ]);
        expect(fileOf(store)).toEqual({
            alpha: {
                es: { text: "[es] Alpha does things.", sourceHash: h("Alpha does things.") },
                "pt-BR": { text: "[pt-BR] Alpha does things.", sourceHash: h("Alpha does things.") },
            },
        });
        expect(report.generated).toEqual([
            { repo: "alpha", locale: "pt-BR" },
            { repo: "alpha", locale: "es" },
        ]);
        expect(report.failed).toEqual([]);
    });

    it("writes a stable, reviewable file: sorted keys, two-space indent, final newline", async () => {
        const store = storeWith(null);
        await sync({
            store,
            allowlist: [{ repo: "zeta" }, { repo: "alpha" }],
            readmes: fakeReadmes({ zeta: readme("Z."), alpha: readme("A.") }),
            locales: ["en", "pt-BR", "es"],
        });

        const text = dec(store.files.get(PROJECT_TRANSLATIONS_PATH))!;
        expect(Object.keys(JSON.parse(text))).toEqual(["alpha", "zeta"]);
        expect(Object.keys(JSON.parse(text).alpha)).toEqual(["es", "pt-BR"]);
        expect(text).toBe(
            [
                "{",
                '  "alpha": {',
                '    "es": {',
                '      "text": "[es] A.",',
                `      "sourceHash": "${h("A.")}"`,
                "    },",
                '    "pt-BR": {',
                '      "text": "[pt-BR] A.",',
                `      "sourceHash": "${h("A.")}"`,
                "    }",
                "  },",
                '  "zeta": {',
                '    "es": {',
                '      "text": "[es] Z.",',
                `      "sourceHash": "${h("Z.")}"`,
                "    },",
                '    "pt-BR": {',
                '      "text": "[pt-BR] Z.",',
                `      "sourceHash": "${h("Z.")}"`,
                "    }",
                "  }",
                "}",
                "",
            ].join("\n"),
        );
    });

    it("produces Translations the Projects module shows, and stops showing them once the README changes", async () => {
        const store = storeWith(null);
        await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }) });
        const facts = (block: string): RepoFacts => ({
            description: "Short description",
            homepage: null,
            topics: [],
            url: "https://github.com/o/alpha",
            isPublic: true,
            readme: readme(block),
            hasScreenshot: false,
        });
        const projectsFor = (block: string) =>
            createProjects({
                allowlist: [{ repo: "alpha" }],
                source: { getRepo: async () => facts(block), ...createTranslationReader(fileOf(store)) },
            });

        expect((await projectsFor("Alpha does things.").getProject("alpha", "pt-BR"))?.summary).toBe("[pt-BR] Alpha does things.");
        expect((await projectsFor("Alpha does more things.").getProject("alpha", "pt-BR"))?.summary).toBe("Alpha does more things.");
    });

    it("sends nothing again when the Source text is unchanged, and writes nothing", async () => {
        const store = storeWith(null);
        const readmes = fakeReadmes({ alpha: readme("Alpha does things.") });
        await sync({ store, readmes });
        store.writes.length = 0;

        const { report, translator } = await sync({ store, readmes });

        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(report.unchanged).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
        expect(report.generated).toEqual([]);
    });

    it("only translates the Locale that is missing", async () => {
        const store = storeWith({ alpha: { "pt-BR": { text: "Alfa faz coisas.", sourceHash: h("Alpha does things.") } } });
        const { translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }), locales: ["en", "pt-BR", "es"] });

        expect(translator.requests).toEqual([{ text: "Alpha does things.", locale: "es" }]);
        expect(fileOf(store)!.alpha["pt-BR"].text).toBe("Alfa faz coisas.");
        expect(fileOf(store)!.alpha.es.text).toBe("[es] Alpha does things.");
    });

    it("ignores the default Locale: no entry is made and an existing one is left alone", async () => {
        const store = storeWith({ alpha: { en: { text: "Hand kept.", sourceHash: "x" } } });
        const { translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }) });

        expect(translator.requests.map((r) => r.locale)).toEqual(["pt-BR"]);
        expect(fileOf(store)!.alpha.en).toEqual({ text: "Hand kept.", sourceHash: "x" });
    });

    it("treats a blank stored text as missing and translates it", async () => {
        const store = storeWith({ alpha: { "pt-BR": { text: "  ", sourceHash: h("Alpha does things.") } } });
        await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }) });

        expect(fileOf(store)!.alpha["pt-BR"].text).toBe("[pt-BR] Alpha does things.");
    });
});

describe("Stale Project summary Translations", () => {
    const old = { alpha: { "pt-BR": { text: "Texto antigo.", sourceHash: h("Old English.") } } };

    it("are reported and left alone, and the Translator is not called", async () => {
        const store = storeWith(old);
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("New English.") }) });

        expect(report.stale).toEqual([{ repo: "alpha", locale: "pt-BR", unknownHash: false }]);
        expect(translator.requests).toEqual([]);
        expect(fileOf(store)).toEqual(old);
        expect(store.writes).toEqual([]);
    });

    it("are replaced, with the new hash, only with regenerateStale", async () => {
        const store = storeWith(old);
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: readme("New English.") }), regenerateStale: true });

        expect(fileOf(store)).toEqual({ alpha: { "pt-BR": { text: "[pt-BR] New English.", sourceHash: h("New English.") } } });
        expect(report.regenerated).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
    });

    it("include an existing entry with no recorded hash, reported as unknown and never overwritten by default", async () => {
        const store = storeWith({ alpha: { "pt-BR": { text: "Texto sem hash." } } } as unknown as FileShape);
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }) });

        expect(report.stale).toEqual([{ repo: "alpha", locale: "pt-BR", unknownHash: true }]);
        expect(translator.requests).toEqual([]);
        expect(fileOf(store)).toEqual({ alpha: { "pt-BR": { text: "Texto sem hash." } } });
    });

    it("an unknown-hash entry is replaced with regenerateStale", async () => {
        const store = storeWith({ alpha: { "pt-BR": { text: "Texto sem hash." } } } as unknown as FileShape);
        await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }), regenerateStale: true });

        expect(fileOf(store)!.alpha["pt-BR"]).toEqual({ text: "[pt-BR] Alpha does things.", sourceHash: h("Alpha does things.") });
    });

    it("a current hand-edited Translation is never overwritten, even with regenerateStale", async () => {
        const mine = { alpha: { "pt-BR": { text: "Meu texto, revisado.", sourceHash: h("Alpha does things.") } } };
        const store = storeWith(mine);
        const { translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha does things.") }), regenerateStale: true });

        expect(translator.requests).toEqual([]);
        expect(fileOf(store)).toEqual(mine);
    });
});

describe("Sync and Projects that cannot be translated", () => {
    it("skips and reports a repo with no Marked block; the short description is never translated", async () => {
        const store = storeWith(null);
        const readmes = fakeReadmes({ alpha: "# Alpha\nNo markers here.", beta: readme("Beta does things.") });
        const { report, translator } = await sync({ store, readmes, allowlist: [{ repo: "alpha" }, { repo: "beta" }, { repo: "gamma" }] });

        expect(report.skipped).toEqual(["alpha", "gamma"]);
        expect(translator.requests).toEqual([{ text: "Beta does things.", locale: "pt-BR" }]);
        expect(Object.keys(fileOf(store)!)).toEqual(["beta"]);
    });

    it("leaves an existing entry alone when the Marked block was removed", async () => {
        const kept = { alpha: { "pt-BR": { text: "Texto.", sourceHash: h("Gone.") } } };
        const store = storeWith(kept);
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: "# no markers" }) });

        expect(report.skipped).toEqual(["alpha"]);
        expect(fileOf(store)).toEqual(kept);
        expect(store.writes).toEqual([]);
    });

    it("treats an empty Marked block as none", async () => {
        const { report, translator } = await sync({ store: storeWith(null), readmes: fakeReadmes({ alpha: readme("   ") }) });

        expect(report.skipped).toEqual(["alpha"]);
        expect(translator.requests).toEqual([]);
    });
});

describe("Hidden repos in Project summary Sync", () => {
    it("are never read from GitHub or sent to the Translator", async () => {
        const store = storeWith(null);
        const readmes = fakeReadmes({ alpha: readme("Alpha."), secret: readme("Commercial secret.") });
        const { translator } = await sync({ store, readmes, allowlist: [{ repo: "alpha" }, { repo: "alpha" }] });

        expect(readmes.asked).toEqual(["alpha"]);
        expect(translator.requests.map((r) => r.text)).toEqual(["Alpha."]);
        expect(Object.keys(fileOf(store)!)).toEqual(["alpha"]);
    });

    it("keep an old stored entry untouched but it is reported as orphaned, so the owner can delete it", async () => {
        const leftover = { secret: { "pt-BR": { text: "Segredo.", sourceHash: h("x") } } };
        const store = storeWith(leftover);
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.orphaned).toEqual(["secret"]);
        expect(translator.requests.map((r) => r.text)).toEqual(["Alpha."]);
        expect(fileOf(store)!.secret).toEqual(leftover.secret);
    });
});

describe("failures in Project summary Sync", () => {
    it("a Translator failure writes nothing, leaves the existing file as it was, and names the entries that failed", async () => {
        const existing = { alpha: { "pt-BR": { text: "Texto.", sourceHash: h("Alpha.") } } };
        const store = storeWith(existing);
        const before = dec(store.files.get(PROJECT_TRANSLATIONS_PATH));
        const translator = createFakeTranslator({ failOn: ["Beta."] });

        const { report } = await sync({
            store,
            translator,
            allowlist: [{ repo: "alpha" }, { repo: "beta" }, { repo: "gamma" }],
            readmes: fakeReadmes({ alpha: readme("Alpha."), beta: readme("Beta."), gamma: readme("Gamma.") }),
        });

        expect(store.writes).toEqual([]);
        expect(dec(store.files.get(PROJECT_TRANSLATIONS_PATH))).toBe(before);
        expect(report.failed).toEqual([{ repo: "beta", locale: "pt-BR", error: "fake translator refused: Beta." }]);
        expect(report.generated).toEqual([]);
    });

    it("an empty Translator answer is a failure, not a stored Translation", async () => {
        const translator = { async translate() { return "  "; } };
        const store = storeWith(null);
        const { report } = await sync({ store, translator: translator as never, readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.failed).toHaveLength(1);
        expect(store.writes).toEqual([]);
    });

    it("a README that cannot be read is reported and nothing is translated or written", async () => {
        const store = storeWith(null);
        const { report, translator } = await sync({
            store,
            allowlist: [{ repo: "alpha" }, { repo: "beta" }],
            readmes: fakeReadmes({ alpha: new Error("GitHub answered 500 while reading o/alpha"), beta: readme("Beta.") }),
        });

        expect(report.failed).toEqual([{ repo: "alpha", error: "GitHub answered 500 while reading o/alpha" }]);
        expect(report.generated).toEqual([]);
        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
    });

    it("a stored file Sync cannot parse is a failure and is left alone", async () => {
        const store = storeWith("{ not json");
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.failed).toEqual([{ repo: "(file)", error: expect.stringContaining(PROJECT_TRANSLATIONS_PATH) }]);
        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
    });

    it("a file with the wrong shape is a failure and is left alone", async () => {
        const store = storeWith('["x"]');
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.failed).toHaveLength(1);
        expect(store.writes).toEqual([]);
    });

    it("an invalid Locale tag is a failure and the Translator is not called", async () => {
        const store = storeWith(null);
        const { report, translator } = await sync({ store, locales: ["en", "../evil"], readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.failed).toEqual([{ repo: "(locale)", locale: "../evil", error: expect.stringContaining("not a valid Locale tag") }]);
        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
    });
});

describe("an empty Allowlist", () => {
    it("reads nothing, translates nothing and creates no file", async () => {
        const store = storeWith(null);
        const readmes = fakeReadmes({ alpha: readme("Alpha.") });
        const { report, translator } = await sync({ store, readmes, allowlist: [] });

        expect(readmes.asked).toEqual([]);
        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(report).toEqual({ generated: [], regenerated: [], stale: [], unchanged: [], skipped: [], orphaned: [], failed: [] });
    });
});

describe("Project summary Sync is optional", () => {
    it("is absent from the report when not requested", async () => {
        const report = await runSync({ github: { getScreenshot: async () => null }, store: createMemoryStore(), allowlist: [{ repo: "alpha" }] });
        expect(report.projectTranslations).toBeUndefined();
    });
});
