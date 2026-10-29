import type { Locale } from "@/lib/locale";
import type { ProjectsSource, StoredTranslation } from "@/lib/projects/types";
import stored from "@/projects.translations.json";

/** The committed file that `pnpm sync` writes and the owner reviews. Repo root, next to `projects.allowlist.ts`. */
export const PROJECT_TRANSLATIONS_FILE = "projects.translations.json";

/**
 * `{ "<repo>": { "<locale>": { "text": string, "sourceHash": string } } }`. The hash is
 * `hashSourceText` of the Marked block the text was translated from; the Projects
 * module shows the text only while the live Marked block still has that hash.
 */
export type ProjectTranslationsFile = Record<string, Record<string, StoredTranslation>>;

const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** A usable entry has text and a hash. Anything else (hand-edited, incomplete) counts as no Translation. */
function entryOf(value: unknown): StoredTranslation | null {
    if (!isObject(value) || typeof value.text !== "string" || typeof value.sourceHash !== "string") return null;
    return { text: value.text, sourceHash: value.sourceHash };
}

/**
 * Reads Project summary Translations from the committed JSON file. The file is
 * imported statically, so it is part of the build and the site never reads the
 * filesystem at request time, whatever the host. `data` is for tests.
 */
export function createTranslationReader(data: unknown = stored): Pick<ProjectsSource, "getTranslation"> {
    if (!isObject(data)) {
        throw new Error(`${PROJECT_TRANSLATIONS_FILE} must be a JSON object keyed by repo name`);
    }

    return {
        async getTranslation(repo: string, locale: Locale) {
            const byLocale = has(data, repo) ? data[repo] : undefined;
            if (!isObject(byLocale) || !has(byLocale, locale)) return null;
            return entryOf(byLocale[locale]);
        },
    };
}
