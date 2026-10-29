import { dedupeAllowlist, screenshotPath } from "@/lib/projects";
import type { AllowlistEntry } from "@/lib/projects";
import { syncProjectTranslations } from "@/lib/sync/project-translations";
import { syncTranslations } from "@/lib/sync/translations";
import type { FileStore, ProjectTranslationsDeps, ProjectTranslationsReport, ScreenshotSource, ScreenshotsReport, SyncReport, TranslationsDeps, TranslationsReport } from "@/lib/sync/types";

export type { DictionaryLocaleReport, FileStore, ProjectTranslationRef, ProjectTranslationsDeps, ProjectTranslationsReport, ReadmeSource, ScreenshotSource, ScreenshotsReport, SyncReport, TranslationsDeps, TranslationsReport } from "@/lib/sync/types";

export type SyncDeps = {
    github: ScreenshotSource;
    store: FileStore;
    /** Only these repos are ever read or written; any other repo is Hidden. */
    allowlist: AllowlistEntry[];
    /** The Translations step. Without it Sync only copies Screenshots. */
    translations?: TranslationsDeps;
    /** The Project summary Translations step. Reads only Allowlisted Projects' READMEs. */
    projectTranslations?: ProjectTranslationsDeps;
};

/**
 * The Sync job. Each step reports into its own key of the SyncReport: Screenshots,
 * then, when given, the Dictionary Translations and the Project summary Translations.
 * Steps are isolated: one that rejects is recorded as a failure under its own key (entry
 * `(step)`) and the others still run and keep their reports.
 */
export async function runSync(deps: SyncDeps): Promise<SyncReport> {
    const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

    const report: SyncReport = {
        screenshots: await copyScreenshots(deps).catch((error): ScreenshotsReport => ({
            copied: [],
            unchanged: [],
            skipped: [],
            failed: [{ repo: "(step)", error: message(error) }],
        })),
    };
    if (deps.translations) {
        report.translations = await syncTranslations(deps.translations).catch((error): TranslationsReport => ({
            "(step)": {
                created: false,
                generated: [],
                regenerated: [],
                stale: [],
                baselined: [],
                unchanged: [],
                failed: [{ path: "(step)", error: message(error) }],
                registry: "skipped",
            },
        }));
    }
    if (deps.projectTranslations) {
        report.projectTranslations = await syncProjectTranslations(deps.projectTranslations, deps.allowlist).catch((error): ProjectTranslationsReport => ({
            generated: [],
            regenerated: [],
            stale: [],
            unchanged: [],
            skipped: [],
            pruned: [],
            failed: [{ repo: "(step)", error: message(error) }],
        }));
    }
    return report;
}

async function copyScreenshots({ github, store, allowlist }: SyncDeps): Promise<ScreenshotsReport> {
    const report: ScreenshotsReport = { copied: [], unchanged: [], skipped: [], failed: [] };
    const repos = dedupeAllowlist(allowlist).map((entry) => entry.repo);

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
