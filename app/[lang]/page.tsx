import ProfileLinks from "@/components/ProfileLinks";
import { getDictionary, type Locale } from "@/lib/locale";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const locale = (await params).lang as Locale // middleware guarantees a valid Locale prefix
  const dictionary = getDictionary(locale)

  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h3 className="text-xl text-gray-500 dark:text-gray-300">{dictionary.Home.Subtitle}</h3>
      <h1 className="text-7xl dark:text-white font-semibold mb-7">Jonatas Lopes</h1>
      <ProfileLinks variant="icons" locale={locale} />
    </div>
  )
}
