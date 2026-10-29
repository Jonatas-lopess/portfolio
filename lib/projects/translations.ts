import { ProjectsSource } from "@/lib/projects/types";

/**
 * Reads committed Translations of Project summaries. There are none yet, so
 * every Locale falls back to the Source text. Ticket 16 fills this in from the
 * files that Sync writes.
 */
export function createTranslationReader(): Pick<ProjectsSource, "getTranslation"> {
    return {
        async getTranslation() {
            return null;
        },
    };
}
