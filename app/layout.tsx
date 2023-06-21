import './globals.css'
import { Inter } from 'next/font/google'

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
      <body className={inter.className + " bg-gradient-to-b from-[#434343] to-[#000000]"}>
        <main className="flex flex-col h-full mx-4">
          <div className="flex justify-between mt-2 space-x-8 text-white">
            <div className="space-x-4">
              <a href="/">Home</a>
              <a href="/projects">Projects</a>
              <a href="/about">About</a>
            </div>
            <div className="space-x-4">
              <span>PT</span>
              <span>Light</span>
            </div>
          </div>
          {children}
        </main>
      </body>
    </html>
  )
}
