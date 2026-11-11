'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Locale, localePath } from '@/lib/locale'
import type { DictionaryEntry } from '@/dictionary/en'
import { deactivate, indexLabel, padNumber, rowState } from '@/lib/project-index'

export type ProjectIndexItem = {
    slug: string
    title: string
    /** The Project's tagline in the page's Locale, or null when it has none. */
    tagline: string | null
}

function ArrowUpRight() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7M8 7h9v9" />
        </svg>
    )
}

function ArrowUp() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V5M6 11l6-6 6 6" />
        </svg>
    )
}

/**
 * The Projects listing: breadcrumb, title with the count, intro, and one row per
 * Project (zero-padded index, title, circle arrow), then the bottom bar.
 * Hovering or keyboard-focusing a row makes it active: it then shows the
 * tagline, the "View project" label and a filled circle. Nothing needed to use
 * the page is hover-only: every row is a link, so touch devices just open it.
 * No Screenshots here.
 */
export default function ProjectIndex({ projects, locale, labels }: {
    projects: ProjectIndexItem[]
    locale: Locale
    labels: DictionaryEntry['Projects']
}) {
    const [active, setActive] = useState<string | null>(null)

    return (
        <div className="flex flex-1 flex-col text-black dark:text-white">
            <p className="mt-8 font-mono text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 md:mt-12 md:text-sm">{labels.Breadcrumb}</p>

            <div className="mt-4 flex flex-col gap-6 md:mt-6 md:flex-row md:items-end md:justify-between md:gap-10">
                <div className="flex items-start gap-2 md:gap-4">
                    <h1 className="text-5xl font-semibold leading-none tracking-tight sm:text-6xl md:text-7xl">{labels.Title}</h1>
                    <span className="font-mono text-base text-gray-600 dark:text-gray-400 md:mt-2 md:text-xl">
                        <span className="sr-only">{labels.CountLabel}: {projects.length}</span>
                        <span aria-hidden="true">({padNumber(projects.length)})</span>
                    </span>
                </div>
                <p className="max-w-xs text-base text-gray-600 dark:text-gray-400 md:mb-3 md:text-right md:text-base">{labels.Intro}</p>
            </div>

            <div className="mt-12 flex items-center justify-between border-b border-black/15 pb-4 font-mono text-xs uppercase tracking-wide text-gray-600 dark:border-white/15 dark:text-gray-400 md:mt-20 md:text-sm">
                <span>{labels.IndexLabel}</span>
                <span>{labels.Explore} <span aria-hidden="true">↙</span></span>
            </div>

            <ul>
                {projects.map((p, position) => {
                    const { active: isActive, tagline } = rowState(p, active)

                    return (
                        <li
                            key={p.slug}
                            className="animate-fade-up border-b border-black/15 dark:border-white/15"
                            style={{ animationDelay: `${Math.min(position, 8) * 70 + 100}ms` }}
                        >
                            <Link
                                href={localePath(locale, `/projects/${encodeURIComponent(p.slug)}`)}
                                onMouseEnter={() => setActive(p.slug)}
                                onMouseLeave={() => setActive((current) => deactivate(current, p.slug))}
                                onFocus={() => setActive(p.slug)}
                                onBlur={() => setActive((current) => deactivate(current, p.slug))}
                                className="flex items-center gap-4 py-6 transition-[padding] duration-300 ease-out md:gap-0 md:py-7"
                            >
                                <span className="w-8 shrink-0 font-mono text-xs text-gray-600 dark:text-gray-400 md:w-28 md:text-sm">{indexLabel(position)}</span>
                                <span className="min-w-0 flex-1">
                                    <span className={'block break-words text-2xl tracking-tight transition-transform duration-300 ease-out md:text-4xl ' + (isActive ? 'md:translate-x-4' : '')}>{p.title}</span>
                                    {tagline && <span className="animate-fade-up-sm mt-3 block text-sm text-gray-600 dark:text-gray-400 md:mt-4 md:text-base">{tagline}</span>}
                                </span>
                                <span className="flex shrink-0 items-center gap-5">
                                    {isActive && <span className="animate-fade-up-sm hidden text-sm text-gray-600 dark:text-gray-400 md:inline">{labels.ViewProject}</span>}
                                    <span aria-hidden="true" className={'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ease-out md:h-14 md:w-14 ' + (isActive
                                        ? 'scale-110 rotate-45 border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                        : 'border-black/25 dark:border-white/25')}>
                                        <ArrowUpRight />
                                    </span>
                                </span>
                            </Link>
                        </li>
                    )
                })}
            </ul>

            <div className="mt-auto flex items-center justify-between pb-8 pt-16 font-mono text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 md:pt-24 md:text-sm">
                <span>{labels.FooterBreadcrumb}</span>
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-3 normal-case tracking-normal text-black hover:underline dark:text-white md:text-base"
                >
                    {labels.BackToTop}
                    <ArrowUp />
                </button>
            </div>
        </div>
    )
}
