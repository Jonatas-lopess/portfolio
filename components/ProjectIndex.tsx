'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Locale, localePath } from '@/lib/locale'

export type ProjectIndexItem = {
    slug: string
    title: string
    /** Public path of the Screenshot, or null to show the placeholder. */
    screenshot: string | null
}

const PLACEHOLDER = '/screenshot-placeholder.svg'

/**
 * The Project index: the list of Project names, which reveals the active
 * Project's Screenshot. Hovering or keyboard-focusing a name makes it active.
 * The images are hidden below the `md` breakpoint (there is no room beside the
 * list); the links are always there, so touch devices simply open the Project.
 */
export default function ProjectIndex({ projects, locale, heading, countLabel }: {
    projects: ProjectIndexItem[]
    locale: Locale
    heading: string
    countLabel: string
}) {
    const [active, setActive] = useState<string | null>(null)

    return (
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full dark:text-white mt-20">
            <div className="w-full space-y-10 capitalize">
                <div className="flex justify-between border-b border-black dark:border-white text-5xl">
                    <h1 className='font-semibold'>{heading}</h1>
                    <span><span className="sr-only">{countLabel}: </span>{projects.length}</span>
                </div>
                <ul className="space-y-3 text-black dark:text-white text-opacity-25 dark:text-opacity-25 text-3xl">
                    {projects.map((p) => (
                        <li
                            key={p.slug}
                            className={`hover:text-black dark:hover:text-white hover:text-opacity-100 focus-within:text-black dark:focus-within:text-white focus-within:text-opacity-100 hover:translate-x-3 focus-within:translate-x-3 duration-200 cursor-pointer ${active === p.slug ? 'text-black dark:text-white text-opacity-100' : ''}`}
                            onMouseEnter={() => setActive(p.slug)}
                            onMouseLeave={() => setActive((current) => (current === p.slug ? null : current))}
                        >
                            <Link
                                href={localePath(locale, `/projects/${encodeURIComponent(p.slug)}`)}
                                onFocus={() => setActive(p.slug)}
                                onBlur={() => setActive((current) => (current === p.slug ? null : current))}
                            >
                                {p.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="w-full max-h-[50rem] col-span-2 relative invisible md:visible mx-2 mb-4">
                {projects.map((p) => (
                    <Image
                        key={p.slug}
                        alt={p.title}
                        src={p.screenshot ?? PLACEHOLDER}
                        fill
                        sizes="(min-width: 768px) 66vw, 0px"
                        aria-hidden={active !== p.slug}
                        className={`absolute object-fill transition-opacity duration-700 rounded ${active === p.slug ? 'opacity-100' : 'opacity-0'}`}
                    />
                ))}
            </div>
        </div>
    )
}
