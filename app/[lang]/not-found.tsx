'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { defaultLocale, getDictionary, isLocale, localePath } from '@/lib/locale'

/**
 * Next gives `not-found.tsx` no params, so the Locale comes from the route
 * the boundary renders inside. `notFound()` from a Project page lands here
 * with the 404 status.
 */
export default function NotFound() {
    const { lang } = useParams<{ lang: string }>()
    const locale = isLocale(lang) ? lang : defaultLocale
    const dictionary = getDictionary(locale)

    return (
        <div className="flex flex-1 flex-col justify-center text-center dark:text-white">
            <h1 className="text-5xl font-semibold mb-7">{dictionary.ProjectInfo.NotFound}</h1>
            <Link href={localePath(locale, '/projects')} className="underline">{dictionary.ProjectInfo.BackToProjects}</Link>
        </div>
    )
}
