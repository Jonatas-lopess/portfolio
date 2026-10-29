import { stripLocalePrefix } from "@/lib/locale";

export type NavItem = "home" | "projects" | "about";

/**
 * The header link a path belongs to, in any Locale: Home is the Locale root,
 * Projects covers the listing and every Project page under it, About is its
 * page. Any other path marks nothing.
 */
export function activeNavItem(pathname: string | null): NavItem | null {
    if (pathname === null) return null;
    const segments = stripLocalePrefix(pathname).split("/").filter(Boolean);
    const [first, ...rest] = segments;

    if (first === undefined) return "home";
    if (first === "projects") return "projects";
    if (first === "about" && rest.length === 0) return "about";
    return null;
}
