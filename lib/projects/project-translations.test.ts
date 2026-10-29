import { describe, expect, it } from "vitest";
import type { Locale } from "@/lib/locale";
import { createProjects, hashSourceText } from "@/lib/projects";
import { createInMemorySource } from "@/lib/projects/in-memory";
import { createTranslationReader } from "@/lib/projects/translations";
import type { AllowlistEntry, RepoFacts } from "@/lib/projects/types";
import committed from "@/projects.translations.json";

const block = "Live English text.";
const readmeWith = (text: string) => `# App\n\n<!-- portfolio:start -->\n${text}\n<!-- portfolio:end -->\n`;

function facts(overrides: Partial<RepoFacts> = {}): RepoFacts {
    return {
        description: "Short GitHub text",
        homepage: null,
        topics: [],
        url: "https://github.com/owner/app",
        isPublic: true,
        readme: readmeWith(block),
        hasScreenshot: false,
        ...overrides,
    };
}

/** The Projects module wired the way live.ts wires it: a ProjectsSource plus the committed-file reader, here fed with `file`. */
function projectsWith(file: unknown, repos: Record<string, RepoFacts>, allowlist: AllowlistEntry[] = [{ repo: "app" }]) {
    const base = createInMemorySource({ repos });
    return createProjects({ allowlist, source: { getRepo: base.getRepo, ...createTranslationReader(file) } });
}

const summary = async (file: unknown, locale: Locale, overrides: Partial<RepoFacts> = {}) =>
    (await projectsWith(file, { app: facts(overrides) }).getProject("app", locale))?.summary;

describe("Project summary Translations read from the committed file", () => {
    const current = { app: { "pt-BR": { text: "Texto em portugues.", sourceHash: hashSourceText(block) } } };

    it("shows a current Translation in its Locale", async () => {
        expect(await summary(current, "pt-BR")).toBe("Texto em portugues.");
    });

    it("shows the same Translation when listing Projects", async () => {
        const [project] = await projectsWith(current, { app: facts() }).listProjects("pt-BR");
        expect(project.summary).toBe("Texto em portugues.");
    });

    it("shows the English Source text in the default Locale, which has no Translation entries", async () => {
        expect(await summary(current, "en")).toBe(block);
    });

    it("never uses an entry stored for the default Locale", async () => {
        const file = { app: { en: { text: "Hand edited.", sourceHash: hashSourceText(block) } } };
        expect(await summary(file, "en")).toBe(block);
    });

    it("shows the fresh English text, not the old Translation, when the Marked block changed (stale)", async () => {
        const changed = readmeWith("Brand new English text.");
        expect(await summary(current, "pt-BR", { readme: changed })).toBe("Brand new English text.");
    });

    it("shows the English text when the Locale has no Translation (missing)", async () => {
        expect(await summary({ app: {} }, "pt-BR")).toBe(block);
        expect(await summary({}, "pt-BR")).toBe(block);
    });

    it("shows the repo description when the README has no Marked block, whatever the file holds", async () => {
        expect(await summary(current, "pt-BR", { readme: "# No markers" })).toBe("Short GitHub text");
        expect(await summary(current, "pt-BR", { readme: null })).toBe("Short GitHub text");
    });

    it("ignores an entry with a missing hash or blank text", async () => {
        expect(await summary({ app: { "pt-BR": { text: "Texto." } } }, "pt-BR")).toBe(block);
        expect(await summary({ app: { "pt-BR": { text: "  ", sourceHash: hashSourceText(block) } } }, "pt-BR")).toBe(block);
        expect(await summary({ app: { "pt-BR": "Texto." } }, "pt-BR")).toBe(block);
    });

    it("never shows a stored Translation for a Hidden repo, because it is not a Project", async () => {
        const file = { secret: { "pt-BR": { text: "Segredo.", sourceHash: hashSourceText(block) } } };
        const projects = projectsWith(file, { app: facts(), secret: facts() });

        expect(projects.listSlugs()).toEqual(["app"]);
        expect(await projects.getProject("secret", "pt-BR")).toBeNull();
        expect((await projects.listProjects("pt-BR")).map((p) => p.summary)).toEqual([block]);
    });

    it("does not mistake an Object.prototype name for a stored repo", async () => {
        const projects = projectsWith({}, { constructor: facts() }, [{ repo: "constructor" }]);
        expect((await projects.getProject("constructor", "pt-BR"))?.summary).toBe(block);
    });

    it("refuses a file that is not an object of repos, so a broken file fails the build", () => {
        expect(() => createTranslationReader([])).toThrow(/projects\.translations\.json/);
        expect(() => createTranslationReader("x")).toThrow(/projects\.translations\.json/);
    });
});

