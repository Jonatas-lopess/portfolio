import type { DictionaryTree } from "@/lib/sync/dictionary-file";
import type { Translator } from "@/lib/translator";

/** Where Sync reads Screenshots from: the owner's GitHub repos. */
export interface ScreenshotSource {
    /** The Screenshot bytes at the fixed path in the repo, or null when the repo has none. Rejects when the repo cannot be read. */
    getScreenshot(repo: string): Promise<Uint8Array | null>;
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
};
