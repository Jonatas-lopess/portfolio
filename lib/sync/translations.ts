import { hashSourceText } from "@/lib/projects/hash";
import {
    addToRegistry,
    exportNameFor,
    flattenDictionary,
    parseDictionaryFile,
    registryLines,
    renderDictionaryFile,
    setPath,
    type DictionaryTree,
} from "@/lib/sync/dictionary-file";
import type { DictionaryLocaleReport, FileStore, TranslationsDeps, TranslationsReport } from "@/lib/sync/types";

/**
 * Where Sync keeps, per Locale and per entry, the hash of the English text the
 * Translation was made from. Committed with the Dictionary files, so a reviewer
 * sees it change in the same diff and "Stale" survives across machines.
 * `{ "<locale>": { "<Section.Key>": "<sha256 of the English text>" } }`.
 */
export const SYNC_STATE_PATH = "/dictionary/.sync-state.json";
const REGISTRY_PATH = "/dictionary/index.ts";
const dictionaryPath = (locale: string) => `/dictionary/${locale}.ts`;

/** A Locale tag is also a file name, so only letters, digits and hyphens in the usual shape. */
const LOCALE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

type SyncState = Record<string, Record<string, string>>;

const decode = (bytes: Uint8Array | null) => (bytes === null ? null : new TextDecoder().decode(bytes));
const encode = (text: string) => new TextEncoder().encode(text);
const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

function emptyReport(): DictionaryLocaleReport {
    return { created: false, generated: [], regenerated: [], stale: [], baselined: [], unchanged: [], failed: [], registry: "skipped" };
}

function parseState(text: string | null): SyncState {
    if (text === null) return {};
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error(`${SYNC_STATE_PATH} is not valid JSON; fix or delete it (deleting re-baselines every existing Translation)`);
    }
    const valid =
        typeof parsed === "object" &&
        parsed !== null &&
        Object.values(parsed).every((hashes) => typeof hashes === "object" && hashes !== null && Object.values(hashes).every((h) => typeof h === "string"));
    if (!valid) throw new Error(`${SYNC_STATE_PATH} does not have the shape { "<locale>": { "<key.path>": "<hash>" } }`);
    return parsed as SyncState;
}

function renderState(state: SyncState): string {
    const sorted = (object: Record<string, unknown>) => Object.keys(object).sort();
    const ordered = Object.fromEntries(
        sorted(state).map((locale) => [locale, Object.fromEntries(sorted(state[locale]).map((path) => [path, state[locale][path]]))]),
    );
    return JSON.stringify(ordered, null, 2) + "\n";
}

type LocaleResult = { report: DictionaryLocaleReport; file?: string; hashes?: Record<string, string> };

/**
 * One Locale. Pure of writes: it returns the new file text and hashes, or a
 * report that carries failures and no changes, so a failure can never leave a
 * half-written Locale behind.
 */
