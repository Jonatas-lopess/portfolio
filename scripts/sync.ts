import path from "node:path";
import { en } from "@/dictionary/en";
import { defaultLocale, localeNames, locales } from "@/lib/locale";
import { allowlist, githubOwner } from "@/projects.allowlist";
import { runSync } from "@/lib/sync";
import { createFileStore } from "@/lib/sync/file-store";
import { formatProjectTranslationsReport } from "@/lib/sync/format-project-translations";
import { formatTranslationsReport } from "@/lib/sync/format-translations";
import { createGitHubReadmes } from "@/lib/sync/github-readmes";
import { createGitHubScreenshots, SCREENSHOT_REPO_PATH } from "@/lib/sync/github-screenshots";
import { createTranslator, TranslatorConfigError } from "@/lib/translator";

const USAGE = "Usage: pnpm sync [--regenerate-stale]";

/**
 * `pnpm sync`: the owner-run Sync job. Copies Screenshots and generates missing
 * Dictionary and Project summary Translations. Review the changes in `git diff` / `git status`, then commit.
 * Exits 1 if any repo, Dictionary entry or Project summary failed.
 */
async function main(argv: string[]): Promise<number> {
    const unknown = argv.filter((arg) => arg !== "--regenerate-stale");
    if (unknown.length > 0) {
        console.error(`Unknown argument: ${unknown.join(" ")}\n${USAGE}`);
        return 1;
    }
    const regenerateStale = argv.includes("--regenerate-stale");

    const token = process.env.GITHUB_TOKEN;
    const secrets = [token, process.env.GEMINI_API_KEY, process.env.LIBRETRANSLATE_API_KEY].filter((s): s is string => !!s);
    const redact = (text: string) => secrets.reduce((out, secret) => out.split(secret).join("***"), text);

    if (allowlist.length > 0 && !token) {
        console.error("GITHUB_TOKEN is not set. Use the same read-only token as the site.");
        return 1;
    }

    let translator;
    try {
        translator = createTranslator(process.env);
    } catch (error) {
        if (!(error instanceof TranslatorConfigError)) throw error;
        console.error(error.message);
        return 1;
    }

    const report = await runSync({
        github: createGitHubScreenshots({ owner: githubOwner, token, apiUrl: process.env.GITHUB_API_URL }),
        store: createFileStore(path.join(process.cwd(), "public")),
        allowlist,
        translations: {
            translator,
            // Rooted at the repo, because the Dictionary lives in dictionary/, not public/.
            store: createFileStore(process.cwd()),
            source: en,
            sourceLocale: defaultLocale,
            locales,
            regenerateStale,
        },
        projectTranslations: {
            translator,
            readmes: createGitHubReadmes({ owner: githubOwner, token, apiUrl: process.env.GITHUB_API_URL }),
            // Rooted at the repo, because projects.translations.json sits next to projects.allowlist.ts.
            store: createFileStore(process.cwd()),
            sourceLocale: defaultLocale,
            locales,
            regenerateStale,
        },
    });

    let failures = 0;
    const { copied, unchanged, skipped, failed } = report.screenshots;
    console.log("Screenshots");
    if (allowlist.length === 0) console.log("  the Allowlist is empty (projects.allowlist.ts): nothing to copy");
    console.log(`  copied:    ${copied.join(", ") || "-"}`);
    console.log(`  unchanged: ${unchanged.join(", ") || "-"}`);
    console.log(`  skipped (no ${SCREENSHOT_REPO_PATH}): ${skipped.join(", ") || "-"}`);
    for (const { repo, error } of failed) {
        console.error(`  FAILED ${repo}: ${redact(error)}`);
    }
    failures += failed.length;

    if (report.translations) {
        const text = formatTranslationsReport(report.translations, redact);
        for (const line of text.lines) console.log(line);
        failures += text.failures;
    }

    if (report.projectTranslations) {
        const text = formatProjectTranslationsReport(report.projectTranslations, allowlist.length, redact);
        for (const line of text.lines) console.log(line);
        failures += text.failures;
    }

    const unnamed = locales.filter((locale) => !(locale in localeNames));
    for (const locale of unnamed) {
        console.log(`REQUIRED: add "${locale}" to localeNames in lib/locale/index.ts (its name in its own language, for the language switcher).`);
    }

    return failures > 0 ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => {
        process.exitCode = code;
    },
    (error) => {
        console.error(`Sync crashed: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
    },
);
