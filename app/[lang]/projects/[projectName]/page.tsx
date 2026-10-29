import Image from "next/image"
import { notFound } from "next/navigation"
import { projects } from "@/lib/projects/live"
import { SCREENSHOT_PLACEHOLDER } from "@/lib/projects/placeholder"
import { getDictionary, type Locale, locales } from "@/lib/locale"

export const revalidate = 3600

export function generateStaticParams() {
    return locales.flatMap((lang) => projects.listSlugs().map((projectName) => ({ lang, projectName })))
}

export default async function ProjectPage({ params }: { params: Promise<{ lang: string, projectName: string }> }) {
    const { lang, projectName } = await params
    const locale = lang as Locale // middleware guarantees a valid Locale prefix
    const dictionary = getDictionary(locale)
    const project = await projects.getProject(projectName, locale);

    if(!project) notFound()

    return (
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full h-full mt-20">
            <div className="dark:text-white">
                <h1 className="text-5xl font-semibold capitalize mb-7">{project.title}</h1>
                <h2 className="text-3xl font-semibold mb-5">{dictionary.ProjectInfo.Summary}</h2>
                <p className="mb-7">{project.summary}</p>
                <h2 className="text-3xl font-semibold mb-5">{dictionary.ProjectInfo.Stack}</h2>
                <p>{project.stack.join(", ")}</p>
                <div className="flex flex-wrap justify-around">
                    {project.codeUrl && <a href={project.codeUrl} className="bg-[#4078c0] py-3 px-12 mt-6 rounded">{dictionary.ProjectInfo.CodeButton}</a>}
                    {project.demoUrl && <a href={project.demoUrl} className="bg-[#bd2c00] py-3 px-12 mt-6 rounded">{dictionary.ProjectInfo.VisitButton}</a>}
                </div>
            </div>
            <div className="w-full max-h-[50rem] col-span-2 relative mx-2 mb-4">
                <Image alt={project.title} src={project.screenshot ?? SCREENSHOT_PLACEHOLDER} fill className='absolute rounded' />
            </div>
        </div>
    )
}
