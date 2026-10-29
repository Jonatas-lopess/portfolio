import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/lib/locale";
import { projects } from "@/lib/projects/live";
import { PROJECTS_CACHE_TAG } from "@/lib/projects/github";

/** Preferred header. The old name below has an underscore, which nginx and some proxies drop by default. */
const KEY_HEADER = "x-revalidate-key";
/** Deprecated: still accepted so existing callers keep working. */
const LEGACY_KEY_HEADER = "revalidate_key";

function sha256(value: string): Buffer {
    return createHash("sha256").update(value).digest();
}

/** Constant-time compare. An unset or empty expected key never matches anything. */
function isAuthorized(provided: string | null, expected: string | undefined): boolean {
    if (!expected || !provided) return false;
    return timingSafeEqual(sha256(provided), sha256(expected));
}

/**
 * Refreshes every Locale's Projects list and every Project page. The GitHub
 * fetches carry PROJECTS_CACHE_TAG, so the tag drops the cached responses and
 * the pages built from them; the concrete paths are listed as well because a
 * dynamic pattern like "/[lang]/projects" has no effect without a `type`.
 */
export async function POST(req: NextRequest | Request) {
    const provided = req.headers.get(KEY_HEADER) ?? req.headers.get(LEGACY_KEY_HEADER);

    if (!isAuthorized(provided, process.env.REVALIDATE_KEY)) {
        return NextResponse.json({ message: "Invalid key" }, { status: 401 });
    }

    try {
        const slugs = projects.listSlugs();
        const paths = locales.flatMap((locale) => [
            `/${locale}/projects`,
            ...slugs.map((slug) => `/${locale}/projects/${slug}`),
        ]);

        revalidateTag(PROJECTS_CACHE_TAG);
        for (const path of paths) {
            revalidatePath(path);
        }

        return NextResponse.json({ revalidated: true, tag: PROJECTS_CACHE_TAG, paths });
    } catch (error) {
        console.error("Error revalidating", error);
        return NextResponse.json("Error revalidating", { status: 500 });
    }
}
