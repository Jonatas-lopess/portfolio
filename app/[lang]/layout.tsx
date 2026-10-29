import '../globals.css'
import { Inter } from 'next/font/google'
import Theme from '@/components/Theme'
import NavBar from '@/components/NavBar'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, locales, type Locale } from '@/lib/locale'

const inter = Inter({ subsets: ['latin'] })

// The middleware leaves static-file paths unprefixed, so an unknown file such as
// /old-name.pdf matches [lang]; the layout turns that into a 404 below. Do not use
// `export const dynamicParams = false` for this: with it, on-demand revalidation
// (POST /api/revalidate) makes every revalidated page answer 404 (NoFallbackError
// in Next 15.5) until the next deploy.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

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
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang

  return (
    <html lang={locale}>
      <body className={inter.className + " bg-gradient-to-b dark:from-[#434343] dark:to-[#000000] from-[#ffffff] to-[#fff1e1]"}>
        <main className="flex flex-col min-h-screen mx-4">
          <Theme>
            <NavBar locale={locale} />
            {children}
          </Theme>
        </main>
      </body>
    </html>
  )
}