describe("Project tagline Translations read from the committed file", () => {
    const description = "Short GitHub text";
    const tagline = async (file: unknown, locale: Locale, overrides: Partial<RepoFacts> = {}) =>
        (await projectsWith(file, { app: facts(overrides) }).getProject("app", locale))?.tagline;
    const current = { app: { "pt-BR": { tagline: { text: "Texto curto do GitHub", sourceHash: hashSourceText(description) } } } };

    it("is the repo's short description in the default Locale", async () => {
        expect(await tagline({}, "en")).toBe(description);
    });

    it("shows a current Translation in its Locale, also when listing", async () => {
        expect(await tagline(current, "pt-BR")).toBe("Texto curto do GitHub");
        const [project] = await projectsWith(current, { app: facts() }).listProjects("pt-BR");
        expect(project.tagline).toBe("Texto curto do GitHub");
    });

    it("never uses an entry stored for the default Locale", async () => {
        const file = { app: { en: { tagline: { text: "Hand edited.", sourceHash: hashSourceText(description) } } } };
        expect(await tagline(file, "en")).toBe(description);
    });

    it("shows the live English description when the description changed (stale)", async () => {
        expect(await tagline(current, "pt-BR", { description: "A new description" })).toBe("A new description");
    });

    it("shows the English description when the Locale has no tagline Translation", async () => {
        expect(await tagline({}, "pt-BR")).toBe(description);
        expect(await tagline({ app: { "pt-BR": {} } }, "pt-BR")).toBe(description);
    });

    it("ignores a tagline entry with a missing hash, blank text or the wrong shape", async () => {
        expect(await tagline({ app: { "pt-BR": { tagline: { text: "Texto." } } } }, "pt-BR")).toBe(description);
        expect(await tagline({ app: { "pt-BR": { tagline: { text: "  ", sourceHash: hashSourceText(description) } } } }, "pt-BR")).toBe(description);
        expect(await tagline({ app: { "pt-BR": { tagline: "Texto." } } }, "pt-BR")).toBe(description);
    });

    it("is null when the repo has no usable description, whatever the file holds", async () => {
        expect(await tagline(current, "pt-BR", { description: null })).toBeNull();
        expect(await tagline(current, "pt-BR", { description: "   " })).toBeNull();
        expect(await tagline(current, "en", { description: null })).toBeNull();
    });

    it("hashes the trimmed description, so stray whitespace on GitHub is not a change", async () => {
        expect(await tagline(current, "pt-BR", { description: `  ${description}\n` })).toBe("Texto curto do GitHub");
        expect(await tagline({}, "en", { description: `  ${description}\n` })).toBe(description);
    });

    it("lives beside the summary Translation without disturbing it", async () => {
        const both = {
            app: {
                "pt-BR": {
                    text: "Texto em portugues.",
                    sourceHash: hashSourceText(block),
                    tagline: { text: "Texto curto do GitHub", sourceHash: hashSourceText(description) },
                },
            },
        };
        const project = await projectsWith(both, { app: facts() }).getProject("app", "pt-BR");
        expect(project?.summary).toBe("Texto em portugues.");
        expect(project?.tagline).toBe("Texto curto do GitHub");
    });

    it("keeps old-shape entries (summary only) working: tagline falls back to English, summary is shown", async () => {
        const old = { app: { "pt-BR": { text: "Texto em portugues.", sourceHash: hashSourceText(block) } } };
        const project = await projectsWith(old, { app: facts() }).getProject("app", "pt-BR");
        expect(project?.summary).toBe("Texto em portugues.");
        expect(project?.tagline).toBe(description);
    });

    it("a tagline-only entry leaves the summary falling back to English", async () => {
        const project = await projectsWith(current, { app: facts() }).getProject("app", "pt-BR");
        expect(project?.summary).toBe(block);
    });

    it("lets the in-memory source hold tagline Translations too", async () => {
        const source = createInMemorySource({
            repos: { app: facts() },
            taglineTranslations: { app: { "pt-BR": { text: "Texto curto", sourceHash: hashSourceText(description) } } },
        });
        const project = await createProjects({ allowlist: [{ repo: "app" }], source }).getProject("app", "pt-BR");
        expect(project?.tagline).toBe("Texto curto");
    });
});

describe("the committed projects.translations.json", () => {
    it("is readable by the Projects module", () => {
        expect(() => createTranslationReader(committed)).not.toThrow();
    });
});
