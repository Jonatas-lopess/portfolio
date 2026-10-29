export type ProjectNavigation = {
    /** 1-based place in Allowlist order. */
    position: number;
    total: number;
    /** The following Project's slug; wraps from the last to the first; null when it is the only Project. */
    next: string | null;
    /** 1-based position of `next`; null when `next` is. */
    nextPosition: number | null;
};

/** Where a Project sits among the listed slugs, or null when the slug is not listed. */
export function projectNavigation(slugs: string[], slug: string): ProjectNavigation | null {
    const index = slugs.indexOf(slug);
    if (index === -1) {
        return null;
    }

    const hasNext = slugs.length > 1;
    const nextIndex = (index + 1) % slugs.length;

    return {
        position: index + 1,
        total: slugs.length,
        next: hasNext ? slugs[nextIndex] : null,
        nextPosition: hasNext ? nextIndex + 1 : null,
    };
}
