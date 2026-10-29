import dictionary from "@/dictionary/content";

/** Every Locale the site is presented in. Adding a Locale starts here. */
export const locales = ["en", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

/** The Locale used when nothing better is known; it is also the Source text's language. */
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
    return (locales as readonly string[]).includes(value);
}

function primarySubtag(tag: string): string {
    return tag.split("-")[0];
}

/**
 * The best supported Locale for an Accept-Language header value. Underscores
 * count as hyphens, matching ignores case, and a regional or bare tag matches
 * a supported Locale of the same language. Anything else gives the default.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
    const requested = (acceptLanguage ?? "")
        .split(",")
        .map((part, position) => {
            const [tag, ...params] = part.trim().split(";");
            const qParam = params.map((p) => p.trim().toLowerCase()).find((p) => p.startsWith("q="));
            const q = qParam === undefined ? 1 : Number(qParam.slice(2));
            return { tag: tag.trim().replaceAll("_", "-").toLowerCase(), q: Number.isNaN(q) ? 1 : q, position };
        })
        .filter(({ tag, q }) => tag !== "" && tag !== "*" && q > 0)
        .sort((a, b) => b.q - a.q || a.position - b.position);

    for (const { tag } of requested) {
        const match =
            locales.find((locale) => locale.toLowerCase() === tag) ??
            locales.find((locale) => primarySubtag(locale.toLowerCase()) === primarySubtag(tag));
        if (match) return match;
    }

    return defaultLocale;
}

/** Whether a path's first segment is a supported Locale. */
export function hasLocalePrefix(path: string): boolean {
    return prefixLocale(path) !== undefined;
}

function prefixLocale(path: string): Locale | undefined {
    return locales.find((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`));
}

/** The absolute path to `path` in a Locale. `path` must not already carry a Locale prefix. */
export function localePath(locale: Locale, path: string): string {
    const rest = path.replace(/^\/+/, "");
    return rest === "" ? `/${locale}` : `/${locale}/${rest}`;
}

/** The same page in another Locale, whether or not `path` carries a Locale prefix. */
export function switchLocalePath(path: string, locale: Locale): string {
    const current = prefixLocale(path);
    return localePath(locale, current ? path.slice(current.length + 1) : path);
}

/** The Dictionary for a Locale, or the English one when `locale` is not supported. */
export function getDictionary(locale: string): DictionaryEntry {
    return dictionary[isLocale(locale) ? locale : defaultLocale];
}
