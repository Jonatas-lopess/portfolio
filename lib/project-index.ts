/** Pure logic of the Projects listing (`components/ProjectIndex.tsx`), kept here so it is unit-tested without a DOM. */

/** Two-digit zero-padded number ("04"); three digits from 100. Used for the count. */
export function padNumber(n: number): string {
    return String(n).padStart(2, "0");
}

/** Row label for a zero-based position: "01", "02", ... */
export function indexLabel(position: number): string {
    return padNumber(position + 1);
}

/** What a row shows: only the active row reveals its tagline, and a blank or missing one shows nothing. */
export function rowState(item: { slug: string; tagline: string | null }, activeSlug: string | null): { active: boolean; tagline: string | null } {
    const active = item.slug === activeSlug;
    const tagline = active && item.tagline && item.tagline.trim() !== "" ? item.tagline : null;

    return { active, tagline };
}

/** The next active slug when `slug` loses hover or focus: cleared only if it was the active one. */
export function deactivate(current: string | null, slug: string): string | null {
    return current === slug ? null : current;
}
