const START = /<!--\s*portfolio:start\s*-->/;
const END = /<!--\s*portfolio:end\s*-->/;

/**
 * The text between the first start marker and the first end marker after it,
 * trimmed. Null when the README has no usable Marked block: missing or empty
 * markers, or a second start marker before the end.
 */
export function extractMarkedBlock(readme: string | null): string | null {
    if (readme === null) {
        return null;
    }

    const start = START.exec(readme);
    if (!start) {
        return null;
    }

    const afterStart = readme.slice(start.index + start[0].length);
    const end = END.exec(afterStart);
    if (!end) {
        return null;
    }

    const block = afterStart.slice(0, end.index);
    if (START.test(block)) {
        return null;
    }

    return block.trim() || null;
}
