import Download from "@/components/svg/Download";
import Github from "@/components/svg/Github";
import Linkedin from "@/components/svg/Linkedin";
import { getDictionary } from "@/lib/locale";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const ICON_SIZE = 36

  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h3 className="text-xl text-gray-500 dark:text-gray-300">{getDictionary(lang).Home.Subtitle}</h3>
      <h1 className="text-7xl dark:text-white font-semibold mb-7">Jonatas Lopes</h1>
      <div className="flex space-x-2 justify-center">
        <a href="https://www.linkedin.com/in/jonatas-lopes-b6629a211" target="_blank" rel="noopener"><Linkedin  width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" /></a>
        <a href="https://github.com/Jonatas-lopess" target="_blank" rel="noopener"><Github width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" /></a>
        <a href="/curriculo-jonatas.pdf" download><Download width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" /></a>
      </div>
    </div>
  )
}
