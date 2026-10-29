import ProfileLinks from "@/components/ProfileLinks";
import { getDictionary } from "@/lib/locale";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params

  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h3 className="text-xl text-gray-500 dark:text-gray-300">{getDictionary(lang).Home.Subtitle}</h3>
      <h1 className="text-7xl dark:text-white font-semibold mb-7">Jonatas Lopes</h1>
      <ProfileLinks variant="icons" lang={lang} />
    </div>
  )
}
