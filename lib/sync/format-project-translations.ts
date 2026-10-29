import type { ProjectTranslationRef, ProjectTranslationsReport } from "@/lib/sync/types";

const label = ({ repo, locale }: { repo: string; locale?: string }) => (locale ? `${repo} (${locale})` : repo);

/**
 * The Project summaries part of the Sync report as lines for the terminal.
 * `projectCount` is the size of the Allowlist, so an empty one gets a clear
 * "nothing to translate". Failures are grouped by message.
 */
export function formatProjectTranslationsReport(
    report: ProjectTranslationsReport,
    projectCount: number,
    redact: (text: string) => string = (t) => t,
): { lines: string[]; failures: number } {
    const lines: string[] = ["Project summaries"];
    let failures = 0;
    const list = (items: ProjectTranslationRef[]) => items.map(label).join(", ") || "-";

    if (projectCount === 0) {
        lines.push("  the Allowlist is empty (projects.allowlist.ts): nothing to translate");
        return { lines, failures };
    }

    if (report.generated.length) lines.push(`  generated:   ${list(report.generated)}`);
    if (report.regenerated.length) lines.push(`  regenerated: ${list(report.regenerated)}`);

    const keptStale = report.stale.filter((s) => !report.regenerated.some((r) => r.repo === s.repo && r.locale === s.locale));
    const known = keptStale.filter((s) => !s.unknownHash);
    const unknown = keptStale.filter((s) => s.unknownHash);
    if (known.length) {
        lines.push(`  STALE (the README's Marked block changed since translated; the site shows the English text; left as is, run \`pnpm sync --regenerate-stale\` to replace): ${list(known)}`);
    }
    if (unknown.length) {
        lines.push(`  STALE (no recorded hash, so it cannot be told whether the Marked block changed; the site shows the English text; left as is, run \`pnpm sync --regenerate-stale\` to replace): ${list(unknown)}`);
    }

    lines.push(`  unchanged:   ${report.unchanged.length}`);
    if (report.skipped.length) {
        lines.push(`  skipped (no Marked block in the README, so nothing to translate): ${report.skipped.join(", ")}`);
    }
    if (report.orphaned.length) {
        lines.push(`  note: projects.translations.json has entries for repos that are not on the Allowlist (left alone; delete them if unwanted): ${report.orphaned.join(", ")}`);
    }

    const byError = new Map<string, string[]>();
    for (const failure of report.failed) {
        const error = redact(failure.error);
        byError.set(error, [...(byError.get(error) ?? []), label(failure)]);
    }
    byError.forEach((entries, error) => {
        failures += entries.length;
        lines.push(`  FAILED ${entries.length} entr${entries.length === 1 ? "y" : "ies"} (${entries.join(", ")}): ${error}`);
    });
    if (report.failed.length) lines.push("  nothing was translated or written");

    return { lines, failures };
}
