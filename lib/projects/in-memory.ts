import type { Locale } from "@/lib/locale";
import { ProjectsSource, RepoFacts, StoredTranslation } from "@/lib/projects/types";

export type InMemoryData = {
    repos: Record<string, RepoFacts>;
    /** Stored Translations, by repo and then by Locale. */
    translations?: Record<string, Partial<Record<Locale, StoredTranslation>>>;
};

export function createInMemorySource(data: InMemoryData): ProjectsSource {
    return {
        async getRepo(repo) {
            const facts = data.repos[repo];
            if (!facts) {
                throw new Error(`Repo "${repo}" cannot be read`);
            }
            return facts;
        },
        async getTranslation(repo, locale) {
            return data.translations?.[repo]?.[locale] ?? null;
        },
    };
}
