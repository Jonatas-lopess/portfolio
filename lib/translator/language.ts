/**
 * An English name for a Locale tag (`pt-BR` gives "Brazilian Portuguese"), used in
 * prompts. Falls back to the tag when the runtime does not know it.
 */
export function languageName(tag: string): string {
    try {
        return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? tag;
    } catch {
        return tag;
    }
}
