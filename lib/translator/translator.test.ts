import { describe, expect, it } from "vitest";
import { createGeminiTranslator, createLibreTranslateTranslator, createTranslator, TranslatorConfigError } from "@/lib/translator";

type Call = { url: string; init: RequestInit; body: any };

/** A fake fetch that answers from a queue of responses and records every request. */
function fakeFetch(...answers: (Response | Error)[]) {
    const calls: Call[] = [];
    const fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {}, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        const next = answers.shift();
        if (!next) throw new Error("fake fetch: no answer left");
        if (next instanceof Error) throw next;
        return next;
    }) as typeof globalThis.fetch;
    return { fetch, calls };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const gemini = (text: string) => json({ candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }] });

describe("the Gemini Translator", () => {
    it("sends the text to generateContent with the key in a header and returns the model's text", async () => {
        const { fetch, calls } = fakeFetch(gemini("Hola"));
        const translator = createGeminiTranslator({ apiKey: "SECRET-KEY", model: "some-model", fetch });

        expect(await translator.translate("Hello", "es")).toBe("Hola");

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe("https://generativelanguage.googleapis.com/v1beta/models/some-model:generateContent");
        expect(calls[0].url).not.toContain("SECRET-KEY");
        expect((calls[0].init.headers as Record<string, string>)["x-goog-api-key"]).toBe("SECRET-KEY");
        expect(calls[0].body.contents[0].parts[0].text).toBe("Hello");
    });

    it("instructs the model to translate only, keep names/code/URLs/placeholders, and add nothing", async () => {
        const { fetch, calls } = fakeFetch(gemini("Hola"));
        await createGeminiTranslator({ apiKey: "k", fetch }).translate("Hello", "pt-BR");

        const instruction: string = calls[0].body.systemInstruction.parts[0].text;
        expect(instruction).toContain("Brazilian Portuguese");
        expect(instruction).toContain("pt-BR");
        expect(instruction).toMatch(/only the translation/i);
        expect(instruction).toMatch(/product names/i);
        expect(instruction).toMatch(/URLs/);
        expect(instruction).toMatch(/placeholders/i);
        expect(instruction).toMatch(/no (extra )?commentary|no explanations|do not add/i);
    });

    it("defaults to the documented free-tier model and honours the override", async () => {
        const a = fakeFetch(gemini("x"));
        await createGeminiTranslator({ apiKey: "k", fetch: a.fetch }).translate("Hello", "es");
        expect(a.calls[0].url).toContain("/models/gemini-3.5-flash-lite:generateContent");

        const b = fakeFetch(gemini("x"));
        await createGeminiTranslator({ apiKey: "k", model: "gemini-other", fetch: b.fetch }).translate("Hello", "es");
        expect(b.calls[0].url).toContain("/models/gemini-other:generateContent");
    });

    it("fails with a clear error naming GEMINI_API_KEY when the key is missing, without any request", async () => {
        const { fetch, calls } = fakeFetch();
        const translator = createGeminiTranslator({ apiKey: undefined, fetch });

        await expect(translator.translate("Hello", "es")).rejects.toThrow(/GEMINI_API_KEY is not set/);
        expect(calls).toEqual([]);
    });

    it("rejects an HTTP error with the status, never echoing the key", async () => {
        const { fetch } = fakeFetch(json({ error: { message: "API key not valid. Please pass a valid API key." } }, 400));
        const error = await createGeminiTranslator({ apiKey: "SECRET-KEY", fetch }).translate("Hello", "es").catch((e) => e);

        expect(error.message).toMatch(/Gemini answered 400/);
        expect(error.message).toContain("API key not valid");
        expect(error.message).not.toContain("SECRET-KEY");
    });

    it("rejects a network failure without leaking the low-level reason", async () => {
        const { fetch } = fakeFetch(new TypeError("fetch failed: https://x?key=SECRET-KEY"));
        const error = await createGeminiTranslator({ apiKey: "SECRET-KEY", fetch }).translate("Hello", "es").catch((e) => e);

        expect(error.message).toMatch(/Cannot reach Gemini/);
        expect(error.message).not.toContain("SECRET-KEY");
    });

    it("rejects a blocked prompt, an empty answer, and a truncated answer", async () => {
        const blocked = fakeFetch(json({ promptFeedback: { blockReason: "SAFETY" } }));
        await expect(createGeminiTranslator({ apiKey: "k", fetch: blocked.fetch }).translate("x", "es")).rejects.toThrow(/blocked.*SAFETY/i);

        const empty = fakeFetch(gemini("   "));
        await expect(createGeminiTranslator({ apiKey: "k", fetch: empty.fetch }).translate("x", "es")).rejects.toThrow(/empty/i);

        const cut = fakeFetch(json({ candidates: [{ content: { parts: [{ text: "Ho" }] }, finishReason: "MAX_TOKENS" }] }));
        await expect(createGeminiTranslator({ apiKey: "k", fetch: cut.fetch }).translate("x", "es")).rejects.toThrow(/MAX_TOKENS/);
    });

    it("retries a rate-limited request after the wait the API asks for, then gives up", async () => {
        const waits: number[] = [];
        const sleep = async (ms: number) => void waits.push(ms);

        const ok = fakeFetch(json({ error: { message: "quota" } }, 429, { "retry-after": "2" }), gemini("Hola"));
        const translator = createGeminiTranslator({ apiKey: "k", fetch: ok.fetch, sleep });
        expect(await translator.translate("Hello", "es")).toBe("Hola");
        expect(waits).toEqual([2000]);

        const never = fakeFetch(...[1, 2, 3, 4].map(() => json({ error: { message: "quota" } }, 429)));
        const error = await createGeminiTranslator({ apiKey: "k", fetch: never.fetch, sleep }).translate("Hello", "es").catch((e) => e);
        expect(error.message).toMatch(/Gemini answered 429/);
        expect(never.calls).toHaveLength(3);
    });

    it("trims whitespace the model wraps around its answer", async () => {
        const { fetch } = fakeFetch(gemini("\n Hola \n"));
        expect(await createGeminiTranslator({ apiKey: "k", fetch }).translate("Hello", "es")).toBe("Hola");
    });
});

