import ProfileLinks from "@/components/ProfileLinks";
import Image from "next/image";
import Link from "next/link";
import { getDictionary, localePath, type Locale } from "@/lib/locale";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const locale = (await params).lang as Locale // middleware guarantees a valid Locale prefix
  const dictionary = getDictionary(locale)

  return (
    <div className="flex flex-1 flex-col justify-center pb-[4.5rem] text-center md:pb-20">
      <div className="animate-fade-up mb-6 flex justify-center">
        {/* Outer dashed ring, then a solid ring with a gap, then the photo (head and shoulders). */}
        <div className="rounded-full border border-dashed border-neutral-400 p-1.5 dark:border-neutral-500">
          <div className="rounded-full border-2 border-neutral-700 p-1 dark:border-neutral-200">
            <Image
              src="/profile.jpg"
              alt={dictionary.Home.PhotoAlt}
              width={2934}
              height={4482}
              sizes="160px"
              priority
              className="h-40 w-40 rounded-full object-cover object-[50%_43%]"
            />
          </div>
        </div>
      </div>
      <h3 className="animate-fade-up text-xl text-gray-500 dark:text-gray-300">{dictionary.Home.Subtitle}</h3>
      <h1 style={{ animationDelay: "100ms" }} className="animate-fade-up text-7xl dark:text-white font-semibold mb-7">Jonatas Lopes</h1>
      <p style={{ animationDelay: "200ms" }} className="animate-fade-up mx-auto mb-7 max-w-xl text-gray-600 dark:text-gray-300">{dictionary.Home.Intro}</p>
      <div style={{ animationDelay: "300ms" }} className="animate-fade-up mb-7">
        <Link
          href={localePath(locale, "/projects")}
          className="inline-block border border-current px-6 py-2 font-mono text-sm uppercase tracking-wide dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        >
          {dictionary.Home.ViewProjects}
        </Link>
      </div>
      <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
        <ProfileLinks variant="icons" locale={locale} />
      </div>
    </div>
  )
}
