export type ProjectNavigation = {
    /** 1-based place in Allowlist order. */
    position: number;
    total: number;
    /** The following Project's slug; wraps from the last to the first; null when it is the only Project. */
    next: string | null;
};

/** Where a Project sits among the listed slugs, or null when the slug is not listed. */
export function projectNavigation(slugs: string[], slug: string): ProjectNavigation | null {
    const index = slugs.indexOf(slug);
    if (index === -1) {
        return null;
    }

    return {
        position: index + 1,
        total: slugs.length,
        next: slugs.length > 1 ? slugs[(index + 1) % slugs.length] : null,
    };
}
