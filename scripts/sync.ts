import path from "node:path";
import { allowlist, githubOwner } from "@/projects.allowlist";
import { runSync } from "@/lib/sync";
import { createFileStore } from "@/lib/sync/file-store";
import { createGitHubScreenshots, SCREENSHOT_REPO_PATH } from "@/lib/sync/github-screenshots";

/** `pnpm sync`: the owner-run Sync job. Review the changes in `git diff` / `git status`, then commit. */
async function main(): Promise<number> {
    const token = process.env.GITHUB_TOKEN;
    const redact = (text: string) => (token ? text.split(token).join("***") : text);

    if (!token) {
        console.error("GITHUB_TOKEN is not set. Use the same read-only token as the site.");
        return 1;
    }
    if (allowlist.length === 0) {
        console.log("The Allowlist is empty (projects.allowlist.ts): nothing to sync.");
        return 0;
    }

    const report = await runSync({
        github: createGitHubScreenshots({ owner: githubOwner, token, apiUrl: process.env.GITHUB_API_URL }),
        store: createFileStore(path.join(process.cwd(), "public")),
        allowlist,
    });

    const { copied, unchanged, skipped, failed } = report.screenshots;
    console.log("Screenshots");
    console.log(`  copied:    ${copied.join(", ") || "-"}`);
    console.log(`  unchanged: ${unchanged.join(", ") || "-"}`);
    console.log(`  skipped (no ${SCREENSHOT_REPO_PATH}): ${skipped.join(", ") || "-"}`);
    for (const { repo, error } of failed) {
        console.error(`  FAILED ${repo}: ${redact(error)}`);
    }
    return failed.length > 0 ? 1 : 0;
}

main().then(
    (code) => {
        process.exitCode = code;
    },
    (error) => {
        console.error(`Sync crashed: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
    },
);
