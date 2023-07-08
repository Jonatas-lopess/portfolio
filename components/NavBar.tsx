'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dictionary from '@/dictionary/content'
import ThemeSwitch from './ThemeSwitch'
import LocaleSwitch from './LocaleSwitch'

export default function NavBar({ lang }: { lang: string }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    return (
    <div className="flex justify-between mt-2 space-x-8 dark:text-white">
        <div className="space-x-4">
        <Link href={`${lang}/`}>{dictionary[lang]?.NavBar.Home}</Link>
        <Link href={`${lang}/projects`}>{dictionary[lang]?.NavBar.Projects}</Link>
        <Link href={`${lang}/about`}>{dictionary[lang]?.NavBar.About}</Link>
        </div>
        <div className="flex space-x-4 items-center">
            <LocaleSwitch locale={lang} />
            <span className='cursor-pointer h-min'>{
                mounted
                    ? <ThemeSwitch />
                    : null
            }</span>
        </div>
    </div>
    )
}