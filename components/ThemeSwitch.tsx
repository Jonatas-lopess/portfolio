'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Light from '@/components/svg/Light'
import Dark from '@/components/svg/Dark'
import { getDictionary, Locale } from '@/lib/locale'

const ICON_SIZE = 18

/**
 * A toggle button named "Dark theme" whose `aria-pressed` says whether dark is
 * active. The icon shows the theme a press switches to.
 *
 * The active theme is only known in the browser, so until mount the button is
 * rendered with an empty icon box of the same size and no `aria-pressed`: the
 * server and the first client render match, nothing shifts when the icon
 * arrives, and the named button is already in the server HTML.
 */
export default function ThemeSwitch({ locale }: { locale: Locale }) {
    const [mounted, setMounted] = useState(false)
    const { resolvedTheme, setTheme } = useTheme()

    useEffect(() => setMounted(true), [])

    const isDark = mounted && resolvedTheme === 'dark'

    return (
        <button
            type="button"
            aria-label={getDictionary(locale).NavBar.DarkTheme}
            aria-pressed={mounted ? isDark : undefined}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className='block cursor-pointer'
        >
            {mounted
                ? isDark
                    ? <Light aria-hidden='true' focusable='false' height={ICON_SIZE} width={ICON_SIZE} className='block dark:fill-white' />
                    : <Dark aria-hidden='true' focusable='false' height={ICON_SIZE} width={ICON_SIZE} className='block dark:fill-white' />
                : <span aria-hidden='true' className='block' style={{ height: ICON_SIZE, width: ICON_SIZE }} />}
        </button>
    )
}
