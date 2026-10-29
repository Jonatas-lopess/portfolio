import { SOURCE_LANGUAGE, type Translator } from "@/lib/translator/types";

export const DEFAULT_LIBRETRANSLATE_URL = "http://localhost:5000";

export type LibreTranslateOptions = {
    /** Base URL of the LibreTranslate server. */
    url?: string;
    /** Only needed for servers that require one. */
    apiKey?: string;
    fetch?: typeof globalThis.fetch;
};

/** The base URL without `user:password@`, safe to show in a message. */
function withoutUserinfo(url: string): string {
    try {
        const parsed = new URL(url);
        parsed.username = "";
        parsed.password = "";
        return parsed.href.replace(/\/+$/, "");
    } catch {
        return url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/?#]*@/i, "$1");
    }
}

/**
 * LibreTranslate's `POST /translate`. Meant for a local server, so text that
 * should not leave the owner's machine never does. LibreTranslate names a
 * language by its primary subtag, so `pt-BR` is sent as `pt`.
 */
export function createLibreTranslateTranslator(options: LibreTranslateOptions = {}): Translator {
    const base = (options.url || DEFAULT_LIBRETRANSLATE_URL).replace(/\/+$/, "");

    return {
        async translate(text, locale) {
            let response: Response;
            try {
                response = await (options.fetch ?? globalThis.fetch)(`${base}/translate`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        q: text,
                        source: SOURCE_LANGUAGE,
                        target: locale.split("-")[0],
                        format: "text",
                        ...(options.apiKey ? { api_key: options.apiKey } : {}),
                    }),
                });
            } catch {
                throw new Error(`Cannot reach LibreTranslate at ${withoutUserinfo(base)}; is the server running (LIBRETRANSLATE_URL)?`);
            }
            const body: any = await response.json().catch(() => undefined);
            if (!response.ok) {
                const reason = typeof body?.error === "string" ? `: ${body.error}` : "";
                throw new Error(`LibreTranslate answered ${response.status}${reason}`);
            }
            if (typeof body?.translatedText !== "string" || body.translatedText.trim() === "") {
                throw new Error("LibreTranslate answered without a translatedText");
            }
            return body.translatedText.trim();
        },
    };
}
