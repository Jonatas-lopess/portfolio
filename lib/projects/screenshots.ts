import { access } from "node:fs/promises";
import path from "node:path";
import { screenshotPath } from "@/lib/projects";

/**
 * Whether this repo's public folder holds the Project's Screenshot. Sync
 * (ticket 07) is what copies Screenshots there, so the file in `public/` is the
 * source of truth for whether the site can show one; the GitHub repo is not asked.
 *
 * It reads the filesystem, so it relies on `public/` being present beside the
 * running server (true for `next build` and `next start`). A host that serves
 * `public/` from a CDN only and leaves it out of the server bundle would report
 * every Screenshot missing.
 */
export async function screenshotExists(slug: string): Promise<boolean> {
    const file = path.join(process.cwd(), "public", screenshotPath(slug));
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
}
