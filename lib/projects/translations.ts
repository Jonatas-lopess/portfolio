import type { Locale } from "@/lib/locale";
import type { ProjectsSource, StoredTranslation } from "@/lib/projects/types";
import stored from "@/projects.translations.json";

/** The committed file that `pnpm sync` writes and the owner reviews. Repo root, next to `projects.allowlist.ts`. */
export const PROJECT_TRANSLATIONS_FILE = "projects.translations.json";

/**
 * `{ "<repo>": { "<locale>": { "text": string, "sourceHash": string, "tagline"?: { "text": string, "sourceHash": string } } } }`.
 * `text` and `sourceHash` are the Project summary: the hash is `hashSourceText` of the
 * Marked block the text was translated from. `tagline` is the Translation of the repo's
 * short description, with the hash of the (trimmed) description. Both are optional and
 * independent (an entry from before taglines has no `tagline`; a repo with a description
 * but no Marked block has only `tagline`). The Projects module shows each text only while
 * its live Source text still has the recorded hash.
 */
export type ProjectTranslationsFile = Record<string, Record<string, Partial<StoredTranslation> & { tagline?: StoredTranslation }>>;

const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** A usable entry has text and a hash. Anything else (hand-edited, incomplete) counts as no Translation. */
function entryOf(value: unknown): StoredTranslation | null {
    if (!isObject(value) || typeof value.text !== "string" || typeof value.sourceHash !== "string") return null;
    return { text: value.text, sourceHash: value.sourceHash };
}

/**
 * Reads Project summary and tagline Translations from the committed JSON file. The file is
 * imported statically, so it is part of the build and the site never reads the
 * filesystem at request time, whatever the host. `data` is for tests.
 */
export function createTranslationReader(data: unknown = stored): Pick<ProjectsSource, "getTranslation" | "getTaglineTranslation"> {
    if (!isObject(data)) {
        throw new Error(`${PROJECT_TRANSLATIONS_FILE} must be a JSON object keyed by repo name`);
    }

    /** The entry stored for a repo and Locale, if there is an object there. */
    function localeEntry(repo: string, locale: Locale): Record<string, unknown> | null {
        const byLocale = has(data as object, repo) ? (data as Record<string, unknown>)[repo] : undefined;
        if (!isObject(byLocale) || !has(byLocale, locale)) return null;
        const entry = byLocale[locale];
        return isObject(entry) ? entry : null;
    }

    return {
        async getTranslation(repo: string, locale: Locale) {
            return entryOf(localeEntry(repo, locale));
        },
        async getTaglineTranslation(repo: string, locale: Locale) {
            const entry = localeEntry(repo, locale);
            return entry !== null && has(entry, "tagline") ? entryOf(entry.tagline) : null;
        },
    };
}
