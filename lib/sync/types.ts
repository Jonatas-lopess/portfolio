import type { DictionaryTree } from "@/lib/sync/dictionary-file";
import type { Translator } from "@/lib/translator";

/** Where Sync reads Screenshots from: the owner's GitHub repos. */
export interface ScreenshotSource {
    /** The Screenshot bytes at the fixed path in the repo, or null when the repo has none. Rejects when the repo cannot be read. */
    getScreenshot(repo: string): Promise<Uint8Array | null>;
}

/** Where Sync reads READMEs from: the owner's GitHub repos. */
export interface ReadmeSource {
    /** The README text, or null when the repo has none. Rejects when the repo cannot be read. */
    getReadme(repo: string): Promise<string | null>;
}

/** Where Sync reads each Project's tagline source from: the repo's short GitHub description. */
export interface DescriptionSource {
    /** The short description, or null when the repo has none. Rejects when the repo cannot be read. */
    getDescription(repo: string): Promise<string | null>;
}

/**
 * Where Sync puts files, addressed by public path (e.g. `/screenshots/alpha.png`,
 * the same strings the Projects module serves them under).
 */
export interface FileStore {
    /** The file's bytes, or null when it does not exist. */
    read(publicPath: string): Promise<Uint8Array | null>;
    write(publicPath: string, bytes: Uint8Array): Promise<void>;
}

export type ScreenshotsReport = {
    /** Repos whose Screenshot was written, new or changed. */
    copied: string[];
    /** Repos whose Screenshot already matched the stored file; nothing was written. */
    unchanged: string[];
    /** Repos with no Screenshot at the fixed path. Not an error. */
    skipped: string[];
    /** Repos that could not be synced; the run carries on with the others. */
    failed: { repo: string; error: string }[];
};

/** What the Translations step needs; all of it injectable so tests use fakes. */
export type TranslationsDeps = {
    translator: Translator;
    /**
     * Rooted at the repo root, not `public/`: Dictionary files are at
     * `/dictionary/<locale>.ts`, the Source-hash state at `/dictionary/.sync-state.json`.
     */
    store: FileStore;
    /** The English Dictionary, the Source text of every Translation. */
    source: DictionaryTree;
    /** Source text's language; it is never a target. */
    sourceLocale: string;
    /** Every Locale that should have a Dictionary (`sourceLocale` is ignored if listed). */
    locales: readonly string[];
    /** Replace Stale translations too. Off by default: the owner decides when their wording is replaced. */
    regenerateStale?: boolean;
};

/** What the Project summary and tagline Translations step needs; all of it injectable so tests use fakes. */
export type ProjectTranslationsDeps = {
    translator: Translator;
    /** Reads the README of each Allowlisted Project. Hidden repos are never asked for. */
    readmes: ReadmeSource;
    /** Reads the short description (the tagline's Source text) of each Allowlisted Project. Hidden repos are never asked for. */
    descriptions: DescriptionSource;
    /** Rooted at the repo root: the Translations are in `/projects.translations.json`. */
    store: FileStore;
    /** Source text's language; it is never a target. */
    sourceLocale: string;
    /** Every Locale that should have a Translation of each summary (`sourceLocale` is ignored if listed). */
    locales: readonly string[];
    /** Replace Stale translations too. Off by default: the owner decides when their wording is replaced. */
    regenerateStale?: boolean;
};

/** One Translation of one Project's summary or tagline. */
export type ProjectTranslationRef = { repo: string; locale: string };

/** What happened to the Project taglines; see `ProjectTranslationsReport` for the meaning of each key. */
export type TaglineTranslationsReport = {
    generated: ProjectTranslationRef[];
    regenerated: ProjectTranslationRef[];
    /** Entries whose description changed since they were translated (or that have no recorded hash). Left alone unless regenerated. */
    stale: (ProjectTranslationRef & { unknownHash: boolean })[];
    unchanged: ProjectTranslationRef[];
    /** Projects whose repo has no description: nothing to translate. Not an error. */
    skipped: string[];
};

/**
 * The top-level keys are about Project summaries; `taglines` holds the same for taglines.
 * `pruned` and `failed` cover both.
 */
export type ProjectTranslationsReport = {
    /** Translated because the Project had no Translation in that Locale. */
    generated: ProjectTranslationRef[];
    /** Stale entries replaced, only with `regenerateStale`. */
    regenerated: ProjectTranslationRef[];
    /**
     * Entries whose Marked block changed since they were translated, or that have no recorded
     * hash (`unknownHash`, so there is no way to tell). Left alone unless regenerated.
     */
    stale: (ProjectTranslationRef & { unknownHash: boolean })[];
    /** Entries that match the live Marked block. Never sent. */
    unchanged: ProjectTranslationRef[];
    /** Projects whose README has no usable Marked block: nothing to translate. Not an error. */
    skipped: string[];
    /** The same, for the Project taglines (the repo's short description). */
    taglines: TaglineTranslationsReport;
    /**
     * Repos that were in the stored file but are not on the Allowlist any more: removed from
     * the file, so a Hidden repo's name does not stay in committed data. Empty when the run failed (nothing is written then).
     */
    pruned: string[];
    /**
     * Things that could not be done. When this is not empty nothing was translated or written.
     * `repo` is `(file)` for the stored file as a whole, `(locale)` for a bad Locale tag.
     * `field` is `"tagline"` for a failure about a tagline; absent means the Project summary
     * (or the file as a whole).
     */
    failed: { repo: string; locale?: string; field?: "tagline"; error: string }[];
};

export type DictionaryLocaleReport = {
    /** The Locale had no Dictionary file and one was written. */
    created: boolean;
    /** Entries translated because the Locale had no Translation for them. */
    generated: string[];
    /** Stale entries replaced, only with `regenerateStale`. */
    regenerated: string[];
    /** Entries whose English text changed since the Translation was made. Left alone unless regenerated. */
    stale: string[];
    /** Existing Translations with no recorded hash: the current English hash was recorded as their baseline. */
    baselined: string[];
    /** Entries with a Translation that matches the current English text. Never sent. */
    unchanged: string[];
    /**
     * Entries (`Section.Key`) that could not be done. When this is not empty
     * nothing of the Locale was written. `(file)` and `(state)` stand for the
     * Locale file or the state file as a whole.
     */
    failed: { path: string; error: string }[];
    /** Whether the Locale is in `dictionary/index.ts`: patched now, already there, patched by hand needed, or not attempted. */
    registry: "added" | "present" | "manual" | "skipped";
    /** With `registry: "manual"`, the lines to add to `dictionary/index.ts`. */
    registryLines?: string[];
};

export type TranslationsReport = Record<string, DictionaryLocaleReport>;

export type SyncReport = {
    screenshots: ScreenshotsReport;
    /** Present only when the run was given a Translator. */
    translations?: TranslationsReport;
    /** Present only when the run was given the Project summary step. */
    projectTranslations?: ProjectTranslationsReport;
};
