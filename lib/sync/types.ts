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

export type SyncReport = {
    screenshots: ScreenshotsReport;
};
