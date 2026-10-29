import { hashSourceText } from "@/lib/projects/hash";
import { extractMarkedBlock } from "@/lib/projects/marked-block";
import { AllowlistEntry, Locale, Project, Projects, ProjectsSource, RepoFacts } from "@/lib/projects/types";

export type { AllowlistEntry, Locale, Project, Projects, ProjectsSource, RepoFacts, StoredTranslation, Visibility } from "@/lib/projects/types";

export { extractMarkedBlock, hashSourceText };

/** Where Sync puts a Project's Screenshot in the public folder. */
export function screenshotPath(slug: string): string {
    return `/screenshots/${slug}.png`;
}

export function createProjects({ allowlist: entries, source }: { allowlist: AllowlistEntry[]; source: ProjectsSource }): Projects {
    const allowlist = entries.filter((entry, i) => entries.findIndex((e) => e.repo === entry.repo) === i);

    async function resolveSummary(repo: string, facts: RepoFacts, locale: Locale): Promise<string> {
        const sourceText = extractMarkedBlock(facts.readme);
        if (sourceText === null) {
            return facts.description ?? "";
        }

        const translation = await source.getTranslation(repo, locale);
        if (translation && translation.text.trim() && translation.sourceHash === hashSourceText(sourceText)) {
            return translation.text;
        }

        return sourceText;
    }

    async function build(entry: AllowlistEntry, locale: Locale): Promise<Project> {
        const facts = await source.getRepo(entry.repo);
        return {
            slug: entry.repo,
            title: entry.title?.trim() || entry.repo,
            summary: await resolveSummary(entry.repo, facts, locale),
            demoUrl: facts.homepage,
            stack: facts.topics,
            codeUrl: entry.visibility === "full" && facts.isPublic ? facts.url : null,
            screenshot: facts.hasScreenshot ? screenshotPath(entry.repo) : null,
        };
    }

    return {
        listProjects: (locale) => Promise.all(allowlist.map((entry) => build(entry, locale))),
        async getProject(slug, locale) {
            const entry = allowlist.find((e) => e.repo === slug);
            return entry ? build(entry, locale) : null;
        },
        listSlugs: () => allowlist.map((e) => e.repo),
    };
}
