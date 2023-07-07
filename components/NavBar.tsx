'use client'

import Light from '@/components/svg/Light'
import Dark from '@/components/svg/Dark'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import dictionary from '@/dictionary/content'

export default function NavBar({ lang }: { lang: string }) {
    const ICON_SIZE = 18
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    return (
    <div className="flex justify-between mt-2 space-x-8 dark:text-white">
        <div className="space-x-4">
        <a href="/">{dictionary[lang]?.NavBar.Home}</a>
        <a href="/projects">{dictionary[lang]?.NavBar.Projects}</a>
        <a href="/about">{dictionary[lang]?.NavBar.About}</a>
        </div>
        <div className="flex space-x-4 items-center">
        <span>{lang.toUpperCase()}</span>
        <span className='cursor-pointer h-min'>{
            mounted ?
                theme === 'dark'
                ? <Light onClick={() => setTheme('light')} height={ICON_SIZE} width={ICON_SIZE} className='dark:fill-white' />
                : <Dark onClick={() => setTheme('dark')} height={ICON_SIZE} width={ICON_SIZE}  className='dark:fill-white' />
            :
                null
        }</span>
        </div>
    </div>
    )
}