import { describe, expect, it } from "vitest";
import { formatTranslationsReport } from "@/lib/sync/format-translations";
import type { DictionaryLocaleReport } from "@/lib/sync/types";

const base: DictionaryLocaleReport = { created: false, generated: [], regenerated: [], stale: [], baselined: [], unchanged: [], failed: [], registry: "present" };

describe("the Translations report as text", () => {
    it("groups failures with the same cause, redacts secrets and counts them", () => {
        const { lines, failures } = formatTranslationsReport(
            { es: { ...base, failed: [{ path: "A", error: "bad KEY1" }, { path: "B", error: "bad KEY1" }, { path: "C", error: "other" }] } },
            (t) => t.replace("KEY1", "***"),
        );
        expect(failures).toBe(3);
        expect(lines).toContain("  FAILED 2 entries (A, B): bad ***");
        expect(lines).toContain("  FAILED 1 entry (C): other");
        expect(lines.join("\n")).not.toContain("KEY1");
    });

    it("names the flag next to Stale translations and the registry lines that are a manual step", () => {
        const { lines, failures } = formatTranslationsReport({
            es: { ...base, stale: ["A.B"], registry: "manual", registryLines: ['import { es } from "./es";', "    es,"] },
        });
        expect(failures).toBe(0);
        expect(lines.join("\n")).toContain("--regenerate-stale");
        expect(lines.join("\n")).toContain('import { es } from "./es";');
    });

    it("says the file was written when only the final state update failed", () => {
        const { lines } = formatTranslationsReport({ es: { ...base, regenerated: ["A"], failed: [{ path: "(state)", error: "disk full" }] } });
        expect(lines.join("\n")).toContain("the new hashes were not");
        expect(lines.join("\n")).not.toContain("nothing of this Locale was written");
    });
});
