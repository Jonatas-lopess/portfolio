'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getDictionary, Locale, localePath } from '@/lib/locale'
import { activeNavItem, type NavItem } from '@/lib/nav'
import ThemeSwitch from './ThemeSwitch'
import LocaleSwitch from './LocaleSwitch'

const links: { item: NavItem, path: string }[] = [
    { item: 'home', path: '/' },
    { item: 'projects', path: '/projects' },
    { item: 'about', path: '/about' },
]

const dictionaryKeys = { home: 'Home', projects: 'Projects', about: 'About' } as const

export default function NavBar({ locale }: { locale: Locale }) {
    const dictionary = getDictionary(locale)
    const active = activeNavItem(usePathname())

    return (
        <header className="flex flex-wrap items-center justify-between gap-x-4 border-b border-black/10 dark:border-white/15">
            <nav className="flex gap-4 text-sm md:gap-10 md:text-base">
                {links.map(({ item, path }) => {
                    const isActive = item === active

                    return (
                        <Link
                            key={item}
                            href={localePath(locale, path)}
                            aria-current={isActive ? 'page' : undefined}
                            className={'relative py-6 transition-colors md:py-7 ' + (isActive
                                ? 'font-medium text-black dark:text-white'
                                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white')}
                        >
                            {dictionary.NavBar[dictionaryKeys[item]]}
                            {isActive && <span aria-hidden="true" className="absolute bottom-3 left-0 h-0.5 w-5 bg-black dark:bg-white md:bottom-4" />}
                        </Link>
                    )
                })}
            </nav>
            <div className="flex items-center gap-3 text-sm text-black dark:text-white md:gap-5 md:text-base">
                <LocaleSwitch locale={locale} />
                <span aria-hidden="true" className="h-5 w-px bg-black/20 dark:bg-white/20" />
                <ThemeSwitch locale={locale} />
            </div>
        </header>
    )
}
