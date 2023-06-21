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
      <body className={inter.className + " bg-gradient-to-b from-[#434343] to-[#000000]"}>{children}</body>
    </html>
  )
}
