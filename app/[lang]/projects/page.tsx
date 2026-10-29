import ProjectIndex from '@/components/ProjectIndex'
import { projects } from '@/lib/projects/live'
import { getDictionary, type Locale, locales } from '@/lib/locale'

export const revalidate = 3600

export function generateStaticParams() {
    return locales.map((lang) => ({ lang }))
}

export default async function Projects({ params }: { params: Promise<{ lang: string }> }) {
    const locale = (await params).lang as Locale // middleware guarantees a valid Locale prefix
    const list = await projects.listProjects(locale)
    const dictionary = getDictionary(locale)

    return (
        <ProjectIndex
            locale={locale}
            heading={dictionary.Projects.Title}
            countLabel={dictionary.Projects.CountLabel}
            projects={list.map((p) => ({ slug: p.slug, title: p.title, screenshot: p.screenshot }))}
        />
    )
}
