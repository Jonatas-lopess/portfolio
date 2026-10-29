import { describe, expect, it } from "vitest";
import { createInMemorySource } from "@/lib/projects/in-memory";
import { createProjects, hashSourceText } from "@/lib/projects";
import { AllowlistEntry, RepoFacts, StoredTranslation } from "@/lib/projects/types";

function repo(overrides: Partial<RepoFacts> = {}): RepoFacts {
    return {
        description: "A short description",
        homepage: null,
        topics: [],
        url: "https://github.com/owner/repo",
        isPublic: true,
        readme: null,
        hasScreenshot: false,
        ...overrides,
    };
}

function projectsFor(allowlist: AllowlistEntry[], repos: Record<string, RepoFacts>) {
    return createProjects({ allowlist, source: createInMemorySource({ repos }) });
}

describe("listing Projects", () => {
    it("lists an Allowlisted repo as a Project with its structured fields", async () => {
        const projects = projectsFor(
            [{ repo: "alpha" }],
            { alpha: repo({ homepage: "https://alpha.example.com", topics: ["next", "ts"] }) },
        );

        expect(await projects.listProjects("en")).toEqual([
            expect.objectContaining({
                slug: "alpha",
                title: "alpha",
                summary: "A short description",
                demoUrl: "https://alpha.example.com",
                stack: ["next", "ts"],
            }),
        ]);
    });
});

describe("Hidden Projects", () => {
    const repos = { listed: repo(), secret: repo({ description: "commercial" }) };
    const projects = projectsFor([{ repo: "listed" }], repos);

    it("never appear in a listing", async () => {
        const slugs = (await projects.listProjects("en")).map((p) => p.slug);
        expect(slugs).toEqual(["listed"]);
    });

    it("are not found by slug", async () => {
        expect(await projects.getProject("secret", "en")).toBeNull();
    });

    it("are absent from the slug listing", () => {
        expect(projects.listSlugs()).toEqual(["listed"]);
    });

    it("leave an Allowlisted Project retrievable by slug", async () => {
        expect(await projects.getProject("listed", "en")).toEqual(expect.objectContaining({ slug: "listed" }));
    });
});

describe("an Allowlisted repo that cannot be read", () => {
    it("fails loudly instead of being skipped", async () => {
        const projects = projectsFor([{ repo: "ghost" }], {});

        await expect(projects.listProjects("en")).rejects.toThrow("ghost");
        await expect(projects.getProject("ghost", "en")).rejects.toThrow("ghost");
    });
});

describe("Visibility and the code link", () => {
    const url = "https://github.com/owner/repo";

    async function codeUrlFor(entry: AllowlistEntry, isPublic: boolean) {
        const projects = projectsFor([entry], { [entry.repo]: repo({ url, isPublic }) });
        return (await projects.getProject(entry.repo, "en"))?.codeUrl;
    }

    it("defaults a new entry to Showcase, with no code link", async () => {
        expect(await codeUrlFor({ repo: "app" }, true)).toBeNull();
    });

    it("never gives a Showcase Project a code link, even for a public repo", async () => {
        expect(await codeUrlFor({ repo: "app", visibility: "showcase" }, true)).toBeNull();
    });

    it("gives a Full Project a code link when GitHub reports the repo public", async () => {
        expect(await codeUrlFor({ repo: "app", visibility: "full" }, true)).toBe(url);
    });

    it("gives a Full Project no code link when the repo is private", async () => {
        expect(await codeUrlFor({ repo: "app", visibility: "full" }, false)).toBeNull();
    });

    it("treats an unrecognised Visibility value as Showcase", async () => {
        const entry = { repo: "app", visibility: "open" } as unknown as AllowlistEntry;
        expect(await codeUrlFor(entry, true)).toBeNull();
    });

    it("applies the same rules in the listing", async () => {
        const projects = projectsFor(
            [{ repo: "a", visibility: "full" }, { repo: "b" }, { repo: "c", visibility: "full" }],
            { a: repo({ url: "u-a" }), b: repo({ url: "u-b" }), c: repo({ url: "u-c", isPublic: false }) },
        );
        const codeUrls = (await projects.listProjects("en")).map((p) => p.codeUrl);
        expect(codeUrls).toEqual(["u-a", null, null]);
    });
});

describe("the title override", () => {
    it("replaces the repo name as the title while the slug stays the repo name", async () => {
        const projects = projectsFor([{ repo: "my-repo-2", title: "My Nice Project" }], { "my-repo-2": repo() });

        const project = await projects.getProject("my-repo-2", "en");
        expect(project).toEqual(expect.objectContaining({ slug: "my-repo-2", title: "My Nice Project" }));
    });
});

describe("a blank title override", () => {
    it("is ignored, so the repo name stays the title", async () => {
        const projects = projectsFor([{ repo: "plain", title: "   " }], { plain: repo() });

        expect((await projects.getProject("plain", "en"))?.title).toBe("plain");
    });
});

describe("the Screenshot", () => {
    it("is reported as a public path when the repo has one", async () => {
        const projects = projectsFor([{ repo: "shot" }], { shot: repo({ hasScreenshot: true }) });

        expect((await projects.getProject("shot", "en"))?.screenshot).toBe("/screenshots/shot.png");
    });

    it("is reported as null when the repo has none, so callers show a placeholder", async () => {
        const projects = projectsFor([{ repo: "bare" }], { bare: repo({ hasScreenshot: false }) });

        expect((await projects.getProject("bare", "en"))?.screenshot).toBeNull();
    });
});

