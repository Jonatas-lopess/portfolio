import ProfileLinks from "@/components/ProfileLinks"
import { getDictionary, type Locale } from "@/lib/locale"

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
    const locale = (await params).lang as Locale // middleware guarantees a valid Locale prefix
    const dictionary = getDictionary(locale)

    return (
        <div className="my-20">
            <h1 className="text-5xl dark:text-white font-semibold mb-7">{dictionary.About.Title}</h1>
            <p className="dark:text-white mb-5">{dictionary.About.Text}</p>
            <h2 className="text-3xl dark:text-white font-semibold mb-7">{dictionary.About.LinksHeading}</h2>
            <ProfileLinks variant="labelled" locale={locale} />
        </div>
    )
}