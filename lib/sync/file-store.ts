import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStore } from "@/lib/sync/types";

/**
 * A FileStore over a directory, normally `public/`. A public path such as
 * `/screenshots/alpha.png` lands at `<root>/screenshots/alpha.png`, which is
 * exactly where `screenshotExists` in `lib/projects/screenshots.ts` looks.
 */
export function createFileStore(root: string): FileStore {
    function resolve(publicPath: string): string {
        const file = path.resolve(root, `.${publicPath}`);
        if (!file.startsWith(path.resolve(root) + path.sep)) {
            throw new Error(`Refusing to touch ${publicPath}: it is outside ${root}`);
        }
        return file;
    }

    return {
        async read(publicPath) {
            try {
                return new Uint8Array(await readFile(resolve(publicPath)));
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
                throw error;
            }
        },
        async write(publicPath, bytes) {
            const file = resolve(publicPath);
            await mkdir(path.dirname(file), { recursive: true });
            await writeFile(file, bytes);
        },
    };
}
