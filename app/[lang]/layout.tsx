import '../globals.css'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import Theme from '@/components/Theme'
import NavBar from '@/components/NavBar'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, locales, type Locale } from '@/lib/locale'

const inter = Inter({ subsets: ['latin'] })
// Labels (breadcrumbs, counts, chips): exposed to Tailwind as `font-mono` through --font-mono.
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

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
      <body className={inter.className + " " + mono.variable + " bg-gradient-to-b dark:from-[#434343] dark:to-[#000000] from-[#ffffff] to-[#fff1e1]"}>
        <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-5 md:px-10 lg:px-16">
          <Theme>
            <NavBar locale={locale} />
            {children}
          </Theme>
        </main>
      </body>
    </html>
  )
}
