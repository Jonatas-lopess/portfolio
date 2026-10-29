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
            labels={dictionary.Projects}
            projects={list.map((p) => ({ slug: p.slug, title: p.title, tagline: p.tagline }))}
        />
    )
}
