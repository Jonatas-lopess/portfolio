import ProfileLinks from "@/components/ProfileLinks"
import { getDictionary } from "@/lib/locale"

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params

    return (
        <div className="my-20">
            <h1 className="text-5xl dark:text-white font-semibold mb-7">{getDictionary(lang).About.Title}</h1>
            <p className="dark:text-white mb-5">{getDictionary(lang).About.Text}</p>
            <h2 className="text-3xl dark:text-white font-semibold mb-7">{getDictionary(lang).About.LinksHeading}</h2>
            <ProfileLinks variant="labelled" lang={lang} />
        </div>
    )
}