import Image from 'next/image'
import ListItem from '@/components/ListItem'
import { projects } from '@/lib/projects/live'
import { getDictionary, Locale, locales } from '@/lib/locale'

export const revalidate = 3600

export function generateStaticParams() {
    return locales.map((lang) => ({ lang }))
}

export default async function Projects({ params }: { params: Promise<{ lang: string }> }) {
    const lang = (await params).lang as Locale // middleware guarantees a valid Locale prefix
    const list = await projects.listProjects(lang);

    return (
            <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full dark:text-white mt-20">
                <div className="w-full space-y-10 capitalize">
                    <div className="flex justify-between border-b border-black dark:border-white text-5xl">
                        <h1 className='font-semibold'>{getDictionary(lang).Projects.Title}</h1>
                        <span>{list.length}</span>
                    </div>
                    <ul id="list-itens" className="space-y-3 text-black dark:text-white text-opacity-25 dark:text-opacity-25 text-3xl" >
                        {
                            list.map((p) => <ListItem key={p.slug} locale={lang} data={{ slug: p.slug, title: p.title }} />)
                        }
                    </ul>
                </div>
                <div id="list-images" className="w-full max-h-[50rem] col-span-2 relative invisible md:visible mx-2 mb-4">
                    {
                        /* ListItem finds these by alt, which must be the lowercased title until the Project index is rewritten. */
                        list.map((p) => <Image key={p.slug} alt={p.title.toLowerCase()} src={p.screenshot ?? '/screenshot-placeholder.svg'} fill className='absolute object-fill opacity-0 transition-opacity duration-700 rounded' />)
                    }
                </div>
            </div>
    )
}
