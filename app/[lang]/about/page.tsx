import ProfileLinks from "@/components/ProfileLinks"
import { getDictionary, type Locale } from "@/lib/locale"

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
    const locale = (await params).lang as Locale // middleware guarantees a valid Locale prefix
    const dictionary = getDictionary(locale)
    const about = dictionary.About
    const jobs = [
        { role: about.Job1Role, company: about.Job1Company, period: about.Job1Period, summary: about.Job1Summary },
        { role: about.Job2Role, company: about.Job2Company, period: about.Job2Period, summary: about.Job2Summary },
        { role: about.Job3Role, company: about.Job3Company, period: about.Job3Period, summary: about.Job3Summary },
        { role: about.Job4Role, company: about.Job4Company, period: about.Job4Period, summary: about.Job4Summary },
    ]

    return (
        <div className="my-20">
            <h1 className="text-5xl dark:text-white font-semibold mb-7">{about.Title}</h1>
            <p className="dark:text-white mb-5">{about.Text}</p>
            <dl className="dark:text-white mb-10 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                <dt className="font-mono text-sm opacity-70">{about.LocationLabel}</dt>
                <dd>{about.Location}</dd>
                <dt className="font-mono text-sm opacity-70">{about.LanguagesLabel}</dt>
                <dd>{about.Languages}</dd>
            </dl>
            <h2 className="text-3xl dark:text-white font-semibold mb-7">{about.ExperienceHeading}</h2>
            <ol className="mb-10 ml-2 border-l border-neutral-300 dark:border-neutral-700">
                {jobs.map((job) => (
                    <li key={job.company} className="relative pl-8 pb-10 last:pb-0 dark:text-white">
                        <span
                            aria-hidden="true"
                            className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-neutral-500 bg-white dark:bg-neutral-950 dark:border-neutral-400"
                        />
                        <p className="font-mono text-sm opacity-70">{job.period}</p>
                        <p className="text-xl font-semibold">{job.role}</p>
                        <p className="font-mono text-sm opacity-70">{job.company}</p>
                        <p className="mt-2 max-w-prose">{job.summary}</p>
                    </li>
                ))}
            </ol>
            <h2 className="text-3xl dark:text-white font-semibold mb-7">{about.LinksHeading}</h2>
            <ProfileLinks variant="labelled" locale={locale} />
        </div>
    )
}
