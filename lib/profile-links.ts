import type { DictionaryEntry } from "@/dictionary";

/** Public path of the CV file. It is the only link that is not external. */
export const CV_PATH = "/curriculo-jonatas.pdf";

/**
 * The owner's Profile links, defined exactly once. `components/ProfileLinks.tsx`
 * renders them; change a URL here and nowhere else.
 *
 * `name` is the accessible name for LinkedIn and GitHub: proper names, the same
 * in every Locale, so they are not in the Dictionary. The CV has no `name`
 * because its name is translated (`About.CVDownload` in the Dictionary); use
 * `profileLinkName` to get the right name for any link.
 */
export const profileLinks = [
    { id: "linkedin", href: "https://www.linkedin.com/in/jonatas-lopes-b6629a211", name: "LinkedIn", external: true },
    { id: "github", href: "https://github.com/Jonatas-lopess", name: "GitHub", external: true },
    { id: "cv", href: CV_PATH, external: false },
] as const;

export type ProfileLink = (typeof profileLinks)[number];

export type ProfileLinkId = ProfileLink["id"];

/** The link's accessible name: its constant `name`, or the translated CV name. */
export function profileLinkName(link: ProfileLink, dictionary: DictionaryEntry): string {
    return "name" in link ? link.name : dictionary.About.CVDownload;
}

/** Anchor attributes for the link: external links open in a new tab; the CV is a same-site file that downloads. */
export function profileLinkAnchorProps(link: ProfileLink): { target: "_blank"; rel: "noopener" } | { download: true } {
    return link.external ? { target: "_blank", rel: "noopener" } : { download: true };
}
