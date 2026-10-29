import type { AllowlistEntry } from "@/lib/projects/types";

/** The Allowlist without repeated repos: the first entry for a repo wins. */
export function dedupeAllowlist(entries: AllowlistEntry[]): AllowlistEntry[] {
    return entries.filter((entry, i) => entries.findIndex((e) => e.repo === entry.repo) === i);
}
