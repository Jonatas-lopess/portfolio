/** Pure helpers behind the generated typographic Project cover. Nothing here is per Project: all text comes from the title, the position and the topics. */

export type CoverTitle = {
    /** The first word, shown large. */
    primary: string;
    /** The remainder, shown smaller; empty for a single word. */
    secondary: string;
};

/** Splits a title at whitespace and underscores (`ai_harness` gives `ai` / `harness`). */
export function splitTitle(title: string): CoverTitle {
    const [primary = "", ...rest] = title.split(/[\s_]+/).filter(Boolean);
    return { primary, secondary: rest.join(" ") };
}

export type CoverLabels = {
    topLeft: string;
    topRight: string;
    /** The first two topics, or null without topics. */
    bottomLeft: string | null;
    /** The third topic, or null. */
    bottomRight: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function coverLabels({ title, position, total, topics }: {
    title: string;
    /** 1-based place among the listed Projects. */
    position: number;
    total: number;
    topics: string[];
}): CoverLabels {
    return {
        topLeft: title,
        topRight: `${pad(position)}–${pad(total)}`,
        bottomLeft: topics.length > 0 ? topics.slice(0, 2).join(" / ") : null,
        bottomRight: topics[2] ?? null,
    };
}

const MIN_SCALE = 0.3;

/** Factor (0.3 to 1) to apply to a font size so `text` fits: 1 up to `fitsAt` characters, then in proportion. */
export function fitScale(text: string, fitsAt: number): number {
    if (text.length <= fitsAt) {
        return 1;
    }
    return Math.max(MIN_SCALE, fitsAt / text.length);
}
