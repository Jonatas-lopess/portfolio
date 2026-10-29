import { languageName } from "@/lib/translator/language";
import type { Translator } from "@/lib/translator/types";

/**
 * Default model: one of the models Google's pricing page lists as free of
 * charge on the Free Tier and recommends for new projects (checked 2026-10-29).
 * Override with GEMINI_MODEL when Google retires or renames it.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

const API_URL = "https://generativelanguage.googleapis.com/v1beta";
const MAX_ATTEMPTS = 3;
const MAX_WAIT_MS = 60_000;

export type GeminiOptions = {
    /** GEMINI_API_KEY. Server/owner-side only; never committed. */
    apiKey: string | undefined;
    model?: string;
    fetch?: typeof globalThis.fetch;
    /** Waits between retries of a rate-limited request. Injected so tests do not sleep. */
    sleep?: (ms: number) => Promise<void>;
};

function instructionFor(locale: string): string {
    return [
        `You are a translation engine. Translate the user's text from English into ${languageName(locale)} (${locale}).`,
        "Reply with only the translation: no extra commentary, no explanations, no quotes around it, no notes.",
        "Keep product names, proper names, code, file names, URLs, e-mail addresses and acronyms exactly as written.",
        "Keep placeholders such as {name}, %s, {{count}} and any HTML or Markdown markup unchanged.",
        "Keep the tone and register of the original. Do not add or drop information.",
    ].join("\n");
}

/** Seconds the API asked us to wait, from the Retry-After header or the error's `retryDelay` ("12s"). */
function requestedWaitMs(response: Response, body: any): number | undefined {
    const header = Number(response.headers.get("retry-after"));
    if (response.headers.get("retry-after") !== null && Number.isFinite(header)) return header * 1000;
    const details: any[] = Array.isArray(body?.error?.details) ? body.error.details : [];
    const delay = details.map((d) => d?.retryDelay).find((d) => typeof d === "string");
    const seconds = delay ? parseFloat(delay) : NaN;
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

/**
 * Gemini over REST (`generateContent`), no SDK. The key travels in the
 * `x-goog-api-key` header, never in the URL, and never appears in an error.
 * A missing key is reported on the first `translate`, not at construction, so a
 * Sync run that has nothing to translate does not need it.
 */
export function createGeminiTranslator(options: GeminiOptions): Translator {
    const model = options.model || DEFAULT_GEMINI_MODEL;
    const sleep = options.sleep ?? ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

    return {
        async translate(text, locale) {
            if (!options.apiKey) {
                throw new Error(
                    "GEMINI_API_KEY is not set. Create a free key in Google AI Studio and export it, " +
                        "or set TRANSLATOR=libretranslate to use a local LibreTranslate instead.",
                );
            }
            const request: RequestInit = {
                method: "POST",
                headers: { "content-type": "application/json", "x-goog-api-key": options.apiKey },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: instructionFor(locale) }] },
                    contents: [{ role: "user", parts: [{ text }] }],
                    generationConfig: { temperature: 0 },
                }),
            };
            const url = `${API_URL}/models/${encodeURIComponent(model)}:generateContent`;

            for (let attempt = 1; ; attempt++) {
                let response: Response;
                try {
                    response = await (options.fetch ?? globalThis.fetch)(url, request);
                } catch {
                    // The low-level reason is left out on purpose: it could echo request details.
                    throw new Error("Cannot reach Gemini (generativelanguage.googleapis.com); check the network");
                }
                const body: any = await response.json().catch(() => undefined);

                if (response.ok) return extractTranslation(body);

                const retryable = response.status === 429 || response.status === 503;
                if (retryable && attempt < MAX_ATTEMPTS) {
                    await sleep(Math.min(requestedWaitMs(response, body) ?? 1000 * 2 ** (attempt - 1), MAX_WAIT_MS));
                    continue;
                }
                const reason = typeof body?.error?.message === "string" ? `: ${body.error.message}` : "";
                throw new Error(`Gemini answered ${response.status}${reason}`);
            }
        },
    };
}

function extractTranslation(body: any): string {
    const blocked = body?.promptFeedback?.blockReason;
    if (blocked) throw new Error(`Gemini blocked the text (${blocked})`);

    const candidate = body?.candidates?.[0];
    const finish = candidate?.finishReason;
    if (finish && finish !== "STOP") throw new Error(`Gemini did not finish the translation (${finish})`);

    const parts: any[] = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("").trim();
    if (!text) throw new Error(`Gemini returned an empty translation`);
    return text;
}
