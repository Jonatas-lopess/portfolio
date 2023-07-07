import './globals.css'
import { Inter } from 'next/font/google'
import ThemeSwitch from '@/components/ThemeSwitch'
import NavBar from '@/components/NavBar'

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

  return (
    <html lang="pt-br">
      <body className={inter.className + " bg-gradient-to-b dark:from-[#434343] dark:to-[#000000] from-[#ffffff] to-[#fff1e1]"}>
        <main className="flex flex-col min-h-screen mx-4">
          <ThemeSwitch>
            <NavBar />
            {children}
          </ThemeSwitch>
        </main>
      </body>
    </html>
  )
}
