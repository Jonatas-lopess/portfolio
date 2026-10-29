/**
 * A function that replaces every occurrence of each secret with `***`. Anything
 * Sync prints that can carry an upstream error message goes through one of these.
 * Empty and undefined secrets are ignored.
 */
export function createRedact(secrets: readonly (string | undefined)[]): (text: string) => string {
    const present = secrets.filter((secret): secret is string => !!secret);
    return (text) => present.reduce((out, secret) => out.split(secret).join("***"), text);
}
