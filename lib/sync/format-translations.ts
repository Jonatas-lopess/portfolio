import type { TranslationsReport } from "@/lib/sync/types";

/**
 * The Translations part of the Sync report as lines for the terminal. Failures
 * are grouped by message, because one cause (a missing key, an unreachable
 * server) usually fails every entry the same way.
 */
export function formatTranslationsReport(report: TranslationsReport, redact: (text: string) => string = (t) => t): { lines: string[]; failures: number } {
    const lines: string[] = [];
    let failures = 0;
    const list = (items: string[]) => items.join(", ") || "-";

    for (const [locale, r] of Object.entries(report)) {
        lines.push(`Dictionary ${locale}${r.created ? " (new file dictionary/" + locale + ".ts)" : ""}`);
        if (r.generated.length) lines.push(`  generated:   ${list(r.generated)}`);
        if (r.regenerated.length) lines.push(`  regenerated: ${list(r.regenerated)}`);
        const keptStale = r.stale.filter((path) => !r.regenerated.includes(path));
        if (keptStale.length) {
            lines.push(`  STALE (English changed since translated; left as is, run \`pnpm sync --regenerate-stale\` to replace): ${list(keptStale)}`);
        }
        if (r.baselined.length) {
            lines.push(`  baselined ${r.baselined.length} existing Translation(s): recorded the current English text as what they were made from`);
        }
        if (r.failed.length === 0) lines.push(`  unchanged:   ${r.unchanged.length}`);

        if (r.registry === "added") lines.push("  registry:    added to dictionary/index.ts");
        if (r.registry === "manual") {
            lines.push("  REQUIRED: add these lines to dictionary/index.ts (Sync could not patch it):");
            for (const line of r.registryLines ?? []) lines.push(`    ${line}`);
        }

        const byError = new Map<string, string[]>();
        for (const { path, error } of r.failed) byError.set(redact(error), [...(byError.get(redact(error)) ?? []), path]);
        byError.forEach((paths, error) => {
            failures += paths.length;
            lines.push(`  FAILED ${paths.length} entr${paths.length === 1 ? "y" : "ies"} (${paths.join(", ")}): ${error}`);
        });
        if (r.failed.length) lines.push("  nothing of this Locale was written");
    }
    return { lines, failures };
}
