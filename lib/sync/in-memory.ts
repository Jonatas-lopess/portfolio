import type { FileStore } from "@/lib/sync/types";

/** A FileStore that keeps files in a Map. For tests. */
export function createMemoryStore(initial: Record<string, Uint8Array> = {}): FileStore & { files: Map<string, Uint8Array>; writes: string[] } {
    const files = new Map(Object.entries(initial));
    const writes: string[] = [];
    return {
        files,
        writes,
        async read(publicPath) {
            return files.get(publicPath) ?? null;
        },
        async write(publicPath, bytes) {
            writes.push(publicPath);
            files.set(publicPath, bytes);
        },
    };
}
