import Link from "next/link"
import { notFound } from "next/navigation"
import ProjectCover from "@/components/ProjectCover"
import { projects } from "@/lib/projects/live"
import { projectNavigation } from "@/lib/projects/navigation"
import { padNumber } from "@/lib/project-index"
import { getDictionary, type Locale, locales, localePath } from "@/lib/locale"

export const revalidate = 3600

export function generateStaticParams() {
    return locales.flatMap((lang) => projects.listSlugs().map((projectName) => ({ lang, projectName })))
}

const mono = "font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
const buttonBase = "px-12 py-3 rounded text-white"

export default async function ProjectPage({ params }: { params: Promise<{ lang: string, projectName: string }> }) {
    const { lang, projectName } = await params
    const locale = lang as Locale // middleware guarantees a valid Locale prefix
    const dictionary = getDictionary(locale)
    const text = dictionary.Project
    const navigation = projectNavigation(projects.listSlugs(), projectName)

    if (!navigation) notFound()

    // Only the current and the next Project are read, so one unreadable repo cannot fail every Project page.
    const project = await projects.getProject(projectName, locale)
    if (!project) notFound()
    const next = navigation.next === null ? null : await projects.getProject(navigation.next, locale)
    // Without a Marked block the summary falls back to the description, which is also the tagline: show it once.
    const tagline = project.tagline && project.tagline !== project.summary ? project.tagline : null
    const allProjectsHref = localePath(locale, "/projects")

    return (
        <div className="flex flex-1 flex-col text-black dark:text-white">
            <div className="flex items-center justify-between gap-4 pt-10 text-sm md:pt-12">
                <Link href={allProjectsHref} className="flex items-center gap-3 hover:underline">
                    <span aria-hidden="true">←</span>
                    {text.AllProjects}
                </Link>
                <p className={mono}>{text.Label} {padNumber(navigation.position)} / {padNumber(navigation.total)}</p>
            </div>

            <div className="flex flex-col justify-between gap-6 border-b border-black/10 py-10 dark:border-white/15 md:flex-row md:items-end md:py-14">
                <h1 className="break-words text-5xl font-medium leading-none tracking-tight sm:text-7xl lg:text-8xl">{project.title}</h1>
                {tagline && (
                    <p className="max-w-xs text-lg text-gray-600 dark:text-gray-300 md:pb-2 md:text-xl">{tagline}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-5 md:gap-16 md:py-14">
                <div className="md:col-span-2">
                    <section>
                        <h2 className="mb-6 flex items-baseline gap-3 text-xl font-medium md:text-2xl">
                            <span className={mono}>01</span>
                            {dictionary.ProjectInfo.Summary}
                        </h2>
                        <p className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-gray-300">{project.summary}</p>
                        {(project.codeUrl || project.demoUrl) && (
                            <div className="mt-8 flex flex-wrap gap-4">
                                {project.codeUrl && <a href={project.codeUrl} className={`${buttonBase} bg-[#4078c0]`}>{dictionary.ProjectInfo.CodeButton}</a>}
                                {project.demoUrl && <a href={project.demoUrl} className={`${buttonBase} bg-[#bd2c00]`}>{dictionary.ProjectInfo.VisitButton}</a>}
                            </div>
                        )}
                    </section>
                    {project.stack.length > 0 && (
                        <section className="mt-10 border-t border-black/10 pt-10 dark:border-white/15">
                            <h2 className="mb-6 flex items-baseline gap-3 text-xl font-medium md:text-2xl">
                                <span className={mono}>02</span>
                                {dictionary.ProjectInfo.Stack}
                            </h2>
                            <ul className="flex flex-wrap gap-2">
                                {project.stack.map((topic) => (
                                    <li key={topic} className="border border-black/20 px-3 py-1.5 font-mono text-sm text-gray-700 dark:border-white/20 dark:text-gray-300">{topic}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
                <div className="md:col-span-3">
                    <ProjectCover title={project.title} screenshot={project.screenshot} label={text.CoverLabel} position={navigation.position} total={navigation.total} topics={project.stack} />
                </div>
            </div>

            {next && (
                <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className={mono}>{text.ContinueExploring}</p>
                    <Link href={localePath(locale, `/projects/${encodeURIComponent(next.slug)}`)} className="flex items-center gap-4 hover:underline sm:gap-6">
                        <span className={mono}>{text.Next} / {padNumber(navigation.nextPosition ?? 1)}</span>
                        <span className="break-words text-2xl md:text-4xl">{next.title}</span>
                        <span aria-hidden="true" className="text-2xl">→</span>
                    </Link>
                </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-4 border-t border-black/10 py-8 dark:border-white/15">
                <p className={mono}>{dictionary.NavBar.Projects} / {project.title}</p>
                <Link href={allProjectsHref} className="flex items-center gap-3 text-sm hover:underline">
                    {text.AllProjects}
                    <span aria-hidden="true">←</span>
                </Link>
            </div>
        </div>
    )
}
