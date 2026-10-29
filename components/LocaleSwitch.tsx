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
        <select
            aria-label={getDictionary(locale).NavBar.Language}
            value={locale}
            onChange={(e) => handleChange(e.target.value)}
            className="bg-transparent cursor-pointer dark:text-white"
        >
            {locales.map((l) => (
                <option key={l} value={l} lang={l} className="text-black">{localeNames[l]}</option>
            ))}
        </select>
    )
}
