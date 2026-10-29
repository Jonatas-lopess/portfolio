export type Locale = string;

export type Visibility = "full" | "showcase";

/** One line of the Allowlist. Absence from the Allowlist is the Hidden Visibility. */
export type AllowlistEntry = {
    /** Repo name; it is also the Project slug. */
    repo: string;
    /** Defaults to "showcase" when omitted. */
    visibility?: Visibility;
    /** Replaces the repo name as the display title. */
    title?: string;
};

/** Facts about a repo as reported by GitHub repo metadata and the repo's contents. */
export type RepoFacts = {
    /** Short GitHub description. */
    description: string | null;
    /** GitHub homepage field, used as the demo link. */
    homepage: string | null;
    /** GitHub topics, used as the stack. */
    topics: string[];
    /** Link to the repo on GitHub. */
    url: string;
    /** Whether GitHub reports the repo as public. */
    isPublic: boolean;
    /** Full README text, or null when the repo has none. Never shown as is. */
    readme: string | null;
    /** Whether the repo has a Screenshot at the fixed path. */
    hasScreenshot: boolean;
};

/** A stored Translation of a Project summary. */
export type StoredTranslation = {
    text: string;
    /** Hash of the Source text the Translation was made from. */
    sourceHash: string;
};

/**
 * The seam behind the Projects module. The GitHub adapter and the in-memory
 * adapter both implement it.
 */
export interface ProjectsSource {
    /** Rejects when the repo cannot be read, so a bad Allowlist entry fails loudly. */
    getRepo(repo: string): Promise<RepoFacts>;
    /** The stored Translation of a repo's Project summary, if there is one. */
    getTranslation(repo: string, locale: Locale): Promise<StoredTranslation | null>;
}

export type Project = {
    /** The repo name. */
    slug: string;
    /** The title override if the Allowlist has one, else the repo name. */
    title: string;
    /** Project summary for the requested Locale. Empty when the repo has nothing to show. */
    summary: string;
    /** Demo link. */
    demoUrl: string | null;
    /** Stack, from the repo topics. */
    stack: string[];
    /** Link to the code. Only for Full Projects whose repo is public. */
    codeUrl: string | null;
    /** Public path of the Screenshot, or null so callers can show a placeholder. */
    screenshot: string | null;
};

export interface Projects {
    /** Allowlisted Projects, in Allowlist order. */
    listProjects(locale: Locale): Promise<Project[]>;
    /** One Project by slug, or null when the slug is not Allowlisted. */
    getProject(slug: string, locale: Locale): Promise<Project | null>;
    /** Slugs of Allowlisted Projects, for static generation. */
    listSlugs(): string[];
}
