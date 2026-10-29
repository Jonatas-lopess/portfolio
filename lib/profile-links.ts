/**
 * The owner's Profile links, defined exactly once. `components/ProfileLinks.tsx`
 * renders them; change a URL here and nowhere else.
 *
 * `name` is the accessible name for LinkedIn and GitHub: proper names, the same
 * in every Locale, so they are not in the Dictionary. The CV has no `name`
 * because its name is translated (`About.CVDownload` in the Dictionary).
 */
export const CV_PATH = "/curriculo-jonatas.pdf";

export const profileLinks = [
    { id: "linkedin", href: "https://www.linkedin.com/in/jonatas-lopes-b6629a211", name: "LinkedIn", external: true },
    { id: "github", href: "https://github.com/Jonatas-lopess", name: "GitHub", external: true },
    { id: "cv", href: CV_PATH, external: false },
] as const;

export type ProfileLinkId = (typeof profileLinks)[number]["id"];