async function planLocale(locale: string, deps: TranslationsDeps, hashes: Record<string, string>): Promise<LocaleResult> {
    const report = emptyReport();
    const fail = (path: string, error: string): LocaleResult => ({ report: { ...report, failed: [...report.failed, { path, error }] } });

    if (!LOCALE_TAG.test(locale)) return fail("(file)", `"${locale}" is not a valid Locale tag (expected something like "es" or "pt-BR")`);

    const entries = flattenDictionary(deps.source);
    const existingText = decode(await deps.store.read(dictionaryPath(locale)));
    let exportName = exportNameFor(locale);
    const existing = new Map<string, string>();
    if (existingText !== null) {
        try {
            const parsed = parseDictionaryFile(existingText);
            exportName = parsed.exportName;
            for (const { path, text } of flattenDictionary(parsed.tree)) existing.set(path, text);
        } catch (error) {
            return fail("(file)", message(error));
        }
    }

    const nextHashes: Record<string, string> = {};
    const toTranslate: { path: string; text: string; regenerate: boolean }[] = [];
    for (const { path, text } of entries) {
        const hash = hashSourceText(text);
        const have = existing.get(path);
        if (have === undefined || have.trim() === "") {
            toTranslate.push({ path, text, regenerate: false });
        } else if (hashes[path] === undefined) {
            nextHashes[path] = hash;
            report.baselined.push(path);
        } else if (hashes[path] === hash) {
            nextHashes[path] = hash;
            report.unchanged.push(path);
        } else {
            nextHashes[path] = hashes[path];
            report.stale.push(path);
            if (deps.regenerateStale) toTranslate.push({ path, text, regenerate: true });
        }
    }

    // An existing file is only rewritten when it is exactly what Sync would have written,
    // otherwise adding a key would silently reformat the owner's file or drop their comments.
    if (existingText !== null && toTranslate.length > 0) {
        const preImage: DictionaryTree = {};
        for (const { path } of entries) if (existing.get(path)?.trim()) setPath(preImage, path, existing.get(path)!);
        if (renderDictionaryFile(exportName, preImage) !== existingText) {
            return fail(
                "(file)",
                `${dictionaryPath(locale)} is not in the generated format (comments, order, extra keys or odd formatting), so Sync will not rewrite it. ` +
                    `Add these by hand or reformat the file: ${toTranslate.map((t) => t.path).join(", ")}`,
            );
        }
    }

    const translated = new Map<string, string>();
    for (const item of toTranslate) {
        try {
            const text = (await deps.translator.translate(item.text, locale)).trim();
            if (text === "") throw new Error("the Translator returned an empty text");
            translated.set(item.path, text);
        } catch (error) {
            report.failed.push({ path: item.path, error: message(error) });
        }
    }
    if (report.failed.length > 0) {
        // Nothing of this Locale is written; the stale list stays as information.
        return { report: { ...report, baselined: [], unchanged: [] } };
    }

    const tree: DictionaryTree = {};
    for (const { path, text } of entries) {
        const value = translated.get(path) ?? existing.get(path)!;
        setPath(tree, path, value);
        if (translated.has(path)) nextHashes[path] = hashSourceText(text);
    }
    for (const item of toTranslate) (item.regenerate ? report.regenerated : report.generated).push(item.path);
    report.created = existingText === null;
    return { report, file: toTranslate.length > 0 ? renderDictionaryFile(exportName, tree) : undefined, hashes: nextHashes };
}

async function registerLocale(locale: string, store: FileStore, report: DictionaryLocaleReport): Promise<void> {
    const current = decode(await store.read(REGISTRY_PATH));
    const patched = current === null ? null : addToRegistry(current, locale);
    if (patched === null) {
        report.registry = "manual";
        report.registryLines = registryLines(locale);
    } else if (patched === current) {
        report.registry = "present";
    } else {
        await store.write(REGISTRY_PATH, encode(patched));
        report.registry = "added";
    }
}

/**
 * The Translations step of Sync. For each target Locale it translates only what
 * has no Translation yet (every entry for a Locale with no file), never changes
 * an existing Translation, and reports Stale ones; `regenerateStale` is the one
 * way to replace them. See ADR 0002.
 */
export async function syncTranslations(deps: TranslationsDeps): Promise<TranslationsReport> {
    const result: TranslationsReport = {};
    const locales = Array.from(new Set(deps.locales)).filter((locale) => locale !== deps.sourceLocale);

    let state: SyncState;
    const stateText = decode(await deps.store.read(SYNC_STATE_PATH));
    try {
        state = parseState(stateText);
    } catch (error) {
        for (const locale of locales) result[locale] = { ...emptyReport(), failed: [{ path: "(state)", error: message(error) }] };
        return result;
    }

    const nextState: SyncState = { ...state };
    for (const locale of locales) {
        let planned: LocaleResult;
        try {
            planned = await planLocale(locale, deps, state[locale] ?? {});
        } catch (error) {
            planned = { report: { ...emptyReport(), failed: [{ path: "(file)", error: message(error) }] } };
        }
        result[locale] = planned.report;
        if (planned.report.failed.length > 0 || !planned.hashes) continue;

        try {
            if (planned.file !== undefined) await deps.store.write(dictionaryPath(locale), encode(planned.file));
            await registerLocale(locale, deps.store, planned.report);
            nextState[locale] = planned.hashes;
        } catch (error) {
            planned.report.failed.push({ path: "(file)", error: message(error) });
        }
    }

    const rendered = renderState(nextState);
    if (rendered !== renderState(state) && Object.keys(nextState).length > 0) await deps.store.write(SYNC_STATE_PATH, encode(rendered));
    return result;
}
