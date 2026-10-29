import { describe, expect, it } from "vitest";
import { createProjects, hashSourceText } from "@/lib/projects";
import { createTranslationReader } from "@/lib/projects/translations";
import type { RepoFacts } from "@/lib/projects/types";
import { runSync } from "@/lib/sync";
import { createMemoryStore } from "@/lib/sync/in-memory";
import { PROJECT_TRANSLATIONS_PATH } from "@/lib/sync/project-translations";
import type { DescriptionSource, ReadmeSource } from "@/lib/sync/types";
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

/** A fake GitHub: short description by repo. A repo that is absent has none; an Error is a failed read. */
function fakeDescriptions(byRepo: Record<string, string | null | Error>) {
    const asked: string[] = [];
    const source: DescriptionSource = {
        async getDescription(repo) {
            asked.push(repo);
            const found = byRepo[repo];
            if (found instanceof Error) throw found;
            return found ?? null;
        },
    };
    return { ...source, asked };
}

type Stored = { text: string; sourceHash: string };
type FileShape = Record<string, Record<string, Partial<Stored> & { tagline?: Stored }>>;
const fileOf = (store: ReturnType<typeof createMemoryStore>): FileShape | null => {
    const text = dec(store.files.get(PROJECT_TRANSLATIONS_PATH));
    return text === null ? null : JSON.parse(text);
};
const storeWith = (file: FileShape | string | null) =>
    createMemoryStore(file === null ? {} : { [PROJECT_TRANSLATIONS_PATH]: enc(typeof file === "string" ? file : JSON.stringify(file, null, 2) + "\n") });

function sync(options: {
    store: ReturnType<typeof createMemoryStore>;
    readmes: ReturnType<typeof fakeReadmes>;
    descriptions?: ReturnType<typeof fakeDescriptions>;
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
            descriptions: options.descriptions ?? fakeDescriptions({}),
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
    it("skips and reports a repo with no Marked block; the short description is not used as a summary Source text", async () => {
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

    it("are pruned from the stored file, name included, and reported so the owner sees it in the diff", async () => {
        const kept = { alpha: { "pt-BR": { text: "Texto.", sourceHash: h("Alpha.") } } };
        const store = storeWith({ ...kept, secret: { "pt-BR": { text: "Segredo.", sourceHash: h("x") } } });
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.pruned).toEqual(["secret"]);
        expect(translator.requests).toEqual([]);
        expect(fileOf(store)).toEqual(kept);
        expect(dec(store.files.get(PROJECT_TRANSLATIONS_PATH))).not.toContain("secret");
    });

    it("are pruned even when the Allowlist is now empty", async () => {
        const store = storeWith({ secret: { "pt-BR": { text: "Segredo.", sourceHash: h("x") } } });
        const { report } = await sync({ store, readmes: fakeReadmes({}), allowlist: [] });

        expect(report.pruned).toEqual(["secret"]);
        expect(fileOf(store)).toEqual({});
    });

    it("are not pruned, nor anything else written, when the run fails", async () => {
        const store = storeWith({ secret: { "pt-BR": { text: "Segredo.", sourceHash: h("x") } } });
        const before = dec(store.files.get(PROJECT_TRANSLATIONS_PATH));
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: new Error("boom") }) });

        expect(report.failed).toHaveLength(1);
        expect(report.pruned).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(dec(store.files.get(PROJECT_TRANSLATIONS_PATH))).toBe(before);
    });

    it("are not reported as pruned when the write fails", async () => {
        const store = storeWith({ secret: { "pt-BR": { text: "Segredo.", sourceHash: h("x") } } });
        store.write = async () => {
            throw new Error("disk full");
        };
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: readme("Alpha.") }) });

        expect(report.failed).toEqual([{ repo: "(file)", error: "disk full" }]);
        expect(report.pruned).toEqual([]);
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
        const descriptions = fakeDescriptions({ alpha: "Alpha tagline" });
        const { report, translator } = await sync({ store, readmes, descriptions, allowlist: [] });

        expect(readmes.asked).toEqual([]);
        expect(descriptions.asked).toEqual([]);
        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(report).toEqual({
            generated: [],
            regenerated: [],
            stale: [],
            unchanged: [],
            skipped: [],
            taglines: { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [] },
            pruned: [],
            failed: [],
        });
    });
});

describe("Project summary Sync is optional", () => {
    it("is absent from the report when not requested", async () => {
        const report = await runSync({ github: { getScreenshot: async () => null }, store: createMemoryStore(), allowlist: [{ repo: "alpha" }] });
        expect(report.projectTranslations).toBeUndefined();
    });
});

