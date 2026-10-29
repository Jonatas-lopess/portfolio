import type { DictionaryEntry } from "@/dictionary";
import { defaultLocale, type Locale } from "@/lib/locale";

/**
 * Locales that have their own CV file at `public/cv/<locale>.pdf`. A Locale not
 * listed here gets the default Locale's CV, so adding a Locale needs no CV.
 */
const cvLocales: readonly Locale[] = ["en", "pt-BR"];

/** Public path of the CV for a Locale, falling back to the default Locale's CV. */
export function cvPath(locale: Locale): string {
    return `/cv/${cvLocales.includes(locale) ? locale : defaultLocale}.pdf`;
}

/**
 * The owner's Profile links, defined exactly once. `components/ProfileLinks.tsx`
 * renders them; change a URL here and nowhere else.
 *
 * `name` is the accessible name for LinkedIn and GitHub: proper names, the same
 * in every Locale, so they are not in the Dictionary. The CV has no `name`
 * because its name is translated (`About.CVDownload` in the Dictionary), and no
 * `href` because the file depends on the Locale (`cvPath`); use `profileLinkName`
 * and `profileLinkHref` to get those for any link.
 */
export const profileLinks = [
    { id: "linkedin", href: "https://www.linkedin.com/in/jonatas-lopes-b6629a211", name: "LinkedIn", external: true },
    { id: "github", href: "https://github.com/Jonatas-lopess", name: "GitHub", external: true },
    { id: "cv", external: false },
] as const;

export type ProfileLink = (typeof profileLinks)[number];

export type ProfileLinkId = ProfileLink["id"];

/** The link's accessible name: its constant `name`, or the translated CV name. */
export function profileLinkName(link: ProfileLink, dictionary: DictionaryEntry): string {
    return "name" in link ? link.name : dictionary.About.CVDownload;
}

/** The link's URL for a Locale: its constant `href`, or the Locale's CV file. */
export function profileLinkHref(link: ProfileLink, locale: Locale): string {
    return "href" in link ? link.href : cvPath(locale);
}

/** Anchor attributes for the link: external links open in a new tab; the CV is a same-site file that downloads under a readable name. */
export function profileLinkAnchorProps(link: ProfileLink, locale: Locale): { target: "_blank"; rel: "noopener" } | { download: string } {
    return link.external ? { target: "_blank", rel: "noopener" } : { download: `Jonatas-Lopes-CV-${locale}.pdf` };
}
