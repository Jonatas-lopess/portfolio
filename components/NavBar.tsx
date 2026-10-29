'use client'

import Link from 'next/link'
import { getDictionary, Locale, localePath } from '@/lib/locale'
import ThemeSwitch from './ThemeSwitch'
import LocaleSwitch from './LocaleSwitch'

export default function NavBar({ lang }: { lang: Locale }) {
    const dictionary = getDictionary(lang)

    return (
    <div className="flex justify-between mt-2 space-x-8 dark:text-white">
        <div className="space-x-4">
        <Link href={localePath(lang, '/')}>{dictionary.NavBar.Home}</Link>
        <Link href={localePath(lang, '/projects')}>{dictionary.NavBar.Projects}</Link>
        <Link href={localePath(lang, '/about')}>{dictionary.NavBar.About}</Link>
        </div>
        <div className="flex space-x-4 items-center">
            <LocaleSwitch locale={lang} />
            <ThemeSwitch locale={lang} />
        </div>
    </div>
    )
}