describe("Sync translates Project taglines", () => {
    const desc = "Offline-first ERP";
    const withDesc = (repos: Record<string, string | null | Error> = { alpha: desc }) => fakeDescriptions(repos);

    it("translates the short description into each non-default Locale and records the hash of the description", async () => {
        const store = storeWith(null);
        const { report, translator } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc(), locales: ["en", "pt-BR", "es"] });

        expect(translator.requests).toEqual([
            { text: desc, locale: "pt-BR" },
            { text: desc, locale: "es" },
        ]);
        expect(fileOf(store)).toEqual({
            alpha: {
                es: { tagline: { text: `[es] ${desc}`, sourceHash: h(desc) } },
                "pt-BR": { tagline: { text: `[pt-BR] ${desc}`, sourceHash: h(desc) } },
            },
        });
        expect(report.taglines.generated).toEqual([
            { repo: "alpha", locale: "pt-BR" },
            { repo: "alpha", locale: "es" },
        ]);
        expect(report.generated).toEqual([]);
        expect(report.failed).toEqual([]);
    });

    it("translates the description trimmed, and records the hash of the trimmed text", async () => {
        const store = storeWith(null);
        const { translator } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc({ alpha: `  ${desc}\n` }) });

        expect(translator.requests).toEqual([{ text: desc, locale: "pt-BR" }]);
        expect(fileOf(store)!.alpha["pt-BR"].tagline!.sourceHash).toBe(h(desc));
    });

    it("writes the tagline beside the summary in one entry, in a stable order", async () => {
        const store = storeWith(null);
        await sync({ store, readmes: fakeReadmes({ alpha: readme("A.") }), descriptions: withDesc() });

        expect(dec(store.files.get(PROJECT_TRANSLATIONS_PATH))).toBe(
            [
                "{",
                '  "alpha": {',
                '    "pt-BR": {',
                '      "text": "[pt-BR] A.",',
                `      "sourceHash": "${h("A.")}",`,
                '      "tagline": {',
                `        "text": "[pt-BR] ${desc}",`,
                `        "sourceHash": "${h(desc)}"`,
                "      }",
                "    }",
                "  }",
                "}",
                "",
            ].join("\n"),
        );
    });

    it("produces Translations the Projects module shows, and stops showing them once the description changes", async () => {
        const store = storeWith(null);
        await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });
        const projectsFor = (description: string) =>
            createProjects({
                allowlist: [{ repo: "alpha" }],
                source: {
                    getRepo: async () => ({ description, homepage: null, topics: [], url: "https://github.com/o/alpha", isPublic: true, readme: null, hasScreenshot: false }),
                    ...createTranslationReader(fileOf(store)),
                },
            });

        expect((await projectsFor(desc).getProject("alpha", "pt-BR"))?.tagline).toBe(`[pt-BR] ${desc}`);
        expect((await projectsFor(desc).getProject("alpha", "en"))?.tagline).toBe(desc);
        expect((await projectsFor("Changed description").getProject("alpha", "pt-BR"))?.tagline).toBe("Changed description");
    });

    it("sends nothing again when the description is unchanged, and writes nothing", async () => {
        const store = storeWith(null);
        const readmes = fakeReadmes({ alpha: readme("A.") });
        await sync({ store, readmes, descriptions: withDesc() });
        store.writes.length = 0;

        const { report, translator } = await sync({ store, readmes, descriptions: withDesc() });

        expect(translator.requests).toEqual([]);
        expect(store.writes).toEqual([]);
        expect(report.taglines.unchanged).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
        expect(report.taglines.generated).toEqual([]);
    });

    it("only translates what is missing: a summary-only entry from before taglines gets a tagline and keeps its summary untouched", async () => {
        const summaryOnly = { text: "Alfa faz coisas.", sourceHash: h("A.") };
        const store = storeWith({ alpha: { "pt-BR": summaryOnly } });
        const { report, translator } = await sync({ store, readmes: fakeReadmes({ alpha: readme("A.") }), descriptions: withDesc() });

        expect(translator.requests).toEqual([{ text: desc, locale: "pt-BR" }]);
        expect(fileOf(store)).toEqual({ alpha: { "pt-BR": { ...summaryOnly, tagline: { text: `[pt-BR] ${desc}`, sourceHash: h(desc) } } } });
        expect(report.unchanged).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
        expect(report.failed).toEqual([]);
    });

    it("generating a summary keeps an existing tagline Translation", async () => {
        const tagline = { text: "Texto curto", sourceHash: h(desc) };
        const store = storeWith({ alpha: { "pt-BR": { tagline } } });
        await sync({ store, readmes: fakeReadmes({ alpha: readme("A.") }), descriptions: withDesc() });

        expect(fileOf(store)).toEqual({ alpha: { "pt-BR": { text: "[pt-BR] A.", sourceHash: h("A."), tagline } } });
    });

    it("ignores the default Locale", async () => {
        const store = storeWith({ alpha: { en: { tagline: { text: "Hand kept.", sourceHash: "x" } } } });
        const { translator } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });

        expect(translator.requests.map((r) => r.locale)).toEqual(["pt-BR"]);
        expect(fileOf(store)!.alpha.en).toEqual({ tagline: { text: "Hand kept.", sourceHash: "x" } });
    });

    it("treats a blank stored tagline as missing and translates it", async () => {
        const store = storeWith({ alpha: { "pt-BR": { tagline: { text: " ", sourceHash: h(desc) } } } });
        await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });

        expect(fileOf(store)!.alpha["pt-BR"].tagline!.text).toBe(`[pt-BR] ${desc}`);
    });

    describe("when the description changed (Stale)", () => {
        const old = { alpha: { "pt-BR": { tagline: { text: "Texto antigo", sourceHash: h("Old description") } } } };

        it("is reported and left alone, and the Translator is not called", async () => {
            const store = storeWith(old);
            const { report, translator } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });

            expect(report.taglines.stale).toEqual([{ repo: "alpha", locale: "pt-BR", unknownHash: false }]);
            expect(report.stale).toEqual([]);
            expect(translator.requests).toEqual([]);
            expect(fileOf(store)).toEqual(old);
            expect(store.writes).toEqual([]);
        });

        it("is replaced, with the new hash, only with regenerateStale", async () => {
            const store = storeWith(old);
            const { report } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc(), regenerateStale: true });

            expect(fileOf(store)).toEqual({ alpha: { "pt-BR": { tagline: { text: `[pt-BR] ${desc}`, sourceHash: h(desc) } } } });
            expect(report.taglines.regenerated).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
        });

        it("regenerating the tagline leaves the summary Translation alone", async () => {
            const summary = { text: "Texto.", sourceHash: h("A.") };
            const store = storeWith({ alpha: { "pt-BR": { ...summary, tagline: old.alpha["pt-BR"].tagline } } });
            await sync({ store, readmes: fakeReadmes({ alpha: readme("A.") }), descriptions: withDesc(), regenerateStale: true });

            expect(fileOf(store)!.alpha["pt-BR"]).toMatchObject(summary);
            expect(fileOf(store)!.alpha["pt-BR"].tagline!.text).toBe(`[pt-BR] ${desc}`);
        });

        it("includes a tagline with no recorded hash, reported as unknown", async () => {
            const store = storeWith({ alpha: { "pt-BR": { tagline: { text: "Sem hash" } } } } as unknown as FileShape);
            const { report, translator } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });

            expect(report.taglines.stale).toEqual([{ repo: "alpha", locale: "pt-BR", unknownHash: true }]);
            expect(translator.requests).toEqual([]);
        });

        it("keeps a current hand-edited tagline, even with regenerateStale", async () => {
            const mine = { alpha: { "pt-BR": { tagline: { text: "Meu texto", sourceHash: h(desc) } } } };
            const store = storeWith(mine);
            const { translator } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc(), regenerateStale: true });

            expect(translator.requests).toEqual([]);
            expect(fileOf(store)).toEqual(mine);
        });
    });

    describe("for a repo with no description", () => {
        it("is skipped and reported, and nothing is sent for the tagline", async () => {
            const store = storeWith(null);
            const { report, translator } = await sync({
                store,
                allowlist: [{ repo: "alpha" }, { repo: "beta" }, { repo: "gamma" }],
                readmes: fakeReadmes({}),
                descriptions: withDesc({ alpha: null, beta: "   ", gamma: "Gamma tagline" }),
            });

            expect(report.taglines.skipped).toEqual(["alpha", "beta"]);
            expect(translator.requests).toEqual([{ text: "Gamma tagline", locale: "pt-BR" }]);
            expect(Object.keys(fileOf(store)!)).toEqual(["gamma"]);
        });

        it("leaves its existing tagline Translations alone", async () => {
            const kept = { alpha: { "pt-BR": { tagline: { text: "Texto", sourceHash: h("Gone") } } } };
            const store = storeWith(kept);
            const { report } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc({ alpha: null }), regenerateStale: true });

            expect(report.taglines.skipped).toEqual(["alpha"]);
            expect(fileOf(store)).toEqual(kept);
            expect(store.writes).toEqual([]);
        });

        it("still has its summary translated", async () => {
            const store = storeWith(null);
            const { report } = await sync({ store, readmes: fakeReadmes({ alpha: readme("A.") }), descriptions: withDesc({ alpha: null }) });

            expect(report.generated).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
            expect(report.taglines.skipped).toEqual(["alpha"]);
        });
    });

    it("a repo with a description but no Marked block still gets its tagline, and the summary is skipped", async () => {
        const store = storeWith(null);
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: "# no markers" }), descriptions: withDesc() });

        expect(report.skipped).toEqual(["alpha"]);
        expect(report.taglines.generated).toEqual([{ repo: "alpha", locale: "pt-BR" }]);
    });

    it("never reads the description of a Hidden repo or sends it to the Translator", async () => {
        const store = storeWith(null);
        const descriptions = withDesc({ alpha: "Alpha tagline", secret: "Commercial secret" });
        const { translator } = await sync({ store, readmes: fakeReadmes({}), descriptions, allowlist: [{ repo: "alpha" }, { repo: "alpha" }] });

        expect(descriptions.asked).toEqual(["alpha"]);
        expect(translator.requests.map((r) => r.text)).toEqual(["Alpha tagline"]);
        expect(Object.keys(fileOf(store)!)).toEqual(["alpha"]);
    });

    it("prunes a Hidden repo's entry, tagline included, in the same all-or-nothing write", async () => {
        const store = storeWith({ secret: { "pt-BR": { tagline: { text: "Segredo", sourceHash: h("x") } } } });
        const { report } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });

        expect(report.pruned).toEqual(["secret"]);
        expect(dec(store.files.get(PROJECT_TRANSLATIONS_PATH))).not.toContain("secret");
    });

    describe("failures", () => {
        it("a Translator failure writes nothing, names the tagline entry and records no generated entries", async () => {
            const existing = { alpha: { "pt-BR": { text: "Texto.", sourceHash: h("A.") } } };
            const store = storeWith(existing);
            const before = dec(store.files.get(PROJECT_TRANSLATIONS_PATH));
            const translator = createFakeTranslator({ failOn: ["Beta tagline"] });

            const { report } = await sync({
                store,
                translator,
                allowlist: [{ repo: "alpha" }, { repo: "beta" }],
                readmes: fakeReadmes({ alpha: readme("A.") }),
                descriptions: withDesc({ alpha: "Alpha tagline", beta: "Beta tagline" }),
            });

            expect(store.writes).toEqual([]);
            expect(dec(store.files.get(PROJECT_TRANSLATIONS_PATH))).toBe(before);
            expect(report.failed).toEqual([{ repo: "beta", locale: "pt-BR", field: "tagline", error: "fake translator refused: Beta tagline" }]);
            expect(report.taglines.generated).toEqual([]);
            expect(report.generated).toEqual([]);
        });

        it("an empty Translator answer is a failure, not a stored tagline", async () => {
            const translator = { async translate() { return "  "; } };
            const store = storeWith(null);
            const { report } = await sync({ store, translator: translator as never, readmes: fakeReadmes({}), descriptions: withDesc() });

            expect(report.failed).toHaveLength(1);
            expect(store.writes).toEqual([]);
        });

        it("a description that cannot be read is reported and nothing is translated or written", async () => {
            const store = storeWith(null);
            const { report, translator } = await sync({
                store,
                allowlist: [{ repo: "alpha" }, { repo: "beta" }],
                readmes: fakeReadmes({ beta: readme("Beta.") }),
                descriptions: withDesc({ alpha: new Error("GitHub answered 500 while reading o/alpha"), beta: "Beta tagline" }),
            });

            expect(report.failed).toEqual([{ repo: "alpha", field: "tagline", error: "GitHub answered 500 while reading o/alpha" }]);
            expect(translator.requests).toEqual([]);
            expect(store.writes).toEqual([]);
        });

        it("a failed write reports no generated or regenerated taglines", async () => {
            const store = storeWith(null);
            store.write = async () => {
                throw new Error("disk full");
            };
            const { report } = await sync({ store, readmes: fakeReadmes({}), descriptions: withDesc() });

            expect(report.failed).toEqual([{ repo: "(file)", error: "disk full" }]);
            expect(report.taglines.generated).toEqual([]);
        });
    });

    it("accepts a file in the old shape (summary entries only) without calling it corrupt", async () => {
        const old = { alpha: { "pt-BR": { text: "Texto.", sourceHash: h("A.") } } };
        const store = storeWith(old);
        const { report } = await sync({ store, readmes: fakeReadmes({ alpha: readme("A.") }), descriptions: withDesc({ alpha: null }) });

        expect(report.failed).toEqual([]);
        expect(fileOf(store)).toEqual(old);
    });
});
