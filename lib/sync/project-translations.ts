import { dedupeAllowlist, extractMarkedBlock, hashSourceText, taglineSourceText } from "@/lib/projects";
import type { AllowlistEntry } from "@/lib/projects";
import type { ProjectTranslationsDeps, ProjectTranslationsReport } from "@/lib/sync/types";

/**
 * Where Project summary Translations are kept: committed, reviewed, and imported
 * by the site at build time (`lib/projects/translations.ts`). Public path form,
 * so it is addressed through the same `FileStore` seam as everything else Sync writes.
 * `{ "<repo>": { "<locale>": { "text"?: string, "sourceHash"?: string, "tagline"?: { "text": string, "sourceHash": string } } } }`:
 * `text` + `sourceHash` are the Project summary, `tagline` the Translation of the repo's short description.
 */
export const PROJECT_TRANSLATIONS_PATH = "/projects.translations.json";

/** A Locale tag is also a key in a committed file, so only letters, digits and hyphens in the usual shape. */
const LOCALE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

type Stored = { text?: unknown; sourceHash?: unknown };
type Entry = Stored & { tagline?: unknown };
type File = Record<string, Record<string, Entry>>;
type Field = "summary" | "tagline";

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
        throw new Error(`${PROJECT_TRANSLATIONS_PATH} does not have the shape { "<repo>": { "<locale>": { "text": "...", "sourceHash": "..." } } } (a "tagline" with the same two keys may sit beside them); fix it by hand`);
    }
    return parsed as File;
}

/** The stored pair for a field of one entry, if the entry has an object there. */
function storedOf(entry: Entry | undefined, field: Field): Stored | undefined {
    if (entry === undefined) return undefined;
    if (field === "summary") return entry;
    return isObject(entry.tagline) ? entry.tagline : undefined;
}

/** Known keys first (summary, then tagline), so a new tagline lands in the same place in every entry. */
function orderedEntry(entry: Entry): Entry {
    const { text, sourceHash, tagline, ...rest } = entry;
    return {
        ...(text !== undefined && { text }),
        ...(sourceHash !== undefined && { sourceHash }),
        ...(tagline !== undefined && { tagline }),
        ...rest,
    };
}

/** Sorted keys and a final newline, so the same content is always the same bytes and a diff only shows real changes. */
function renderFile(file: File): string {
    const sorted = (object: object) => Object.keys(object).sort();
    const ordered = Object.fromEntries(
        sorted(file).map((repo) => [repo, Object.fromEntries(sorted(file[repo]).map((locale) => [locale, orderedEntry(file[repo][locale])]))]),
    );
    return JSON.stringify(ordered, null, 2) + "\n";
}

/** Nothing was written, so nothing counts as generated or regenerated. */
function clearGenerated(report: ProjectTranslationsReport): void {
    report.generated = [];
    report.regenerated = [];
    report.taglines.generated = [];
    report.taglines.regenerated = [];
}

type Pending = { repo: string; locale: string; field: Field; text: string; hash: string; regenerate: boolean };

/**
 * The Project summaries and taglines step of Sync. For each Allowlisted Project
 * and each target Locale, twice over: the summary (Source text: the README's Marked
 * block; none means the Project is skipped for it) and the tagline (Source text: the
 * repo's trimmed short description; none means skipped for it). No Translation means
 * translate and record the hash of the Source text; a Translation whose hash matches
 * is left alone; one whose hash differs (or is missing) is Stale, reported and left
 * alone, and replaced only with `regenerateStale`. The two live side by side in one
 * entry and never touch each other. Entries for repos no longer on the
 * Allowlist are pruned. All or nothing: any failure means the file is not
 * touched, pruning included. Hidden repos are never read. See ADR 0002.
 */
export async function syncProjectTranslations(deps: ProjectTranslationsDeps, allowlist: AllowlistEntry[]): Promise<ProjectTranslationsReport> {
    const report: ProjectTranslationsReport = { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [], taglines: { generated: [], regenerated: [], stale: [], unchanged: [], skipped: [] }, pruned: [], failed: [] };
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

    // Phase 1: read and classify. Nothing is sent to the Translator until every README and description was read.
    const pending: Pending[] = [];
    const classify = (repo: string, field: Field, sourceText: string, byLocale: Record<string, Entry>) => {
        const hash = hashSourceText(sourceText);
        const target = field === "summary" ? report : report.taglines;
        for (const locale of locales) {
            const stored = storedOf(has(byLocale, locale) ? byLocale[locale] : undefined, field);
            const ref = { repo, locale };
            if (stored === undefined || typeof stored.text !== "string" || stored.text.trim() === "") {
                pending.push({ ...ref, field, text: sourceText, hash, regenerate: false });
            } else if (stored.sourceHash === hash) {
                target.unchanged.push(ref);
            } else {
                target.stale.push({ ...ref, unknownHash: typeof stored.sourceHash !== "string" || stored.sourceHash === "" });
                if (deps.regenerateStale) pending.push({ ...ref, field, text: sourceText, hash, regenerate: true });
            }
        }
    };

    for (const repo of repos) {
        const byLocale = has(file, repo) ? file[repo] : {};

        let block: string | null | undefined;
        try {
            block = extractMarkedBlock(await deps.readmes.getReadme(repo));
        } catch (error) {
            report.failed.push({ repo, error: message(error) });
        }
        if (block === null) report.skipped.push(repo);
        else if (block !== undefined) classify(repo, "summary", block, byLocale);

        let description: string | null | undefined;
        try {
            description = taglineSourceText(await deps.descriptions.getDescription(repo));
        } catch (error) {
            report.failed.push({ repo, field: "tagline", error: message(error) });
        }
        if (description === null) report.taglines.skipped.push(repo);
        else if (description !== undefined) classify(repo, "tagline", description, byLocale);
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
            // Only this field of the entry changes; the other one (and anything else in the entry) stays as it was.
            const current = next[item.repo]?.[item.locale] ?? {};
            const updated: Entry = item.field === "summary" ? { ...current, text, sourceHash: item.hash } : { ...current, tagline: { text, sourceHash: item.hash } };
            next[item.repo] = { ...(next[item.repo] ?? {}), [item.locale]: updated };
            const target = item.field === "summary" ? report : report.taglines;
            (item.regenerate ? target.regenerated : target.generated).push({ repo: item.repo, locale: item.locale });
        } catch (error) {
            report.failed.push({ repo: item.repo, locale: item.locale, ...(item.field === "tagline" && { field: "tagline" as const }), error: message(error) });
        }
    }
    if (report.failed.length > 0) {
        clearGenerated(report);
        return report;
    }

    const rendered = renderFile(next);
    if ((pending.length > 0 || orphans.length > 0) && rendered !== existingText) {
        try {
            await deps.store.write(PROJECT_TRANSLATIONS_PATH, new TextEncoder().encode(rendered));
        } catch (error) {
            report.failed.push({ repo: "(file)", error: message(error) });
            clearGenerated(report);
            return report;
        }
    }
    report.pruned = orphans;
    return report;
}