describe("the LibreTranslate Translator", () => {
    it("posts plain text from English to the target language and returns translatedText", async () => {
        const { fetch, calls } = fakeFetch(json({ translatedText: "Hola" }));
        const translator = createLibreTranslateTranslator({ url: "http://localhost:5000/", fetch });

        expect(await translator.translate("Hello", "es")).toBe("Hola");
        expect(calls[0].url).toBe("http://localhost:5000/translate");
        expect(calls[0].body).toEqual({ q: "Hello", source: "en", target: "es", format: "text" });
    });

    it("uses the language part of a regional Locale", async () => {
        const { fetch, calls } = fakeFetch(json({ translatedText: "Olá" }));
        await createLibreTranslateTranslator({ url: "http://x", fetch }).translate("Hello", "pt-BR");
        expect(calls[0].body.target).toBe("pt");
    });

    it("sends the API key only when one is configured", async () => {
        const { fetch, calls } = fakeFetch(json({ translatedText: "a" }), json({ translatedText: "b" }));
        await createLibreTranslateTranslator({ url: "http://x", fetch }).translate("Hello", "es");
        await createLibreTranslateTranslator({ url: "http://x", apiKey: "LT-KEY", fetch }).translate("Hello", "es");
        expect(calls[0].body.api_key).toBeUndefined();
        expect(calls[1].body.api_key).toBe("LT-KEY");
    });

    it("reports the server's error and an unreachable server clearly", async () => {
        const bad = fakeFetch(json({ error: "xx is not supported" }, 400));
        await expect(createLibreTranslateTranslator({ url: "http://x", fetch: bad.fetch }).translate("a", "xx")).rejects.toThrow(
            /LibreTranslate answered 400.*xx is not supported/,
        );

        const down = fakeFetch(new TypeError("fetch failed"));
        await expect(createLibreTranslateTranslator({ url: "http://x", fetch: down.fetch }).translate("a", "es")).rejects.toThrow(
            /Cannot reach LibreTranslate at http:\/\/x/,
        );
    });

    it("rejects an answer with no translatedText", async () => {
        const { fetch } = fakeFetch(json({}));
        await expect(createLibreTranslateTranslator({ url: "http://x", fetch }).translate("a", "es")).rejects.toThrow(/translatedText/);
    });
});

describe("choosing a Translator by configuration", () => {
    it("defaults to Gemini and reads the key and model from the environment", async () => {
        const { fetch, calls } = fakeFetch(gemini("Hola"));
        const translator = createTranslator({ GEMINI_API_KEY: "k", GEMINI_MODEL: "m1" }, fetch);

        expect(await translator.translate("Hello", "es")).toBe("Hola");
        expect(calls[0].url).toContain("generativelanguage.googleapis.com");
        expect(calls[0].url).toContain("/models/m1:");
    });

    it("selects LibreTranslate with TRANSLATOR=libretranslate and its URL, defaulting to localhost:5000", async () => {
        const a = fakeFetch(json({ translatedText: "Hola" }));
        await createTranslator({ TRANSLATOR: "libretranslate" }, a.fetch).translate("Hello", "es");
        expect(a.calls[0].url).toBe("http://localhost:5000/translate");

        const b = fakeFetch(json({ translatedText: "Hola" }));
        await createTranslator({ TRANSLATOR: "libretranslate", LIBRETRANSLATE_URL: "http://lt:9", LIBRETRANSLATE_API_KEY: "K" }, b.fetch).translate("Hello", "es");
        expect(b.calls[0].url).toBe("http://lt:9/translate");
        expect(b.calls[0].body.api_key).toBe("K");
    });

    it("rejects an unknown TRANSLATOR value listing the valid ones", () => {
        expect(() => createTranslator({ TRANSLATOR: "deepl" })).toThrow(TranslatorConfigError);
        expect(() => createTranslator({ TRANSLATOR: "deepl" })).toThrow(/gemini.*libretranslate/);
    });

    it("surfaces a missing Gemini key when the first text is translated", async () => {
        await expect(createTranslator({}).translate("Hello", "es")).rejects.toThrow(/GEMINI_API_KEY is not set/);
    });
});
