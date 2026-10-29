import { screenshotPath } from "@/lib/projects";
import type { AllowlistEntry } from "@/lib/projects";
import type { FileStore, ScreenshotSource, ScreenshotsReport, SyncReport } from "@/lib/sync/types";

export type { FileStore, ScreenshotSource, ScreenshotsReport, SyncReport } from "@/lib/sync/types";

export type SyncDeps = {
    github: ScreenshotSource;
    store: FileStore;
    /** Only these repos are ever read or written; any other repo is Hidden. */
    allowlist: AllowlistEntry[];
};

/**
 * The Sync job. Each step reports into its own key of the SyncReport, so a
 * later step (Translations) is a new optional dependency plus a new report key.
 */
export async function runSync(deps: SyncDeps): Promise<SyncReport> {
    return { screenshots: await copyScreenshots(deps) };
}

async function copyScreenshots({ github, store, allowlist }: SyncDeps): Promise<ScreenshotsReport> {
    const report: ScreenshotsReport = { copied: [], unchanged: [], skipped: [], failed: [] };
    const repos = allowlist.map((entry) => entry.repo).filter((repo, i, all) => all.indexOf(repo) === i);

    for (const repo of repos) {
        try {
            const bytes = await github.getScreenshot(repo);
            if (!bytes || bytes.length === 0) {
                report.skipped.push(repo);
                continue;
            }
            const target = screenshotPath(repo);
            const existing = await store.read(target);
            if (existing && sameBytes(existing, bytes)) {
                report.unchanged.push(repo);
                continue;
            }
            await store.write(target, bytes);
            report.copied.push(repo);
        } catch (error) {
            report.failed.push({ repo, error: error instanceof Error ? error.message : String(error) });
        }
    }
    return report;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
    return a.length === b.length && a.every((byte, i) => byte === b[i]);
}
