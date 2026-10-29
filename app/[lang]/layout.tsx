import '../globals.css'
import { Inter } from 'next/font/google'
import Theme from '@/components/Theme'
import NavBar from '@/components/NavBar'
import type { Metadata } from 'next'
import { getDictionary, Locale } from '@/lib/locale'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { Title, Description } = getDictionary((await params).lang).Meta

  return { title: Title, description: Description }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{ lang: string }>
}) {
  const lang = (await params).lang as Locale // middleware guarantees a valid Locale prefix

  return (
    <html lang={lang}>
      <body className={inter.className + " bg-gradient-to-b dark:from-[#434343] dark:to-[#000000] from-[#ffffff] to-[#fff1e1]"}>
        <main className="flex flex-col min-h-screen mx-4">
          <Theme>
            <NavBar lang={lang} />
            {children}
          </Theme>
        </main>
      </body>
    </html>
  )
}
