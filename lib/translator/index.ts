import { createGeminiTranslator } from "@/lib/translator/gemini";
import { createLibreTranslateTranslator } from "@/lib/translator/libretranslate";
import type { Translator } from "@/lib/translator/types";

export type { Translator } from "@/lib/translator/types";
export { SOURCE_LANGUAGE } from "@/lib/translator/types";
export { createGeminiTranslator, DEFAULT_GEMINI_MODEL } from "@/lib/translator/gemini";
export { createLibreTranslateTranslator, DEFAULT_LIBRETRANSLATE_URL } from "@/lib/translator/libretranslate";
export { languageName } from "@/lib/translator/language";

export class TranslatorConfigError extends Error {}

/** The environment variables that configure the Translator (any other variable is ignored). */
export type TranslatorEnv = Readonly<Record<string, string | undefined>> & {
    /** `gemini` (default) or `libretranslate`. */
    TRANSLATOR?: string;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    LIBRETRANSLATE_URL?: string;
    LIBRETRANSLATE_API_KEY?: string;
};

/** The configured Translator. The adapters are swapped by `TRANSLATOR` alone. */
export function createTranslator(env: TranslatorEnv, fetch?: typeof globalThis.fetch): Translator {
    const choice = (env.TRANSLATOR || "gemini").trim().toLowerCase();
    if (choice === "gemini") {
        return createGeminiTranslator({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, fetch });
    }
    if (choice === "libretranslate") {
        return createLibreTranslateTranslator({ url: env.LIBRETRANSLATE_URL, apiKey: env.LIBRETRANSLATE_API_KEY, fetch });
    }
    throw new TranslatorConfigError(`TRANSLATOR must be "gemini" or "libretranslate", not "${env.TRANSLATOR}"`);
}
