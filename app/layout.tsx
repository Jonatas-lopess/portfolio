'use client'

import Light from '@/components/svg/Light'
import './globals.css'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import Dark from '@/components/svg/Dark'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Jonatas Lopes - Portfolio',
  description: 'Conheça minha carreira na área da programação, são 6 anos de estudo e mais de 1 ano de experiência no mercado.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ICON_SIZE = 18
  const [theme, setTheme] = useState(sessionStorage.theme === 'dark' || (!('theme' in sessionStorage)) && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '')

  useEffect(() => {
    if(!('theme' in sessionStorage)) sessionStorage.setItem('theme', theme)
    if(sessionStorage.theme !== theme) sessionStorage.theme = theme
  }, [theme])

  return (
    <html lang="pt-br" className={theme}>
      <body className={inter.className + " bg-gradient-to-b dark:from-[#434343] dark:to-[#000000] from-[#ffffff] to-[#fff1e1]"}>
        <main className="flex flex-col h-full mx-4">
          <div className="flex justify-between mt-2 space-x-8 dark:text-white">
            <div className="space-x-4">
              <a href="/">Home</a>
              <a href="/projects">Projects</a>
              <a href="/about">About</a>
            </div>
            <div className="flex space-x-4 items-center">
              <span>PT</span>
              <span onClick={() => setTheme(prev => (prev === 'dark' ? '' : 'dark'))} className='cursor-pointer h-min'>{
                theme === 'dark'
                  ? <Light height={ICON_SIZE} width={ICON_SIZE} className='dark:fill-white' />
                  : <Dark height={ICON_SIZE} width={ICON_SIZE} />
              }</span>
            </div>
          </div>
          {children}
        </main>
      </body>
    </html>
  )
}
