import ProjectIndex from '@/components/ProjectIndex'
import { projects } from '@/lib/projects/live'
import { getDictionary, Locale, locales } from '@/lib/locale'

export const revalidate = 3600

export function generateStaticParams() {
    return locales.map((lang) => ({ lang }))
}

export default async function Projects({ params }: { params: Promise<{ lang: string }> }) {
    const lang = (await params).lang as Locale // middleware guarantees a valid Locale prefix
    const list = await projects.listProjects(lang)
    const dictionary = getDictionary(lang)

    return (
        <ProjectIndex
            locale={lang}
            heading={dictionary.Projects.Title}
            countLabel={dictionary.Projects.CountLabel}
            projects={list.map((p) => ({ slug: p.slug, title: p.title, screenshot: p.screenshot }))}
        />
    )
}
