'use client'

import { usePathname, useRouter } from 'next/navigation'
import { getDictionary, isLocale, Locale, localeNames, locales, switchLocalePath } from '@/lib/locale'

export default function LocaleSwitch({ locale }: { locale: Locale }) {
    const pathname = usePathname()
    const router = useRouter()

    function handleChange(value: string) {
        if (isLocale(value) && value !== locale) router.push(switchLocalePath(pathname, value))
    }

    return (
        <div className="relative flex items-center">
            <select
                aria-label={getDictionary(locale).NavBar.Language}
                value={locale}
                onChange={(e) => handleChange(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent py-1 pr-5 text-black dark:text-white"
            >
                {locales.map((l) => (
                    <option key={l} value={l} lang={l} className="text-black">{localeNames[l]}</option>
                ))}
            </select>
            <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                width={14}
                height={14}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-0"
            >
                <path d="m6 9 6 6 6-6" />
            </svg>
        </div>
    )
}
