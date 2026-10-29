/**
 * The tagline's Source text: the repo's short GitHub description, trimmed. Null when
 * the repo has none or it is blank. The Projects module and Sync both go through
 * this, so the hash Sync records is the hash the site compares.
 */
export function taglineSourceText(description: string | null): string | null {
    return description?.trim() || null;
}
