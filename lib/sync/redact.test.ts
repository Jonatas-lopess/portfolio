import { describe, expect, it } from "vitest";
import { createRedact } from "@/lib/sync/redact";

describe("redacting secrets from text", () => {
    it("replaces every occurrence of every secret", () => {
        const redact = createRedact(["ghp_abc", "AIza123"]);
        expect(redact("ghp_abc failed; ghp_abc and AIza123")).toBe("*** failed; *** and ***");
    });

    it("ignores unset and empty secrets instead of mangling the text", () => {
        expect(createRedact([undefined, ""])("keep as is")).toBe("keep as is");
    });
});
