import { dedupeAllowlist, extractMarkedBlock, hashSourceText } from "@/lib/projects";
import type { AllowlistEntry } from "@/lib/projects";
import type { ProjectTranslationsDeps, ProjectTranslationsReport } from "@/lib/sync/types";

/**
 * Where Project summary Translations are kept: committed, reviewed, and imported
 * by the site at build time (`lib/projects/translations.ts`). Public path form,
 * so it is addressed through the same `FileStore` seam as everything else Sync writes.
 * `{ "<repo>": { "<locale>": { "text": string, "sourceHash": string } } }`.
 */
export const PROJECT_TRANSLATIONS_PATH = "/projects.translations.json";

/** A Locale tag is also a key in a committed file, so only letters, digits and hyphens in the usual shape. */
const LOCALE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

type Entry = { text?: unknown; sourceHash?: unknown };
type File = Record<string, Record<string, Entry>>;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

function parseFile(text: string | null): File {
    if (text === null) return {};
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error(`${PROJECT_TRANSLATIONS_PATH} is not valid JSON; fix it by hand (Sync will not overwrite it)`);
    }
    const valid = isObject(parsed) && Object.values(parsed).every((byLocale) => isObject(byLocale) && Object.values(byLocale).every(isObject));
    if (!valid) {
        throw new Error(`${PROJECT_TRANSLATIONS_PATH} does not have the shape { "<repo>": { "<locale>": { "text": "...", "sourceHash": "..." } } }; fix it by hand`);
    }
    return parsed as File;
}

/** Sorted keys and a final newline, so the same content is always the same bytes and a diff only shows real changes. */
function renderFile(file: File): string {
    const sorted = (object: object) => Object.keys(object).sort();
    const ordered = Object.fromEntries(
        sorted(file).map((repo) => [repo, Object.fromEntries(sorted(file[repo]).map((locale) => [locale, file[repo][locale]]))]),
    );
    return JSON.stringify(ordered, null, 2) + "\n";
}

type Pending = { repo: string; locale: string; text: string; hash: string; regenerate: boolean };

/**
 * The Project summaries step of Sync. For each Allowlisted Project with a Marked
 * block and each target Locale: no Translation means translate and record the
 * hash of the Source text; a Translation whose hash matches is left alone; one
 * whose hash differs (or is missing) is Stale, reported and left alone, and
 * replaced only with `regenerateStale`. Entries for repos no longer on the
 * Allowlist are pruned. All or nothing: any failure means the file is not
 * touched, pruning included. Hidden repos are never read. See ADR 0002.
 */
export async function syncProjectTranslations(deps: ProjectTranslationsDeps, allowlist: AllowlistEntry[]): Promise<ProjectTranslationsReport> {
    const report: ProjectTranslationsReport = { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [], pruned: [], failed: [] };
    const repos = dedupeAllowlist(allowlist).map((entry) => entry.repo);

    const locales = Array.from(new Set(deps.locales)).filter((locale) => locale !== deps.sourceLocale);
    for (const locale of repos.length === 0 ? [] : locales) {
        if (!LOCALE_TAG.test(locale)) {
            report.failed.push({ repo: "(locale)", locale, error: `"${locale}" is not a valid Locale tag (expected something like "es" or "pt-BR")` });
        }
    }
    if (report.failed.length > 0 || (repos.length > 0 && locales.length === 0)) return report;

    let file: File;
    let existingText: string | null;
    try {
        const bytes = await deps.store.read(PROJECT_TRANSLATIONS_PATH);
        existingText = bytes === null ? null : new TextDecoder().decode(bytes);
        file = parseFile(existingText);
    } catch (error) {
        report.failed.push({ repo: "(file)", error: message(error) });
        return report;
    }

    // Entries for repos that left the Allowlist are dropped from the file (a Hidden repo's name must not stay in committed data).
    const orphans = Object.keys(file).filter((repo) => !repos.includes(repo)).sort();

    // Phase 1: read and classify. Nothing is sent to the Translator until every README was read.
    const pending: Pending[] = [];
    for (const repo of repos) {
        let block: string | null;
        try {
            block = extractMarkedBlock(await deps.readmes.getReadme(repo));
        } catch (error) {
            report.failed.push({ repo, error: message(error) });
            continue;
        }
        if (block === null) {
            report.skipped.push(repo);
            continue;
        }

        const hash = hashSourceText(block);
        const byLocale = has(file, repo) ? file[repo] : {};
        for (const locale of locales) {
            const entry = has(byLocale, locale) ? byLocale[locale] : undefined;
            const ref = { repo, locale };
            if (entry === undefined || typeof entry.text !== "string" || entry.text.trim() === "") {
                pending.push({ ...ref, text: block, hash, regenerate: false });
            } else if (entry.sourceHash === hash) {
                report.unchanged.push(ref);
            } else {
                report.stale.push({ ...ref, unknownHash: typeof entry.sourceHash !== "string" || entry.sourceHash === "" });
                if (deps.regenerateStale) pending.push({ ...ref, text: block, hash, regenerate: true });
            }
        }
    }
    if (report.failed.length > 0) return report;

    // Phase 2: translate. Nothing is recorded unless every call worked.
    const next: File = Object.fromEntries(
        Object.entries(file)
            .filter(([repo]) => !orphans.includes(repo))
            .map(([repo, byLocale]) => [repo, { ...byLocale }]),
    );
    for (const item of pending) {
        try {
            const text = (await deps.translator.translate(item.text, item.locale)).trim();
            if (text === "") throw new Error("the Translator returned an empty text");
            next[item.repo] = { ...(next[item.repo] ?? {}), [item.locale]: { text, sourceHash: item.hash } };
            (item.regenerate ? report.regenerated : report.generated).push({ repo: item.repo, locale: item.locale });
        } catch (error) {
            report.failed.push({ repo: item.repo, locale: item.locale, error: message(error) });
        }
    }
    if (report.failed.length > 0) {
        report.generated = [];
        report.regenerated = [];
        return report;
    }

    const rendered = renderFile(next);
    if ((pending.length > 0 || orphans.length > 0) && rendered !== existingText) {
        try {
            await deps.store.write(PROJECT_TRANSLATIONS_PATH, new TextEncoder().encode(rendered));
        } catch (error) {
            report.failed.push({ repo: "(file)", error: message(error) });
            report.generated = [];
            report.regenerated = [];
            return report;
        }
    }
    report.pruned = orphans;
    return report;
}