describe("the Project summary and the Marked block", () => {
    async function summaryFor(readme: string | null) {
        const projects = projectsFor([{ repo: "app" }], { app: repo({ description: "Short GitHub text", readme }) });
        return (await projects.getProject("app", "en"))?.summary;
    }

    it("is the text between the start and end markers", async () => {
        const readme = "# App\n\nSecret setup notes\n\n<!-- portfolio:start -->\nA web app for X.\n\nIt does Y.\n<!-- portfolio:end -->\n\nMore private notes";

        expect(await summaryFor(readme)).toBe("A web app for X.\n\nIt does Y.");
    });

    it("never includes text outside the markers", async () => {
        const summary = await summaryFor("before <!-- portfolio:start -->inside<!-- portfolio:end --> after");

        expect(summary).toBe("inside");
    });

    it("accepts extra whitespace inside the marker comments", async () => {
        expect(await summaryFor("<!--   portfolio:start   -->hi<!--portfolio:end-->")).toBe("hi");
    });

    it("uses the first block when there are several", async () => {
        const readme = "<!-- portfolio:start -->one<!-- portfolio:end --> x <!-- portfolio:start -->two<!-- portfolio:end -->";

        expect(await summaryFor(readme)).toBe("one");
    });

    it("falls back to the short description when the repo has no README", async () => {
        expect(await summaryFor(null)).toBe("Short GitHub text");
    });

    it("falls back to the short description when there are no markers", async () => {
        expect(await summaryFor("# App\n\nPrivate README text")).toBe("Short GitHub text");
    });

    it("falls back to the short description when the block is empty", async () => {
        expect(await summaryFor("<!-- portfolio:start -->  \n <!-- portfolio:end -->")).toBe("Short GitHub text");
    });

    it("falls back when the end marker is missing, without leaking the rest of the README", async () => {
        expect(await summaryFor("<!-- portfolio:start -->private tail")).toBe("Short GitHub text");
    });

    it("falls back when the start marker is missing", async () => {
        expect(await summaryFor("private head<!-- portfolio:end -->")).toBe("Short GitHub text");
    });

    it("falls back when the markers are in the wrong order", async () => {
        expect(await summaryFor("<!-- portfolio:end -->private<!-- portfolio:start -->")).toBe("Short GitHub text");
    });

    it("falls back when a second start marker appears before the end marker", async () => {
        const readme = "<!-- portfolio:start -->private <!-- portfolio:start -->public<!-- portfolio:end -->";

        expect(await summaryFor(readme)).toBe("Short GitHub text");
    });

    it("is empty when there is neither a Marked block nor a short description", async () => {
        const projects = projectsFor([{ repo: "app" }], { app: repo({ description: null }) });

        expect((await projects.getProject("app", "en"))?.summary).toBe("");
    });
});

describe("hashing Source text", () => {
    it("is the SHA-256 hex digest, the contract stored Translations rely on", () => {
        expect(hashSourceText("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });
});

describe("the Locale fallback for the Project summary", () => {
    const readme = "<!-- portfolio:start -->Live English text.<!-- portfolio:end -->";

    async function summaryFor(
        locale: string,
        translations: Record<string, StoredTranslation> | undefined,
        facts: Partial<RepoFacts> = {},
    ) {
        const source = createInMemorySource({
            repos: { app: repo({ description: "Short GitHub text", readme, ...facts }) },
            translations: translations && { app: translations },
        });
        const projects = createProjects({ allowlist: [{ repo: "app" }], source });
        return (await projects.getProject("app", locale))?.summary;
    }

    it("uses the current Translation for the requested Locale", async () => {
        const translations = { "pt-BR": { text: "Texto em portugues.", sourceHash: hashSourceText("Live English text.") } };

        expect(await summaryFor("pt-BR", translations)).toBe("Texto em portugues.");
    });

    it("lists Projects with the same Translation", async () => {
        const source = createInMemorySource({
            repos: { app: repo({ readme }) },
            translations: { app: { "pt-BR": { text: "Texto.", sourceHash: hashSourceText("Live English text.") } } },
        });
        const projects = createProjects({ allowlist: [{ repo: "app" }], source });

        expect((await projects.listProjects("pt-BR"))[0].summary).toBe("Texto.");
    });

    it("skips a Stale translation and uses the Source text", async () => {
        const translations = { "pt-BR": { text: "Texto antigo.", sourceHash: hashSourceText("Old English text.") } };

        expect(await summaryFor("pt-BR", translations)).toBe("Live English text.");
    });

    it("uses the Source text when the Locale has no Translation", async () => {
        const translations = { "pt-BR": { text: "Texto.", sourceHash: hashSourceText("Live English text.") } };

        expect(await summaryFor("es", translations)).toBe("Live English text.");
        expect(await summaryFor("es", undefined)).toBe("Live English text.");
    });

    it("skips a blank Translation", async () => {
        const translations = { "pt-BR": { text: "  ", sourceHash: hashSourceText("Live English text.") } };

        expect(await summaryFor("pt-BR", translations)).toBe("Live English text.");
    });

    it("falls back to the short description when the README lost its Marked block", async () => {
        const translations = { "pt-BR": { text: "Texto.", sourceHash: hashSourceText("Live English text.") } };

        expect(await summaryFor("pt-BR", translations, { readme: "# No markers" })).toBe("Short GitHub text");
    });
});

describe("a repo listed twice on the Allowlist", () => {
    it("appears once, using its first entry", async () => {
        const projects = projectsFor(
            [{ repo: "dup", title: "First" }, { repo: "other" }, { repo: "dup", title: "Second" }],
            { dup: repo(), other: repo() },
        );

        expect(projects.listSlugs()).toEqual(["dup", "other"]);
        expect((await projects.listProjects("en")).map((p) => p.title)).toEqual(["First", "other"]);
        expect((await projects.getProject("dup", "en"))?.title).toBe("First");
    });
});
