/**
 * Public path of the image shown when a Project has no Screenshot. A module of
 * its own so client components can import it without pulling in `lib/projects`
 * (which imports `node:crypto`).
 */
export const SCREENSHOT_PLACEHOLDER = "/screenshot-placeholder.svg";
