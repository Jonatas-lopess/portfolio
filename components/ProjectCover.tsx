import Image from 'next/image'
import { coverLabels, fitScale, splitTitle } from '@/lib/projects/cover'

const frame = 'relative aspect-[4/3] w-full overflow-hidden border border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/5'
const mono = 'font-mono uppercase tracking-wide text-gray-500 dark:text-gray-400'

/**
 * The cover slot of the Project page. With a Screenshot it is the Screenshot in
 * a bordered frame; without one it is a generated typographic cover (grid, mono
 * corner labels, the title's first word large, the rest smaller, an arrow),
 * built only from the title, the position and the stack topics. Under it, a
 * mono caption row.
 *
 * The typographic cover (and its caption) is decorative: the title is already
 * the page's h1, so the whole figure is `aria-hidden`. Text sizes use container
 * query units (`cqw`) of the panel, so it scales with the column and never
 * depends on the viewport.
 */
export default function ProjectCover({ title, screenshot, label, position, total, topics }: {
    title: string
    /** Public path of the Screenshot, or null to show the typographic cover. */
    screenshot: string | null
    /** Right-hand caption (Dictionary `Project.CoverLabel`). */
    label: string
    /** 1-based place among the listed Projects, and how many there are. */
    position: number
    total: number
    /** GitHub topics (the stack); the first three feed the bottom corner labels. */
    topics: string[]
}) {
    const caption = (
        <figcaption className={`mt-4 flex justify-between gap-4 text-xs ${mono} normal-case`}>
            <span className="min-w-0 break-words">{title}</span>
            <span className="shrink-0 uppercase">{label}</span>
        </figcaption>
    )

    if (screenshot) {
        return (
            <figure>
                <div className={frame}>
                    <Image
                        alt={title}
                        src={screenshot}
                        fill
                        sizes="(min-width: 768px) 60vw, 100vw"
                        className="object-cover"
                    />
                </div>
                {caption}
            </figure>
        )
    }

    const { primary, secondary } = splitTitle(title)
    const labels = coverLabels({ title, position, total, topics })
    const grid = 'rgb(128 128 128 / 0.18)'

    return (
        <figure aria-hidden="true">
            <div className={`${frame} [container-type:inline-size] text-black dark:text-white`}>
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(to right, ${grid} 1px, transparent 1px), linear-gradient(to bottom, ${grid} 1px, transparent 1px)`,
                        backgroundSize: '12.5% 100%, 100% 25%',
                    }}
                />
                <div className="absolute inset-0 flex flex-col justify-between p-[4.5cqw]">
                    <div className={`flex justify-between gap-[2cqw] ${mono}`} style={{ fontSize: 'max(9px, 1.5cqw)' }}>
                        <span className="min-w-0 truncate">{labels.topLeft}</span>
                        <span className="shrink-0">{labels.topRight}</span>
                    </div>

                    <div className="flex items-end justify-between gap-[3cqw]">
                        <div className="min-w-0">
                            <p
                                className="break-words font-medium leading-[0.95] tracking-tight"
                                style={{ fontSize: `${17 * fitScale(primary, 7)}cqw` }}
                            >
                                {primary}
                            </p>
                            {secondary && (
                                <p
                                    className="mt-[1cqw] line-clamp-2 break-words font-light leading-none text-gray-500 dark:text-gray-400"
                                    style={{ fontSize: `${9.5 * fitScale(secondary, 12)}cqw` }}
                                >
                                    {secondary}
                                </p>
                            )}
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-[1cqw] h-[5cqw] w-[5cqw] shrink-0 text-gray-500 dark:text-gray-400">
                            <path d="M6 18 18 6M8 6h10v10" />
                        </svg>
                    </div>

                    <div className={`flex justify-between gap-[2cqw] ${mono}`} style={{ fontSize: 'max(9px, 1.5cqw)' }}>
                        <span className="min-w-0 truncate">{labels.bottomLeft}</span>
                        <span className="min-w-0 truncate text-right">{labels.bottomRight}</span>
                    </div>
                </div>
            </div>
            {caption}
        </figure>
    )
}
