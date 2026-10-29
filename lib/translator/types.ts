/** The language every piece of Source text is written in. */
export const SOURCE_LANGUAGE = "en";

/**
 * Turns English Source text into another Locale's language. Adapters (Gemini,
 * LibreTranslate) satisfy this, so Sync never knows which provider it uses.
 */
export interface Translator {
    /**
     * The Translation of `text` (English) into `locale`, a BCP 47 tag such as
     * `es` or `pt-BR`. Rejects with a message that tells the owner what to fix;
     * the message never contains a key.
     */
    translate(text: string, locale: string): Promise<string>;
}
