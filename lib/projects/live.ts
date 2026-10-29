import { allowlist, githubOwner } from "@/projects.allowlist";
import { createProjects } from "@/lib/projects";
import { createGitHubSource } from "@/lib/projects/github";
import { screenshotExists } from "@/lib/projects/screenshots";
import { createTranslationReader } from "@/lib/projects/translations";

const github = createGitHubSource({
    owner: githubOwner,
    // Server-only on purpose: no NEXT_PUBLIC_ prefix, so it never reaches client code.
    token: process.env.GITHUB_TOKEN,
    hasScreenshot: screenshotExists,
    apiUrl: process.env.GITHUB_API_URL,
});

/** The Projects module wired to the real Allowlist, GitHub and the committed files. Import from server code only. */
export const projects = createProjects({
    allowlist,
    source: { ...github, ...createTranslationReader() },
});
