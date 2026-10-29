import { createHash } from "node:crypto";

/** SHA-256 hex digest of Source text. Stored Translations record this to detect staleness. */
export function hashSourceText(text: string): string {
    return createHash("sha256").update(text).digest("hex");
}
