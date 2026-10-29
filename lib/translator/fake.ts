import type { Translator } from "@/lib/translator/types";

/**
 * A Translator for tests: every answer is `[<locale>] <text>`, every request is
 * recorded, and chosen texts can be made to fail.
 */
export function createFakeTranslator(options: { failOn?: string[] } = {}): Translator & { requests: { text: string; locale: string }[] } {
    const requests: { text: string; locale: string }[] = [];
    return {
        requests,
        async translate(text, locale) {
            requests.push({ text, locale });
            if (options.failOn?.includes(text)) throw new Error(`fake translator refused: ${text}`);
            return `[${locale}] ${text}`;
        },
    };
}
